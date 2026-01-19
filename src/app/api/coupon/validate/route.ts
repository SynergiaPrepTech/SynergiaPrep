import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    
    const { courseId, couponCode } = await req.json();

    // console.log(courseId, couponCode)

    if (!courseId || !couponCode) {
      return NextResponse.json(
        { error: "Course ID and coupon code required" },
        { status: 400 }
      );
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { price: true, discount:true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const coupon = await db.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 }
      );
    }

    if (coupon.validTill && coupon.validTill < new Date()) {
      return NextResponse.json(
        { error: "Coupon expired" },
        { status: 400 }
      );
    }

    if ((course.price - course.discount) < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Coupon ${couponCode} Valid For Above ₹${coupon.minOrderAmount}`,
        },
        { status: 400 }
      );
    }

    const discount = Math.min(coupon.fixedDiscount, (course.price - course.discount)) + course.discount;
    const finalAmount = (course.price) - discount ;

    return NextResponse.json({
      success: true,
      discount,
      finalAmount,
      couponCode: coupon.code,
    });
  } catch (err) {
    console.error("Coupon validate error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
