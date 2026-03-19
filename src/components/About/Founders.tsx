import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const founders = [
  {
    name: "Tanbir Ahammed",
    role: "Founder & CEO",
    image: "/assets/AboutUs/Founders/TanbirAhmed.jpg",
    linkedin: "https://www.linkedin.com/in/tanbir-ahammed-71a719336/",
  },
  // {
  //   name: "Mouli Kalsa",
  //   role: "Executive Director and CMO",
  //   image: "/assets/AboutUs/Founders/MouliKalsa.jpg",
  //   linkedin: "https://www.linkedin.com/in/mouli-kalsa-55587021b",
  // },
  // {
  //   name: "Najes Riaz",
  //   role: "Co- Founder & COO",
  //   image: "/assets/AboutUs/Founders/NazesRiaz.jpg",
  //   linkedin: "https://www.linkedin.com/in/najes-riaz-1888061b0",
  // },
];

export const FounderDisplay = () => {
  return (
    <div
      className="max-w-[90rem] mx-auto p-6 "
      id="founders"
      // style={{
      //   backgroundImage: "url(/assets/images/ourfounders.webp)",
      //   backgroundSize: "contain",
      //   backgroundPosition: "center",
      // }}
    >
      <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
        Meet Our Founder
      </h2>

      {/* Center the grid container */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 gap-8 auto-rows-fr max-w-2xl place-items-center">
          {founders.map((founder) => (
            <Card
              key={founder.name}
              className="hover:shadow-xl transition-shadow duration-300 bg-card flex flex-col"
            >
              <CardHeader className="text-center pb-4 relative">
                <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Link
                  href={founder.linkedin}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors p-2 bg-background/80 rounded-full hover:bg-background"
                  aria-label={`${founder.name}'s LinkedIn profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin size={24} />
                </Link>
                <h3 className="text-2xl font-semibold text-foreground mb-1">
                  {founder.name}
                </h3>
                <p className="text-lg text-muted-foreground">{founder.role}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
