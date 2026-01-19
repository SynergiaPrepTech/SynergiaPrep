"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { ExamGuard } from "../ExamGuard";

const QuizApp = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState("info");
  const [currentQuestion, setCurrentQuestion] = useState<[number, number]>([
    0, 0,
  ]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [markedForReview, setMarkedForReview] = useState(new Set<string>());
  const [visitedQuestions, setVisitedQuestions] = useState(
    new Set<string>(["0-0"])
  );
  const [loading, setLoading] = useState(true);
  const [fetcherror, setFetcherror] = useState(false);
  const [currentanswer, setCurrentanswer] = useState<{
    value?: string;
    questionId: string;
    chosenOptions?: { optionId: string }[];
  } | null>(null);

  const examId = searchParams.get("examId");

  const[accessType, setAccessType] =useState("");
  const[courseId, setCourseId] =useState("");
 
  

  const [ExamData, setExam] = useState<Exam>({} as Exam);

  const [UserResponse, setUserResponse] = useState<IUserResponse>({
    userId: session?.user.id ?? "",
    examId: examId ?? "",
    userAnswerPerQuestions: [] as UserAnswer[],
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);

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
      className:
        "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      text: "You have answered the question.",
    },
    {
      className:
        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      text: "You have NOT answered the question, but have marked the question for review.",
    },
    {
      className:
        "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
      text: "The question(s) 'Answered and Marked for Review' will be considered for evaluation.",
    },
  ];

  // Fetch exam data
  useEffect(() => {
    const fetchExamData = async () => {
      const response = await fetch(`/api/v1/exams/${examId}`);
      const data = await response.json();
      // console.log("exam data:",data.data)
      setAccessType(data.data.accessType)
      setCourseId(data.data.courseId);
      setExam(data)

      


setAccessType(data?.data?.accessType);

      setLoading(false);
      if (!response.ok) {
        setFetcherror(true);
        return;
      } else if (data.status !== "success") {
        setFetcherror(true);
        return;
      }
      setExam(data.data);
       setCourseId(data.data.courseId);
    };

    if (examId) fetchExamData();
  }, [examId,accessType,courseId]);

  // Pre-populate UserResponse with all questions and default answers
  useEffect(() => {
    if (!loading && !fetcherror && ExamData?.examSections?.length) {
      const prePopulatedAnswers: UserAnswer[] = [];
      ExamData.examSections.forEach((section) => {
        section.questions.forEach((question) => {
          prePopulatedAnswers.push({
            questionId: question.id,
            isAttempted: false,
            value: "",
            chosenOptions: [],
          });
        });
      });
      setUserResponse((prev) => ({
        ...prev,
        userAnswerPerQuestions: prePopulatedAnswers,
      }));
      setTimeLeft(ExamData.totalDurationInSeconds);
    }
  }, [loading, fetcherror, ExamData]);

  // Load any saved answer for the current question
  useEffect(() => {
    if (!fetcherror && !loading && ExamData?.examSections.length) {
      const questionId =
        ExamData.examSections[currentQuestion[0]].questions[currentQuestion[1]]
          .id;
      const existingAnswer = UserResponse.userAnswerPerQuestions.find(
        (ans) => ans.questionId === questionId
      );
      if (existingAnswer) {
        setCurrentanswer({
          value: existingAnswer.value,
          questionId: existingAnswer.questionId,
          chosenOptions: existingAnswer.chosenOptions,
        });
      } else {
        setCurrentanswer(null);
      }
    }
  }, [
    currentQuestion,
    ExamData,
    loading,
    UserResponse.userAnswerPerQuestions,
    fetcherror,
  ]);

  const handleStart = () => setCurrentStep("quiz");

  const handleAnswer = (
    sectionIndex: number,
    questionIndex: number,
    optionIndex?: number,
    value?: string
  ) => {
    const questionData =
      ExamData.examSections[sectionIndex].questions[questionIndex];
    const currentSectionData = ExamData.examSections[currentQuestion[0]];
    // For numerical questions, we won’t use this handler.
    if (questionData.options.length === 0) return;

    const optionId =
      optionIndex !== undefined ? questionData.options[optionIndex].id : "";
    // Determine if multiple selections are allowed
    const isMultiple = currentSectionData.sectionConfig.partialMarks.length > 1;

    setCurrentanswer((prev) => {
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
    // Retrieve the current question's id
    const questionId =
      ExamData.examSections[currentQuestion[0]].questions[currentQuestion[1]]
        .id;
    // Update currentanswer with the new value (preserving any existing chosenOptions)
    setCurrentanswer((prev) => ({
      value: newValue,
      questionId,
      chosenOptions: prev?.chosenOptions || [],
    }));
  };

  const handleSaveAndNext = () => {
    const [sectionIndex, questionIndex] = currentQuestion;
    const questionId =
      ExamData.examSections[sectionIndex].questions[questionIndex].id;

    // Update the pre-populated answer for the current question
    setUserResponse((prev) => {
      const updatedAnswers = prev.userAnswerPerQuestions.map((answer) =>
        answer.questionId === questionId
          ? {
            ...answer,
            isAttempted: true,
            value: currentanswer?.value?.toString() || "",
            chosenOptions:
              currentanswer?.chosenOptions?.map((option) => ({
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

    setCurrentanswer(null);

    // Move to next question logic
    if (
      ExamData &&
      currentQuestion[1] + 1 <
      ExamData.examSections[currentQuestion[0]].questions.length
    ) {
      const nextQuestion = currentQuestion[1] + 1;
      setCurrentQuestion([currentQuestion[0], nextQuestion]);
      setVisitedQuestions(
        new Set([...visitedQuestions, `${currentQuestion[0]}-${nextQuestion}`])
      );
    } else {
      const nextSection =
        ExamData && ExamData.examSections[currentQuestion[0]]
          ? (currentQuestion[0] + 1) % ExamData.examSections.length
          : 0;
      setCurrentQuestion([nextSection, 0]);
      setVisitedQuestions(new Set([...visitedQuestions, `${nextSection}-0`]));
    }
  };

  const handleClearAnswer = () => {
    setCurrentanswer(null);
    setUserResponse((prev) => ({
      ...prev,
      userAnswerPerQuestions: prev.userAnswerPerQuestions.map((answer) =>
        answer.questionId ===
          ExamData.examSections[currentQuestion[0]].questions[currentQuestion[1]]
            .id
          ? { ...answer, value: "", chosenOptions: [] }
          : answer
      ),
    }));

    if (markedForReview.has(`${currentQuestion[0]}-${currentQuestion[1]}`)) {
      const newMarked = new Set(markedForReview);
      newMarked.delete(`${currentQuestion[0]}-${currentQuestion[1]}`);
      setMarkedForReview(newMarked);
    }

    setVisitedQuestions(
      new Set([
        ...visitedQuestions,
        `${currentQuestion[0]}-${currentQuestion[1]}`,
      ])
    );
  };

  const handleMarkForReview = () => {
    setCurrentanswer(null);
    setMarkedForReview(
      new Set([
        ...markedForReview,
        `${currentQuestion[0]}-${currentQuestion[1]}`,
      ])
    );
    if (
      ExamData &&
      currentQuestion[1] + 1 <
      ExamData.examSections[currentQuestion[0]].questions.length
    ) {
      const nextQuestion = currentQuestion[1] + 1;
      setCurrentQuestion([currentQuestion[0], nextQuestion]);
      setVisitedQuestions(
        new Set([...visitedQuestions, `${currentQuestion[0]}-${nextQuestion}`])
      );
    } else {
      const nextSection =
        ExamData && ExamData.examSections[currentQuestion[0]]
          ? (currentQuestion[0] + 1) % ExamData.examSections.length
          : 0;
      setCurrentQuestion([nextSection, 0]);
      setVisitedQuestions(new Set([...visitedQuestions, `${nextSection}-0`]));
    }
  };

  const handleNextQuestion = () => {
    setCurrentanswer(null);
    if (
      ExamData?.examSections?.[currentQuestion[0]] &&
      currentQuestion[1] + 1 <
      ExamData.examSections[currentQuestion[0]].questions.length
    ) {
      const nextQuestion = currentQuestion[1] + 1;
      setCurrentQuestion([currentQuestion[0], nextQuestion]);
      setVisitedQuestions(
        new Set([...visitedQuestions, `${currentQuestion[0]}-${nextQuestion}`])
      );
    } else if (ExamData?.examSections?.length) {
      const nextSection = (currentQuestion[0] + 1) % ExamData.examSections.length;
      setCurrentQuestion([nextSection, 0]);
      setVisitedQuestions(new Set([...visitedQuestions, `${nextSection}-0`]));
    }
  };

  const handlePrevQuestion = () => {
    setCurrentanswer(null);
    if (currentQuestion[1] > 0) {
      setCurrentQuestion([currentQuestion[0], currentQuestion[1] - 1]);
    } else if (ExamData?.examSections?.length) {
      const prevSection =
        (currentQuestion[0] - 1 + ExamData.examSections.length) %
        ExamData.examSections.length;
      const prevQuestion =
        ExamData.examSections[prevSection].questions.length - 1;
      setCurrentQuestion([prevSection, prevQuestion]);
    }
  };

 const onSubmit = async (ans: boolean) => {
  if (ans) {
    const updatedResponse = {
      ...UserResponse,
      userId: session?.user.id ?? "",
    };

    // console.log("User Response: ", updatedResponse);

    try {
      const response = await fetch(`/api/v1/user-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedResponse),
      });

      const result = await response.json();
      // console.log(result);

      // Destructuring data from result object
      const {
        userId,
        examId,
        id: userSubmissionId,
      } = result.data;

      const report = (await submitAttempt(
        userId,
        examId,
        userSubmissionId,
        ExamData.totalDurationInSeconds - timeLeft
      )) as {
        data: {
          examId: string; // Note: lowercase 'd'
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

      // console.log("Report:", report);
      
      // Fix: Use examId (lowercase 'd') instead of examID
      const generateReport = await fetch(
        `/api/v1/reports/exams/${report.data.examId}/generate-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: report.data.userId,
            userSubmissionId: report.data.userSubmissionId,
          }),
        }
      );
      
      const generateReportData = await generateReport.json();
      // console.log("Generate Report:", generateReportData);
      setCurrentStep("submitted");
      setUserResponse(updatedResponse);
    } catch (error) {
      console.error("Error submitting attempt:", error);
    }
  } else {
    setCurrentStep("quiz");
  }
};
  const getQuestionStatus = (
    sectionNumber: number,
    questionNumber: number,
    questionId: string
  ) => {
    const isVisited = visitedQuestions.has(
      `${sectionNumber}-${questionNumber}`
    );
    const answer = UserResponse.userAnswerPerQuestions.find(
      (ans) => ans.questionId === questionId
    );
    const isAnswered =
      answer?.isAttempted &&
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

  return (
    <StudyTracker>
       {/* <ExamGuard courseId={courseId} accessType={accessType} /> */}

    <div className="min-h-screen">
      {session && currentStep !== "submitted" && (
        <QuizHeader
          session={session}
          // time={ExamData.totalDurationInSeconds}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
        />
      )}

      {loading && (
        <div className="container flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-4xl font-bold mb-4">Loading...</h1>
            <p className="text-xl">Please wait while we prepare your exam.</p>
          </div>
        </div>
      )}

      {fetcherror && (
        <div className="container flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-600">Error!</h1>
            <p className="text-xl text-gray-700">
              Oops! Something went wrong while fetching the exam data.
            </p>
            <p className="text-md text-gray-500 mt-2">
              Please check your internet connection and try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {!fetcherror && !loading && currentStep === "info" && (
        <InfoPage
          acceptedTerms={acceptedTerms}
          setAcceptedTerms={setAcceptedTerms}
          handleStart={handleStart}
          loading={loading}
          Exam={ExamData}
          questionStatuses={questionStatuses}
        />
      )}

      {!fetcherror && !loading && currentStep === "quiz" && (
        <QuizPage
          Exam={ExamData}
          currentQuestion={currentQuestion}
          setCurrentQuestion={setCurrentQuestion}
          currentanswer={currentanswer}
          handleAnswer={handleAnswer}
          updateCurrentAnswer={updateCurrentAnswer}
          handleSaveAndNext={handleSaveAndNext}
          handleClearAnswer={handleClearAnswer}
          handleMarkForReview={handleMarkForReview}
          handleNextQuestion={handleNextQuestion}
          handlePrevQuestion={handlePrevQuestion}
          setCurrentStep={setCurrentStep}
          session={{ userId: session?.user.id ?? "" }}
          visitedQuestions={visitedQuestions}
          setVisitedQuestions={setVisitedQuestions}
          getQuestionStatus={getQuestionStatus}
        />
      )}

      {!fetcherror && !loading && currentStep === "summary" && (
        <ExamSummary
          Exam={ExamData}
          UserResponse={UserResponse}
          markedForReview={markedForReview}
          visitedQuestions={visitedQuestions}
          onSubmit={onSubmit}
        />
      )}

      {!fetcherror && !loading && currentStep === "submitted" && (
        <SubmittedPage />
      )}
    </div>
    </StudyTracker>
  );
};

export default QuizApp;
