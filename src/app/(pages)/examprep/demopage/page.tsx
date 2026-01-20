"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  BarChart3,
  Download,
  ArrowRight,
  Lock,
  FileDown,
  GraduationCap,
  Check,
} from "lucide-react";
import Image from "next/image";
import CourseCarousel from "@/components/CourseCarousel";

const demoFeatures = [
  {
    id: "practice",
    title: "Practice",
    description: "Practice with adaptive questions and detailed explanations",
    href: "/examprep/practice",
    requiresAuth: false,
    icon: BookOpen,
    color: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "pyq",
    title: "PYQ Bank",
    description: "Previous Year Questions with solutions and explanations",
    href: "/examprep/pyqbank",
    requiresAuth: false,
    icon: FileText,
    color: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
    note: "Attempting tests requires login",
  },
  {
    id: "mock",
    title: "Mock Tests",
    description: "Simulated exams with performance analytics",
    href: "/examprep/mock",
    requiresAuth: false,
    icon: BarChart3,
    color: "bg-purple-50 border-purple-100",
    iconColor: "text-purple-600",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    note: "Taking tests requires login",
  },
  {
    id: "quiz",
    title: "Quick Quiz",
    description: "Short topic-based quizzes for quick revision",
    href: "/examprep/quiz",
    requiresAuth: false,
    icon: FileText,
    color: "bg-indigo-50 border-indigo-100",
    iconColor: "text-indigo-600",
    buttonColor: "bg-indigo-600 hover:bg-indigo-700",
    note: "Quick practice sessions",
  },
  {
    id: "archive",
    title: "Archives",
    description: "Download PDFs, notes, and study materials for free",
    href: "/archive",
    requiresAuth: false,
    icon: FileDown,
    color: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-600",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
    note: "Free downloads for everyone",
  },
];

// Updated faculty data with your actual information
const facultyMembers = [
  {
    id: 1,
    name: "Dr. Arnab Das",
    qualification: "PhD from Jadavpur University",
    expertise: "Physics",
    image: "/assets/Faculty/arnab das.png",
  },
  {
    id: 2,
    name: "Dr. D. Roy",
    qualification: "PhD from Jadavpur University",
    expertise: "Chemistry",
    image: "/placeholder.svg", // Placeholder for missing image
  },
  {
    id: 3,
    name: "Mr. Tanbir Ahammed",
    qualification: "B.E. & M.Tech from Jadavpur University",
    expertise: "Mathematics",
    image: "/assets/Faculty/tanbir ahammed.png",
  },
  {
    id: 4,
    name: "Mr. Mahamood Hasan",
    qualification: "B.E. from Jadavpur University",
    expertise: "Physics",
    image: "/assets/Faculty/mahamood hasan.png",
  },
  {
    id: 5,
    name: "Mr. Mousom Roy",
    qualification: "M.Tech., Pursuing PhD from Jadavpur University",
    expertise: "Chemistry",
    image: "/assets/Faculty/mousom roy.png",
  },
  {
    id: 6,
    name: "Mr. Najes Riaz",
    qualification: "M.Sc. in Physics from Calcutta University",
    expertise: "Physics",
    image: "/assets/Faculty/najes riaz.png",
  },
  {
    id: 6,
    name: "Mr. Abir Ghosh",
    qualification: "B.E. ,Electrical Engineering, Jadavpur University",
    expertise: "Mathematics",
    image: "/assets/Faculty/abir ghosh.png",
  },
];

const DemoPage = () => {
  const router = useRouter();
  const [clickedFeature, setClickedFeature] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleFeatureClick = (feature: (typeof demoFeatures)[0]) => {
    setClickedFeature(feature.id);
    router.push(feature.href);
  };

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  const handleRegisterRedirect = () => {
    router.push("/login");
  };

  // Auto-scroll functionality
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollSpeed = 1.2; // pixels per frame

    const animateScroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;

        // Reset to start when reaching end
        if (
          scrollContainer.scrollLeft >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(animateScroll);
    };

    animationId = requestAnimationFrame(animateScroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused]);

  // Duplicate faculty for seamless scrolling
  const duplicatedFaculty = [
    ...facultyMembers,
    ...facultyMembers,
    ...facultyMembers,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mx-auto">
            <div className="text-center mx-auto mt-16 mb-10">
              <h1 className="relative inline-block text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Explore Our Courses
                <span className="absolute left-1/2 -bottom-3 w-16 h-[3px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full -translate-x-1/2"></span>
              </h1>

              <p className="mt-6 text-sm md:text-base text-gray-600 max-w-xl mx-auto">
                Carefully designed mock papers and exam-oriented courses to
                boost your preparation
              </p>
            </div>

            <CourseCarousel />

            {/* <h1 className="text-4xl md:text-5xl mt-16 font-bold text-gray-900 mb-4">
              Start Your Exam Preparation
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Free access to practice materials, PYQs, mock tests, and study
              resources. Create an account to track progress and unlock full
              features.
            </p> */}

            {/* Authentication Buttons */}
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleRegisterRedirect}
                size="lg"
                className="bg-[#2D9596] hover:bg-[#88C399] px-8 py-6 text-lg font-semibold rounded-lg"
              >
                Create Free Account
              </Button>
              <Button
                onClick={handleLoginRedirect}
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg font-semibold rounded-lg"
              >
                Already have an account? Login
              </Button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h2 className="relative inline-block text-3xl font-extrabold text-gray-900 tracking-tight">
            Explore Our Free Features
            <span className="absolute left-1/2 -bottom-3 w-20 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full -translate-x-1/2"></span>
          </h2>

          <p className="mt-6 text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Get started with these essential preparation tools.
            <span className="block text-sm mt-1 text-gray-500">
              Some interactive features require login.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:ml-[-10rem] lg:mr-[-10rem]">
          {demoFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.id}
                className={`group hover:shadow-xl transition-all duration-300 border-2 ${feature.color} hover:border-gray-300 h-full flex flex-col`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${feature.color} border`}>
                      <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    {feature.note && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {feature.note}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mt-4">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Available for everyone</span>
                    </div>

                    {feature.id === "pyq" || feature.id === "mock" ? (
                      <div className="flex items-center text-sm text-gray-700">
                        <Lock className="h-3 w-3 text-amber-500 mr-2" />
                        <span>Login required for test attempts</span>
                      </div>
                    ) : feature.id === "archive" ? (
                      <div className="flex items-center text-sm text-gray-700">
                        <Download className="h-3 w-3 text-green-500 mr-2" />
                        <span>Instant PDF downloads</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span>Start immediately</span>
                      </div>
                    )}

                    {feature.id === "archive" && (
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                        <span>100% free resources</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t">
                  <Button
                    onClick={() => handleFeatureClick(feature)}
                    className={`w-full ${feature.buttonColor} text-white font-semibold py-3 group-hover:scale-[1.02] transition-transform`}
                    disabled={clickedFeature === feature.id}
                  >
                    {clickedFeature === feature.id ? (
                      <>Opening...</>
                    ) : (
                      <>
                        Access Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pricing & Membership Tiers */}
      <div className="bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pricing and Membership Tiers
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Pricing Table */}
            <div className="lg:col-span-3 overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-50 text-md text-gray-700">
                    <th className="text-left px-6 py-4 border-r">Facilities</th>
                    <th className="px-6 py-4 border-r text-center">
                      <div className="font-bold text-xl mt-1">Free</div>
                    </th>
                    {/* Recommended */}
                    <th className="px-6 py-4 border-r text-center relative bg-blue-50">
                      <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-semibold py-1">
                        RECOMMENDED
                      </div>
                      <div className="pt-6">
                        Paid
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 line-through text-lg">
                              ₹1999
                            </span>
                            <span className="font-bold text-2xl text-blue-700">
                              ₹1199
                            </span>
                          </div>
                          <div className="text-xs text-green-600 font-semibold mt-1">
                            Save ₹800
                          </div>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="text-sm text-gray-700">
                  {[
                    ["Live Classes for WBJEE 2026", false, true],
                    [
                      "Previous Years Questions (PYQ) practice",
                      "3 years",
                      "10 years",
                    ],
                    ["Mock Test", "Limited (3)", "15"],
                    ["Sectional Mock", "1", "4"],
                    ["WBJEE Counselling Support", false, true],
                    ["Gap Certificate Preparation", true, true],
                    ["Access To JU Alumni Network", false, true],
                  ].map(([label, freeValue, paidValue], i) => (
                    <tr
                      key={i}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 border-r font-medium">
                        {label}
                      </td>
                      <td className="text-center border-r">
                        {typeof freeValue === "boolean" ? (
                          freeValue ? (
                            <Check className="mx-auto text-green-600" />
                          ) : (
                            "—"
                          )
                        ) : (
                          freeValue
                        )}
                      </td>
                      <td className="text-center border-r bg-blue-50">
                        {typeof paidValue === "boolean" ? (
                          paidValue ? (
                            <Check className="mx-auto text-blue-600" />
                          ) : (
                            "—"
                          )
                        ) : (
                          paidValue
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Side Cards - Separated into two */}
            <div className="space-y-6">
              {/* Top Card */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    Offline Mock Test
                  </h4>
                  <p className="text-sm text-gray-700">Facility in Kolkata</p>
                </div>
              </div>

              {/* Bottom Card */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 shadow-sm">
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-lg text-gray-700 font-medium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    Mock Test
                  </h4>

                  <h4 className="flex items-center gap-2 text-lg text-gray-700 font-medium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    Practice Test
                  </h4>

                  <h4 className="flex items-center gap-2 text-lg text-gray-700 font-medium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    PYQs
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Showcase Section */}
      <div className="py-16 bg-white border-y">
        <div className="mx-auto px-2 sm:px-52">
          {" "}
          {/* Reduced padding here */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Our Expert Faculty
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Learn from experienced educators dedicated to your success
            </p>
          </div>
          {/* Auto-scrolling faculty cards */}
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-hidden gap-6 py-4"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {duplicatedFaculty.map((faculty, index) => (
                <div
                  key={`${faculty.id}-${index}`}
                  className="flex-shrink-0 w-64 group hover:scale-105 transition-transform duration-300"
                >
                  {/* Faculty Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 h-full">
                    {/* Faculty Image */}
                    <div className="relative mx-auto mb-4">
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-gray-100 to-gray-200">
                        {faculty.image === "/placeholder.svg" ? (
                          // Placeholder for Dr. D. Roy
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                            <GraduationCap className="h-16 w-16 text-blue-400" />
                          </div>
                        ) : (
                          <Image
                            src={faculty.image}
                            alt={faculty.name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {faculty.expertise}
                      </div>
                    </div>

                    {/* Faculty Info */}
                    <div className="text-center">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        {faculty.name}
                      </h3>
                      <p className="text-gray-700 text-sm mb-3">
                        {faculty.qualification}
                      </p>
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 rounded-full">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700 font-medium text-sm">
                          {faculty.expertise} Expert
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reduce gradient overlay width to match reduced padding */}
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
          {/* Scroll indicator */}
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <div
                className={`h-2 w-2 rounded-full ${isPaused ? "bg-gray-400" : "bg-blue-500"}`}
              ></div>
              <span>{isPaused ? "Scroll paused" : "Auto-scrolling"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Why Create an Account?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Track Progress</h4>
                <p className="text-gray-600 text-sm">
                  Monitor your performance with detailed analytics and
                  personalized insights
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Save Attempts</h4>
                <p className="text-gray-600 text-sm">
                  Save your test attempts, bookmark questions, and continue
                  where you left off
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Get Recommendations
                </h4>
                <p className="text-gray-600 text-sm">
                  Receive personalized study recommendations based on your
                  performance
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-700 mb-6">
                Ready to boost your exam preparation?
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={handleRegisterRedirect}
                  size="lg"
                  className="bg-gradient-to-r from-[#2D9596] to-[#88C399] hover:from-[#2D9596] hover:to-[#88C399]/90 px-8 py-4 text-lg rounded-lg"
                >
                  Get Started For Free
                </Button>
                <Button
                  onClick={handleLoginRedirect}
                  variant="outline"
                  size="lg"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg rounded-lg"
                >
                  I Already Have an Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
