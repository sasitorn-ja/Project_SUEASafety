"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Megaphone,
  Percent,
  Settings2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getSafetyCultureEventPhase,
  useAppActions,
  useAppState,
  type SafetyCultureBonusMode,
  type SafetyCultureEventAction,
  type SafetyCultureEventStatus,
} from "@/providers/app-providers";

const EVENT_STATUS_OPTIONS = [
  { id: "draft", label: "Draft", note: "ยังไม่แสดงบนหน้า Feed" },
  { id: "scheduled", label: "Scheduled", note: "เริ่มตามวันและเวลาที่ตั้งไว้" },
  { id: "live", label: "Live", note: "เริ่มใช้งานทันที" },
  { id: "paused", label: "Paused", note: "หยุดอีเว้นชั่วคราว" },
] as const;

const BONUS_MODE_OPTIONS = [
  { id: "multiplier", label: "Multiplier", hint: "คูณคะแนน เช่น x2" },
  { id: "fixed", label: "Fixed points", hint: "เพิ่มแต้มคงที่ เช่น +5" },
] as const;

const ACTION_OPTIONS = [
  { id: "approved-post", label: "โพสต์ความปลอดภัยที่อนุมัติแล้ว" },
  { id: "comment", label: "คอมเมนต์บนโพสต์" },
  { id: "reaction", label: "กด Reaction" },
  { id: "theme-post", label: "โพสต์ตามธีมกิจกรรม" },
] as const;

const QUICK_PRESETS = [
  {
    id: "happy-hour-15",
    label: "Happy Hour x1.5",
    apply: {
      bonusMode: "multiplier" as const,
      multiplier: 1.5,
      fixedPoints: 5,
      enabledActions: ["approved-post", "comment"] as SafetyCultureEventAction[],
    },
  },
  {
    id: "happy-hour-2",
    label: "Happy Hour x2",
    apply: {
      bonusMode: "multiplier" as const,
      multiplier: 2,
      fixedPoints: 5,
      enabledActions: ["approved-post", "comment", "reaction"] as SafetyCultureEventAction[],
    },
  },
  {
    id: "flash-plus-5",
    label: "Flash +5",
    apply: {
      bonusMode: "fixed" as const,
      multiplier: 1.5,
      fixedPoints: 5,
      enabledActions: ["approved-post", "comment"] as SafetyCultureEventAction[],
    },
  },
] as const;

const RANGE_PRESETS = [
  { label: "7 วัน", days: 7 },
  { label: "14 วัน", days: 14 },
  { label: "30 วัน", days: 30 },
] as const;

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => `${index}`.padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => `${index * 5}`.padStart(2, "0"));

function formatBonusLabel(mode: SafetyCultureBonusMode, multiplier: number, fixedPoints: number) {
  return mode === "multiplier" ? `x${multiplier}` : `+${fixedPoints} แต้ม`;
}

function buildAutoHeadline(eventName: string, mode: SafetyCultureBonusMode, multiplier: number, fixedPoints: number) {
  return `${eventName} ${formatBonusLabel(mode, multiplier, fixedPoints)}`;
}

function buildAutoSupportingText(mode: SafetyCultureBonusMode, startTime: string, endTime: string) {
  return mode === "multiplier"
    ? `แชร์เรื่องความปลอดภัยช่วง ${startTime} - ${endTime} แล้วรับคะแนนคูณเพิ่มทันที`
    : `แชร์เรื่องความปลอดภัยช่วง ${startTime} - ${endTime} แล้วรับคะแนนโบนัสเพิ่มทันที`;
}

function formatWindowLabel(startDate: string, startTime: string, endDate: string, endTime: string) {
  const startAt = new Date(`${startDate}T${startTime}`);
  const endAt = new Date(`${endDate}T${endTime}`);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return "กรุณาระบุวันและเวลาเริ่ม-จบให้ครบ";
  }

  return `${startAt.toLocaleDateString("th-TH", { day: "2-digit", month: "short" })} ${startTime} - ${endAt.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
  })} ${endTime}`;
}

function getPhaseLabel(phase: ReturnType<typeof getSafetyCultureEventPhase>) {
  if (phase === "upcoming") return "กำลังจะเริ่ม";
  if (phase === "live") return "กำลังใช้งาน";
  if (phase === "ended") return "สิ้นสุดแล้ว";
  if (phase === "paused") return "หยุดชั่วคราว";
  return "Draft";
}

function addDays(dateString: string, days: number) {
  const source = new Date(`${dateString}T00:00`);
  if (Number.isNaN(source.getTime())) return dateString;
  source.setDate(source.getDate() + days);
  const year = source.getFullYear();
  const month = `${source.getMonth() + 1}`.padStart(2, "0");
  const day = `${source.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function getTimeParts(value: string) {
  const [rawHour = "14", rawMinute = "00"] = value.split(":");
  const hour = rawHour.padStart(2, "0").slice(0, 2);
  const minute = rawMinute.padStart(2, "0").slice(0, 2);
  return { hour, minute };
}

function roundMinutesToNearestFive(minute: string) {
  const numericMinute = Number(minute);
  if (Number.isNaN(numericMinute)) return "00";
  return `${Math.round(numericMinute / 5) * 5}`.padStart(2, "0").slice(0, 2);
}

function SectionCard({
  title,
  icon,
  children,
  className,
  description,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
}) {
  return (
    <Card className={cn("rounded-[24px] border border-[#e3d0ae] bg-[#fffdfa] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-5", className)}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff1c9] text-[#6d4716]">{icon}</div>
        <div className="min-w-0">
          <h2 className="text-[18px] font-black text-[#1A1A1A]">{title}</h2>
          {description ? <p className="text-[13px] font-bold leading-relaxed text-[#8E8A81]">{description}</p> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function AdminEventPage() {
  const { safetyCultureEvent, eventNow } = useAppState();
  const { updateSafetyCultureEvent } = useAppActions();
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved" | "published">("idle");
  const [openTimePicker, setOpenTimePicker] = useState<"start" | "end" | null>(null);

  const {
    status,
    bonusMode,
    enabledActions,
    eventName,
    headline,
    supportingText,
    startDate,
    startTime,
    endDate,
    endTime,
    multiplier,
    fixedPoints,
    eventCode,
  } = safetyCultureEvent;
  const [multiplierInput, setMultiplierInput] = useState(() => `${safetyCultureEvent.multiplier}`);

  useEffect(() => {
    setMultiplierInput(`${multiplier}`);
  }, [multiplier]);

  const autoHeadline = buildAutoHeadline(eventName, bonusMode, multiplier, fixedPoints);
  const autoSupportingText = buildAutoSupportingText(bonusMode, startTime, endTime);
  const bonusPreview = formatBonusLabel(bonusMode, multiplier, fixedPoints);
  const activeStatusLabel = EVENT_STATUS_OPTIONS.find((option) => option.id === status)?.label ?? "Draft";
  const phase = getSafetyCultureEventPhase(safetyCultureEvent, eventNow);
  const phaseLabel = getPhaseLabel(phase);
  const windowLabel = formatWindowLabel(startDate, startTime, endDate, endTime);
  const selectedActions = ACTION_OPTIONS.filter((action) => enabledActions.includes(action.id));

  const validation = useMemo(() => {
    const issues: string[] = [];
    const startAt = new Date(`${startDate}T${startTime}`);
    const endAt = new Date(`${endDate}T${endTime}`);

    if (!eventName.trim()) issues.push("กรุณากรอกชื่ออีเว้น");
    if (!headline.trim()) issues.push("กรุณากรอกหัวข้อบนแบนเนอร์");
    if (!supportingText.trim()) issues.push("กรุณากรอกข้อความรอง");
    if (enabledActions.length === 0) issues.push("กรุณาเลือกอย่างน้อย 1 กิจกรรมที่ได้โบนัส");
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      issues.push("วันและเวลาเริ่ม-จบยังไม่ครบ");
    } else if (endAt <= startAt) {
      issues.push("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
    }

    return issues;
  }, [enabledActions.length, endDate, endTime, eventName, headline, startDate, startTime, supportingText]);

  const canPublish = validation.length === 0;
  const usingAutoHeadline = headline === autoHeadline;
  const usingAutoSupportingText = supportingText === autoSupportingText;

  const updateEvent = (nextEvent: typeof safetyCultureEvent) => {
    updateSafetyCultureEvent(nextEvent);
    setSaveLabel("idle");
  };

  const syncAutoCopy = (previousEvent: typeof safetyCultureEvent, nextEvent: typeof safetyCultureEvent) => {
    const previousAutoHeadline = buildAutoHeadline(
      previousEvent.eventName,
      previousEvent.bonusMode,
      previousEvent.multiplier,
      previousEvent.fixedPoints
    );
    const previousAutoSupportingText = buildAutoSupportingText(previousEvent.bonusMode, previousEvent.startTime, previousEvent.endTime);

    const syncedEvent = { ...nextEvent };

    if (previousEvent.headline === previousAutoHeadline) {
      syncedEvent.headline = buildAutoHeadline(
        syncedEvent.eventName,
        syncedEvent.bonusMode,
        syncedEvent.multiplier,
        syncedEvent.fixedPoints
      );
    }

    if (previousEvent.supportingText === previousAutoSupportingText) {
      syncedEvent.supportingText = buildAutoSupportingText(syncedEvent.bonusMode, syncedEvent.startTime, syncedEvent.endTime);
    }

    return syncedEvent;
  };

  const patchEvent = (recipe: (current: typeof safetyCultureEvent) => typeof safetyCultureEvent, syncCopy = false) => {
    const nextEvent = recipe(safetyCultureEvent);
    updateEvent(syncCopy ? syncAutoCopy(safetyCultureEvent, nextEvent) : nextEvent);
  };

  const updateField = <K extends keyof typeof safetyCultureEvent>(key: K, value: (typeof safetyCultureEvent)[K]) => {
    patchEvent((current) => ({ ...current, [key]: value }));
  };

  const toggleAction = (actionId: SafetyCultureEventAction) => {
    const nextActions = enabledActions.includes(actionId)
      ? enabledActions.filter((id) => id !== actionId)
      : [...enabledActions, actionId];

    updateField("enabledActions", nextActions);
  };

  const handleSaveDraft = () => {
    updateField("status", "draft");
    setSaveLabel("saved");
  };

  const handlePublish = () => {
    if (!canPublish) return;
    const nextStatus: SafetyCultureEventStatus =
      status === "live" || status === "paused" ? status : "scheduled";
    updateField("status", nextStatus);
    setSaveLabel("published");
  };

  const applyPreset = (preset: (typeof QUICK_PRESETS)[number]) => {
    patchEvent(
      (current) => ({
        ...current,
        bonusMode: preset.apply.bonusMode,
        multiplier: preset.apply.multiplier,
        fixedPoints: preset.apply.fixedPoints,
        enabledActions: preset.apply.enabledActions,
      }),
      true
    );
  };

  const applyRangePreset = (days: number) => {
    patchEvent(
      (current) => ({
        ...current,
        endDate: addDays(current.startDate, days),
      }),
      true
    );
  };

  const resetAutoHeadline = () => updateField("headline", autoHeadline);
  const resetAutoSupportingText = () => updateField("supportingText", autoSupportingText);
  const pickTime = (field: "start" | "end", value: string) => {
    patchEvent(
      (current) => ({
        ...current,
        [field === "start" ? "startTime" : "endTime"]: value,
      }),
      true
    );
    setOpenTimePicker(null);
  };
  const updateTimePart = (field: "start" | "end", part: "hour" | "minute", value: string) => {
    const source = field === "start" ? startTime : endTime;
    const { hour, minute } = getTimeParts(source);
    const nextValue = part === "hour" ? `${value}:${minute}` : `${hour}:${value}`;
    patchEvent(
      (current) => ({
        ...current,
        [field === "start" ? "startTime" : "endTime"]: nextValue,
      }),
      true
    );
  };
  const handleMultiplierChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    setMultiplierInput(value);

    if (!value || value === ".") return;

    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    patchEvent(
      (current) => ({
        ...current,
        multiplier: parsed,
      }),
      true
    );
  };

  const handleMultiplierBlur = () => {
    if (!multiplierInput || multiplierInput === ".") {
      setMultiplierInput(`${multiplier}`);
      return;
    }

    const parsed = Number(multiplierInput);
    if (Number.isNaN(parsed)) {
      setMultiplierInput(`${multiplier}`);
      return;
    }

    setMultiplierInput(`${parsed}`);
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1320px] bg-[#f1ecdf] px-3.5 pt-0 pb-8 font-sarabun md:px-4">
        <SafetyCultureHero
          eyebrow="SAFETY CULTURE ADMIN"
          title={
            <>
              Admin Edit <span className="text-[#F5BB00]">Event</span>
            </>
          }
          description="ตั้งค่าอีเว้น ดูตัวอย่างผลทันที และกด Publish ได้อย่างมั่นใจ"
          mascotSrc="/images/mascots/suea-mascot.png"
          mascotAlt="SUEA Admin Mascot"
          actions={
            <div className="mt-[12px] flex flex-wrap gap-2">
              <Link href="/safety-culture">
                <Button className="h-[32px] rounded-full border border-white/30 bg-white/10 px-4 text-[12.5px] font-black text-white hover:bg-white/14 md:h-[36px] md:text-[13px]">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  กลับไปหน้า Feed
                </Button>
              </Link>
              <div className="flex h-[32px] items-center rounded-full border border-[#d89b09] bg-[#ffb000] px-4 text-[12.5px] font-black text-[#3b1d07] md:h-[36px] md:text-[13px]">
                <Sparkles className="mr-1 h-4 w-4" />
                พร้อมเชื่อมกับ Feed
              </div>
            </div>
          }
        />

        <Card className="mt-4 rounded-[22px] border border-[#e4d3b3] bg-[#fffaf0] p-3.5 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-xl border border-[#d7c5a7] bg-white px-3 py-2 text-[11px] font-black text-[#5c3214]">
                สถานะ {activeStatusLabel}
              </Badge>
              <Badge className="rounded-xl border border-[#d7c5a7] bg-[#fff6d6] px-3 py-2 text-[11px] font-black text-[#8b5a12]">
                ตอนนี้ {phaseLabel}
              </Badge>
              <Badge className="rounded-xl border border-[#d7c5a7] bg-white px-3 py-2 text-[11px] font-black text-[#5c3214]">
                โบนัส {bonusPreview}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="h-10 rounded-xl border-[#d7c5a7] bg-[#fff8eb] px-4 text-[13px] font-black text-[#5c3214] hover:bg-[#fff2d8]"
              >
                บันทึกเป็น Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!canPublish}
                className="h-10 rounded-xl bg-[#5c3214] px-4 text-[13px] font-black text-white hover:bg-[#4a280f] disabled:bg-[#a79885]"
              >
                Publish Event
              </Button>
              {saveLabel !== "idle" ? (
                <div className="flex h-10 items-center rounded-xl border border-[#d7c5a7] bg-white px-3 text-[12px] font-black text-[#5c3214]">
                  {saveLabel === "saved" ? "บันทึก Draft แล้ว" : "Publish แล้ว"}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            <SectionCard
              title="เริ่มแบบเร็ว"
              description="เลือก preset ก่อน ถ้าต้องการตั้งแบบไว"
              icon={<WandSparkles className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-full border border-[#d7c5a7] bg-[#fffcf5] px-4 py-2 text-[12px] font-black text-[#5c3214] transition-colors hover:bg-[#fff3dd]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="ตั้งค่าหลัก"
              description="กรอกเฉพาะข้อมูลที่จำเป็นก่อน"
              icon={<Settings2 className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-name" className="text-[13px] font-black text-[#5c3214]">
                      ชื่ออีเว้น
                    </Label>
                    <Input
                      id="event-name"
                      value={eventName}
                      onChange={(event) =>
                        patchEvent(
                          (current) => ({
                            ...current,
                            eventName: event.target.value,
                          }),
                          true
                        )
                      }
                      className="h-11 rounded-xl border-[#d7c5a7] bg-[#fffcf5] px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-code" className="text-[13px] font-black text-[#5c3214]">
                      รหัสอีเว้น
                    </Label>
                    <Input
                      id="event-code"
                      value={eventCode}
                      onChange={(event) => updateField("eventCode", event.target.value)}
                      className="h-11 rounded-xl border-[#d7c5a7] bg-[#fffcf5] px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                  {EVENT_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateField("status", option.id as SafetyCultureEventStatus)}
                      className={cn(
                        "rounded-[16px] border px-3 py-3 text-left transition-all",
                        status === option.id
                          ? "border-[#5c3214] bg-[#5c3214] text-white shadow-[0_10px_18px_rgba(62,36,13,0.14)]"
                          : "border-[#e3d0ae] bg-[#fffcf5] text-[#4f4335] hover:border-[#c89a4f]"
                      )}
                    >
                      <div className="text-[14px] font-black">{option.label}</div>
                      <div className={cn("mt-1 text-[11px] font-bold leading-relaxed", status === option.id ? "text-white/78" : "text-[#8E8A81]")}>
                        {option.note}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="ช่วงเวลาและโบนัส"
              description="รวมการตั้งค่าเวลาและคะแนนไว้ในบล็อกเดียว"
              icon={<CalendarClock className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.84fr)]">
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-[20px] border border-[#eee2cb] bg-[#fffcf6] p-3.5">
                    <div className="mb-3 text-[13px] font-black text-[#5c3214]">ช่วงเวลาอีเว้น</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="start-date" className="text-[13px] font-black text-[#5c3214]">
                          วันที่เริ่ม
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(event) => updateField("startDate", event.target.value)}
                          className="h-11 rounded-xl border-[#d7c5a7] bg-white px-3.5 pr-4 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="start-time" className="text-[13px] font-black text-[#5c3214]">
                          เวลาเริ่ม
                        </Label>
                        <div className="relative">
                          <Input
                            id="start-time"
                            type="text"
                            value={startTime}
                            onChange={(event) =>
                              patchEvent(
                                (current) => ({
                                  ...current,
                                  startTime: normalizeTimeInput(event.target.value),
                                }),
                                true
                              )
                            }
                            inputMode="numeric"
                            placeholder="14:00"
                            maxLength={5}
                            className="h-11 rounded-xl border-[#d7c5a7] bg-white px-3.5 pr-11 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => setOpenTimePicker((current) => (current === "start" ? null : "start"))}
                            className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#d7c5a7] bg-[#fffaf0] text-[#5c3214] transition-colors hover:bg-[#fff0cf]"
                            aria-label="เลือกเวลาเริ่ม"
                          >
                            <Clock3 className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </button>
                          {openTimePicker === "start" ? (
                            <div className="absolute top-[calc(100%+8px)] left-0 z-20 w-[280px] rounded-[18px] border border-[#e3d0ae] bg-white p-3 shadow-[0_16px_34px_rgba(62,36,13,0.14)]">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">เลือกเวลาเริ่ม</div>
                                  <div className="mt-1 text-[18px] font-black text-[#5c3214]">{startTime || "14:00"}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => pickTime("start", startTime || "14:00")}
                                  className="h-8 rounded-lg border-[#d7c5a7] bg-[#fffaf0] px-3 text-[12px] font-black text-[#5c3214] hover:bg-[#fff4df]"
                                >
                                  เสร็จสิ้น
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">ชั่วโมง</label>
                                  <select
                                    value={getTimeParts(startTime).hour}
                                    onChange={(event) => updateTimePart("start", "hour", event.target.value)}
                                    className="h-11 rounded-xl border border-[#d7c5a7] bg-[#fffcf5] px-3 text-[14px] font-black text-[#5c3214] outline-none"
                                  >
                                    {HOUR_OPTIONS.map((hour) => (
                                      <option key={hour} value={hour}>
                                        {hour}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">นาที</label>
                                  <select
                                    value={roundMinutesToNearestFive(getTimeParts(startTime).minute)}
                                    onChange={(event) => updateTimePart("start", "minute", event.target.value)}
                                    className="h-11 rounded-xl border border-[#d7c5a7] bg-[#fffcf5] px-3 text-[14px] font-black text-[#5c3214] outline-none"
                                  >
                                    {MINUTE_OPTIONS.map((minute) => (
                                      <option key={minute} value={minute}>
                                        {minute}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="end-date" className="text-[13px] font-black text-[#5c3214]">
                          วันที่จบ
                        </Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(event) => updateField("endDate", event.target.value)}
                          className="h-11 rounded-xl border-[#d7c5a7] bg-white px-3.5 pr-4 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="end-time" className="text-[13px] font-black text-[#5c3214]">
                          เวลาจบ
                        </Label>
                        <div className="relative">
                          <Input
                            id="end-time"
                            type="text"
                            value={endTime}
                            onChange={(event) =>
                              patchEvent(
                                (current) => ({
                                  ...current,
                                  endTime: normalizeTimeInput(event.target.value),
                                }),
                                true
                              )
                            }
                            inputMode="numeric"
                            placeholder="16:00"
                            maxLength={5}
                            className="h-11 rounded-xl border-[#d7c5a7] bg-white px-3.5 pr-11 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => setOpenTimePicker((current) => (current === "end" ? null : "end"))}
                            className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#d7c5a7] bg-[#fffaf0] text-[#5c3214] transition-colors hover:bg-[#fff0cf]"
                            aria-label="เลือกเวลาจบ"
                          >
                            <Clock3 className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </button>
                          {openTimePicker === "end" ? (
                            <div className="absolute top-[calc(100%+8px)] left-0 z-20 w-[280px] rounded-[18px] border border-[#e3d0ae] bg-white p-3 shadow-[0_16px_34px_rgba(62,36,13,0.14)]">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">เลือกเวลาจบ</div>
                                  <div className="mt-1 text-[18px] font-black text-[#5c3214]">{endTime || "16:00"}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => pickTime("end", endTime || "16:00")}
                                  className="h-8 rounded-lg border-[#d7c5a7] bg-[#fffaf0] px-3 text-[12px] font-black text-[#5c3214] hover:bg-[#fff4df]"
                                >
                                  เสร็จสิ้น
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">ชั่วโมง</label>
                                  <select
                                    value={getTimeParts(endTime).hour}
                                    onChange={(event) => updateTimePart("end", "hour", event.target.value)}
                                    className="h-11 rounded-xl border border-[#d7c5a7] bg-[#fffcf5] px-3 text-[14px] font-black text-[#5c3214] outline-none"
                                  >
                                    {HOUR_OPTIONS.map((hour) => (
                                      <option key={hour} value={hour}>
                                        {hour}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">นาที</label>
                                  <select
                                    value={roundMinutesToNearestFive(getTimeParts(endTime).minute)}
                                    onChange={(event) => updateTimePart("end", "minute", event.target.value)}
                                    className="h-11 rounded-xl border border-[#d7c5a7] bg-[#fffcf5] px-3 text-[14px] font-black text-[#5c3214] outline-none"
                                  >
                                    {MINUTE_OPTIONS.map((minute) => (
                                      <option key={minute} value={minute}>
                                        {minute}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {RANGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyRangePreset(preset.days)}
                          className="rounded-full border border-[#d7c5a7] bg-white px-3 py-1.5 text-[12px] font-black text-[#5c3214] transition-colors hover:bg-[#fff3dd]"
                        >
                          จบใน {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#eee2cb] bg-[#fffcf6] p-3.5">
                    <div className="mb-3 flex items-center gap-2 text-[13px] font-black text-[#5c3214]">
                      <CalendarClock className="h-4 w-4 text-[#8b5a12]" strokeWidth={2.2} />
                      สรุปช่วงเวลา
                    </div>
                    <div className="text-[13px] font-bold leading-relaxed text-[#6e6254]">{windowLabel}</div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#eee2cb] bg-[#fffcf6] p-3.5">
                  <div className="mb-3 text-[13px] font-black text-[#5c3214]">รูปแบบโบนัส</div>
                  <div className="grid grid-cols-1 gap-2">
                    {BONUS_MODE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          patchEvent(
                            (current) => ({
                              ...current,
                              bonusMode: option.id as SafetyCultureBonusMode,
                            }),
                            true
                          )
                        }
                        className={cn(
                          "rounded-[16px] border px-4 py-3 text-left transition-all",
                          bonusMode === option.id
                            ? "border-[#f5bb00] bg-[#fff6d6] text-[#1A1A1A] shadow-[inset_0_0_0_1px_#f5bb00]"
                            : "border-[#e3d0ae] bg-white text-[#4f4335] hover:border-[#c89a4f]"
                        )}
                      >
                        <div className="flex items-center gap-2 text-[14px] font-black">
                          <Percent className="h-4 w-4" strokeWidth={2.2} />
                          {option.label}
                        </div>
                        <div className="mt-1 text-[12px] font-bold text-[#8E8A81]">{option.hint}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="multiplier" className="text-[13px] font-black text-[#5c3214]">
                        ค่า Multiplier
                      </Label>
                      <Input
                        id="multiplier"
                        type="text"
                        inputMode="decimal"
                        value={multiplierInput}
                        onChange={(event) => handleMultiplierChange(event.target.value)}
                        onBlur={handleMultiplierBlur}
                        disabled={bonusMode !== "multiplier"}
                        className="h-11 rounded-xl border-[#d7c5a7] bg-white px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="fixed-points" className="text-[13px] font-black text-[#5c3214]">
                        แต้มโบนัสคงที่
                      </Label>
                      <Input
                        id="fixed-points"
                        value={`${fixedPoints}`}
                        onChange={(event) =>
                          patchEvent(
                            (current) => ({
                              ...current,
                              fixedPoints: Number(event.target.value) || 0,
                            }),
                            true
                          )
                        }
                        disabled={bonusMode !== "fixed"}
                        className="h-11 rounded-xl border-[#d7c5a7] bg-white px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="กิจกรรมและข้อความ"
              description="เลือกกิจกรรมที่ได้โบนัส และปรับข้อความที่ผู้ใช้จะเห็น"
              icon={<Megaphone className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="rounded-[20px] border border-[#eee2cb] bg-[#fffcf6] p-3.5">
                  <div className="mb-3 text-[13px] font-black text-[#5c3214]">กิจกรรมที่ได้โบนัส</div>
                  <div className="grid grid-cols-1 gap-2">
                    {ACTION_OPTIONS.map((action) => {
                      const active = enabledActions.includes(action.id);

                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => toggleAction(action.id as SafetyCultureEventAction)}
                          className={cn(
                            "rounded-[16px] border px-4 py-3 text-left transition-all",
                            active ? "border-[#5c3214] bg-[#fff1dc] shadow-[inset_0_0_0_1px_#5c3214]" : "border-[#e3d0ae] bg-white hover:border-[#c89a4f]"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[14px] font-black text-[#1A1A1A]">{action.label}</span>
                            {active ? <CheckCircle2 className="h-4 w-4 text-[#5c3214]" strokeWidth={2.4} /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#eee2cb] bg-[#fffcf6] p-3.5">
                  <div className="mb-3 text-[13px] font-black text-[#5c3214]">ข้อความบน Feed</div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-[16px] border border-[#eadcc7] bg-white px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">หัวข้อแนะนำ</div>
                          <div className="mt-1 truncate text-[13px] font-bold text-[#5c3214]">{autoHeadline}</div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={resetAutoHeadline}
                          className="h-8 rounded-lg border-[#d7c5a7] bg-white px-3 text-[12px] font-black text-[#5c3214] hover:bg-[#fff4df]"
                        >
                          ใช้
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="headline" className="text-[13px] font-black text-[#5c3214]">
                        หัวข้อ
                      </Label>
                      <Input
                        id="headline"
                        value={headline}
                        onChange={(event) => updateField("headline", event.target.value)}
                        className="h-11 rounded-xl border-[#d7c5a7] bg-white px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                      />
                      {!usingAutoHeadline ? <div className="text-[12px] font-bold text-[#8b5a12]">กำลังใช้หัวข้อแบบกำหนดเอง</div> : null}
                    </div>

                    <div className="rounded-[16px] border border-[#eadcc7] bg-white px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">ข้อความรองแนะนำ</div>
                          <div className="mt-1 line-clamp-2 text-[13px] font-bold text-[#5c3214]">{autoSupportingText}</div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={resetAutoSupportingText}
                          className="h-8 rounded-lg border-[#d7c5a7] bg-white px-3 text-[12px] font-black text-[#5c3214] hover:bg-[#fff4df]"
                        >
                          ใช้
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="supporting-text" className="text-[13px] font-black text-[#5c3214]">
                        ข้อความรอง
                      </Label>
                      <Textarea
                        id="supporting-text"
                        value={supportingText}
                        onChange={(event) => updateField("supportingText", event.target.value)}
                        className="min-h-[104px] rounded-[18px] border-[#d7c5a7] bg-white px-3.5 py-3 text-[14px] font-bold leading-relaxed text-[#1A1A1A] focus-visible:border-[#5c3214] focus-visible:ring-0"
                      />
                      {!usingAutoSupportingText ? <div className="text-[12px] font-bold text-[#8b5a12]">กำลังใช้ข้อความรองแบบกำหนดเอง</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[24px] border border-[#e3d0ae] bg-[#fffdfa] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1c9] text-[#6d4716]">
                  <Clock3 className="h-5 w-5" strokeWidth={2.3} />
                </div>
                <div>
                  <h3 className="text-[17px] font-black text-[#1A1A1A]">สถานะก่อน Publish</h3>
                  <p className="text-[12px] font-bold text-[#8E8A81]">เช็กเฉพาะสิ่งที่ยังต้องแก้</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div
                  className={cn(
                    "rounded-[18px] px-3.5 py-3 text-[13px] font-bold",
                    validation.length > 0
                      ? "border border-[#e2b4b4] bg-[#fff4f4] text-[#6c2d2d]"
                      : "border border-[#bfd7c0] bg-[#f2fff2] text-[#245336]"
                  )}
                >
                  {validation.length > 0 ? `ยังเหลือ ${validation.length} จุดที่ต้องแก้ก่อน Publish` : "ค่าจำเป็นครบแล้ว พร้อม Publish"}
                </div>

                {validation.length > 0
                  ? validation.map((issue) => (
                      <div key={issue} className="rounded-[16px] border border-[#e2b4b4] bg-[#fff9f9] px-3 py-2.5 text-[12px] font-bold text-[#6c2d2d]">
                        {issue}
                      </div>
                    ))
                  : null}
              </div>
            </Card>

            <Card className="hidden overflow-hidden rounded-[24px] border border-[#c89a4f] bg-[linear-gradient(135deg,#3f210d_0%,#5b3214_55%,#714413_100%)] p-0 text-white shadow-[0_14px_28px_rgba(62,36,13,0.16)] xl:block">
              <div className="h-2 bg-[repeating-linear-gradient(-45deg,#ffb000,#ffb000_10px,#15120e_10px,#15120e_20px)]" />
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-[#d89b09] bg-[rgba(255,176,0,0.14)] px-3 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffd96a]">
                    ตัวอย่างบน FEED
                  </span>
                  <span className="text-[12px] font-black text-[#ffe7b0]">{windowLabel}</span>
                </div>
                <h3 className="text-[24px] font-black leading-tight text-white">{headline || autoHeadline}</h3>
                <p className="mt-2 text-[13px] font-bold leading-relaxed text-[#f8ead7]">{supportingText || autoSupportingText}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-black text-[#ffe7b0]">
                    โบนัส {bonusPreview}
                  </span>
                  {selectedActions.map((action) => (
                    <span key={action.id} className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-black text-[#ffe7b0]">
                      {action.label}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
