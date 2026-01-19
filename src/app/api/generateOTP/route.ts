"use server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { db } from "@/lib/db";

import {
  VerificationEmailTemplate,
  ForgotPasswordEmailTemplate,
} from "@/components/OTP-email";

const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(req: Request) {
  const { email, type = "email_verification" } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "Email not provided" }), {
      status: 400,
    });
  }
  const otp = crypto.randomInt(100000, 999999);

  //Hash the OTP
  const hashedOtp = await bcrypt.hash(otp.toString(), 10);
  // console.log(otp);
  try {
    //console.log(process.env.RESEND_API_KEY);

    const template =
      type === "email_verification"
        ? await VerificationEmailTemplate({ otp: otp.toString(), email })
        : await ForgotPasswordEmailTemplate({ otp: otp.toString(), email });

    const { data, error } = await resend.emails.send({
      from: "SynergiaPrep <noreply@synergiaprep.com>",
      to: email,
      subject:
        type === "email_verification"
          ? "OTP for Email Verification"
          : "OTP to Reset Password",
      react: template,
    });
    // console.log(data, error);
    if (error) {
      console.log("Error: ", error);
      return new Response(JSON.stringify({ error: "Could not send OTP" }), {
        status: 500,
      });
    }
    const otp_rec = await db.oTP.findUnique({
      where: {
        email: email,
      },
    });

    if (!!otp_rec)
      await db.oTP.update({
        where: {
          email: email,
        },
        data: {
          otp: hashedOtp,
          expires: new Date(Date.now() + 600000),
        },
      });
    else {
      await db.oTP.create({
        data: {
          email: email,
          otp: hashedOtp,
          expires: new Date(Date.now() + 600000), // 10 minutes
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      console.log("Error: ", err.stack);
      return new Response(JSON.stringify({ error: "Could not send OTP" }), {
        status: 500,
      });
    }
  }
}
