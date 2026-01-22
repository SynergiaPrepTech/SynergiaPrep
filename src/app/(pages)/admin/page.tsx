"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExamCreator from "@/components/Admin/ExamCreator2/ExamCreator";
import OtherExamForms from "@/components/Admin/Other/OtherExamForms";
import Drafts from "@/components/Admin/Drafts/Drafts";
import { DraftExam, ExamDetails } from "@/types/draft";

// Use the DraftType from the component directly if possible
// Or define it based on what ExamCreator expects
type DraftType = {
  id: string;
  examDetails: ExamDetails;
  examSections: Array<{
    name: string;
    description: string;
    isAllQuestionsMandatory: boolean;
    numberOfQuestionsToAttempt: number;
    sectionConfigId: string;
    sectionConfig: string;
    subjectId: string;
    subject: string;
    questions: Array<{
      text: string;
      imageUrl?: string | null;
      chapterId: string;
      difficultyLevel: "EASY" | "MEDIUM" | "HARD";
      options?: Array<{
        isCorrect: boolean;
        text: string;
        imageUrl?: string | null;
      }>;
      answerExplanationField: {
        text?: string;
        value?: string;
        explanation?: string;
        imageUrl?: string | null;
      };
    }>;
  }>;
  savedAt: string;
  currentStep: string;
};

// Define a type for LocalImage from your types/draft.ts
interface LocalImage {
  file: File;
  previewUrl: string;
}

// Define a union type for possible image input
type ImageInput = LocalImage | File | string | null | undefined;

// Helper function to convert LocalImage to imageUrl string
const convertLocalImageToUrl = (imageFile: ImageInput): string | null => {
  if (!imageFile) return null;
  
  // If it already has a previewUrl (LocalImage type)
  if (typeof imageFile === 'object' && 'previewUrl' in imageFile) {
    return (imageFile as LocalImage).previewUrl;
  }
  
  // If it's already a string URL
  if (typeof imageFile === 'string') {
    return imageFile;
  }
  
  // If it's a File object, create object URL
  if (imageFile instanceof File) {
    return URL.createObjectURL(imageFile);
  }
  
  return null;
};

// Main conversion function - Convert DraftExam to DraftType
const convertDraftToExamCreatorFormat = (
  draft: DraftExam
): DraftType => {
  return {
    id: draft.id,
    examDetails: {
      title: draft.examDetails.title,
      instruction: draft.examDetails.instruction,
      description: draft.examDetails.description,
      examTypeId: draft.examDetails.examTypeId,
      examType: draft.examDetails.examType,
      accessType: draft.examDetails.accessType,
      examCategoryId: draft.examDetails.examCategoryId,
      examCategory: draft.examDetails.examCategory,
      // subjectId: draft.examDetails.subjectId || "",
      // subject: draft.examDetails.subject || "",
      topicId: draft.examDetails.topicId || "",
      topic: draft.examDetails.topic || "",
      totalDurationInSeconds: draft.examDetails.totalDurationInSeconds || 0,
      courseId: draft.examDetails.courseId || "",
    },
    examSections: draft.examSections.map(section => ({
      name: section.name,
      description: section.description,
      isAllQuestionsMandatory: section.isAllQuestionsMandatory,
      numberOfQuestionsToAttempt: section.numberOfQuestionsToAttempt,
      sectionConfigId: section.sectionConfigId,
      sectionConfig: section.sectionConfig,
      subjectId: section.subjectId,
      subject: section.subject,
      questions: section.questions.map(question => ({
        text: question.text,
        imageUrl: convertLocalImageToUrl(question.imageFile),
        chapterId: question.chapterId,
        difficultyLevel: question.difficultyLevel,
        options: question.options?.map(option => ({
          isCorrect: option.isCorrect,
          text: option.text || "",
          imageUrl: convertLocalImageToUrl(option.imageFile),
        })),
        answerExplanationField: {
          text: question.answerExplanationField.text,
          value: question.answerExplanationField.value,
          explanation: question.answerExplanationField.explanation,
          imageUrl: convertLocalImageToUrl(question.answerExplanationField.imageFile),
        },
      })),
    })),
    savedAt: draft.savedAt,
    currentStep: draft.currentStep,
  };
};

const Header = () => (
  <div className="w-full bg-muted border-b">
    <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>
      <Button variant="ghost" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Admin Profile
      </Button>
    </div>
  </div>
);

const Page = () => {
  const [currentTab, setCurrentTab] = useState("examcreate");
  const [draftToResume, setDraftToResume] = useState<DraftType | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="w-full mx-auto p-4">
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="examcreate">Exam Create</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>

          {/* Fixed the comment syntax and removed type assertion */}
          <TabsContent value="examcreate" className="w-full">
            <ExamCreator
              draft={draftToResume}
              onFinish={() => setDraftToResume(null)}
            />
          </TabsContent>
          
          <TabsContent value="others">
            <OtherExamForms />
          </TabsContent>
          
          <TabsContent value="drafts">
            <Drafts
              onResume={(draft: DraftExam) => {
                const convertedDraft = convertDraftToExamCreatorFormat(draft);
                setDraftToResume(convertedDraft);
                setCurrentTab("examcreate");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Page;