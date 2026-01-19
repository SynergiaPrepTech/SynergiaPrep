"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { Course } from "@/type/course";

export default function CourseList() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/v1/courses");

        const data = await response.json();
        // console.log("Fetched courses:", data)

        // Validate that data is an array of Courses
        if (Array.isArray(data.data)) {
          // console.log("Fetched courses:", data.data);
          setCourses(data.data);
        } else {
          console.warn("Received non-array data, using mock courses");
          setCourses([]);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setCourses([]);
        setError("Failed to fetch courses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch(`/api/v1/courses/users/${userid}`);
        const data = await response.json();
        setUserCourses(data.data.map((course: Course) => course.id));
      } catch (error) {
        // console.log("Error fetching courses:", error);
      }
    }

    const userid = session?.user.id;
    if (!userid) {
      // console.log("User ID is not available.");
      return;
    }
    fetchCourses();
  }, [session?.user.id]);



  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get unique categories from examCategories
  const categories = [
    ...new Set(
      courses.flatMap((course) =>
        course.examCategories.map((category) => category.name)
      )
    ),
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          >
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-48 object-contain rounded-t-lg"
              height={400}
              width={600}
            />
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-4">{course.subtitle}</p>

              <div className="flex justify-between items-center">
                <div>
                  <span className="line-through text-gray-400 mr-2">
                    ₹{course.price}
                  </span>
                  <span className="font-bold text-green-600">
                    ₹{course.price - course.discount}
                  </span>
                </div>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {course.level}
                </span>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Exam Categories:</h4>
                <div className="flex flex-wrap gap-2">
                  {course.examCategories.map((category, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {userCourses.includes(course.id) ? (
              <Button className="mt-4 w-full" disabled>
                Already Enrolled
              </Button>
            ) : (
              <Link href={`/checkout?courseId=${course.id}`} passHref>
                <Button className="mt-4 w-full">View Course</Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
