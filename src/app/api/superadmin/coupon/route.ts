import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuthAdmin, checkAuthSuperAdmin } from "@/lib/utils/auth-check-in-exam-api";

export async function POST(req: Request) {
   const authResponse = await checkAuthSuperAdmin();
       if(authResponse) return authResponse;
  try {
    const data = await req.json();

    const coupon = await db.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        fixedDiscount: Number(data.fixedDiscount),
        minOrderAmount: Number(data.minOrderAmount),
        validTill: data.validTill ? new Date(data.validTill) : null,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}


export async function GET() {
    const authResponse = await checkAuthAdmin();
  if (authResponse) return authResponse;

  try {
    const coupons = await db.coupon.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}