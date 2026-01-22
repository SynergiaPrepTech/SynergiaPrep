"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ExamDetailsForm } from "./ExamDetailsForms";
import { SectionDetailsForm } from "./SectionForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { uploadFileToS3 } from "./action";
import { useSession } from "next-auth/react";
import { Loader2, Save, Clock, FileText, AlertCircle, CheckCircle2, XCircle, Upload, Eye, Edit2 } from "lucide-react";
import { toast } from "sonner";

// Define types
interface ExamDetailsType {
  title: string;
  instruction: string;
  description: string;
  examTypeId: string;
  examType: string;
  accessType: "FREE" | "PAID";
  examCategoryId: string;
  examCategory: string;
  topicId: string;
  topic: string;
  courseId: string;
  totalDurationInSeconds: number;
}

interface OptionType {
  text: string;
  isCorrect: boolean;
  imageFile?: { file: File; previewUrl: string };
}

interface AnswerExplanationFieldType {
  text?: string;
  value?: string;
  explanation?: string;
  imageFile?: { file: File; previewUrl: string };
}

interface QuestionType {
  text: string;
  imageFile?: { file: File; previewUrl: string };
  options?: OptionType[];
  answerExplanationField: AnswerExplanationFieldType;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  chapterId: string; // Add this line
}

interface SectionType {
  name: string;
  description: string;
  isAllQuestionsMandatory: boolean;
  numberOfQuestionsToAttempt: number;
  sectionConfigId: string;
  sectionConfig: string; // Add this
  subjectId: string;
  subject: string; // Add this
  questions: QuestionFormState[];
}

interface DraftType {
  id: string;
  examDetails: ExamDetailsType;
  examSections: SectionType[];
  currentStep: string;
  savedAt?: string;
  userId?: string;
}

const LOCAL_STORAGE_KEY = "examDetails";

const ExamCreator = ({
  draft,
  onFinish,
}: {
  draft: DraftType | null;
  onFinish?: () => void;
}) => {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<string>(draft?.currentStep || "exam");
  const [ExamDetails, setExamDetails] = useState<ExamDetailsType>(
    draft?.examDetails || {
      title: "",
      instruction: "",
      description: "",
      examTypeId: "",
      examType: "",
      accessType: "FREE",
      examCategoryId: "",
      examCategory: "",
      topicId: "",
      topic: "",
      courseId: "",
      totalDurationInSeconds: 0,
    }
  );
  const [examSections, setExamSections] = useState<SectionType[]>(
    draft?.examSections || []
  );

  const [draftId, setDraftId] = useState<string | null>(draft?.id || null);
  const [isSubmitExam, setSubmitExam] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if draft has meaningful data
  const hasMeaningfulData = useCallback(() => {
    if (ExamDetails?.title?.trim()) return true;
    if (ExamDetails?.description?.trim()) return true;
    if (ExamDetails?.instruction?.trim()) return true;
    if (ExamDetails?.examType?.trim()) return true;
    
    if (examSections && examSections.length > 0) {
      const hasQuestions = examSections.some(section => 
        section.questions && section.questions.length > 0
      );
      if (hasQuestions) return true;
      
      const hasSectionName = examSections.some(section => 
        section.name?.trim()
      );
      if (hasSectionName) return true;
    }
    
    return false;
  }, [ExamDetails, examSections]);

  // Track changes for manual save prompts
  const previousStateRef = React.useRef({ ExamDetails, examSections, currentStep });

  // Check for changes
  useEffect(() => {
    const currentState = { ExamDetails, examSections, currentStep };
    const previousState = previousStateRef.current;
    
    const hasChanged = JSON.stringify(currentState) !== JSON.stringify(previousState);
    
    if (hasChanged) {
      setHasUnsavedChanges(true);
      previousStateRef.current = currentState;
    }
  }, [ExamDetails, examSections, currentStep]);

  // Save to localStorage
  const saveToLocalStorage = useCallback((force = false) => {
    // Only save if we have meaningful data or forced
    if (!force && !hasMeaningfulData()) {
      console.log("Skipping localStorage save: no meaningful data");
      return null;
    }

    try {
      const existingDrafts: DraftType[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"
      );

      const newDraft: DraftType = {
        id: draftId || `local_${Date.now()}`,
        userId: session?.user?.id,
        examDetails: ExamDetails,
        examSections: examSections,
        currentStep: currentStep,
        savedAt: new Date().toISOString(),
      };

      const updatedDrafts = draftId
        ? existingDrafts.map((draft: DraftType) =>
            draft.id === draftId ? newDraft : draft
          )
        : [...existingDrafts, newDraft];

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDrafts));
      
      if (!draftId) {
        setDraftId(newDraft.id);
      }
      
      console.log("Saved to localStorage:", newDraft.id);
      setHasUnsavedChanges(false);
      return newDraft.id;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return null;
    }
  }, [ExamDetails, examSections, currentStep, draftId, session?.user?.id, hasMeaningfulData]);

  // Save to database
  const saveToDatabase = useCallback(async (force = false) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to save drafts to cloud");
      return null;
    }

    // Only save if we have meaningful data or forced
    if (!force && !hasMeaningfulData()) {
      console.log("Skipping database save: no meaningful data");
      toast.info("Add some content before saving to cloud");
      return null;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const draftData = {
        examDetails: ExamDetails,
        examSections,
        currentStep,
      };

      console.log("Saving draft to database:", { 
        userId: session.user.id, 
        draftId,
        hasTitle: !!ExamDetails.title?.trim()
      });

      const res = await fetch("/api/v1/exam-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draftId?.startsWith("local_") ? undefined : draftId,
          userId: session.user.id,
          data: draftData,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to save draft");
      }

      const newDraftId = result.data?.id;
      
      if (newDraftId && newDraftId !== draftId) {
        console.log("New draft ID received:", newDraftId);
        setDraftId(newDraftId);
      }

      setLastSaved(new Date().toLocaleTimeString());
      setHasUnsavedChanges(false);
      return newDraftId;
    } catch (error: unknown) {
      console.error("Error saving to database:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      setSaveError(message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [ExamDetails, examSections, currentStep, draftId, session?.user?.id, hasMeaningfulData]);

  // Manual save handler - saves to localStorage first, then database
  const handleManualSave = async () => {
    if (!hasMeaningfulData()) {
      toast.error("Add some content before saving");
      return;
    }

    // First save to localStorage
    const localDraftId = saveToLocalStorage(true);
    if (!localDraftId) {
      toast.error("Failed to save locally");
      return;
    }

    toast.info("Saved locally");

    // Then save to database if user is logged in
    if (session?.user.id) {
      try {
        const cloudDraftId = await saveToDatabase(true);
        toast.success("Draft saved to cloud", {
          description: cloudDraftId ? `Draft ID: ${cloudDraftId.slice(0, 8)}...` : undefined,
        });

        localStorage.removeItem(LOCAL_STORAGE_KEY)
        // localStorage.removeItem('draft_exam')

      } catch (error: unknown) {
        toast.error("Failed to save to cloud", {
          description: "Your draft is saved locally and will sync when online",
        });
      }
    }
  };

  // Auto-save to localStorage only when user leaves the page or after 30 seconds of inactivity
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && hasMeaningfulData()) {
        saveToLocalStorage(true);
      }
    };

    // Auto-save after 30 seconds of inactivity
    const inactivityTimer = setTimeout(() => {
      if (hasUnsavedChanges && hasMeaningfulData()) {
        console.log("Auto-saving due to inactivity");
        saveToLocalStorage(true);
      }
    }, 30000); // 30 seconds

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(inactivityTimer);
    };
  }, [hasUnsavedChanges, hasMeaningfulData, saveToLocalStorage]);

  // Load from localStorage on initial mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const drafts: DraftType[] = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"
        );

        if (drafts.length > 0 && draft?.id) {
          // Try to find the specific draft by ID
          const foundDraft = drafts.find((d: DraftType) => d.id === draft.id);
          if (foundDraft) {
            setExamDetails(foundDraft.examDetails || ExamDetails);
            setExamSections(foundDraft.examSections || []);
            setCurrentStep(foundDraft.currentStep || "exam");
            setDraftId(foundDraft.id);
            console.log("Loaded draft from localStorage:", foundDraft.id);
            return;
          }
        }

        // Otherwise, get the most recent draft for this user
        const userDrafts = drafts.filter((d: DraftType) => 
          d.userId === session?.user?.id || !d.userId
        );

        if (userDrafts.length > 0) {
          const recentDraft = userDrafts[userDrafts.length - 1];
          if (recentDraft) {
            setExamDetails(recentDraft.examDetails || ExamDetails);
            setExamSections(recentDraft.examSections || []);
            setCurrentStep(recentDraft.currentStep || "exam");
            setDraftId(recentDraft.id);
            console.log("Loaded recent draft from localStorage:", recentDraft.id);
          }
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
    };

    loadFromLocalStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty dependency array to run only on mount

  // Rest of your existing functions remain exactly the same
  const uploadAllImages = async (sections: SectionType[]) => {
    const uploadPromises = sections.flatMap((section) =>
      section.questions.flatMap(async (question: QuestionType) => {
        const questionImageUrl = question.imageFile
          ? await uploadFileToS3(question.imageFile.file)
          : undefined;

        const optionImageUrls = await Promise.all(
          question.options?.map(async (option: OptionType) =>
            option.imageFile
              ? await uploadFileToS3(option.imageFile.file)
              : undefined
          ) || []
        );

        const answerImageUrl = question.answerExplanationField.imageFile
          ? await uploadFileToS3(question.answerExplanationField.imageFile.file)
          : undefined;

        return {
          question,
          questionImageUrl,
          optionImageUrls,
          answerImageUrl,
        };
      })
    );

    return Promise.all(uploadPromises);
  };

  const handleExamSubmit = async () => {
  try {
    setSubmitExam(true);
    
    // Save one last time before submission
    if (hasMeaningfulData()) {
      saveToLocalStorage(true);
      
      if (session?.user.id) {
        await saveToDatabase(true);
      }
    }

    const uploadResults = await uploadAllImages(examSections);

    const sectionsWithUrls = examSections.map((section, sectionIndex) => ({
      ...section,
      questions: section.questions.map(
        ({ imageFile, ...question }: QuestionType, questionIndex: number) => {
          const result = uploadResults.find(
            (res) => res.question.text === question.text
          );

          return {
            ...question,
            imageUrl: result?.questionImageUrl,
            options: question.options?.map(
              ({ imageFile, ...option }: OptionType, optionIndex: number) => ({
                ...option,
                imageUrl: result?.optionImageUrls[optionIndex],
              })
            ),
           answerExplanationField: {
  text: question.answerExplanationField.text,
  value: question.answerExplanationField.value,
  explanation: question.answerExplanationField.explanation,
  imageUrl: result?.answerImageUrl,
},
          };
        }
      ),
    }));

    await submitExamData(sectionsWithUrls);

    // Clean up object URLs
    examSections.forEach((section) => {
      section.questions.forEach((question: QuestionType) => {
        if (question.imageFile?.previewUrl)
          URL.revokeObjectURL(question.imageFile.previewUrl);
        question.options?.forEach((option: OptionType) => {
          if (option.imageFile?.previewUrl)
            URL.revokeObjectURL(option.imageFile.previewUrl);
        });
        if (question.answerExplanationField.imageFile?.previewUrl) {
          URL.revokeObjectURL(
            question.answerExplanationField.imageFile.previewUrl
          );
        }
      });
    });

    // Clear draft after successful submission
    if (draftId) {
      const existingDrafts: DraftType[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"
      );
      const updatedDrafts = existingDrafts.filter((draft: DraftType) => draft.id !== draftId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDrafts));
    }

    setSubmitExam(false);
    toast.success("Exam submitted successfully!");
    
    if (onFinish) {
      onFinish();
    }
  } catch (error: unknown) {
    console.error("Error submitting exam:", error);
    setSubmitExam(false);
    const message = error instanceof Error ? error.message : "Unknown error";
    toast.error("Failed to submit exam", {
      description: message,
    });
  }
};

  async function submitExamData(sectionsWithUrls: SectionType[]) {
    const data = {
      title: ExamDetails.title,
      instructions: ExamDetails.instruction,
      description: ExamDetails.description,
      isDraft: false,
      examType: ExamDetails.examType,
      accessType: ExamDetails.accessType,
      examCategoryId: ExamDetails.examCategoryId,
      courseId: ExamDetails.courseId, 
      totalDurationInSeconds: ExamDetails.totalDurationInSeconds,
      examSections: sectionsWithUrls.map((section) => ({
        name: section.name,
        description: section.description,
        isAllQuestionsMandatory: section.isAllQuestionsMandatory,
        numberOfQuestionsToAttempt: section.questions.length,
        sectionConfigId: section.sectionConfigId,
        subjectId: section.subjectId,
        questions: section.questions,
      })),
    };

    try {
      const response = await fetch("/api/v1/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  // Calculate total questions
  const totalQuestions = examSections.reduce(
    (total, section) => total + section.questions.length,
    0
  );

  // Calculate estimated completion time
  const estimatedTime = ExamDetails.totalDurationInSeconds 
    ? `${Math.floor(ExamDetails.totalDurationInSeconds / 60)} min` 
    : "Not set";



  return (
    <>
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Exam</h1>
                <p className="text-sm text-gray-500">
                  {ExamDetails.title || "Untitled Exam"}
                  {draftId?.startsWith("local_") && " (Offline)"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Duration: {estimatedTime}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Questions: {totalQuestions}</span>
              </div>
              
              {hasUnsavedChanges && (
                <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                  Unsaved changes
                </div>
              )}
              
              {draftId && (
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs",
                  draftId.startsWith("local_") 
                    ? "bg-amber-100 text-amber-800" 
                    : "bg-green-100 text-green-800"
                )}>
                  {draftId.startsWith("local_") ? "Offline" : "Cloud"} Draft: {draftId.slice(0, 8)}...
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {isSaving && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <Upload className="h-4 w-4 animate-pulse" />
                    <span>Syncing...</span>
                  </div>
                )}
                
                {lastSaved && !isSaving && !saveError && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Synced {lastSaved}</span>
                  </div>
                )}
                
                {saveError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>Sync failed</span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleManualSave}
                disabled={isSaving || !hasMeaningfulData()}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentStep("exam")}
                className={`flex flex-col items-center px-6 ${currentStep === "exam" ? "text-primary" : "text-gray-500"}`}
              >
                <div className={`h-2 w-24 rounded-full ${currentStep === "exam" ? "bg-primary" : "bg-gray-300"}`}></div>
                <span className="mt-2 text-sm font-medium">Exam Details</span>
                {currentStep === "exam" && <Edit2 className="h-4 w-4 mt-1" />}
              </button>
              
              <button
                onClick={() => setCurrentStep("section")}
                className={`flex flex-col items-center px-6 ${currentStep === "section" ? "text-primary" : "text-gray-500"}`}
              >
                <div className={`h-2 w-24 rounded-full ${currentStep === "section" ? "bg-primary" : "bg-gray-300"}`}></div>
                <span className="mt-2 text-sm font-medium">Questions</span>
                {currentStep === "section" && <Edit2 className="h-4 w-4 mt-1" />}
              </button>
              
              <button
                onClick={() => setCurrentStep("preview")}
                className={`flex flex-col items-center px-6 ${currentStep === "preview" ? "text-primary" : "text-gray-500"}`}
              >
                <div className={`h-2 w-24 rounded-full ${currentStep === "preview" ? "bg-primary" : "bg-gray-300"}`}></div>
                <span className="mt-2 text-sm font-medium">Preview</span>
                {currentStep === "preview" && <Eye className="h-4 w-4 mt-1" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 mx-auto w-full max-w-7xl">
        {saveError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Sync Error:</span>
              <span>{saveError}</span>
            </div>
            <Button
              onClick={handleManualSave}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Retry Save
            </Button>
          </div>
        )}

        {currentStep === "exam" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Exam Information</h2>
              <div className="flex gap-3">
                <Button
                  onClick={handleManualSave}
                  disabled={isSaving || !hasMeaningfulData()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  onClick={() => {
                    if (ExamDetails.title && ExamDetails.examType) {
                      setCurrentStep("section");
                    } else {
                      toast.error("Please fill in exam title and type before proceeding.");
                    }
                  }}
                  disabled={!ExamDetails.title || !ExamDetails.examType}
                >
                  Next: Add Questions →
                </Button>
              </div>
            </div>
            
            <ExamDetailsForm
              setCurrentStep={setCurrentStep}
              ExamDetails={ExamDetails}
              setExamDetails={setExamDetails}
            />
          </div>
        )}

        {currentStep === "section" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Exam Questions</h2>
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep("exam")}
                  variant="outline"
                  size="sm"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleManualSave}
                  disabled={isSaving || !hasMeaningfulData()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  onClick={() => setCurrentStep("preview")}
                  disabled={examSections.length === 0 || totalQuestions === 0}
                >
                  Preview Exam
                </Button>
              </div>
            </div>

            <SectionDetailsForm
              examSections={examSections}
              setCurrentStep={setCurrentStep}
              setExamSections={setExamSections}
              examConfigId={ExamDetails.examCategoryId}
            />
          </div>
        )}

        {currentStep === "preview" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Exam Preview</h2>
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep("exam")}
                  variant="outline"
                  size="sm"
                >
                  Edit Exam Details
                </Button>
                <Button
                  onClick={() => setCurrentStep("section")}
                  variant="outline"
                  size="sm"
                >
                  Edit Questions
                </Button>
                <Button
                  onClick={handleManualSave}
                  disabled={isSaving || !hasMeaningfulData()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  onClick={handleExamSubmit}
                  disabled={isSubmitExam}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitExam ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Publish Exam"
                  )}
                </Button>
              </div>
              
            </div>
             <ExamPreview
              examDetails={ExamDetails}
              examSections={examSections}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ExamCreator;



const ExamPreview = ({
  examDetails,
  examSections,
}: {
  examDetails: ExamDetails;
  examSections: SectionFormState[];
}) => {
  return (
    <div className="space-y-8">
      {/* Exam Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Title</h3>
                <p>{examDetails.title}</p>
              </div>
              <div>
                <h3 className="font-semibold">Duration</h3>
                <p>{examDetails.totalDurationInSeconds} seconds</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Instructions</h3>
              <p className="whitespace-pre-wrap">{examDetails.instruction}</p>
            </div>

            <div>
              <h3 className="font-semibold">Description</h3>
              <p className="whitespace-pre-wrap">{examDetails.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Exam Type</h3>
                <p>{examDetails.examType}</p>
              </div>
              <div>
                <h3 className="font-semibold">Category</h3>
                <p>{examDetails.examCategory}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Preview */}
      {examSections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <CardTitle>
              Section {sectionIndex + 1}: {section.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p>{section.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Configuration</h3>
                  <p>
                    Questions to attempt: {section.numberOfQuestionsToAttempt}
                  </p>
                  <p>
                    All questions mandatory:{" "}
                    {section.isAllQuestionsMandatory ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {/* Questions */}
              <MathJaxContext>
                <div className="space-y-6">
                  <h3 className="font-semibold">Questions</h3>
                  {section.questions.map((question, questionIndex) => (
                    <div
                      key={questionIndex}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">
                          Question {questionIndex + 1}
                        </h4>
                        <span
                          className={cn("px-2 py-1 rounded text-sm", {
                            "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200":
                              question.difficultyLevel === "EASY",
                            "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200":
                              question.difficultyLevel === "MEDIUM",
                            "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200":
                              question.difficultyLevel === "HARD",
                          })}
                        >
                          {question.difficultyLevel}
                        </span>
                      </div>

                      <div>
                        <p className="whitespace-pre-wrap">
                          <MathJax inline>{question.text}</MathJax>
                        </p>
                        {question.imageFile?.previewUrl && (
                          <Image
                            src={question.imageFile?.previewUrl}
                            alt="Question image"
                            className="mt-2 max-w-md rounded"
                            width={500}
                            height={500}
                          />
                        )}
                      </div>

                      {question.options && (
                        <div className="space-y-2">
                          <h5 className="font-medium">Options:</h5>
                          <div className="grid gap-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={cn(
                                  "p-2 rounded-md",
                                  option.isCorrect
                                    ? "bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-300"
                                    : "bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-300"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="font-medium">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <div className="flex-1">
                                    <p>
                                      <MathJax inline>{option.text}</MathJax>
                                    </p>
                                    {option.imageFile?.previewUrl && (
                                      <Image
                                        src={option.imageFile.previewUrl}
                                        alt="Option image"
                                        className="mt-2 max-w-md rounded"
                                        width={500}
                                        height={500}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.answerExplanationField && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                          {question.answerExplanationField.text && (
                            <>
                              <h5 className="font-medium text-blue-800">
                                Text:
                              </h5>
                              <p className="text-blue-700">
                                <MathJax inline>
                                  {question.answerExplanationField.text}
                                </MathJax>
                              </p>
                            </>
                          )}
                          {question.answerExplanationField.value && (
                            <>
                              <h5 className="font-medium text-blue-800">
                                Value:
                              </h5>
                              <p className="text-blue-700">
                                <MathJax inline>
                                  {question.answerExplanationField.value}
                                </MathJax>
                              </p>
                            </>
                          )}
                          {question.answerExplanationField.explanation && (
                            <>
                              <h5 className="font-medium text-blue-800">
                                Explanation:
                              </h5>
                              <p className="text-blue-700">
                                <MathJax inline>
                                  {question.answerExplanationField.explanation}
                                </MathJax>
                              </p>
                            </>
                          )}
                          {question.answerExplanationField.imageFile
                            ?.previewUrl && (
                            <Image
                              src={
                                question.answerExplanationField.imageFile
                                  ?.previewUrl
                              }
                              alt="Answer image"
                              className="mt-2 max-w-md rounded"
                              width={500}
                              height={500}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </MathJaxContext>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};