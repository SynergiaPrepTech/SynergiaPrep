// types/draft.ts - Add these new interfaces

// types/draft.ts - Add this interface
export interface LocalDraftExam {
  id: string;
  userId?: string;
  examDetails: ExamDetails;
  examSections: SectionFormState[];
  currentStep?: string;
  savedAt: string; // ISO string
}

// Also add this type if not already present
export interface ExamSection {
  name: string;
  description: string;
  isAllQuestionsMandatory: boolean;
  numberOfQuestionsToAttempt: number;
  sectionConfigId: string;
  subjectId: string;
  questions: QuestionFormState[];
}

export interface LocalDraftExam {
  id: string;
  userId?: string; // Optional for localStorage
  examDetails: ExamDetails;
  examSections: SectionFormState[];
  currentStep?: string; // Add this for tracking step
  savedAt: string; // ISO string for localStorage
}

// Your existing DraftExam interface is for database
// We'll keep LocalDraftExam for localStorage

export interface DraftExam {
  id: string;
  userId: string;
  examDetails: ExamDetails;
  examSections: SectionFormState[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currentStep?: string;
  savedAt?: string; // ISO string
}

export type DraftType = DraftExam & {
  currentStep?: string;
};

export interface ExamDetails {
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

export interface SectionFormState {
  name: string;
  description: string;
  isAllQuestionsMandatory: boolean;
  numberOfQuestionsToAttempt: number;
  sectionConfigId: string;
  sectionConfig: string;
  subjectId: string;
  subject: string;
  questions: QuestionFormState[];
}

export interface QuestionFormState {
  text: string;
  imageFile?: FileUploadState | null;
  chapterId: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  options?: OptionFormState[];
  answerExplanationField: AnswerExplanationField;
}

export interface OptionFormState {
  isCorrect: boolean;
  text?: string;
  imageFile?: FileUploadState | null;
}

export interface AnswerExplanationField {
  text?: string;
  value?: string;
  explanation?: string;
  imageFile?: FileUploadState | null;
}

export interface FileUploadState {
  file: File;
  previewUrl: string;
}

export type QuestionType = "SINGLE" | "MULTI" | "INTEGER";

export interface CreateDraftRequest {
  examDetails: ExamDetails;
  examSections: SectionFormState[];
  userId: string;
}

export interface UpdateDraftRequest {
  examDetails?: ExamDetails;
  examSections?: SectionFormState[];
  isActive?: boolean;
}

export interface DraftResponse {
  success: boolean;
  data?: DraftExam;
  message?: string;
  error?: string;
}