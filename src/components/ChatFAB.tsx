"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { ChatContent } from "@/app/chat/page";

export default function ChatFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop floating chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 w-[420px] h-[650px] rounded-md shadow-2xl overflow-hidden z-50 border border-gray-200 hidden lg:block">
          <ChatContent onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Mobile: link to full-screen chat page */}
      <Link
        href="/chat"
        className="fixed bottom-4 right-4 w-14 h-14 bg-brand-yellow rounded-full shadow-lg flex items-center justify-center hover:brightness-95 transition z-50 lg:hidden"
        aria-label="Chat with a peer navigator"
      >
        <Image src="/new-icons/chat-search.svg" alt="" width={24} height={24} aria-hidden />
      </Link>

      {/* Desktop: toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-brand-yellow rounded-full shadow-lg items-center justify-center hover:brightness-95 transition z-50 hidden lg:flex"
        aria-label="Toggle chat"
      >
        {open ? (
          <X size={22} strokeWidth={2} className="text-brand-dark" />
        ) : (
          <Image src="/new-icons/chat-search.svg" alt="" width={24} height={24} aria-hidden />
        )}
      </button>
    </>
  );
}
