"use server";

import { errorResponse, successResponse } from "@/lib/utils/api-responses";
import { db } from "@/lib/db";
import { ExamCreateValidationSchema } from "@/lib/utils/model-validation-schema";
import {
  transformExamResponse,
  transformGetAllForEachExamResponse,
} from "@/lib/utils/utility_functions";

import { NextRequest } from "next/server";

import { ExamType } from "@prisma/client";
import {
  ExtendedExamSectionWithReducedSectionConfig,
  ExtendedQuestion,
} from "@/lib/utils/custom-interfaces";
import {
  checkAuthAdmin,
  checkAuthUser,
} from "@/lib/utils/auth-check-in-exam-api";

interface ExamQuery {
  examCategory?: {
    name: {
      equals: string;
      mode: "insensitive";
    };
  };
  examType?: ExamType;
}

export const GET = async (req: NextRequest) => {
  // const authResponse = await checkAuthUser();
  // if (authResponse) return authResponse;

  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const type = searchParams.get("type")?.toUpperCase();

    const whereClause: ExamQuery = {};

    if (category) {
      whereClause.examCategory = {
        name: {
          equals: category,
          mode: "insensitive",
        },
      };
    }

    if (type) {
      whereClause.examType = type as ExamType;
    }

    const allExams = await db.exam.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isDraft: true,
        totalDurationInSeconds: true,
        totalMarks: true,
        totalQuestions: true,
    accessType: true,
    courseId: true,   
   
        chapterToExams: {
          select: {
            id: true,
            chapter: {
              select: {
                id: true,
                name: true,
                subjectId: true,
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const ts = allExams.map((exam) => transformGetAllForEachExamResponse(exam));

    return successResponse(ts, "Exam(s) fetched successfully", 200);
  } catch (error) {
    return errorResponse("Internal Server Error", 500, error);
  }
};

export const POST = async (req: NextRequest) => {
  const authResponse = await checkAuthAdmin();
  if (authResponse) return authResponse;

  try {
    const body = await req.json();
    console.log(body);
    const validation = ExamCreateValidationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid Input", 400, validation.error);
    }

      const {
      title,
      instructions,
      description,
      isDraft = false,
      examType,
      accessType,
      courseId,
      examCategoryId,
      totalDurationInSeconds,
      examSections,
    } = validation.data;



     if (accessType === "PAID" && !courseId) {
      return errorResponse("PAID exams must have a courseId", 400);
    }


    // Check if exam category exists
    const existingExamCategory = await db.examCategory.findUnique({
      where: { id: examCategoryId },
    });
    if (!existingExamCategory) {
      return errorResponse("Exam category not found", 404);
    }

    // Perform all database operations inside a transaction
    const result = await db.$transaction(
      async (prisma) => {
        // Create the exam
        const exam = await prisma.exam.create({
          data: {
              title,
    instructions,
    description,
    isDraft,
    examType,
    accessType,
    course: courseId ? { connect: { id: courseId } } : undefined, 
    examCategory: { connect: { id: examCategoryId } },
    totalDurationInSeconds,
            examSections: {
              create: examSections.map((section) => ({
                name: section.name,
                description: section.description,
                isAllQuestionsMandatory: section.isAllQuestionsMandatory,
                numberOfQuestionsToAttempt: section.numberOfQuestionsToAttempt,
                sectionConfig: { connect: { id: section.sectionConfigId } },
                subject: { connect: { id: section.subjectId } },
                questions: {
                  create: section.questions?.map((question) => ({
                    text: question.text,
                    imageUrl:
                      question.imageUrl === "" ? null : question.imageUrl,
                    difficultyLevel: question.difficultyLevel,
                    examType: examType,
                    chapter: { connect: { id: question.chapterId } },
                    options: {
                      create: question.options?.map((option) => ({
                        text: option.text,
                        isCorrect: option.isCorrect,
                        imageUrl:
                          option.imageUrl === "" ? null : option.imageUrl,
                      })),
                    },
                    answerExplanationField: {
                      create: {
                        text: question.answerExplanationField?.text,
                        value: question.answerExplanationField?.value,
                        explanation:
                          question.answerExplanationField?.explanation,
                        imageUrl:
                          question.answerExplanationField?.imageUrl === ""
                            ? null
                            : question.answerExplanationField?.imageUrl,
                      },
                    },
                  })),
                },
              })),
            },
          },
          include: {
            examSections: {
              include: {
                sectionConfig: {
                  select: { fullMarks: true },
                },
                questions: {
                  include: {
                    chapter: true,
                    options: true,
                    answerExplanationField: true,
                  },
                },
              },
            },
          },
        });

        // Extract unique chapter IDs from the questions that have chapters
        const chapterIds = new Set<string>();
        exam.examSections.forEach(
          (section: ExtendedExamSectionWithReducedSectionConfig) => {
            section.questions.forEach((question: ExtendedQuestion) => {
              if (question.chapterId) chapterIds.add(question.chapterId);
            });
          }
        );

        // Only create ChapterToExam entries if there are chapters
        if (chapterIds.size > 0) {
          await prisma.chapterToExam.createMany({
            data: Array.from(chapterIds).map((chapterId) => ({
              chapterId,
              examId: exam.id,
            })),
          });
        }

        // Calculate total questions and total marks
        const totalQuestions = exam.examSections.reduce(
          (sum: number, section: ExtendedExamSectionWithReducedSectionConfig) =>
            sum + section.questions.length,
          0
        );
        const totalMarks = exam.examSections.reduce(
          (sum: number, section: ExtendedExamSectionWithReducedSectionConfig) =>
            sum + section.questions.length * section.sectionConfig.fullMarks,
          0
        );

        // Update the exam with calculated totals
        const updatedExam = await prisma.exam.update({
          where: { id: exam.id },
          data: {
            totalQuestions,
            totalMarks,
          },
          include: {
            examCategory: {
              select: {
                id: true,
                name: true,
              },
            },
            chapterToExams: {
              select: {
                id: true,
                chapter: {
                  select: {
                    id: true,
                    name: true,
                    subjectId: true,
                    subject: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            examSections: {
              include: {
                sectionConfig: true,
                subject: true,
                questions: {
                  include: {
                    options: true,
                    answerExplanationField: true,
                  },
                },
              },
            },
          },
        });

        return updatedExam;
      },
      {
        timeout: 300000,
      }
    );

    const statusMessage = isDraft
      ? "Draft exam created successfully."
      : "Exam published successfully.";

    const transformedExam = transformExamResponse(result);
    return successResponse(transformedExam, statusMessage, 201);
  } catch (error) {
    return errorResponse("Internal Server Error", 500, error);
  }
};
