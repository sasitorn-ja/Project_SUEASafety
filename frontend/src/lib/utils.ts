import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function normalizeDateInput(value: string | Date) {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+07:00`);
  }
  return new Date(value);
}

export function formatDisplayDate(value?: string | Date | null, timeZone = "Asia/Bangkok") {
  if (!value) return "";
  const parsed = normalizeDateInput(value);
  if (Number.isNaN(parsed.getTime())) return typeof value === "string" ? value : "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatDisplayDateTime(value?: string | Date | null, timeZone = "Asia/Bangkok") {
  if (!value) return "";
  const parsed = normalizeDateInput(value);
  if (Number.isNaN(parsed.getTime())) return typeof value === "string" ? value : "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}
