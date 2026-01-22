"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { errorResponse, successResponse } from "@/lib/utils/api-responses";
import { checkAuthUser } from "@/lib/utils/auth-check-in-exam-api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  const authResponse = await checkAuthUser();
  if (authResponse) return authResponse;

  try {
    const { examId } = await params;
    const { userId, userSubmissionId, timeTaken } = await request.json();

    if (!userId || !userSubmissionId) {
      return errorResponse("Invalid input", 400);
    }

    // Prevent duplicate submission
    const existing = await db.examAttempt.findUnique({
      where: { userSubmissionId },
    });
    if (existing) {
      return errorResponse("Attempt already submitted", 409);
    }

    // Fetch submission with answers + correct options
    const submission = await db.userSubmission.findUnique({
      where: { id: userSubmissionId },
      include: {
        userAnswerPerQuestions: {
          include: {
            chosenOptions: true,
            question: {
              include: {
                options: true, // contains isCorrect
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return errorResponse("Submission not found", 404);
    }

    let attemptedQuestions = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    for (const answer of submission.userAnswerPerQuestions) {
      if (!answer.isAttempted) continue;

      attemptedQuestions++;

      const correctOptionIds = answer.question.options
        .filter(o => o.isCorrect)
        .map(o => o.id)
        .sort();

      const userOptionIds = answer.chosenOptions
        .map(o => o.optionId)
        .sort();

      const isCorrect =
        correctOptionIds.length === userOptionIds.length &&
        correctOptionIds.every((id, idx) => id === userOptionIds[idx]);

      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    }

    const accuracy =
      attemptedQuestions === 0
        ? 0
        : Number(((correctAnswers / attemptedQuestions) * 100).toFixed(2));

    // scoring logic (adjust later if section-wise)
    const score = correctAnswers;

    // Transaction
    const result = await db.$transaction(
      async (db) => {
        const attempt = await db.examAttempt.create({
          data: {
            userId,
            examId,
            userSubmissionId,
            score,
            accuracy,
            attemptedQuestions,
            correctAnswers,
            incorrectAnswers,
            timeTaken,
          },
        });

        await db.$queryRaw(getRankQuery(examId));
        await db.$executeRaw(getStatsQuery(examId));

        return db.examAttempt.findUnique({
          where: { id: attempt.id },
          include: { analysisReport: true },
        });
      },
      { timeout: 300000 }
    );

    return successResponse(result, "Attempt submitted successfully", 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500, error);
  }
}



function getRankQuery(examId : string) : Prisma.Sql {
    return Prisma.sql`
    WITH ranked_attempts AS (
    SELECT 
        id,
        score,
        RANK() OVER (ORDER BY score DESC) as rank,
        PERCENT_RANK() OVER (ORDER BY score DESC) as percentile
    FROM "ExamAttempt"
    WHERE "examId" = ${examId}
    )
    UPDATE "ExamAttempt" ea
    SET 
    rank = ra.rank,
    percentile = (1 - ra.percentile) * 100
    FROM ranked_attempts ra
    WHERE ea.id = ra.id
    RETURNING ea.id, ea.score, ea.rank, ea.percentile;
`
}

function getStatsQuery(examId : string) : Prisma.Sql {
    return Prisma.sql`
    WITH exam_stats AS (
    SELECT 
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score) as median_score,
        COALESCE(STDDEV(score), 0) as standard_deviation,
        AVG("timeTaken") as average_time_taken
    FROM "ExamAttempt"
    WHERE "examId" = ${examId}
    )
    INSERT INTO "ExamStatistics" (
    "id","examId", "totalAttempts", "averageScore", "highestScore", 
    "lowestScore", "medianScore", "standardDeviation", "averageTimeTaken", 
    "topPerformers", "createdAt", "updatedAt"
    )
    SELECT 
    gen_random_uuid(),
    ${examId}, total_attempts, average_score, highest_score, 
    lowest_score, median_score, standard_deviation, average_time_taken,
    (SELECT json_agg(row_to_json(top_performers))
    FROM (
        SELECT "userId", score
        FROM "ExamAttempt"
        WHERE "examId" = ${examId}
        ORDER BY score DESC
        LIMIT 10
    ) as top_performers),
    NOW(), NOW()
    FROM exam_stats
    ON CONFLICT ("examId") DO UPDATE
    SET 
    "totalAttempts" = EXCLUDED."totalAttempts",
    "averageScore" = EXCLUDED."averageScore",
    "highestScore" = EXCLUDED."highestScore",
    "lowestScore" = EXCLUDED."lowestScore",
    "medianScore" = EXCLUDED."medianScore",
    "standardDeviation" = EXCLUDED."standardDeviation",
    "averageTimeTaken" = EXCLUDED."averageTimeTaken",
    "topPerformers" = EXCLUDED."topPerformers",
    "updatedAt" = NOW()
    RETURNING *;
`;
}