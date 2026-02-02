"use client";
import React, { useState, useEffect } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  Flag,
  Save,
  X as CloseIcon,
  Maximize2,
} from "lucide-react";
import QuestionPanel from "./QuestionPanel";
import { Exam, OptionSelection } from "@/types/examTypes";
import 'katex/dist/katex.min.css';
import katex from 'katex';
import Image from "next/image";
import StudyTracker from "../StudyTracker";

interface QuizPageProps {
  Exam: Exam;
  currentQuestion: [number, number];
  setCurrentQuestion: (q: [number, number]) => void;
  currentanswer: {
    value?: string;
    questionId: string;
    chosenOptions?: OptionSelection[];
  } | null;
  handleAnswer: (
    sectionIndex: number,
    questionIndex: number,
    optionIndex?: number,
    value?: string
  ) => void;
  handleSaveAndNext: () => void;
  handleClearAnswer: () => void;
  handleMarkForReview: () => void;
  handleNextQuestion: () => void;
  handlePrevQuestion: () => void;
  setCurrentStep: (step: string) => void;
  session: { userId: string };
  visitedQuestions: Set<string>;
  setVisitedQuestions: (visited: Set<string>) => void;
  getQuestionStatus: (
    sectionNumber: number,
    questionNumber: number,
    questionId: string
  ) => string;
  updateCurrentAnswer: (value: string) => void;
}

// Image Modal Component
const ImageModal: React.FC<{
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ imageUrl, alt, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh]">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10"
        >
          <CloseIcon className="h-6 w-6" />
        </Button>

        <div className="relative w-full h-full">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        <div className="mt-4 text-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const Numpad: React.FC<{
  value: string;
  onChange: (newVal: string) => void;
}> = ({ value, onChange }) => {
  const handleClick = (digit: string) => onChange(value + digit);
  const handleBackspace = () => onChange(value.slice(0, -1));

  return (
    <div className="mt-6">
      <input
        type="text"
        readOnly
        value={value}
        className="mb-4 w-full p-3 rounded-lg text-center text-lg font-medium bg-gray-50 border border-gray-200"
      />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <Button
            key={digit}
            onClick={() => handleClick(digit.toString())}
            variant="outline"
            className="h-14 text-lg font-medium hover:bg-gray-100"
          >
            {digit}
          </Button>
        ))}
        <Button
          onClick={handleBackspace}
          variant="outline"
          className="h-14 text-lg font-medium hover:bg-gray-100"
        >
          Back
        </Button>
        <Button
          onClick={() => handleClick("0")}
          variant="outline"
          className="h-14 text-lg font-medium hover:bg-gray-100"
        >
          0
        </Button>
        <Button
          onClick={() => onChange("")}
          variant="outline"
          className="h-14 text-lg font-medium hover:bg-gray-100"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

// Helper function to render text with LaTeX
const renderTextWithLatex = (text: string, isLatexReady: boolean = false) => {
  if (!text) return null;

  // Unescape dollar signs (\$ -> $) as source data often has them escaped
  let processedText = text.replace(/\\\$/g, '$');

  // If Latex (specifically mhchem) isn't ready, return text as is
  if (!isLatexReady && processedText.includes('\\ce{')) {
    return <span>{processedText}</span>;
  }

  // Wrap all \ce{...} chemistry notation that don't already have $ delimiters
  const hasChemistry = /\\ce\{[^}]+\}/.test(processedText);
  if (hasChemistry) {
    // Only wrap if not already wrapped
    if (!processedText.includes('$\\ce{')) {
      processedText = processedText.replace(/\\ce\{[^}]+\}/g, (match) => `$${match}$`);
    }
  }

  // Split the text by LaTeX expressions
  const parts = processedText.split(/(\$\$?[^$]+\$\$?)/);

  return parts.map((part, index) => {
    // Check if it's a LaTeX expression
    if (part.startsWith('$') && part.endsWith('$')) {
      const isBlock = part.startsWith('$$') && part.endsWith('$$');
      const latexContent = part.slice(isBlock ? 2 : 1, isBlock ? -2 : -1);

      try {
        // KaTeX render options with trust for mhchem chemistry notation
        const html = katex.renderToString(latexContent, {
          displayMode: isBlock,
          trust: true, // Required for \ce chemistry commands
          strict: false,
          throwOnError: false,
        });

        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: html }}
            className={isBlock ? "katex-block" : "katex-inline"}
          />
        );
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        return <span key={index} className="text-red-500" title={String(error)}>{part} (Error: {String(error)})</span>;
      }
    }
    return <span key={index}>{part}</span>;
  });
};

// Helper function to clean LaTeX expressions
const cleanLatexText = (text: string) => {
  if (!text) return text;

  // Fix common LaTeX issues
  const cleaned = text
    // Ensure proper spacing
    .replace(/\\cdot/g, '\\cdot ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
};

const QuizPage: React.FC<QuizPageProps> = ({
  Exam,
  currentQuestion,
  setCurrentQuestion,
  currentanswer,
  handleAnswer,
  handleSaveAndNext,
  handleClearAnswer,
  handleMarkForReview,
  handleNextQuestion,
  handlePrevQuestion,
  setCurrentStep,
  session,
  visitedQuestions,
  setVisitedQuestions,
  getQuestionStatus,
  updateCurrentAnswer,
}) => {
  const [modalImage, setModalImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isLatexReady, setIsLatexReady] = useState(false);

  // Ensure katex is available globally for mhchem script to patch
  if (typeof window !== 'undefined') {
    (window as unknown as { katex: typeof katex }).katex = katex;
  }

  // Check if mhchem is ALREADY loaded (e.g. navigation or cached script)
  useEffect(() => {
    if ((window as unknown as { katex?: { __mhchemSpec?: unknown } }).katex?.__mhchemSpec) {
      setIsLatexReady(true);
    }
  }, []);


  const currentSectionData = Exam?.examSections?.[currentQuestion[0]];
  const currentQuestionData = currentSectionData?.questions?.[currentQuestion[1]];

  // Return early if exam data is not ready
  if (!Exam?.examSections?.length || !currentSectionData || !currentQuestionData) {
    return <div className="bg-white min-h-screen flex items-center justify-center">Loading question...</div>;
  }

  const isNumerical = currentQuestionData.options.length === 0;
  // Determine if question is multi-select by counting correct answers
  const correctAnswersCount = currentQuestionData.options.filter(opt => opt.isCorrect).length;
  const isMultipleChoice = !isNumerical && correctAnswersCount > 1;

  return (
    <StudyTracker>
      <div className="bg-white">
        <div className="max-w-screen-xl mx-auto px-4 flex">
          {/* Main content area - fixed at 75% on large screens */}
          <div className="w-full lg:w-3/4 pr-0 lg:pr-6 border-r-2">
            <Card className="border-0 rounded-xl shadow-none overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                      Section: {currentSectionData.name}
                    </span>
                    <h2 className="text-xl font-bold mt-2">
                      Question {currentQuestion[1] + 1} of{" "}
                      {currentSectionData.questions.length}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="lg:hidden">
                          <Menu className="h-5 w-5 mr-2" />
                          Questions
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader>
                          <SheetTitle>Question Panel</SheetTitle>
                          <SheetDescription>
                            Navigate through questions using this panel.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-4">
                          <QuestionPanel
                            Exam={Exam}
                            currentQuestion={currentQuestion}
                            setCurrentQuestion={setCurrentQuestion}
                            visitedQuestions={visitedQuestions}
                            setVisitedQuestions={setVisitedQuestions}
                            getQuestionStatus={getQuestionStatus}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Question Text with LaTeX */}
                  <div className="p-4 bg-gray-50 rounded-lg text-gray-800 text-lg">
                    <div className="katex-render">
                      {renderTextWithLatex(currentQuestionData.text, isLatexReady)}
                    </div>

                    {currentQuestionData.imageUrl && (
                      <div className="mt-4 relative group">
                        <div className="relative w-full max-w-md mx-auto">
                          <img
                            src={currentQuestionData.imageUrl}
                            alt="Question Image"
                            className="w-full h-auto max-h-64 object-contain rounded-md border border-gray-300 cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setModalImage({
                              url: currentQuestionData.imageUrl,
                              alt: "Question Image"
                            })}
                          />
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Maximize2 className="h-3 w-3" />
                            Click to view fullscreen
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {isNumerical ? (
                    <Numpad
                      value={currentanswer?.value || ""}
                      onChange={(newVal) => updateCurrentAnswer(newVal)}
                    />
                  ) : (
                    <div className="space-y-3 mt-4">
                      {currentQuestionData.options.map((option, index) => (
                        <div key={index} className="space-y-2">
                          <div
                            className={`w-full gap-2 justify-start text-left min-h-[56px] py-4 px-5 rounded-lg text-md font-medium cursor-pointer ${currentanswer?.chosenOptions?.some(
                              (opt) => opt.optionId === option.id
                            )
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-800 border border-gray-200"
                              }`}
                            onClick={() =>
                              handleAnswer(
                                currentQuestion[0],
                                currentQuestion[1],
                                index
                              )
                            }
                          >
                            <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full border border-current">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="katex-render">
                              {renderTextWithLatex(option.text, isLatexReady)}
                            </span>
                          </div>
                          {option.imageUrl && (
                            <div className="pl-9 pr-4">
                              <div className="relative w-full max-w-xs group">
                                <img
                                  src={option.imageUrl}
                                  alt={`Option ${String.fromCharCode(65 + index)} Image`}
                                  className="w-full h-auto max-h-48 object-contain rounded-md border border-gray-300 cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() => setModalImage({
                                    url: option.imageUrl,
                                    alt: `Option ${String.fromCharCode(65 + index)} Image`
                                  })}
                                />
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Maximize2 className="h-3 w-3" />
                                  View fullscreen
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 gap-2"
                      onClick={handleSaveAndNext}
                    >
                      <Save size={16} />
                      Save & Next
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50 gap-2"
                      onClick={handleClearAnswer}
                    >
                      <X size={16} />
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      className="text-amber-600 hover:text-amber-600 border-amber-200 hover:bg-amber-50 gap-2"
                      onClick={handleMarkForReview}
                    >
                      <Flag size={16} />
                      Review
                    </Button>
                    <Button
                      variant="outline"
                      className="text-purple-600 hover:text-purple-600 border-purple-200 hover:bg-purple-50 gap-2"
                      onClick={handleMarkForReview}
                    >
                      <CheckCircle size={16} />
                      Mark & Next
                    </Button>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handlePrevQuestion}
                      >
                        <ChevronLeft size={16} /> Prev
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleNextQuestion}
                      >
                        Next <ChevronRight size={16} />
                      </Button>
                    </div>

                    <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                      <Button
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => setShowSubmitDialog(true)}
                      >
                        Submit
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to submit your exam? Once submitted, you won&apos;t be able to make any changes to your answers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setShowSubmitDialog(false);
                              setCurrentStep("summary");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Yes, Submit
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed width sidebar - always 25% on large screens */}
          <div className="hidden lg:block w-1/4">
            <div className="bg-white p-5 rounded-xl border-0 w-full">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                Question Panel
              </h3>
              <QuestionPanel
                Exam={Exam}
                currentQuestion={currentQuestion}
                setCurrentQuestion={setCurrentQuestion}
                visitedQuestions={visitedQuestions}
                setVisitedQuestions={setVisitedQuestions}
                getQuestionStatus={getQuestionStatus}
              />
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {modalImage && (
          <ImageModal
            imageUrl={modalImage.url}
            alt={modalImage.alt}
            isOpen={!!modalImage}
            onClose={() => setModalImage(null)}
          />
        )}
      </div>
      <Script
        src="https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/contrib/mhchem.min.js"
        strategy="afterInteractive"
        onReady={() => {
          console.log('mhchem script onReady fired');
          setIsLatexReady(true);
        }}
      />
    </StudyTracker>
  );
};

export default QuizPage;