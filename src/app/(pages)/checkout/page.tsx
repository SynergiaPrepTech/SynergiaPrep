"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Course } from "@/type/course";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CircleCheck, Loader2 } from "lucide-react";
import PaymentButton from "@/components/PaymentButton";
import Image from "next/image";
import { useSession } from "next-auth/react";
import CourseDescriptionCard from "@/components/CourseDescriptionCard";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/v1/courses/${courseId}`);
        const data = await response.json();
        setCourse(data.data || null);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) {
      fetchCourse();
    } else {
      setLoading(false);
    }
  }, [courseId]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setApplying(true);
    setCouponError("");

    const res = await fetch("/api/coupon/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseId: courseId,
        couponCode: couponCode.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setCouponError(data.error || data.message || "Invalid coupon");
      setDiscount(0);
      setCouponCode("");
      setIsValid(false);
      setFinalAmount(course!.price);
    } else {
      setIsValid(true);
      setDiscount(data.discount);
      setFinalAmount(data.finalAmount);
    }

    setApplying(false);
  };

  useEffect(() => {
    if (course) {
      setFinalAmount(course.price);
    }
  }, [course]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading course details...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <p className="mb-6">
          The course you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Button onClick={() => router.push("/")}>Return to Courses</Button>
      </div>
    );
  }

  return (
    <div className="container min-w-[100vw]">
      <h1 className="text-2xl font-bold text-center mb-8">Course Checkout</h1>

      <div className="flex lg:flex-row flex-col w-full gap-4 lg:gap-8">
        {/* Desktop: Order Summary stays on right */}
        {/* Mobile: Order Summary shows as 2nd element */}
        <div className="lg:hidden order-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Original Price:</span>
                <span className="font-medium">₹{course.price}</span>
              </div>
              
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">
                  - ₹{discount > 0 ? discount : course.discount}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">
                  ₹{isValid ? finalAmount : (course.price - course.discount)}
                </span>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="mb-6">
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-semibold text-gray-600">Have A Coupon Code?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                  
                  {!isValid ? (
                    <Button
                      onClick={applyCoupon}
                      disabled={applying || !couponCode.trim()}
                      className="bg-green-600 hover:bg-green-700 whitespace-nowrap min-w-[80px]"
                    >
                      {applying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setCouponCode("");
                        setIsValid(false);
                      }}
                      variant="outline"
                      className="whitespace-nowrap min-w-[80px]"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {couponError && (
                <p className="mt-3 text-center text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">
                  {couponError}
                </p>
              )}

              {isValid && discount > 0 && (
                <p className="mt-3 text-center text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-center gap-2">
                  <CircleCheck className="h-4 w-4" />
                  Coupon Applied Successfully!
                </p>
              )}
            </div>

            {/* Payment Button */}
            <div className="mb-6">
              <PaymentButton 
                amount={isValid ? finalAmount : (course.price - course.discount)} 
                courseId={course.id} 
                couponCode={isValid ? couponCode : ""}
              />
            </div>

            {/* Trust Signals */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.enrollmentCount > 5 
                      ? `Join ${course.enrollmentCount} students who recently enrolled in this course`
                      : `Be the first to enroll in this course!`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Course Details */}
        <div className="lg:max-w-sm space-y-6 order-1">
          {/* Course Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="relative w-full h-48 md:h-64 mb-4 -mt-6 ">
              <Image 
                src={course.thumbnailUrl} 
                alt={course.title} 
                fill
                className="rounded-lg object-contain" 
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
            <p className="text-lg text-muted-foreground mb-4">
              {course.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">
                {course.examCategories.map((category) => category.name).join(", ")}
              </span>
              <span className="text-sm text-gray-500">
                {course.exams.map((exam) => exam.title).join(", ")}
              </span>
            </div>

            {/* <div className="flex items-center mb-6">
              <span className="text-sm text-gray-500">
                {course.enrollmentCount} students enrolled
              </span>
            </div> */}
            
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>
          </div>
        </div>

        {/* Course Description Card */}
        <div className="lg:overflow-y-scroll lg:max-h-screen lg:px-3 rounded-md order-3">
          <CourseDescriptionCard />
        </div>

        {/* Desktop: Order Summary */}
        <div className="hidden lg:block order-4">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Original Price:</span>
                <span className="font-medium">₹{course.price}</span>
              </div>
              
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">
                  - ₹{discount > 0 ? discount : course.discount}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">
                  ₹{isValid ? finalAmount : (course.price - course.discount)}
                </span>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="mb-6">
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-semibold text-gray-600">Have A Coupon Code?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                  
                  {!isValid ? (
                    <Button
                      onClick={applyCoupon}
                      disabled={applying || !couponCode.trim()}
                      className="bg-green-600 hover:bg-green-700 whitespace-nowrap min-w-[80px]"
                    >
                      {applying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setCouponCode("");
                        setIsValid(false);
                      }}
                      variant="outline"
                      className="whitespace-nowrap min-w-[80px]"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {couponError && (
                <p className="mt-3 text-center text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">
                  {couponError}
                </p>
              )}

              {isValid && discount > 0 && (
                <p className="mt-3 text-center text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-center gap-2">
                  <CircleCheck className="h-4 w-4" />
                  Coupon Applied Successfully!
                </p>
              )}
            </div>

            {/* Payment Button */}
            <div className="mb-6">
              <PaymentButton 
                amount={isValid ? finalAmount : (course.price - course.discount)} 
                courseId={course.id} 
                couponCode={isValid ? couponCode : ""}
              />
            </div>

            {/* Trust Signals */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.enrollmentCount > 5 
                      ? `Join ${course.enrollmentCount} students who recently enrolled in this course`
                      : `Be the first to enroll in this course!`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}