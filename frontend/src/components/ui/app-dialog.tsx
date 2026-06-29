"use client";

import type { ComponentProps } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const APP_DIALOG_SIZES = {
  sm: "sm:max-w-[430px]",
  md: "sm:max-w-[500px]",
  lg: "sm:max-w-[600px]",
  xl: "sm:max-w-[760px]",
} as const;

type AppDialogContentProps = ComponentProps<typeof DialogContent> & {
  size?: keyof typeof APP_DIALOG_SIZES;
};

function AppDialogContent({
  className,
  size = "md",
  ...props
}: AppDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "w-[calc(100vw-20px)] gap-0 overflow-hidden rounded-[22px] border border-[#cfe0f2] bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-0 font-sarabun shadow-[0_24px_64px_rgba(6,43,99,0.22)] sm:w-full sm:rounded-[26px]",
        APP_DIALOG_SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

function AppDialogSectionHeader({
  className,
  ...props
}: ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn(
        "w-full rounded-t-[22px] border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--brand-soft)_100%)] px-4 pt-3.5 pb-3 text-left sm:rounded-t-[26px] sm:px-5 sm:pt-5 sm:pb-4",
        className,
      )}
      {...props}
    />
  );
}

function AppDialogSectionFooter({
  className,
  ...props
}: ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn(
        "border-t border-[var(--border)] bg-[var(--brand-soft)] px-4 py-3.5 sm:px-5 sm:py-4 rounded-b-[22px] sm:rounded-b-[26px]",
        className,
      )}
      {...props}
    />
  );
}

function AppDialogBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid gap-4 px-4 py-4 sm:px-5 sm:py-4.5 scrollbar-thin [scrollbar-color:#cfe0f2_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#eef5ff] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#cfe0f2]",
        className,
      )}
      {...props}
    />
  );
}

export {
  AppDialogBody,
  AppDialogContent,
  AppDialogDescription,
  AppDialogSectionFooter,
  AppDialogSectionHeader,
  AppDialogTitle,
};

function AppDialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogTitle>) {
  return (
    <DialogTitle
      className={cn("text-[18px] font-black text-[var(--brand-text)] sm:text-[22px]", className)}
      {...props}
    />
  );
}

function AppDialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogDescription>) {
  return (
    <DialogDescription
      className={cn("mt-1 text-[11px] font-bold leading-relaxed text-[#55739B] sm:text-[13px]", className)}
      {...props}
    />
  );
}
