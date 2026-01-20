// components/CourseDescriptionCard.tsx
import React from "react";
import Link from "next/link";
import {
  FaRocket,
  FaBookOpen,
  FaChalkboardTeacher,
  FaFileAlt,
  FaBullseye,
  FaCompass,
  FaHandshake,
  FaUsers,
  FaPhoneAlt,
  FaGlobe,
  FaArrowRight,
  FaCalendarCheck,
  FaGraduationCap,
  FaLightbulb,
} from "react-icons/fa";
import { GiBrain } from "react-icons/gi";
import { MdSchool, MdSupportAgent } from "react-icons/md";
import { Goal } from "lucide-react";

interface CourseDescriptionCardProps {
  title?: string;
  showNavigation?: boolean;
}

const CourseDescriptionCard: React.FC<CourseDescriptionCardProps> = ({
  title = "চলো 'JU' Crash Course for WBJEE 2026",
  showNavigation = true,
}) => {
  const courseFeatures = [
    {
      icon: <FaBookOpen className="text-blue-600" />,
      title: "What You Will Get in This Course",
      items: [
        "Live Interactive Classes",
        "Complete WBJEE 2026 syllabus coverage",
        "Concept-focused + exam-oriented teaching",
        "Live doubt solving during classes",
      ],
      bgColor: "bg-blue-50",
    },
    {
      icon: <FaChalkboardTeacher className="text-purple-600" />,
      title: "Expert Faculty Support",
      items: [
        "Classes conducted by IITian, Jadavpurian, PhD scholars",
        "Full dedication, mentorship, and academic support",
      ],
      bgColor: "bg-purple-50",
    },
    {
      icon: <FaFileAlt className="text-green-600" />,
      title: "Mock Tests & Practice",
      items: [
        "10+5 Full-Length Mock Tests (Offline & Online)",
        "10 Years Full-Length PYQ Tests",
        "Chapter-wise PYQs (Last 10 Years)",
      ],
      bgColor: "bg-green-50",
    },
    {
      icon: <FaBullseye className="text-red-600" />,
      title: "JU-Focused Guidance",
      items: [
        "Direct guidance from JU toppers",
        "Strategy to maximize score for JU cut-off",
        "Common mistakes & rank improvement techniques",
      ],
      bgColor: "bg-red-50",
    },
    {
      icon: <FaCompass className="text-orange-600" />,
      title: "Counselling & Admission Support",
      items: [
        "WBJEE Counselling guidance",
        "Choice filling support",
        "Help with documentation & admission process",
      ],
      bgColor: "bg-orange-50",
    },
    {
      icon: <FaHandshake className="text-teal-600" />,
      title: "Alumni Advantage",
      items: [
        "Access to Jadavpur University Alumni Network",
        "Motivation, real-life college insights & career guidance",
      ],
      bgColor: "bg-teal-50",
    },
  ];

  const targetAudience = [
    "WBJEE 2026 aspirants",
    "Students targeting Jadavpur University",
    "Droppers & repeaters looking for structured revision",
    "Students needing last-moment concept clarity + mock practice",
  ];

  const navigationPages = [
    {
      name: "Syllabus",
      path: "/syllabus",
      icon: <FaBookOpen />,
      color: "bg-blue-100 hover:bg-blue-200",
    },
    {
      name: "Mock Tests",
      path: "/mock-tests",
      icon: <FaFileAlt />,
      color: "bg-green-100 hover:bg-green-200",
    },
    {
      name: "Faculty",
      path: "/faculty",
      icon: <FaChalkboardTeacher />,
      color: "bg-purple-100 hover:bg-purple-200",
    },
    {
      name: "Schedule",
      path: "/schedule",
      icon: <FaCalendarCheck />,
      color: "bg-orange-100 hover:bg-orange-200",
    },
    {
      name: "Counselling",
      path: "/counselling",
      icon: <MdSupportAgent />,
      color: "bg-teal-100 hover:bg-teal-200",
    },
    {
      name: "Alumni",
      path: "/alumni",
      icon: <FaUsers />,
      color: "bg-indigo-100 hover:bg-indigo-200",
    },
  ];

  return (
    <div className="overflow-y-scroll max-h-screen transition-all rounded-2xl p-6 md:p-8 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 border border-blue-200 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-4 bg-sky-600 px-8 py-4 rounded-2xl shadow-lg mb-6">
          <FaRocket className="text-3xl text-white animate-pulse" />
          <h1 className="text-xl md:text-xl font-bold text-white">{title}</h1>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <MdSchool className="text-2xl text-blue-600" />
          <p className="text-blue-800 font-semibold text-lg">
            Powered by Synergia Prep × Joddha
          </p>
        </div>

        <p className="text-sky-700 mt-2 max-w-3xl mx-auto text-lg leading-relaxed">
          This crash course is specially designed for WBJEE 2026 aspirants
          targeting Jadavpur University and top Government Engineering Colleges
          of West Bengal.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {courseFeatures.map((feature, index) => (
          <div
            key={index}
            className={`${feature.bgColor} border rounded-xl p-6 border border-opacity-30 transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white rounded-lg shadow">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {feature.title}
              </h3>
            </div>
            <ul className="space-y-3">
              {feature.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <FaArrowRight className="text-blue-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Target Audience */}
      <div className="bg-gradient-to-r from-blue-100 to-sky-100 rounded-xl p-6 mb-10 border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <FaUsers className="text-2xl text-blue-600 flex-shrink-0" />
          <h3 className="text-2xl font-bold text-blue-800">Who Should Join?</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targetAudience.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm"
            >
              <FaGraduationCap className="text-blue-500 flex-shrink-0 text-lg md:text-xl" />
              <span className="text-gray-700 font-medium text-sm md:text-base">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FaLightbulb className="text-2xl text-yellow-500" />
          <h3 className="text-2xl font-bold text-gray-800">Need Help?</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg min-w-0">
            <FaPhoneAlt className="text-2xl text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-gray-600 font-medium text-sm">
                Call / WhatsApp
              </p>
              <a
                href="tel:+918274995556"
                className="block text-sm md:text-base font-bold text-blue-700 break-all hover:text-blue-800 transition-colors"
              >
                +91-8274995556
              </a>
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg min-w-0">
            <FaGlobe className="text-2xl text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-gray-600 font-medium text-sm">Website</p>
              <a
                href="https://www.synergiaprep.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm md:text-base font-bold text-blue-700 break-all hover:text-blue-800 transition-colors"
              >
                www.synergiaprep.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation to Different Pages */}

      {/*       
      {showNavigation && (
        <div className="mt-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <GiBrain className="text-3xl text-blue-600" />
            <h3 className="text-2xl font-bold text-center text-blue-800">
              Explore Course Components
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {navigationPages.map((page) => (
              <Link
                key={page.name}
                href={page.path}
                className={`${page.color} rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg`}
              >
                <div className="text-2xl mb-2">{page.icon}</div>
                <span className="font-semibold text-gray-800 text-center">
                  {page.name}
                </span>
              </Link>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-4 text-sm">
            Click on any section to explore detailed information
          </p>
        </div>
      )} */}

      {/* Footer Note */}
      {/* <div className="mt-8 pt-6 border-t border-blue-200">
        <p className="text-center text-gray-500 text-sm flex justify-center items-center gap-3">
          <span><Goal/></span> Start your journey to Jadavpur University today! Limited seats available.
        </p>
      </div> */}
    </div>
  );
};

export default CourseDescriptionCard;
