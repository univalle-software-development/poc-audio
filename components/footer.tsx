"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { useRef, useEffect } from "react";
import { NavLinks } from "./nav-links";

export function Footer() {
  const tubelightRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (tubelightRef.current && footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect();
        const x = e.clientX - footerRect.left;
        tubelightRef.current.style.left = `${x}px`;
      }
    };

    const footer = footerRef.current;
    if (footer) {
      footer.addEventListener("mousemove", handleMouseMove);
      return () => footer.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <footer ref={footerRef} className="mt-auto">
      {/* <div className="h-16 flex items-center justify-center">
        <NavLinks />
      </div> */}
      <div className="min-h-16 flex items-center px-4">
        <div
          ref={tubelightRef}
          className="tubelight absolute bottom-0 -translate-x-1/2 h-1 w-20 bg-blue-500 blur-[16px] pointer-events-none"
        />
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-3 items-center justify-between text-center sm:text-left sm:flex-row sm:gap-0">
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            © {new Date().getFullYear()} Universidad del Valle, PROYECTO INTEGRADOR II-01.
          </div>
          <div className="flex gap-4 order-1 sm:order-2">
            {/* <Link
              href="https://convex.link/nextchatdemo"
              className="text-gray-600 hover:text-gray-900 transition-colors">
              Convex
            </Link> */}
            <Link
              href="https://github.com/univalle-software-development/poc-audio"
              target="_blank"
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm">
              <Github size={18} />
              <span className="hidden sm:inline">univalle-software-development/poc-audio</span>
              <span className="sm:hidden">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
