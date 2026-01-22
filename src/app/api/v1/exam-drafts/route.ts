// src/app/api/v1/exam-drafts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/utils/api-responses";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftId, userId, data } = body;

    console.log("Draft save request:", { 
      draftId, 
      userId, 
      hasExamDetails: !!data?.examDetails,
      sectionsCount: data?.examSections?.length || 0 
    });

    if (!data) {
      return errorResponse("Invalid payload", 400);
    }

    let draft;

    // Try to update if draftId exists and doesn't start with "local_"
    if (draftId) {
      try {
        // First check if draft exists
        const existingDraft = await db.examDraft.findUnique({
          where: { id: draftId },
        });

        if (existingDraft) {
          // Update existing draft
          draft = await db.examDraft.update({
            where: { 
              id: draftId,
            },
            data: { 
              data,
              updatedAt: new Date(),
            },
          });
          console.log("Draft updated:", draft.id);
        } else {
          // Draft doesn't exist, create new one
          draft = await db.examDraft.create({
            data: data,
          });
          console.log("New draft created (ID not found):", draft.id);
        }
      } catch (updateError: unknown) {
        console.error("Update error:", updateError);
        // If update fails, create new draft
        draft = await db.examDraft.create({
          data: {
            userId,
            data,
        },
        });
        console.log("Created new draft after update error:", draft.id);
      }
    } else {
      // Create new draft (either no draftId or local draft)
      draft = await db.examDraft.create({
        data: {
          userId,
          data,
        },
      });
      console.log("New draft created:", draft.id);
    }

    return successResponse(
      { 
        id: draft.id,
        message: draftId ? "Draft updated" : "Draft created"
      },
      draftId ? "Draft updated successfully" : "Draft created successfully",
      draftId ? 200 : 201
    );

  } catch (error: unknown) {
    console.error("Error saving draft:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to save draft: ${message}`, 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    
    const draftId = req.nextUrl.searchParams.get("draftId");

    if (draftId) {
      // Get single draft
      const draft = await db.examDraft.findUnique({
        where: {
          id: draftId,
        },
      });

      if (!draft) {
        return errorResponse("Draft not found", 404);
      }

      return successResponse(draft, "Draft fetched successfully");
    } else {
      // Get all drafts for user
      const drafts = await db.examDraft.findMany({
        where: {
          isActive: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      return successResponse(drafts, "Drafts fetched successfully");
    }
  } catch (error: unknown) {
    console.error("Error fetching drafts:", error);
    return errorResponse("Failed to fetch drafts", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get draftId from query parameter
    const url = new URL(req.url);
    const draftId = url.searchParams.get("draftId");

    console.log("DELETE request received for draftId:", draftId);

    if (!draftId) {
      return errorResponse("Draft ID is required", 400);
    }

    // Check if draft exists
    const existingDraft = await db.examDraft.findUnique({
      where: { id: draftId },
    });

    if (!existingDraft) {
      console.log("Draft not found:", draftId);
      return errorResponse("Draft not found", 404);
    }

    // Delete the draft
    await db.examDraft.delete({
      where: { id: draftId },
    });

    console.log("Draft deleted successfully:", draftId);

    return successResponse(null, "Draft deleted successfully");

  } catch (error: unknown) {
    console.error("Error deleting draft:", error);
    
    // Handle Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return errorResponse("Draft not found", 404);
    }
    
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to delete draft: ${message}`, 500);
  }
}