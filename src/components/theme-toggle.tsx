"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { useAppTheme } from "@/providers/theme-provider";

export function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { theme, toggleTheme } = useAppTheme();
  const nextTheme = theme === "tiger" ? "wangjai" : "tiger";
  const nextLabel = nextTheme === "wangjai" ? "น้องวางใจ" : "เสือ";
  const size = compact ? 32 : 44;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "theme-toggle relative inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={`เปลี่ยนเป็นธีม${nextLabel}`}
      title={`เปลี่ยนเป็นธีม${nextLabel}`}
    >
      <Image
        src={
          theme === "wangjai"
            ? "/images/mascots/suea-mascot-transparent.png"
            : "/images/mascots/wangjai/8.png"
        }
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </button>
  );
}
