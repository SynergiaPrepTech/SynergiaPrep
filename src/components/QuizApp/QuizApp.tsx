"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import InfoPage from "./InfoPage";
import QuizPage from "./QuizPage";
import ExamSummary from "./ExamSummary";
import SubmittedPage from "./SubmittedPage";
import {
  Exam,
  UserResponse as IUserResponse,
  UserAnswer,
} from "@/types/examTypes";
import { Button } from "@/components/ui/button";
import QuizHeader from "./QuizHeader";
import { submitAttempt } from "@/lib/evaluation-hooks/report-functions";
import StudyTracker from "../StudyTracker";
import { toast } from "sonner";

/* ---------------- TYPES ---------------- */

interface Enrollment {
  courseId: string;
}

declare module "next-auth" {
  interface User {
    id: string;
    role?: "ADMIN" | "SUPERADMIN" | "USER";
    enrollments?: Enrollment[];
  }
}

/* ---------------- COMPONENT ---------------- */

const QuizApp = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const examId = searchParams.get("examId");

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentStep, setCurrentStep] = useState<"info" | "quiz" | "summary" | "submitted">("info");

  const [courseId, setCourseId] = useState("");
  const [ExamData, setExam] = useState<Exam>({} as Exam);

  const [UserResponse, setUserResponse] = useState<IUserResponse>({
    userId: "",
    examId: examId ?? "",
    userAnswerPerQuestions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState<[number, number]>([0, 0]);
  const [currentAnswer, setCurrentAnswer] = useState<{
    value?: string;
    questionId: string;
    chosenOptions?: { optionId: string }[];
  } | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set<string>(["0-0"]));
  const [markedForReview, setMarkedForReview] = useState(new Set<string>());
  const [timeLeft, setTimeLeft] = useState(0);

  const questionStatuses = [
    {
      className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
      text: "You have not visited the question yet.",
    },
    {
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      text: "You have not answered the question.",
    },
    {
      className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      text: "You have answered the question.",
    },
    {
      className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      text: "You have NOT answered the question, but have marked the question for review.",
    },
    {
      className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
      text: "The question(s) 'Answered and Marked for Review' will be considered for evaluation.",
    },
  ];

  /* ---------------- FETCH EXAM ---------------- */

  useEffect(() => {
    if (!examId) return;

    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/v1/exams/${examId}`);
        const json = await res.json();

        if (!res.ok || json.status !== "success") {
          setFetchError(true);
          setLoading(false);
          return;
        }

        setCourseId(json.data.courseId);
        setExam(json.data);
        setTimeLeft(json.data.totalDurationInSeconds);
        setLoading(false);
      } catch {
        setFetchError(true);
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  /* ---------------- ACCESS CONTROL ---------------- */

  const isCheckingAccess = useMemo(() => {
    return status === "loading" || loading || !courseId;
  }, [status, loading, courseId]);

  const hasAccess = useMemo(() => {
    if (status !== "authenticated" || !session?.user) return false;

    if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") {
      return true;
    }

    return session.user.enrollments?.some(
      (e: Enrollment) => e.courseId === courseId
    );
  }, [status, session, courseId]);

  useEffect(() => {
    if (isCheckingAccess) return;

    if (!hasAccess) {
      toast.error("You are not subscribed to this course");
      router.replace("/");
    }
  }, [isCheckingAccess, hasAccess, router]);

  /* ---------------- USER RESPONSE INIT ---------------- */

  useEffect(() => {
    if (!ExamData?.examSections?.length) return;

    const answers: UserAnswer[] = [];

    ExamData.examSections.forEach((section) => {
      section.questions.forEach((q) => {
        answers.push({
          questionId: q.id,
          isAttempted: false,
          value: "",
          chosenOptions: [],
        });
      });
    });

    setUserResponse((prev) => ({
      ...prev,
      userId: session?.user.id ?? "",
      userAnswerPerQuestions: answers,
    }));
  }, [ExamData, session]);

  /* ---------------- LOAD CURRENT ANSWER ---------------- */

  useEffect(() => {
    if (fetchError || loading || !ExamData?.examSections?.length) return;

    const questionId = ExamData.examSections[currentQuestion[0]]?.questions[currentQuestion[1]]?.id;
    if (!questionId) return;

    const existingAnswer = UserResponse.userAnswerPerQuestions.find(
      (ans) => ans.questionId === questionId
    );
    
    if (existingAnswer && (existingAnswer.value || existingAnswer.chosenOptions?.length > 0)) {
      setCurrentAnswer({
        value: existingAnswer.value,
        questionId: existingAnswer.questionId,
        chosenOptions: existingAnswer.chosenOptions,
      });
    } else {
      setCurrentAnswer(null);
    }
  }, [currentQuestion, ExamData, loading, UserResponse.userAnswerPerQuestions, fetchError]);

  /* ---------------- HANDLERS ---------------- */

  const handleStart = () => {
    if (acceptedTerms) {
      setCurrentStep("quiz");
    } else {
      toast.error("Please accept the terms and conditions to start the exam");
    }
  };

  const handleAnswer = (
    sectionIndex: number,
    questionIndex: number,
    optionIndex?: number,
    value?: string
  ) => {
    if (!ExamData?.examSections?.[sectionIndex]?.questions?.[questionIndex]) return;

    const questionData = ExamData.examSections[sectionIndex].questions[questionIndex];
    
    // For numerical questions, handle differently
    if (questionData.options.length === 0 && value !== undefined) {
      setCurrentAnswer({
        value,
        questionId: questionData.id,
        chosenOptions: [],
      });
      return;
    }

    // For MCQ questions
    if (optionIndex === undefined) return;

    const optionId = questionData.options[optionIndex].id;
    const currentSectionData = ExamData.examSections[sectionIndex];
    const isMultiple = currentSectionData.sectionConfig.partialMarks.length > 1;

    setCurrentAnswer((prev) => {
      if (isMultiple) {
        // Toggle the option in the list
        let newChosen = prev?.chosenOptions ? [...prev.chosenOptions] : [];
        if (newChosen.find((opt) => opt.optionId === optionId)) {
          newChosen = newChosen.filter((opt) => opt.optionId !== optionId);
        } else {
          newChosen.push({ optionId });
        }
        return {
          value: prev?.value,
          questionId: questionData.id,
          chosenOptions: newChosen,
        };
      } else {
        // For single choice, replace with the new selection
        return {
          value: prev?.value,
          questionId: questionData.id,
          chosenOptions: [{ optionId }],
        };
      }
    });
  };

  const updateCurrentAnswer = (newValue: string) => {
    if (!ExamData?.examSections?.[currentQuestion[0]]?.questions?.[currentQuestion[1]]) return;

    const questionId = ExamData.examSections[currentQuestion[0]].questions[currentQuestion[1]].id;
    setCurrentAnswer((prev) => ({
      value: newValue,
      questionId,
      chosenOptions: prev?.chosenOptions || [],
    }));
  };

  const handleSaveAndNext = () => {
    if (!ExamData?.examSections?.[currentQuestion[0]]?.questions?.[currentQuestion[1]]) return;

    const [sectionIndex, questionIndex] = currentQuestion;
    const questionId = ExamData.examSections[sectionIndex].questions[questionIndex].id;

    // Update the user response
    setUserResponse((prev) => {
      const updatedAnswers = prev.userAnswerPerQuestions.map((answer) =>
        answer.questionId === questionId
          ? {
              ...answer,
              isAttempted: true,
              value: currentAnswer?.value?.toString() || "",
              chosenOptions: currentAnswer?.chosenOptions?.map((option) => ({
                optionId: option.optionId,
              })) || [],
            }
          : answer
      );
      return {
        ...prev,
        userAnswerPerQuestions: updatedAnswers,
      };
    });

    // Move to next question
    const currentSection = ExamData.examSections[sectionIndex];
    if (questionIndex + 1 < currentSection.questions.length) {
      const nextQuestion = questionIndex + 1;
      setCurrentQuestion([sectionIndex, nextQuestion]);
      setVisitedQuestions(new Set([...visitedQuestions, `${sectionIndex}-${nextQuestion}`]));
    } else if (sectionIndex + 1 < ExamData.examSections.length) {
      setCurrentQuestion([sectionIndex + 1, 0]);
      setVisitedQuestions(new Set([...visitedQuestions, `${sectionIndex + 1}-0`]));
    } else {
      // Reached end of exam, go to summary
      setCurrentStep("summary");
    }

    setCurrentAnswer(null);
  };

  const handleClearAnswer = () => {
    if (!ExamData?.examSections?.[currentQuestion[0]]?.questions?.[currentQuestion[1]]) return;

    const questionId = ExamData.examSections[currentQuestion[0]].questions[currentQuestion[1]].id;

    setUserResponse((prev) => ({
      ...prev,
      userAnswerPerQuestions: prev.userAnswerPerQuestions.map((answer) =>
        answer.questionId === questionId
          ? { ...answer, value: "", chosenOptions: [], isAttempted: false }
          : answer
      ),
    }));

    const questionKey = `${currentQuestion[0]}-${currentQuestion[1]}`;
    if (markedForReview.has(questionKey)) {
      const newMarked = new Set(markedForReview);
      newMarked.delete(questionKey);
      setMarkedForReview(newMarked);
    }

    setCurrentAnswer(null);
  };

  const handleMarkForReview = () => {
    const questionKey = `${currentQuestion[0]}-${currentQuestion[1]}`;
    setMarkedForReview(new Set([...markedForReview, questionKey]));

    // Save current answer if exists
    if (currentAnswer && ExamData?.examSections?.[currentQuestion[0]]?.questions?.[currentQuestion[1]]) {
      const questionId = ExamData.examSections[currentQuestion[0]].questions[currentQuestion[1]].id;
      
      setUserResponse((prev) => {
        const updatedAnswers = prev.userAnswerPerQuestions.map((answer) =>
          answer.questionId === questionId
            ? {
                ...answer,
                isAttempted: true,
                value: currentAnswer?.value?.toString() || "",
                chosenOptions: currentAnswer?.chosenOptions?.map((option) => ({
                  optionId: option.optionId,
                })) || [],
              }
            : answer
        );
        return {
          ...prev,
          userAnswerPerQuestions: updatedAnswers,
        };
      });
    }

    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (!ExamData?.examSections) return;

    const [sectionIndex, questionIndex] = currentQuestion;
    const currentSection = ExamData.examSections[sectionIndex];

    if (questionIndex + 1 < currentSection.questions.length) {
      const nextQuestion = questionIndex + 1;
      setCurrentQuestion([sectionIndex, nextQuestion]);
      setVisitedQuestions(new Set([...visitedQuestions, `${sectionIndex}-${nextQuestion}`]));
    } else if (sectionIndex + 1 < ExamData.examSections.length) {
      setCurrentQuestion([sectionIndex + 1, 0]);
      setVisitedQuestions(new Set([...visitedQuestions, `${sectionIndex + 1}-0`]));
    }
    setCurrentAnswer(null);
  };

  const handlePrevQuestion = () => {
    if (!ExamData?.examSections) return;

    const [sectionIndex, questionIndex] = currentQuestion;

    if (questionIndex > 0) {
      setCurrentQuestion([sectionIndex, questionIndex - 1]);
    } else if (sectionIndex > 0) {
      const prevSection = sectionIndex - 1;
      const prevQuestion = ExamData.examSections[prevSection].questions.length - 1;
      setCurrentQuestion([prevSection, prevQuestion]);
    }
    setCurrentAnswer(null);
  };

  const onSubmit = async (shouldSubmit: boolean) => {
    if (!shouldSubmit) {
      setCurrentStep("quiz");
      return;
    }

    try {
      const updatedResponse = {
        ...UserResponse,
        userId: session?.user.id ?? "",
      };

      const response = await fetch(`/api/v1/user-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedResponse),
      });

      if (!response.ok) {
        throw new Error("Failed to submit exam");
      }

      const result = await response.json();

      const { userId, examId, id: userSubmissionId } = result.data;

      const report = (await submitAttempt(
        userId,
        examId,
        userSubmissionId,
        ExamData.totalDurationInSeconds - timeLeft
      )) as {
        data: {
          examId: string;
          userId: string;
          userSubmissionId: string;
          score: number;
          accuracy: number;
          attemptedQuestions: number;
          correctAnswers: number;
          incorrectAnswers: number;
          timeTaken: number;
          percentile: number;
          rank: number;
        };
      };

      await fetch(`/api/v1/reports/exams/${report.data.examId}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: report.data.userId,
          userSubmissionId: report.data.userSubmissionId,
        }),
      });

      setCurrentStep("submitted");
      setUserResponse(updatedResponse);
    } catch (error) {
      console.error("Error submitting attempt:", error);
      toast.error("Failed to submit exam. Please try again.");
    }
  };

  const getQuestionStatus = (
    sectionNumber: number,
    questionNumber: number,
    questionId: string
  ) => {
    const isVisited = visitedQuestions.has(`${sectionNumber}-${questionNumber}`);
    const answer = UserResponse.userAnswerPerQuestions.find(
      (ans) => ans.questionId === questionId
    );
    const isAnswered = answer?.isAttempted &&
      ((answer.value && answer.value !== "") ||
        (answer.chosenOptions && answer.chosenOptions.length > 0));
    const isMarked = markedForReview.has(`${sectionNumber}-${questionNumber}`);

    if (!isVisited) return "not-visited";
    if (isAnswered && isMarked) return "answered-marked";
    if (isMarked) return "review";
    if (isAnswered) return "answered";
    if (isVisited && !isAnswered) return "not-answered";
    return "not-visited";
  };

  /* ---------------- RENDER LOGIC ---------------- */

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="flex h-screen items-center justify-center gap-3">
       
          
          <p className="text-lg animate-pulse text-gray-900">Checking access…</p>
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-500"></div>
       
      </div>
    );
  }

  // Redirecting state - render nothing while redirecting
  if (!hasAccess) {
    return null;
  }

  // Error state
  if (fetchError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Error</h1>
          <p>Failed to load exam.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Still loading exam data
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading exam…</p>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN RENDER ---------------- */

  return (
    <StudyTracker>
      <div className="min-h-screen">
        {session && currentStep !== "submitted" && (
          <QuizHeader
            session={session}
            currentStep={currentStep}
            setCurrentStep={(step: string) => {
              // Only allow valid steps
              if (["info", "quiz", "summary", "submitted"].includes(step)) {
                setCurrentStep(step as "info" | "quiz" | "summary" | "submitted");
              }
            }}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
          />
        )}

        {currentStep === "info" && (
          <InfoPage
            Exam={ExamData}
            loading={loading}
            acceptedTerms={acceptedTerms}
            setAcceptedTerms={setAcceptedTerms}
            handleStart={handleStart}
            questionStatuses={questionStatuses}
          />
        )}

        {currentStep === "quiz" && (
          <QuizPage
            Exam={ExamData}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            currentanswer={currentAnswer}
            handleAnswer={handleAnswer}
            updateCurrentAnswer={updateCurrentAnswer}
            handleSaveAndNext={handleSaveAndNext}
            handleClearAnswer={handleClearAnswer}
            handleMarkForReview={handleMarkForReview}
            handleNextQuestion={handleNextQuestion}
            handlePrevQuestion={handlePrevQuestion}
            setCurrentStep={(step: string) => {
              // Only allow valid steps
              if (["info", "quiz", "summary", "submitted"].includes(step)) {
                setCurrentStep(step as "info" | "quiz" | "summary" | "submitted");
              }
            }}
            session={{ userId: session?.user.id ?? "" }}
            visitedQuestions={visitedQuestions}
            setVisitedQuestions={setVisitedQuestions}
            getQuestionStatus={getQuestionStatus}
          />
        )}

        {currentStep === "summary" && (
          <ExamSummary
            Exam={ExamData}
            UserResponse={UserResponse}
            markedForReview={markedForReview}
            visitedQuestions={visitedQuestions}
            onSubmit={onSubmit}
          />
        )}

        {currentStep === "submitted" && <SubmittedPage />}
      </div>
    </StudyTracker>
  );
};

export default QuizApp;