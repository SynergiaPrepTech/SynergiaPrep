"use client";
import { useState } from "react";
import Image from "next/image";
import FounderCard from "./FounderCard";

// Interfaces
interface FounderCardProps {
  img: string;
  h1: string;
  p: string[];
  className?: string;
}

interface TeamMember {
  img: string;
  h1: string;
  p: string[];
  expertise?: string[];
  bio: string;
  achievements: string[];
}

// Flex layout styles
const sectionStyle = "flex flex-wrap justify-center gap-6 mt-6";

export default function Team() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<"Profile" | "Biography" | "Achievements">("Profile");

  const handleCardClick = (member: TeamMember) => {
    setSelectedMember(member);
    setActiveTab("Profile");
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  const teamMembers: TeamMember[] = [
    {
      img: "/assets/images/Tanbir.jpg",
      h1: "Tanbir Ahammed",
      p: ["Founder & CEO"],
      expertise: ["Leadership", "Innovation", "Strategy"],
      bio: "Visionary leader driving innovation and growth.",
      achievements: ["Led company to significant milestones.", "Pioneered new technology initiatives."],
    },
  ];

  const renderTabContent = (member: TeamMember) => {
    switch (activeTab) {
      case "Profile":
        return (
          <div className="space-y-4">
            {member.p.map((title, index) => (
              <p key={index} className="text-gray-700 text-lg">{title}</p>
            ))}
            {member.expertise && (
              <div className="flex flex-wrap gap-2">
                {member.expertise.map((item, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      case "Biography":
        return <p className="text-gray-700 text-lg leading-relaxed">{member.bio}</p>;
      case "Achievements":
        return (
          <ul className="list-disc list-inside text-gray-700 text-lg space-y-2">
            {member.achievements.map((achievement, index) => (
              <li key={index}>{achievement}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 sm:px-10 py-10 bg-gray-50">
      <h1 className="text-4xl font-bold mb-4 text-blue-700 text-center">Meet Our Founders</h1>
      <div className={sectionStyle}>
        {teamMembers.map((member, index) => (
          <div key={index} onClick={() => handleCardClick(member)} className="transition-transform hover:scale-105">
            <FounderCard
              img={member.img}
              h1={member.h1}
              p={member.p}
              className="bg-white shadow-md rounded-lg cursor-pointer w-80 h-80" // Increased card size from w-64 h-80 to w-80 h-96
            />
          </div>
        ))}
      </div>

      {selectedMember && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 p-8 relative h-[600px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-semibold transition-colors"
              onClick={closeModal}
            >
              ×
            </button>
            <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-6 rounded-lg text-center">
              <Image
                src={selectedMember.img}
                alt={selectedMember.h1}
                width={128}
                height={128}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-md"
              />
              <h2 className="text-3xl font-bold text-blue-800">{selectedMember.h1}</h2>
              <p className="text-gray-600 text-lg mt-2">{selectedMember.p[0]}</p>
            </div>
            <div className="flex justify-center mt-6 space-x-4 bg-gray-100 p-3 rounded-lg">
              {(["Profile", "Biography", "Achievements"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-6 px-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {renderTabContent(selectedMember)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}