"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({
    type: "",
    message: "",
    show: false,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const synergiaprep = "914040a6-f7c8-4750-91b9-8aef783befb2";
    formData.append("access_key", synergiaprep);

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: json,
      });
      const result = await response.json();

      if (result.success) {
        (event.target as HTMLFormElement).reset();
        setFormStatus({
          type: "success",
          message: "Your message has been sent successfully!",
          show: true,
        });
        toast("Your message has been sent successfully!", {
          description: "We&apos;ll get back to you soon.",
          className: "bg-green-100 border-green-500",
        });
      } else {
        setFormStatus({
          type: "error",
          message: "Failed to send message. Please try again.",
          show: true,
        });
        toast.error("Failed to send message", {
          description: "Please try again later.",
          className: "bg-red-100 border-red-500",
        });
      }
    } catch (error) {
      setFormStatus({
        type: "error",
        message: "An error occurred. Please try again.",
        show: true,
      });
      toast.error("An error occurred", {
        description: "Please try again later.",
        className: "bg-red-100 border-red-500",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f3bfe] via-blue-400 dark:via-blue-900 to-blue-200 sm:pt-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-64 flex flex-col justify-center items-center text-white"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
        <p className="text-lg md:text-xl">We&apos;d love to hear from you!</p>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-[-5rem]  pt:5 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-blue-600 border-none text-white">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold border-b border-white/50 pb-4 mb-6">
                  Contact Details
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-20 h-20 mt-1" />
                    <div>
                      <h3 className="font-semibold">Our Location</h3>
                      <p className="text-gray-200 text-sm">
                        Institution’s Innovation Council (IIC),<br /> Jadavpur
                        University 
                        7th Floor of the Technology Bhawan, Main Campus, 188,
                        Raja S.C. Mallick Road, Kolkata, 700032, West Bengal,
                        India.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="font-semibold">Phone Number</h3>
                      <p className="text-gray-200">+91 82749 95556</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="font-semibold">Email Address</h3>
                      <p className="text-gray-200">
                        synergiaprep.official@gmail.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="font-semibold">Business Hours</h3>
                      <p className="text-gray-200">
                        Mon - Fri: 9:00 AM - 6:00 PM
                      </p>
                      <p className="text-gray-200">Weekend: Closed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/90 backdrop-blur-lg">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Let&apos;s Build Something Amazing Together
                </h2>
                <p className="text-gray-600 mb-6">
                  Share your vision with us, and we&apos;ll help bring it to
                  life with our expertise and innovative solutions.
                </p>

                {formStatus.show && (
                  <Alert
                    className={`mb-6 ${
                      formStatus.type === "success"
                        ? "bg-green-100 border-green-500"
                        : "bg-red-100 border-red-500"
                    }`}
                  >
                    <AlertDescription>{formStatus.message}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name*</Label>
                    <Input
                      id="name"
                      name="name"
                      className="border-gray-300 bg-white"
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email*</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        className="border-gray-300 bg-white"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number*</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="border-gray-300 bg-white"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Ask Me Anything</Label>
                    <Textarea
                      id="message"
                      name="message"
                      className="min-h-32 border-gray-300 bg-white"
                      placeholder="Your message here..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
