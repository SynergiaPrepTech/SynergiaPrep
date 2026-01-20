"use client";
import React, { Suspense, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Loading from "@/app/(pages)/checkout/loading";

interface PaymentButtonInterface {
  amount: number;
  courseId: string;
  couponCode: string;
}

const PaymentButton = ({
  amount,
  courseId,
  couponCode,
}: PaymentButtonInterface) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resMsg, setResMsg] = useState("");

  const makePayment = async () => {
    if (!session?.user?.id) {
      const callbackUrl = `/checkout?courseId=${courseId}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setIsLoading(true);

    try {
      const data = await fetch("/api/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          amount,
          couponCode,
        }),
      });

      const response = await data.json();

      if (response.error) {
        setResMsg(response.message);
        return;
      }
      console.log("co res", response);
      // alert(response.data.order.free)

      // Check if it's a free course
      if (response.order.free === true) {
        // For free courses, directly call the verify endpoint to create enrollment
        const verifyResponse = await fetch("/api/order/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpayPaymentId: null,
            razorpayOrderId: null,
            razorpaySignature: null,
            email: session?.user?.email,
            courseId: courseId,
            amount: 0, // Free course
            couponCode,
          }),
        });

        const verifyResult = await verifyResponse.json();

        if (verifyResult?.error === false) {
          router.push("/checkout/success");
        } else {
          setResMsg(verifyResult?.message || "Failed to enroll in free course");
          return;
        }

        setIsLoading(false);
        return;
      }

      // For paid courses, proceed with Razorpay
      const order = response.order;

      // Check if order exists
      if (!order || !order.id) {
        throw new Error("Invalid order response");
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        name: session?.user?.name || session?.user?.email || "Customer",
        description: `Payment for ${order.course?.title || "Course"}`,
        currency: order.currency || "INR",
        amount: order.amount * 100, // Convert to paise
        order_id: order.id,
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
        handler: async (response) => {
          const data = await fetch("/api/order/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              email: session?.user?.email,
              courseId,
              amount: order.amount * 100,
              couponCode,
            }),
          });

          const res = await data.json();

          if (res?.error === false) {
            router.push("/checkout/success");
          } else {
            setResMsg(res?.message || "Payment verification failed");
            setIsLoading(false);
          }
        },

        prefill: {
          email: session?.user?.email || "",
          contact: session?.user?.ph_no?.toString() || "",
          name: session?.user?.name || "",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      // Razorpay type definitions
      interface RazorpayOptions {
        key: string;
        name: string;
        description?: string;
        currency: string;
        amount: number;
        order_id: string;
        modal: {
          ondismiss: () => void;
        };
        handler: (response: {
          razorpay_payment_id: string | null;
          razorpay_order_id: string | null;
          razorpay_signature: string | null;
        }) => void;
        prefill: {
          email: string;
          contact: string;
          name?: string;
        };
        theme?: {
          color: string;
        };
      }

      // Check if Razorpay is available
      if (typeof window !== "undefined" && window.Razorpay) {
        const paymentObject = new window.Razorpay(options);

        paymentObject.on("payment.failed", (response) => {
          if ("error" in response) {
            console.error("Payment failed:", response.error);
            setResMsg(
              "Payment failed. Reason: " +
                (response.error.description || "Unknown error"),
            );
          }
          setIsLoading(false);
        });

        paymentObject.on("payment.success", (response) => {
          console.log("Payment success callback:", response);
        });

        paymentObject.open();
      } else {
        console.error("Razorpay SDK not loaded");
        setResMsg("Payment gateway not available. Please refresh the page.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      setResMsg("Failed to initiate payment. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="w-full">
        {resMsg && (
          <div className=" font-semibold  border border-amber-700 flex p-2 bg-amber-500/10 m-1 mb-2 text-amber-700  rounded-md">
            {resMsg}
          </div>
        )}
        <Button
          className="w-full bg-sky-700/80"
          disabled={isLoading}
          onClick={makePayment}
        >
          {isLoading
            ? "Processing..."
            : amount === 0
              ? "Enroll for Free"
              : `Pay ₹${amount}`}
        </Button>
      </div>
    </Suspense>
  );
};

export default PaymentButton;
