"use server";
import bcrypt from "bcryptjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { db } from "@/lib/db";
import { headers } from "next/headers";

import jwt from "jsonwebtoken";

// console.log(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const rateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, "3 s"),
});

export async function POST(req: Request) {
  const { email, otp, type = "email_verification" } = await req.json();
  // const user_ip = req.headers.get("x-real-ip") ?? "127.0.0.1";
  // console.log("user-ip", user_ip);
  // const { success } = await rateLimiter.limit(user_ip);

  // if (!success) {
  //   return new Response(JSON.stringify({error:"Too Many Requests"}), { status: 429 })
  // }

  if (!email || !otp) {
    return new Response(JSON.stringify({ error: "Email and OTP required" }), {
      status: 400,
    });
  }

  const otps = db.oTP;

  try {
    const otpRecord = await otps.findUnique({
      where: {
        email: email,
      },
    });

    if (!otpRecord) {
      return new Response(JSON.stringify({ error: "Invalid email or OTP" }), {
        status: 400,
      });
    }

    if (Date.now() > otpRecord.expires.getTime()) {
      await otps.delete({
        where: {
          email: otpRecord.email,
          otp: otpRecord.otp,
        },
      });
      return new Response(JSON.stringify({ error: "OTP has expired" }), {
        status: 400,
      });
    }

    const otpMatch = await bcrypt.compare(otp, otpRecord?.otp);
    if (!otpMatch) {
      return new Response(JSON.stringify({ error: "Invalid email or OTP" }), {
        status: 400,
      });
    }

    await otps.delete({
      where: {
        email: email,
      },
    });

    //token is generated if otp verify is used for password reset
    const token =
      type === "forgot_password"
        ? jwt.sign(
            { email, purpose: "forgot_password" },
            process.env.JWT_SECRET!,
            { expiresIn: "5m" }
          )
        : null;

    return new Response(
      JSON.stringify({
        success: true,
        ...(token && { token }), // include token if for reset
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
