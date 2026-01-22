'use server';

import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/utils/api-responses";
import { checkAuthSuperAdmin } from "@/lib/utils/auth-check-in-exam-api";
import { NextRequest } from "next/server";



export const GET = async (req: NextRequest) => {

    
    const authResponse = await checkAuthSuperAdmin();
    if(authResponse) return authResponse;
    

    try {
        
        return successResponse({}, "super admin get not implemented", 501);

    } catch (error) {
        return errorResponse("Internal Server Error", 500, error);
    }
};



export const POST = async (req: NextRequest) => {

    
    const authResponse = await checkAuthSuperAdmin();
    if(authResponse) return authResponse;
    

    try {
        
        return successResponse({}, "super admin post not implemented", 501);

    } catch (error) {
        return errorResponse("Internal Server Error", 500, error);
    }
};



export const PATCH = async (req: NextRequest) => {
    const authResponse = await checkAuthSuperAdmin();
    if(authResponse) return authResponse;

    try {
        // Parse the request body
        const body = await req.json();
        
        // Extract required fields from the payload
        const { targetUserId, targetUserRole } = body;
        
        // Validate required fields
        if (!targetUserId || !targetUserRole) {
            return errorResponse("Both targetUserId and targetUserRole are required", 400);
        }
        
        // Validate the role is one of the allowed values
        const allowedRoles = ["ADMIN", "USER", "SUPERADMIN"]; // Add other roles as needed
        if (!allowedRoles.includes(targetUserRole)) {
            return errorResponse(`Invalid role. Allowed roles: ${allowedRoles.join(", ")}`, 400);
        }
        
        // Validate userId format if needed (optional)
        if (typeof targetUserId !== 'string' || targetUserId.trim().length === 0) {
            return errorResponse("Invalid user ID format", 400);
        }
        
        
        const user = await db.user.findUnique({ where: { id: targetUserId } });
        if (!user) return errorResponse("User not found", 404);
        
        const updatedUser = await db.user.update({
            where: { id: targetUserId },
            data: { role: targetUserRole }
        });
        
        return successResponse(
            {
                message: "User role updated successfully",
                updatedUser: {
                    id: targetUserId,
                    role: targetUserRole
                }
            },
            "User role has been updated",
            200
        );

    } catch (error) {
         
        return errorResponse("Internal Server Error", 500, error);
    }
};




