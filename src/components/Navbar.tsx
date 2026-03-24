"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200",
        className
      )}
    >
      {/* Hamburger */}
      <button
        aria-label="Open menu"
        className="p-1 text-gray-800 hover:opacity-70 transition-opacity"
      >
        <Menu size={24} strokeWidth={2} />
      </button>

      {/* Wordmark */}
      <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
        <span className="font-black">StreetLives</span>
      </Link>

      {/* Quick Exit */}
      <a
        href="https://www.google.com"
        className="flex items-center gap-1.5 bg-brand-exit text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
        aria-label="Quick exit — leave this site"
      >
        Quick Exit
        <span className="w-4 h-4 rounded-full bg-white text-brand-exit flex items-center justify-center text-xs font-black leading-none">
          !
        </span>
      </a>
    </header>
  );
}
