// // src/hooks/useExamDraftSync.ts
// import { useEffect, useRef, useCallback, useState } from "react";
// import debounce from "lodash/debounce";
// import type { ExamDetails, SectionFormState } from "@/types/draft";

// export interface ExamDraftData {
//   examDetails: ExamDetails;
//   examSections: SectionFormState[];
//   currentStep: string;
// }

// interface UseExamDraftSyncProps {
//   userId?: string;
//   draftId?: string;
//   payload: ExamDraftData;
//   onDraftId: (id: string) => void;
//   isEnabled?: boolean;
//   onSaveError?: (error: string) => void;
// }

// export function useExamDraftSync({
//   userId,
//   draftId,
//   payload,
//   onDraftId,
//   isEnabled = true,
//   onSaveError,
// }: UseExamDraftSyncProps) {
//   const previousPayloadRef = useRef<ExamDraftData | null>(null);
//   const isInitialMount = useRef(true);
//   const [isSaving, setIsSaving] = useState(false);

//   const saveDraft = useCallback(async (data: ExamDraftData, force = false) => {
//     if (!userId || !isEnabled) {
//       console.log("Skipping save:", { userId, isEnabled });
//       return;
//     }

//     // Skip if data hasn't changed
//     const currentDataStr = JSON.stringify(data);
//     const previousDataStr = JSON.stringify(previousPayloadRef.current);
    
//     if (!force && previousDataStr === currentDataStr) {
//       console.log("Data unchanged, skipping save");
//       return;
//     }

//     previousPayloadRef.current = JSON.parse(currentDataStr);
//     setIsSaving(true);

//     try {
//       console.log("Saving draft to database:", { 
//         userId, 
//         draftId,
//         hasTitle: !!data.examDetails?.title?.trim(),
//         sectionsCount: data.examSections?.length || 0
//       });

//       const res = await fetch("/api/v1/exam-drafts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           draftId, 
//           userId, 
//           data,
//         }),
//       });

//       const json = await res.json();

//       console.log("Save response:", { 
//         status: res.status, 
//         ok: res.ok, 
//         hasData: !!json.data 
//       });

//       if (!res.ok) {
//         const errorMsg = json.message || `HTTP ${res.status}: ${res.statusText}`;
//         console.error("Draft save failed:", errorMsg);
        
//         if (onSaveError) {
//           onSaveError(errorMsg);
//         }
        
//         return;
//       }

//       const newDraftId = json?.data?.id;
      
//       // Update draftId if it's new or different
//       if (newDraftId && newDraftId !== draftId) {
//         console.log("New draft ID received:", newDraftId);
//         onDraftId(newDraftId);
//       }
      
//     } catch (error: any) {
//       console.error("Network error saving draft:", error);
      
//       if (onSaveError) {
//         onSaveError(error.message || "Network error");
//       }
      
//     } finally {
//       setIsSaving(false);
//     }
//   }, [userId, draftId, onDraftId, isEnabled, onSaveError]);

//   const debouncedSave = useRef(
//     debounce((data: ExamDraftData) => {
//       saveDraft(data);
//     }, 2000, { leading: false, trailing: true })
//   ).current;

//   useEffect(() => {
//     // Skip save on initial mount
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       console.log("Initial mount, skipping auto-save");
//       return;
//     }

//     if (userId && isEnabled) {
//       console.log("Auto-saving draft to database...");
//       debouncedSave(payload);
//     }
//   }, [payload, userId, isEnabled, debouncedSave]);

//   useEffect(() => {
//     return () => {
//       console.log("Cleaning up draft sync...");
//       debouncedSave.cancel();
//     };
//   }, [debouncedSave]);

//   // Manual save function (always saves, even with minimal data)
//   const manualSave = useCallback(async () => {
//     console.log("Manual save triggered");
//     debouncedSave.cancel();
//     return saveDraft(payload, true);
//   }, [debouncedSave, saveDraft, payload]);

//   return { manualSave, isSaving };
// }