// components/TestListing.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Search,
  Filter,
  List,
  Grid,
  Info,
  Lock,
  LockIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Loading from "@/components/Loading";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DeleteExamButton from "@/components/DeleteExamButton";
import Link from "next/link";

interface Enrollment {
  courseId: string;
}


export interface Test {
  id: string;
  title: string;
  subjects: { name: string; chapters: { name: string }[] }[];
  exam: "NEET" | "JEE" | "WBJEE";
  totalDurationInSeconds: number;
  totalQuestions: number;
  accessType: "FREE" | "PAID";
  totalMarks: number;
  courseId: string;
}

interface TestListingProps {
  type: "mock" | "pyq" | "practice" | "quiz" | "brainstorm";
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  primaryColor: string;
  icon?: React.ReactNode;
  apiEndpoint?: string;
}

const TestListing: React.FC<TestListingProps> = ({
  type,
  title,
  description,
  gradientFrom,
  gradientTo,
  borderColor,
  primaryColor,
  icon,
  apiEndpoint = "/api/v1/exams",
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isLoggedIn = status === "authenticated";


 const isAdminOrSuperAdmin =
  session?.user?.role === "ADMIN" ||
  session?.user?.role === "SUPERADMIN";

const hasAccessToTest = (test: Test): boolean => {
  // FREE tests → everyone logged in can access
  if (test.accessType === "FREE") return true;

  // Admins & Superadmins → always access
  if (isAdminOrSuperAdmin) return true;

  // Enrolled users → access
  return (
    session?.user?.enrollments?.some(
      (e) => e.courseId === test.courseId
    ) ?? false
  );
};



  const userEnrollments: Enrollment[] =
  session?.user?.enrollments ?? [];


  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiEndpoint}?type=${type}`);
        const data = await response.json();
        setTests(data.data as Test[]);
      } catch (e) {
        console.error(`Error fetching ${title}:`, e);
        setError(`Failed to load ${title}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [type, apiEndpoint, title]);

  // Handle test start - check if user is logged in (YOUR LOGIC)
 const handleStartTest = (test: Test) => {
  if (!isLoggedIn) {
    const callbackUrl = `/exam?examId=${test.id}&type=${type}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return;
  }

  if (!hasAccessToTest(test)) {
    router.push(`/checkout?courseId=${test.courseId}`);
    return;
  }

  router.push(
    `/exam?examId=${test.id}&type=${type}&courseId=${test.courseId}`
  );
};


  // Extract unique subjects from available tests
  const uniqueSubjects = useMemo(() => {
    if (!tests || !Array.isArray(tests)) return [];
    const subjects = tests.flatMap((test) =>
      test.subjects.map((subject) => subject.name)
    );
    return [...new Set(subjects)];
  }, [tests]);

  // Get available exams
  const availableExams = useMemo(() => {
    if (!tests || !Array.isArray(tests)) return [];
    return [...new Set(tests.map((test) => test.exam))];
  }, [tests]);

  // Filter tests based on selected filters
  const filteredExams = useMemo(() => {
    if (!tests || !Array.isArray(tests)) return [];
    return tests.filter(
      (test) =>
        (!selectedExam || test.exam === selectedExam) &&
        (!selectedSubject ||
          test.subjects.some((subject) => subject.name === selectedSubject)) &&
        (searchQuery === "" ||
          test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          test.subjects.some((subject) =>
            subject.name.toLowerCase().includes(searchQuery.toLowerCase())
          ))
    );
  }, [tests, selectedExam, selectedSubject, searchQuery]);

  const resetFilters = () => {
    setSelectedExam(null);
    setSelectedSubject(null);
    setSearchQuery("");
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} mins`;
  };

  const getTestTypeText = () => {
    switch (type) {
      case "mock":
        return "Mock Test";
      case "pyq":
        return "PYQ Test";
      case "practice":
        return "Practice Test";
      case "quiz":
        return "Quiz Test";
      case "brainstorm":
        return "Brainstorm Test";
      default:
        return "Test";
    }
  };

  const renderTestCard = (test: Test) => {
    const totalChapters = test.subjects.flatMap((s) => s.chapters).length;
    const isSubscribed = hasAccessToTest(test)
;

    return (
      <div key={test.id} className="h-full group">
        <Card className="h-full flex flex-col relative overflow-hidden bg-white/90 backdrop-blur border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-3">
              <CardTitle className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
                {test.title}
              </CardTitle>
              <Badge
                className="shrink-0"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: `${primaryColor}30`,
                }}
              >
                {test.exam}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-grow relative">
            {/* PAID Overlay */}
            {test.accessType === "PAID" && !hasAccessToTest(test) && (

              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 bg-white px-6 py-4 rounded-xl shadow-lg">
                  <div className="text-white bg-red-600 p-2 rounded-full">
                      <Lock className=" size-5" />
                  </div>
                  <p className="font-bold text-gray-900 !poppinsmd ">
                    Unlock {getTestTypeText()}
                  </p>
                  <p className="text-sm text-gray-600 !poppinsmd font-semibold -mt-2">Subscribe to unlock access</p>
                  <Link
                    href={`/checkout?courseId=${test.courseId}`}
                    className="bg-red-600 p-2 px-4 outline-none border-none rounded-full mt-2 flex justify-center items-center text-white hover:bg-red-700 tracking-wide !poppinsmd text-sm font-semibold"
                  >
                    Upgrade Now
                  </Link>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                {
                  icon: Clock,
                  label: formatDuration(test.totalDurationInSeconds),
                },
                {
                  icon: Target,
                  label: `${test.totalQuestions} Questions`,
                },
                {
                  icon: BookOpen,
                  label: `${test.subjects.length} Subjects`,
                },
                {
                  icon: Award,
                  label: `${test.totalMarks} Marks`,
                },
              ].map(({ icon: Icon, label }, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 border border-gray-200 transition group-hover:bg-gray-100"
                  style={{
                    backgroundColor: `${primaryColor}05`,
                    borderColor: `${primaryColor}20`,
                  }}
                >
                  <Icon
                    className="h-5 w-5 mb-1"
                    style={{ color: primaryColor }}
                  />
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Topics */}
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: `${primaryColor}05`,
                borderColor: `${primaryColor}20`,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-800">
                  Topics Covered
                  <span className="ml-1 text-gray-500 font-normal">
                    ({totalChapters})
                  </span>
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-gray-200"
                    >
                      <Info className="h-4 w-4 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-80 overflow-y-auto p-4">
                    <p className="font-semibold mb-3 text-gray-900">
                      Subjects & Topics
                    </p>
                    {test.subjects.map((subject) => (
                      <div key={subject.name} className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {subject.name}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {subject.chapters.map((chapter, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs bg-gray-100"
                            >
                              {chapter.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap gap-1">
                {test.subjects.map((subject) => (
                  <Badge
                    key={subject.name}
                    className="text-xs"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    {subject.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-3 flex flex-col gap-2">
            {/* YOUR BUTTON LOGIC */}
            {test.accessType === 'FREE' ? (
              <Button
                onClick={() => handleStartTest(test)}
                className={`w-full font-medium transition ${
                  isLoggedIn
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {isLoggedIn ? `Start ${getTestTypeText()}` : "Login to Start"}
              </Button>
            ) : (
              <Button
  onClick={() => handleStartTest(test)}
  className={`w-full font-medium transition ${
    isLoggedIn && !hasAccessToTest(test)
      ? "bg-red-600 hover:bg-red-700"
      : "bg-emerald-600 hover:bg-emerald-700"
  } ${!isLoggedIn ? "!bg-amber-500" :""}`}
>
  {hasAccessToTest(test)
    ? `Start ${getTestTypeText()}`
    : !isLoggedIn
    ? "Login & Subscribe To Unlock"
    : "Subscribe To Start"}
</Button>

            )}

            {/* DeleteExamButton */}
            <DeleteExamButton
              examId={test.id}
              onDeleted={() =>
                setTests((prev) => prev.filter((exam) => exam.id !== test.id))
              }
            />
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderTestRow = (test: Test) => {
    const totalChapters = test.subjects.flatMap((s) => s.chapters).length;
    const isSubscribed = hasAccessToTest(test);

    return (
      <div key={test.id}>
        <Card
          className="hover:shadow-lg transition-all duration-300 border bg-white mb-3"
          style={{ borderColor: `${primaryColor}30` }}
        >
          <div className="flex flex-col md:flex-row p-4">
            <div className="flex-grow md:pr-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {test.title}
                  </h3>
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    }}
                  >
                    {test.exam}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {test.subjects.map((subject) => (
                    <Badge
                      key={subject.name}
                      variant="secondary"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700">
                    {formatDuration(test.totalDurationInSeconds)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700">
                    {test.totalQuestions} Questions
                  </span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700">
                    {test.subjects.length} Subjects
                  </span>
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700">
                    {test.totalMarks} Marks
                  </span>
                </div>
              </div>

              <div className="flex items-center my-2">
                <p className="text-sm font-medium text-gray-700 mr-2">
                  Topics Covered: {totalChapters}
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full hover:bg-gray-200"
                    >
                      <Info className="h-4 w-4 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-80 overflow-y-auto p-4">
                    <div className="font-medium mb-2 text-gray-900">
                      Subjects & Topics
                    </div>
                    {test.subjects.map((subject) => (
                      <div key={subject.name} className="mb-3">
                        <p className="text-sm font-semibold mb-1 text-gray-700">
                          {subject.name}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {subject.chapters.map((chapter, index) => (
                            <Badge
                              key={`${chapter.name}-${index}`}
                              variant="secondary"
                              className="text-xs mb-1 bg-gray-100 text-gray-700"
                            >
                              {chapter.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              {!isLoggedIn && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg mt-2">
                  <Lock className="h-4 w-4" />
                  <span>Login required to attempt this {getTestTypeText()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-0 md:ml-4 md:flex md:items-center">
              {/* YOUR BUTTON LOGIC FOR LIST VIEW */}
              {test.accessType === 'FREE' ? (
                <Button
                  onClick={() => handleStartTest(test)}
                  className={`${isLoggedIn ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"}`}
                >
                  {isLoggedIn ? `Start ${getTestTypeText()}` : "Login to Start"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleStartTest(test)}
                  className={`relative ${isLoggedIn ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"}`}
                >
                  {hasAccessToTest(test)

                    ? `Start ${getTestTypeText()}`
                    : !isLoggedIn ? "Login & Subscribe" : (
                      <p className="absolute top-0 left-0 flex items-center justify-center rounded-md w-full h-full bg-red-500 text-white">
                        Subscribe To Start
                      </p>
                    )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div
          className="bg-gradient-to-r py-16 text-center mb-8 rounded-lg shadow-sm border"
          style={{
            background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
            borderColor: borderColor,
          }}
        >
          <h1 className="text-4xl font-bold mb-4 text-gray-900">{title}</h1>
          <p className="text-xl text-gray-600">Loading {title.toLowerCase()}...</p>
        </div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 py-16 text-center mb-8 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold mb-4 text-rose-700">Oops!</h1>
          <p className="text-xl text-rose-600">{error}</p>
          <Button
            className="mt-4 bg-rose-600 hover:bg-rose-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div
        className="my-[-2rem] bg-gradient-to-r border py-12 text-center mb-8 rounded-lg shadow-sm"
        style={{
          background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
          borderColor: borderColor,
        }}
      >
        <h1 className="text-4xl font-bold mb-4 text-gray-900">{title}</h1>
        <p className="text-xl text-gray-600 mb-4">{description}</p>
        {!isLoggedIn && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-6">
            <Button
              onClick={() => router.push("/login")}
              style={{ backgroundColor: primaryColor }}
            >
              Login to Attempt {title}
            </Button>
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
              }}
            >
              Create Free Account
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="shadow-sm rounded-lg pt-4 px-4 bg-white border mt-[-1.5rem] mb-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center w-full md:w-auto max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={`Search ${title.toLowerCase()} by title or subject`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedExam || "all-exams"}
                onValueChange={(value) => {
                  setSelectedExam(value === "all-exams" ? null : value);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Exams</SelectLabel>
                    <SelectItem value="all-exams">All Exams</SelectItem>
                    {availableExams.map((exam, idx) => (
                      <SelectItem key={idx} value={exam}>
                        {exam}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={selectedSubject || "all-subjects"}
                onValueChange={(value) =>
                  setSelectedSubject(value === "all-subjects" ? null : value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Subjects</SelectLabel>
                    <SelectItem value="all-subjects">All Subjects</SelectItem>
                    {uniqueSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center border-gray-300"
                size="icon"
              >
                <Filter className="h-4 w-4" />
              </Button>

              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none border-r"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedExam && (
              <Badge
                variant="secondary"
                className="flex gap-1 items-center"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                Exam: {selectedExam}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  style={{
                    backgroundColor: `${primaryColor}30`,
                  }}
                  onClick={() => setSelectedExam(null)}
                >
                  <span className="sr-only">Remove</span>×
                </Button>
              </Badge>
            )}

            {selectedSubject && (
              <Badge
                variant="secondary"
                className="flex gap-1 items-center bg-green-100 text-green-700"
              >
                Subject: {selectedSubject}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-green-200"
                  onClick={() => setSelectedSubject(null)}
                >
                  <span className="sr-only">Remove</span>×
                </Button>
              </Badge>
            )}

            {searchQuery && (
              <Badge
                variant="secondary"
                className="flex gap-1 items-center bg-gray-100 text-gray-700"
              >
                Search: {searchQuery}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-gray-200"
                  onClick={() => setSearchQuery("")}
                >
                  <span className="sr-only">Remove</span>×
                </Button>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map(renderTestCard)}
        </div>
      ) : (
        <div className="space-y-2">{filteredExams.map(renderTestRow)}</div>
      )}

      {filteredExams.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-xl text-gray-600 mb-2">
            No {title.toLowerCase()} found matching your filters
          </p>
          <Button onClick={resetFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default TestListing;