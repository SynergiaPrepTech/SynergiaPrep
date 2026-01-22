interface ExamDetails {
  title: string;
  instruction: string;
  description: string;
  examTypeId: string;
  examType: string;
  accessType: "FREE" | "PAID";
  examCategoryId: string;
  examCategory: string;
  subjectId?: string;
  subject?: string;
  topicId?: string;
  topic?: string;
  totalDurationInSeconds?: number;
  courseId?: string;
}

interface ExamSection {
  name: string;
  description: string;
  isAllQuestionsMandatory: boolean;
  numberOfQuestionsToAttempt: number;
  sectionConfigId: string;
  sectionConfig: string;
  subjectId: string;
  subject: string;
  questions: Questions[];
}

interface Questions {
  text: string;
  imageUrl?: string | null;
  chapterId: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  options?: {
    isCorrect: boolean;
    text: string;
    imageUrl?: string | null;
  }[];
  answerExplanationField: {
    text?: string;
    value?: string;
    explanation?: string;
    imageUrl?: string | null;
  };
}

interface LocalImage {
  file: File;
  previewUrl: string;
}

type ImageFile = LocalImage | undefined | null;

interface QuestionFormState {
  text: string;
  imageFile?: LocalImage | null;
  chapterId: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  options?: {
    isCorrect: boolean;
    text: string;
    imageFile?: LocalImage | null;
  }[];
  answerExplanationField: {
    text?: string;
    value?: string;
    explanation?: string;
    imageFile?: LocalImage | null;
  };
}

// In SectionForm.tsx
interface SectionFormState {
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

interface DraftExam {
  id: number;
  examDetails: ExamDetails;
  examSections: SectionFormState[];
  savedAt: string;
  currentStep: string;
}

// When adding/editing questions, just store them with local files

type QuestionType = "SINGLE" | "MULTI" | "INTEGER";
