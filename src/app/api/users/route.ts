"use server";

import { errorResponse, successResponse } from "@/lib/utils/api-responses";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { UserUpdateValidationSchema } from "@/lib/utils/model-validation-schema";
import { auth } from "@/auth";


export const GET = async (req: NextRequest) => {
  try {
    const session = await auth();

    if (!session) {
      return errorResponse("Not authenticated", 401);
    }

    // Optional: Add admin check
    // const user = await db.user.findUnique({
    //   where: { id: session.user.id },
    //   select: { role: true }
    // });
    // if (user?.role !== 'ADMIN') {
    //   return errorResponse("Not authorized", 403);
    // }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    // Validate parameters
    if (page < 1) return errorResponse("Invalid page number", 400);
    if (limit < 1 || limit > 100) return errorResponse("Limit must be 1-100", 400);

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (courseId) {
      whereClause.courseId = courseId;
    }

    // Fetch enrollments with pagination
    const [enrollments, total] = await Promise.all([
      db.enrollment.findMany({
        skip,
        take: limit,
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.enrollment.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    return successResponse({
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    }, "Enrollments fetched successfully", 200);

  } catch (error) {
    console.error("GET enrollments error:", error);
    return errorResponse("Internal Server Error", 500, error);
  }
};


export const PATCH = async (req: NextRequest) => {
  try {
    const session = await auth();

    if (!session) {
      return errorResponse("Not authenticated", 401);
    }

    const id = session.user.id;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingUser) {
      return errorResponse("No user found", 404);
    }

    const body = await req.json();
    // console.log("PATCH request body:", body);

    // Validate the input
    const validation = UserUpdateValidationSchema.safeParse(body);
    if (!validation.success) {
      console.log("Validation error details:", validation.error.errors);
      return errorResponse("Invalid Input", 400, validation.error);
    }

    const { name, email, image, ph_no } = validation.data;

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findFirst({
        where: {
          email: email,
          id: { not: id },
        },
      });

      if (emailExists) {
        return errorResponse("Email already in use", 400);
      }
    }

    // Prepare update data - only update fields that are provided
    // const updateData: any = {};

    const updateData: {
      name?: string;
      email?: string;
      image?: string | null;
      ph_no?: string;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (image !== undefined) updateData.image = image;
    // Only set phone number if it's a non-null value. Prisma `ph_no` is non-nullable string.
    if (ph_no !== undefined && ph_no !== null) {
      updateData.ph_no = String(ph_no);
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      return successResponse(existingUser, "No changes to update", 200);
    }

    const updatedUser = await db.user.update({
      where: {
        id: id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        ph_no: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // console.log("Updated user:", updatedUser);
    return successResponse(updatedUser, "User updated successfully", 200);
  } catch (error: unknown) {
    console.error("PATCH user error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return errorResponse("Email already in use", 400);
    }

    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    return errorResponse("Internal Server Error", 500, message);
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const session = await auth();

    if (!session) {
      return errorResponse("Not authenticated", 401);
    }

    return errorResponse("User delete by self not implemented", 501);
  } catch (error) {
    console.error("DELETE user error:", error);
    return errorResponse("Internal Server Error", 500, error);
  }
};
