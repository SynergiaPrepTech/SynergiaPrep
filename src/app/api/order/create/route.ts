import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { courseId, couponCode } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: true, message: "Course ID is required" },
        { status: 400 }
      );
    }

    // Fetch course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, price: true, title: true, discount: true,level:true },
    });

    if(course?.level === "COMING_SOON"){
        return NextResponse.json(
        { error: true, message: "This Course Is Not Released Yet !" },
        { status: 404 }
      );
    }

    if (!course) {
      return NextResponse.json(
        { error: true, message: "Course not found" },
        { status: 404 }
      );
    }

    let discount = course.discount || 0;
    let appliedCoupon: { code: string; fixedDiscount: number } | null = null;

    // Coupon validation
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: true, message: "Invalid coupon code" },
          { status: 400 }
        );
      }

      if (!coupon.isActive) {
        return NextResponse.json(
          { error: true, message: "Coupon is inactive" },
          { status: 400 }
        );
      }

      if (coupon.validTill && coupon.validTill < new Date()) {
        return NextResponse.json(
          { error: true, message: "Coupon has expired" },
          { status: 400 }
        );
      }

      if (coupon.minOrderAmount && (course.price - course.discount) < coupon.minOrderAmount) {
        return NextResponse.json(
          {
            error: true,
            message: `Used Coupon required Minimum order amount of ₹${coupon.minOrderAmount}`,
          },
          { status: 400 }
        );
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json(
          { error: true, message: "Coupon usage limit exceeded" },
          { status: 400 }
        );
      }

      discount = course.discount + coupon.fixedDiscount;
      appliedCoupon = { code: coupon.code, fixedDiscount: coupon.fixedDiscount };
    }

    const finalAmount = Math.max(
  course.price - discount,
  0
);

    // Free course
    if (finalAmount === 0) {
      return NextResponse.json({
        order:{
        free: true,
        course,
        discount,
        finalAmount,
        coupon: appliedCoupon?.code ?? null,
      }
      });

      
    }

    // Razorpay order creation with timeout handling
    let razorpayOrder;
    try {
      razorpayOrder = await instance.orders.create({
        amount: finalAmount * 100, // Amount in paise
        currency: "INR",
        receipt: uuid(),
      });
    } catch (err) {
      console.error("Razorpay order creation failed:", err);
      return NextResponse.json(
        { error: true, message: "Payment gateway error. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      free: false,
      order: razorpayOrder,
      course,
      discount,
      finalAmount,
      coupon: appliedCoupon?.code ?? null,
    });

  } catch (err) {
    console.error("Server error creating order:", err);
    return NextResponse.json(
      { error: true, message: "Server error" },
      { status: 500 }
    );
  }
}
