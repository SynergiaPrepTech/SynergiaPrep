"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Trash2, Loader2, FileText, Calendar, Folder, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { DraftExam, ExamDetails, SectionFormState } from "@/types/draft";

interface ApiDraft {
  id: string;
  userId: string;
  data: {
    examDetails: ExamDetails;
    examSections: SectionFormState[];
    currentStep?: string;
    savedAt?: string; // Add this here since it's in data
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LocalStorageDraft {
  id: string;
  userId: string;
  examDetails: ExamDetails;
  examSections: SectionFormState[];
  currentStep: string;
  savedAt: string;
}

const Drafts = ({ onResume }: { onResume: (draft: DraftExam) => void }) => {
  const { data: session } = useSession();
  const [drafts, setDrafts] = useState<ApiDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const LOCAL_STORAGE_KEY = "examDetails";
  
  const fetchDrafts = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/v1/exam-drafts?userId=${session.user.id}`);
      
      if (!res.ok) {
        throw new Error(`Failed to load drafts: ${res.statusText}`);
      }

      const json = await res.json();

      if (json.status === "success") {
        // Filter only active drafts
        const activeDrafts = json.data.filter((draft: ApiDraft) => draft.isActive !== false);
        setDrafts(activeDrafts);
      } else {
        throw new Error(json.message || "Failed to load drafts");
      }
    } catch (error: unknown) {
      console.error("Failed to load drafts:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load drafts", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleDelete = async (draftId: string) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to delete drafts");
      return;
    }

    setDeletingId(draftId);

    try {
      const res = await fetch(`/api/v1/exam-drafts?draftId=${draftId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to delete draft");
      }

      // Remove from local state
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      
      toast.success("Draft deleted successfully");
    } catch (error: unknown) {
      console.error("Failed to delete draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to delete draft", {
        description: errorMessage,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Save draft to localStorage
  const saveToLocalStorage = (draft: ApiDraft) => {
    try {
      // Get existing drafts from localStorage
      const existingDrafts = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"
      ) as LocalStorageDraft[];

      // Convert API draft to localStorage format
      const localDraft: LocalStorageDraft = {
        id: draft.id,
        userId: draft.userId,
        examDetails: draft.data.examDetails,
        examSections: draft.data.examSections,
        currentStep: draft.data.currentStep || "exam",
        savedAt: new Date().toISOString(),
      };

      // Check if this draft already exists in localStorage
      const draftIndex = existingDrafts.findIndex((d: LocalStorageDraft) => d.id === draft.id);
      
      if (draftIndex >= 0) {
        // Update existing draft
        existingDrafts[draftIndex] = localDraft;
      } else {
        // Add new draft
        existingDrafts.push(localDraft);
      }

      // Save back to localStorage (keep only last 10 drafts)
      const recentDrafts = existingDrafts.slice(-10);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recentDrafts));
      
      console.log("Draft saved to localStorage:", draft.id);
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  };

  const handleResume = (draft: ApiDraft) => {
    console.log("Resuming draft and saving to localStorage:", draft.id);
    
    // First, save the draft to localStorage
    const savedToLocal = saveToLocalStorage(draft);
    
    if (!savedToLocal) {
      toast.error("Failed to save draft locally");
      return;
    }

    // Then convert API draft to DraftExam format
    const draftExam: DraftExam = {
      id: draft.id,
      userId: draft.userId,
      examDetails: {
        title: draft.data.examDetails?.title || "",
        instruction: draft.data.examDetails?.instruction || "",
        description: draft.data.examDetails?.description || "",
        examTypeId: draft.data.examDetails?.examTypeId || "",
        examType: draft.data.examDetails?.examType || "",
        accessType: draft.data.examDetails?.accessType || "FREE",
        examCategoryId: draft.data.examDetails?.examCategoryId || "",
        examCategory: draft.data.examDetails?.examCategory || "",
        topicId: draft.data.examDetails?.topicId || "",
        topic: draft.data.examDetails?.topic || "",
        courseId: draft.data.examDetails?.courseId || "",
        totalDurationInSeconds: draft.data.examDetails?.totalDurationInSeconds || 0,
      },
      examSections: draft.data.examSections || [],
      isActive: draft.isActive,
      createdAt: new Date(draft.createdAt),
      updatedAt: new Date(draft.updatedAt),
      // Access currentStep and savedAt from draft.data
      currentStep: draft.data.currentStep || "1",
      savedAt: draft.data.savedAt || new Date().toISOString(),
    };
    
    // Show success message
    toast.success("Draft loaded successfully", {
      description: "Your draft has been saved locally for offline editing",
    });
    onResume(draftExam);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading drafts...</p>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No draft exams found</h3>
        <p className="text-muted-foreground">Create a new exam to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Drafts</h2>
          <p className="text-muted-foreground">
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Folder className="h-4 w-4 mr-2" />
          Auto-saved
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drafts.map((draft) => (
          <Card 
            key={draft.id} 
            className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {draft.data.examDetails?.title || "Untitled Exam"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(draft.id)}
                  disabled={deletingId === draft.id}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  {deletingId === draft.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(draft.updatedAt)}
              </div>
            </CardHeader>

            <CardContent className="text-sm space-y-3 pb-4">
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">
                  {draft.data.examDetails?.examCategory || "Not set"}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="secondary" className="text-xs">
                  {draft.data.examDetails?.examType || "Not set"}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sections:</span>
                <Badge variant="outline" className="text-xs">
                  {draft.data.examSections?.length || 0}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last saved:</span>
                <span className="font-medium">
                  {new Date(draft.updatedAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t">
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDelete(draft.id)}
                  disabled={deletingId === draft.id}
                >
                  {deletingId === draft.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => handleResume(draft)}
                >
                  Continue Editing
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>
          Drafts are automatically saved as you work. Click &quot;Continue Editing&quot; to resume working on any draft.
        </p>
      </div>
    </div>
  );
};

export default Drafts;