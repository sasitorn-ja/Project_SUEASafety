"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type AppModalTone = "default" | "danger" | "success";

export function appModalPanelClassName(tone: AppModalTone = "default", className?: string) {
  const toneClassName =
    tone === "danger"
      ? "border-[#efc9c9]"
      : tone === "success"
        ? "border-[#cfe7d6]"
        : "border-[var(--border)]";

  return cn(
    "relative flex w-full flex-col overflow-hidden rounded-[24px] border bg-[var(--brand-surface)] text-[var(--brand-text)] shadow-[0_28px_60px_rgba(0,0,0,0.22)] sm:rounded-[30px]",
    toneClassName,
    className,
  );
}

export function AppModalOverlay({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(20,13,7,0.55)] p-3 animate-[fadeIn_0.18s_ease-out_both] supports-backdrop-filter:backdrop-blur-[4px] md:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function AppModalPanel({
  tone = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { tone?: AppModalTone }) {
  return <div className={appModalPanelClassName(tone, className)} {...props} />;
}

export function AppModalHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,#fffaf0_100%)] px-5 py-4 sm:px-6 sm:py-5",
        className,
      )}
      {...props}
    />
  );
}

export function AppModalBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("bg-[var(--brand-surface)] px-5 py-5 sm:px-6 sm:py-6", className)} {...props} />;
}

export function AppModalFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[linear-gradient(180deg,#fffaf0_0%,var(--brand-soft)_100%)] px-5 py-4 sm:px-6 sm:py-5",
        className,
      )}
      {...props}
    />
  );
}

export function AppModalCloseButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="ปิดหน้าต่าง"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--brand-text)]/55 transition-all hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)]",
        className,
      )}
      {...props}
    >
      <X className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}
