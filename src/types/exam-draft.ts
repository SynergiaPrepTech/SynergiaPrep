// src/types/exam-draft.ts
export interface ExamDraftData {
  examDetails: ExamDetails
  examSections: SectionFormState[]
  currentStep: "exam" | "section" | "preview"
}
