"use server";

import { errorResponse, successResponse } from "@/lib/utils/api-responses";
import { db } from "@/lib/db";
import {
  ExamUpdateValidationSchema,
  ExamCreateValidationSchema,
} from "@/lib/utils/model-validation-schema";
import { transformExamResponse } from "@/lib/utils/utility_functions";
import { NextRequest } from "next/server";
import {
  checkAuthAdmin,
  checkAuthUser,
} from "@/lib/utils/auth-check-in-exam-api";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authResponse = await checkAuthUser();
  if (authResponse) return authResponse;

  try {
    const { id: examId } = await params;

    const existingExam = await db.exam.findUnique({
      where: {
        id: examId,
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

    if (!existingExam) {
      return errorResponse("Exam not found", 404);
    }

    const transformedExam = transformExamResponse(existingExam);
    // const transformedExam = existingExam;

    return successResponse(transformedExam, "Exam fetched successfully", 200);
  } catch (error) {
    return errorResponse("Internal Server Error", 500, error);
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authResponse = await checkAuthAdmin();
  if (authResponse) return authResponse;

  try {
    const { id: examId } = await params;
    const body = await req.json();
    const validation = ExamCreateValidationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid Input", 400, validation.error);
    }

    const {
      title,
      instructions,
      description,
      isDraft,
      examType,
      examCategoryId,
      totalDurationInSeconds,
      examSections,
    } = validation.data;

    // Check if exam and category exist
    const [existingExam, existingExamCategory] = await Promise.all([
      db.exam.findUnique({
        where: { id: examId },
        include: { examSections: true },
      }),
      db.examCategory.findUnique({ where: { id: examCategoryId } }),
    ]);

    if (!existingExam) return errorResponse("Exam not found", 404);
    if (!existingExamCategory)
      return errorResponse("Exam category not found", 404);

    const result = await db.$transaction(
      async (prisma) => {
        // Delete existing examSections (cascade deletes questions/options/etc.)
        await prisma.examSection.deleteMany({ where: { examId } });

        // Update exam metadata
        const updatedExam = await prisma.exam.update({
          where: { id: examId },
          data: {
            title,
            instructions,
            description,
            isDraft,
            examCategory: { connect: { id: examCategoryId } },
            examType,
            totalDurationInSeconds,
          },
        });

        // Create new sections with nested questions
        const newSections = await Promise.all(
          examSections.map((section) =>
            prisma.examSection.create({
              data: {
                name: section.name,
                description: section.description,
                isAllQuestionsMandatory: section.isAllQuestionsMandatory,
                numberOfQuestionsToAttempt: section.numberOfQuestionsToAttempt,
                sectionConfig: { connect: { id: section.sectionConfigId } },
                subject: { connect: { id: section.subjectId } },
                exam: { connect: { id: examId } },
                questions: {
                  create: section.questions?.map((question) => ({
                    text: question.text,
                    imageUrl:
                      question.imageUrl === "" ? null : question.imageUrl,
                    difficultyLevel: question.difficultyLevel,
                    examType,
                    chapter: { connect: { id: question.chapterId } },
                    options: {
                      create: question.options?.map((option) => ({
                        text: option.text,
                        isCorrect: option.isCorrect,
                        imageUrl:
                          option.imageUrl === "" ? null : option.imageUrl,
                      })),
                    },
                    answerExplanationField: question.answerExplanationField && {
                      create: {
                        text: question.answerExplanationField.text,
                        value: question.answerExplanationField.value,
                        explanation:
                          question.answerExplanationField.explanation,
                        imageUrl:
                          question.answerExplanationField.imageUrl === ""
                            ? null
                            : question.answerExplanationField.imageUrl,
                      },
                    },
                  })),
                },
              },
              include: {
                sectionConfig: true,
                questions: {
                  include: {
                    chapter: true,
                  },
                },
              },
            })
          )
        );
        // Calculate totalQuestions and totalMarks
        const totalQuestions = newSections.reduce(
          (sum: number, section) => sum + section.questions.length,
          0
        );
        const totalMarks = newSections.reduce(
          (sum: number, section) =>
            sum + section.questions.length * section.sectionConfig.fullMarks,
          0
        );

        // Set new ChapterToExam links
        const chapterIds = new Set<string>();

        newSections.forEach((section) =>
          section.questions.forEach((q) => chapterIds.add(q.chapterId))
        );

        // Remove old links first (optional if onDelete: Cascade is used)
        await prisma.chapterToExam.deleteMany({ where: { examId } });
        if (chapterIds.size > 0) {
          await prisma.chapterToExam.createMany({
            data: Array.from(chapterIds).map((chapterId) => ({
              chapterId,
              examId,
            })),
          });
        }

        // Update totals
        const finalExam = await prisma.exam.update({
          where: { id: examId },
          data: {
            totalQuestions,
            totalMarks,
          },
          include: {
            examCategory: {
              select: { id: true, name: true },
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
                subject: true,
                sectionConfig: true,
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

        return finalExam;
      },
      { timeout: 300000 }
    );

    const statusMessage = isDraft
      ? "Draft exam updated successfully."
      : "Exam published successfully.";

    const transformedExam = transformExamResponse(result);
    return successResponse(transformedExam, statusMessage, 200);
  } catch (error) {
    return errorResponse("Internal Server Error", 500, error);
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authResponse = await checkAuthAdmin();
  if (authResponse) return authResponse;

  try {
    const { id: examId } = await params;
    const body = await req.json();
    const validation = ExamUpdateValidationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid Input", 400, validation.error);
    }

    const {
      title,
      instructions,
      description,
      examCategoryId,
      examType,
      totalDurationInSeconds,
    } = validation.data;

    // Check if exam exists
    const existingExam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        examSections: {
          include: {
            questions: true,
            sectionConfig: true,
          },
        },
      },
    });

    if (!existingExam) {
      return errorResponse("Exam not found", 404);
    }

    // Check if exam category exists
    const existingExamCategory = await db.examCategory.findUnique({
      where: { id: examCategoryId },
    });

    if (!existingExamCategory) {
      return errorResponse("Exam Category not found", 404);
    }

    // Dynamic calculation of totalQuestions and totalMarks
    const calculatedTotalQuestions = existingExam.examSections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );
    const calculatedTotalMarks = existingExam.examSections.reduce(
      (sum, section) => {
        return (
          sum +
          section.questions.length * (section.sectionConfig?.fullMarks || 0)
        );
      },
      0
    );

    // Update the exam
    const updatedExam = await db.exam.update({
      where: { id: examId },
      data: {
        title,
        instructions,
        description,
        examCategoryId,
        examType,
        totalDurationInSeconds,
        totalQuestions: calculatedTotalQuestions,
        totalMarks: calculatedTotalMarks,
      },
    });

    return successResponse(updatedExam, "Exam updated successfully", 200);
  } catch (error) {
    return errorResponse("Internal Server Error", 500, error);
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authResponse = await checkAuthAdmin();
  if (authResponse) return authResponse;

  try {
    const { id: examId } = await params;

    // Check if exam exists
    const existingExam = await db.exam.findUnique({
      where: { id: examId },
    });

    if (!existingExam) {
      return errorResponse("Exam not found", 404);
    }

    await db.exam.delete({
      where: { id: examId },
    });

    return successResponse({}, "Exam deleted successfully", 200);
  } catch (error) {
    return errorResponse("Internal Server Error", 500, error);
  }
};
