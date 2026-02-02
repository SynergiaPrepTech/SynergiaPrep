import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "@/lib/db"; // or your DB method

export async function POST(req: Request) {
  const {
    razorpayOrderId,
    razorpaySignature,
    razorpayPaymentId,
    email,
    amount,
    courseId,
    couponCode,
  } = await req.json();

  if (!email)
    return NextResponse.json(
      { message: "email is required", error: true },
      { status: 400 },
    );
  if (amount === undefined)
    return NextResponse.json(
      { message: "amount is required", error: true },
      { status: 400 },
    );
  if (!courseId)
    return NextResponse.json(
      { message: "courseId is required", error: true },
      { status: 400 },
    );

  // If amount is 0, skip Razorpay verification
  if (amount === 0) {
    // Directly create enrollment
    const enroll = await db.enrollment.create({
      data: {
        user: { connect: { email } },
        course: { connect: { id: courseId } },
        totalAmount: 0,
        // no payment ID for free course
      },
    });


  


    if (enroll) {

        if (couponCode) {
    await db.coupon.update({
      where: { code: couponCode },
      data: {
        usedCount: { increment: 1 }, // increment usedCount by 1
      },
    });
  }


      return NextResponse.json(
        { message: "Free course enrolled successfully", enroll, error: false },
        { status: 200 },
      );
    }
  }

  // For paid courses, verify Razorpay payment
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpaySignature;

  if (!isAuthentic) {
    return NextResponse.json(
      { message: "invalid payment signature", error: true },
      { status: 400 },
    );
  }

  console.log("email : ", email);
  console.log("courseId : ", courseId);

  // Paid course: create enrollment record
  await db.enrollment.create({
    data: {
      user: { connect: { email } },
      course: { connect: { id: courseId } },
      totalAmount: amount,
      paymentId: razorpayPaymentId || null,
    },
  });


    if (couponCode) {
    await db.coupon.update({
      where: { code: couponCode },
      data: {
        usedCount: { increment: 1 }, // increment usedCount by 1
      },
    });
  }

 
  return NextResponse.json(
    { message: "Payment successful, enrolled!", error: false },
    { status: 200 },
  );
}
