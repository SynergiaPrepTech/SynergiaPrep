"use client";

import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Linkedin,
  Twitter,
  Facebook,
  Mail,
  Phone,
  MapPin,
  Youtube,
  Instagram,
} from "lucide-react";
import { Section } from "./craft";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Footer() {
  const { data: session } = useSession();
  const socialLinks = [
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/company/105668233/admin/feed/following/",
      label: "Linkedin",
    },
    { icon: Twitter, href: "https://x.com/synergiaprep", label: "Twitter" },
    {
      icon: Facebook,
      href: "https://www.facebook.com/profile.php?id=61572624476351",
      label: "Facebook",
    },
    {
      icon: Youtube,
      href: "https://www.youtube.com/channel/UCJYS35ljo8orpaVk1r5y1RA",
      label: "YouTube",
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/synergiaprep.official/?next=%2F",
      label: "Instagram",
    },
  ];

  return (
    <footer>
      <Section className="px-4 ">
        <Card
          className="relative border overflow-hidden min-h-[500px] 
             bg-gradient-to-r from-[#7078e8] to-[#96ff62] 
             bg-[length:200%_200%] bg-left 
             hover:bg-right transition-[background-position] 
             duration-500 ease-in-out 
             rounded-t-xl shadow-[0_-2px_15px_rgba(0,0,0,0.08)]"
        >
          <CardContent className="relative z-10 p-6">
            <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_0.5fr] py-4">
              {/* Company Info Section */}
              <div className="not-prose flex flex-col gap-6">
                <Link href="/" className="w-fit">
                  <h3 className="sr-only">SynergiTech</h3>
                  <div className="relative group">
                    <Image
                      src="/assets/images/Logomark.png"
                      alt="Logo"
                      width={60}
                      height={60}
                      className="transition-all duration-300 group-hover:scale-110"
                    />
                  </div>
                </Link>
                <div className="space-y-4">
                  <p className="text-lg font-medium text-[#2d3436]">
                    <Balancer>
                      India&apos;s Front-running Startup : Revolutionizing Exam
                      Preparation with Tech Innovation
                    </Balancer>
                  </p>
                  <div className="flex flex-col gap-2 text-[#2d3436]/80">
                    <div className="flex items-center gap-2 hover:text-[#2d3436] transition-colors">
                      <Mail className="h-4 w-4" />
                      <span>synergiaprep.official@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-[#2d3436] transition-colors">
                      <Phone className="h-4 w-4" />
                      <span>+91 82749 95556</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-[#2d3436] transition-colors">
                      <MapPin className="sm:h-5 sm:w-5 h-14 w-14" />
                      <span className="hidden sm:block">
                        Institution’s Innovation Council (IIC), Jadavpur
                        University <br />
                        7th Floor of the Technology Bhawan, Main Campus, 188,
                        Raja S.C. Mallick Road, Kolkata, 700032, West Bengal,
                        India.
                      </span>

                      <span className="block sm:hidden">
                        Institution’s Innovation Council (IIC),
                        <br />
                        Jadavpur University 7th Floor of the Technology Bhawan,
                        Main Campus, 188, Raja S.C. Mallick Road, Kolkata,
                        700032, West Bengal, India.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <h4 className="font-semibold text-[#1b2020]">Company</h4>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      SynergiaPrep
                    </Link>
                    <Link
                      href="/about"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      About Us
                    </Link>
                    <Link
                      href="/products"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      Products
                    </Link>
                    <Link
                      href="/examprep"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      ExamPrep
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="font-semibold text-[#1b2020]">Resources</h4>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/study-abroad"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      Study Abroad
                    </Link>
                    <Link
                      href="/blog"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      Blog
                    </Link>
                    <Link
                      href="/contact-us"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      Contact Us
                    </Link>

                    <Link
                      href="/admin"
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      Admin
                    </Link>
                  </div>
                </div>
              </div>
              {/* className="text-[#2d3436]/80 hover:text-[#2d3436] transition-colors duration-200" */}
              {/* Legal Links */}
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-[#1b2020]">Legal</h4>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/privacypolicy"
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/cookiepolicy"
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    Cookie Policy
                  </Link>
                  <Link
                    href="/termsofservice"
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    href="/shiping-and-delivery-policy"
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    Shipping and Delivery Policy
                  </Link>
                  <Link
                    href="/cancelation-and-refund-policy"
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    Cancellation and Refund Policy
                  </Link>
                </div>
              </div>
            </div>

            <Separator className="my-8 bg-[#2d3436]/20" />

            {/* Footer Bottom */}
            <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-[1.1em] text-[#2d3436]">
                  © 2025 Online Exam Solutions. Empowering Your Success
                </p>
                {/* <p className="text-[1.1em] text-[#2d3436]">
                  Made with <span className="text-red-500">❤</span> for education
                </p> */}
              </div>
              <TooltipProvider>
                <div className="flex gap-4 flex-wrap justify-center">
                  {socialLinks.map(({ icon: Icon, href, label }) => (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-[#2d3436] hover:text-white"
                        >
                          <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icon className="h-5 w-5" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Follow us on {label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </Section>
    </footer>
  );
}
