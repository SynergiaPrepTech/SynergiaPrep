'use server';

import { errorResponse, successResponse } from "@/lib/utils/api-responses";
import { db } from "@/lib/db";
import { PracticeExamCreateValidationSchema } from "@/lib/utils/model-validation-schema";

import { NextRequest } from "next/server";
import { transformExamResponse } from "@/lib/utils/utility_functions";
import { ExtendedExamSectionWithReducedSectionConfig } from "@/lib/utils/custom-interfaces";
import { checkAuthAdmin } from "@/lib/utils/auth-check-in-exam-api";

export const POST = async (req: NextRequest) => {

    const authResponse = await checkAuthAdmin();
    if(authResponse) return authResponse;

    try {
        const body = await req.json();
        const validation = PracticeExamCreateValidationSchema.safeParse(body);

        if (!validation.success) {
            return errorResponse("Invalid Input", 400, validation.error);
        }

        const {
            userId,
            chapterId,
            examCategoryId,
            sectionConfigId
        } = validation.data;

        /********************************************************************* */
        // Fetch existing questions
        const questions = await db.question.findMany({
            where: {
                chapterId: chapterId,
                examType : "PRACTICE"
            },
            include: {
                options: true,
                answerExplanationField: true
            }
        });
        
        /********************************************************************* */
        // Define exam details
        
        const title  = "abcd";
        const instructions = "abcd";  
        const description = "abcd";
        const examType = "PRACTICE";
        const totalDurationInSeconds = 20 * 60;

        // single section

        const sectionName = "section 1";
        const sectionDescription = "description";

        // Perform all database operations inside a transaction
        const result = await db.$transaction(async (prisma) => {
            // Create the exam
            const exam = await prisma.exam.create({
                data: {
                    title,
                    instructions,
                    description,
                    examCategory: { connect: { id: examCategoryId } },
                    examType,
                    totalDurationInSeconds,
                    examSections: {
                        create: {
                            name : sectionName,
                            description : sectionDescription,
                            sectionConfig: { connect: { id: sectionConfigId } },
                            questions: {
                                connect: questions.map(question => ({ id: question.id })) // Link existing questions
                            }
                        }
                    }
                },
                include: {
                    examSections: {
                        include: {
                            sectionConfig: {
                                select: { fullMarks: true }
                            },
                            questions: {
                                include: {
                                    chapter: true, // Include the chapter to get chapterId
                                    options: true,
                                    answerExplanationField: true
                                }
                            }
                        }
                    }
                }
            });

            // Create ChapterToExam entry
            await prisma.chapterToExam.create({
                data: {
                    examId: exam.id,
                    chapterId: chapterId
                }
            });

            // Calculate total questions and total marks
            const totalQuestions = exam.examSections.reduce((sum: number, section: ExtendedExamSectionWithReducedSectionConfig) => sum + section.questions.length, 0);
            const totalMarks = exam.examSections.reduce((sum: number, section: ExtendedExamSectionWithReducedSectionConfig) => sum + section.questions.length * section.sectionConfig.fullMarks, 0);

            // Update the exam with calculated totals
            const updatedExam = await prisma.exam.update({
                where: { id: exam.id },
                data: {
                    totalQuestions,
                    totalMarks
                },
                include: {
                    examCategory: {
                        select: {
                            id: true,
                            name: true
                        }
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
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    examSections: {
                        include: {
                            sectionConfig: true,
                            subject: true,
                            questions: {
                                include: {
                                    options: true,
                                    answerExplanationField: true
                                }
                            }
                        }
                    }
                }
            });

            return updatedExam;
        }, {
            timeout: 300000
        });

        const transformedExam = transformExamResponse(result);

        return successResponse(transformedExam, "Exam created successfully", 201);
    } catch (error) {
        return errorResponse("Internal Server Error", 500, error);
    }
};