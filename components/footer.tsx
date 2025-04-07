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
    <footer ref={footerRef} className="relative mt-auto">
      <div className="h-16 flex items-center justify-center">
        <NavLinks />
      </div>
      <div className="h-16 flex items-center px-4 overflow-hidden">
        <div
          ref={tubelightRef}
          className="tubelight absolute bottom-0 -translate-x-1/2 h-1 w-20 bg-blue-500 blur-[16px] pointer-events-none"
        />
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link
              href="https://github.com"
              className="text-gray-600 hover:text-gray-900 transition-colors">
              <Github size={20} />
            </Link>
            <Link
              href="https://twitter.com"
              className="text-gray-600 hover:text-gray-900 transition-colors">
              <Twitter size={20} />
            </Link>
            <Link
              href="https://linkedin.com"
              className="text-gray-600 hover:text-gray-900 transition-colors">
              <Linkedin size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
