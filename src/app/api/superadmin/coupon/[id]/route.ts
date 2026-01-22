import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuthAdmin, checkAuthSuperAdmin } from "@/lib/utils/auth-check-in-exam-api";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Change here
) {
  try {
   const authResponse = await checkAuthSuperAdmin();
       if(authResponse) return authResponse;
    
    // Await the params promise
    const resolvedParams = await params; // Add this line
    const data = await req.json();

    const coupon = await db.coupon.update({
      where: { id: resolvedParams.id }, // Change to resolvedParams
      data: {
        fixedDiscount: Number(data.fixedDiscount),
        minOrderAmount: Number(data.minOrderAmount),
        validTill: data.validTill ? new Date(data.validTill) : null,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(coupon);
  } catch {
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> } // Change here
) {
 const authResponse = await checkAuthSuperAdmin();
     if(authResponse) return authResponse;
  
  try {
    // Await the params promise
    const resolvedParams = await params; // Add this line
    
    await db.coupon.delete({
      where: { id: resolvedParams.id }, // Change to resolvedParams
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}