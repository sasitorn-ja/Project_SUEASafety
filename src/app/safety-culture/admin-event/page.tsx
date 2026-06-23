"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileImage,
  GripVertical,
  Megaphone,
  Percent,
  Plus,
  SquarePen,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  WandSparkles,
} from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AppModalBody,
  AppModalCloseButton,
  AppModalFooter,
  AppModalHeader,
  AppModalPanel,
} from "@/components/ui/app-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getSafetyCultureEventPhase,
  useAppActions,
  useAppState,
  type SafetyCultureBonusMode,
  type SafetyCultureEventAction,
  type SafetyCultureFeedEvent,
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
const ADMIN_EDITOR_MODES = [
  {
    id: "bonus",
    label: "Event แบบเวลา",
    description: "จัดการ Banner โบนัสและช่วงเวลาอีเวนต์",
    icon: CalendarClock,
  },
  {
    id: "feed",
    label: "Event แบบ Card",
    description: "จัดการการ์ดกิจกรรมและ Popup บน Feed",
    icon: Sparkles,
  },
] as const;

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

function createFeedEventDraft(index: number): SafetyCultureFeedEvent {
  return {
    id: `activity-${Date.now()}-${index}`,
    title: `กิจกรรมใหม่ ${index + 1}`,
    subtitle: "",
    summary: "",
    details: "",
    imageSrc: null,
    imageText: `Activity ${index + 1}`,
    startDate: "",
    endDate: "",
    dateLabel: "TBD",
    points: 100,
    status: "open",
    published: true,
    bonusMode: "fixed",
    multiplier: 1,
    fixedPoints: 0,
    enabledActions: ["theme-post"],
  };
}

function formatFeedEventDateLabel(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return "TBD";

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "TBD";
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function syncFeedEventDateLabel(event: SafetyCultureFeedEvent): SafetyCultureFeedEvent {
  const computedLabel = formatFeedEventDateLabel(event.startDate, event.endDate);
  return {
    ...event,
    dateLabel: computedLabel !== "TBD" ? computedLabel : event.dateLabel || "TBD",
  };
}

function addDaysToDateString(dateString: string, days: number) {
  if (!dateString) return "";
  const source = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(source.getTime())) return "";
  source.setDate(source.getDate() + days);
  const year = source.getFullYear();
  const month = `${source.getMonth() + 1}`.padStart(2, "0");
  const day = `${source.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFeedEventDurationMeta(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return {
      label: "ยังไม่ได้กำหนดช่วงวันที่",
      tone: "text-[#8E8A81]",
    };
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      label: "กรุณาเลือกวันที่ให้ครบ",
      tone: "text-[#b45454]",
    };
  }

  if (end < start) {
    return {
      label: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
      tone: "text-[#b45454]",
    };
  }

  const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return {
    label: `แสดงบนการ์ดเป็น ${formatFeedEventDateLabel(startDate, endDate)} · ระยะเวลา ${days} วัน`,
    tone: "text-[var(--c-5c3214)]",
  };
}

function getFeedEventStatusMeta(status: SafetyCultureFeedEvent["status"]) {
  return status === "open"
    ? {
        label: "เปิดกิจกรรม",
        tone: "border-[#245336] bg-[#245336] text-white",
      }
    : {
        label: "ปิดกิจกรรม",
        tone: "border-[#7d3434] bg-[#7d3434] text-white",
      };
}

function getFeedEventCardCopy(event: Pick<SafetyCultureFeedEvent, "details" | "summary">) {
  return event.details?.trim() || event.summary?.trim() || "รายละเอียดกิจกรรมจะแสดงที่นี่";
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
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
    <Card className={cn("rounded-[24px] border border-[var(--c-e3d0ae)] bg-[var(--c-fffdfa)] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-5", className)}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--c-fff1c9)] text-[var(--c-6d4716)]">{icon}</div>
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
  const { safetyCultureEvent, feedEvents, eventNow, posts } = useAppState();
  const { updateSafetyCultureEvent, updateFeedEvents, sendFeedEventNotification } = useAppActions();
  const [saveLabel, setSaveLabel] = useState<"idle" | "saved" | "published">("idle");
  const [openTimePicker, setOpenTimePicker] = useState<"start" | "end" | null>(null);
  const [activitySaveLabel, setActivitySaveLabel] = useState<"idle" | "saved" | "error">("idle");
  const [isSavingFeedEvents, setIsSavingFeedEvents] = useState(false);
  const [notifiedFeedEventId, setNotifiedFeedEventId] = useState<string | null>(null);
  const [draftFeedEvents, setDraftFeedEvents] = useState<SafetyCultureFeedEvent[]>(feedEvents);
  const [draggingFeedEventId, setDraggingFeedEventId] = useState<string | null>(null);
  const [dragOverFeedEventId, setDragOverFeedEventId] = useState<string | null>(null);
  const [editingFeedEventId, setEditingFeedEventId] = useState<string | null>(feedEvents[0]?.id ?? null);
  const [feedModalEventId, setFeedModalEventId] = useState<string | null>(null);
  const [feedModalDraft, setFeedModalDraft] = useState<SafetyCultureFeedEvent | null>(null);
  const [feedModalMultiplierInput, setFeedModalMultiplierInput] = useState("1");
  const [feedModalMode, setFeedModalMode] = useState<"create" | "edit">("edit");
  const [pendingDeleteFeedEvent, setPendingDeleteFeedEvent] = useState<{ id: string; title: string } | null>(null);
  const [editorMode] = useState<(typeof ADMIN_EDITOR_MODES)[number]["id"]>("feed");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    bannerVisible,
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

  useEffect(() => {
    setDraftFeedEvents(feedEvents);
    setEditingFeedEventId((current) => {
      if (current && feedEvents.some((event) => event.id === current)) return current;
      return feedEvents[0]?.id ?? null;
    });
  }, [feedEvents]);

  useEffect(() => {
    setFeedModalMultiplierInput(feedModalDraft ? `${feedModalDraft.multiplier}` : "1");
  }, [feedModalDraft?.multiplier]);

  const autoHeadline = buildAutoHeadline(eventName, bonusMode, multiplier, fixedPoints);
  const autoSupportingText = buildAutoSupportingText(bonusMode, startTime, endTime);
  const bonusPreview = formatBonusLabel(bonusMode, multiplier, fixedPoints);
  const activeStatusLabel = EVENT_STATUS_OPTIONS.find((option) => option.id === status)?.label ?? "Draft";
  const phase = getSafetyCultureEventPhase(safetyCultureEvent, eventNow);
  const phaseLabel = getPhaseLabel(phase);
  const windowLabel = formatWindowLabel(startDate, startTime, endDate, endTime);
  const selectedActions = ACTION_OPTIONS.filter((action) => enabledActions.includes(action.id));
  const feedModalOpen = Boolean(feedModalEventId && feedModalDraft);
  const feedModalDurationMeta = getFeedEventDurationMeta(feedModalDraft?.startDate, feedModalDraft?.endDate);
  const feedModalTitle = feedModalMode === "create" ? "สร้างกิจกรรมใหม่" : "แก้ไขกิจกรรม";
  const feedModalDescription =
    feedModalMode === "create"
      ? "กรอกข้อมูลหลักของกิจกรรมและตั้งค่าการแสดงผล"
      : "ปรับข้อมูลกิจกรรมและการแสดงผลบน Feed";
  const feedModalSubmitLabel = feedModalMode === "create" ? "สร้างกิจกรรม" : "บันทึกการแก้ไข";
  const feedModalSelectedActions = ACTION_OPTIONS.filter((action) => feedModalDraft?.enabledActions.includes(action.id));
  const feedModalBonusPreview = feedModalDraft
    ? formatBonusLabel(feedModalDraft.bonusMode, feedModalDraft.multiplier, feedModalDraft.fixedPoints)
    : "+0 แต้ม";
  const isFeedModalBonusEnabled = Boolean(feedModalDraft?.enabledActions.length);
  const feedEventParticipantCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const event of draftFeedEvents) {
      const uniqueAuthors = new Set(
        posts
          .filter((post) => post.feedEventId === event.id)
          .map((post) => (post.author || "").trim())
          .filter(Boolean)
      );

      counts.set(event.id, uniqueAuthors.size);
    }

    return counts;
  }, [draftFeedEvents, posts]);

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

  const handleAddFeedEvent = () => {
    const nextEvent = createFeedEventDraft(draftFeedEvents.length);
    setDraftFeedEvents((current) => [nextEvent, ...current]);
    setEditingFeedEventId(nextEvent.id);
    setFeedModalEventId(nextEvent.id);
    setFeedModalDraft(nextEvent);
    setFeedModalMode("create");
    setActivitySaveLabel("idle");
  };

  const handleDeleteFeedEvent = (eventId: string) => {
    const remaining = draftFeedEvents.filter((event) => event.id !== eventId);
    setDraftFeedEvents(remaining);
    setEditingFeedEventId((current) => {
      if (current !== eventId) return current;
      return remaining[0]?.id ?? null;
    });
    if (feedModalEventId === eventId) {
      setFeedModalEventId(null);
      setFeedModalDraft(null);
    }
    setActivitySaveLabel("idle");
  };

  const requestDeleteFeedEvent = (eventId: string) => {
    const targetEvent = draftFeedEvents.find((event) => event.id === eventId);
    if (!targetEvent) return;
    setPendingDeleteFeedEvent({ id: targetEvent.id, title: targetEvent.title });
  };

  const closeDeleteFeedEventPrompt = () => {
    setPendingDeleteFeedEvent(null);
  };

  const confirmDeleteFeedEvent = async () => {
    if (!pendingDeleteFeedEvent) return;
    const deletedEventId = pendingDeleteFeedEvent.id;
    const remaining = draftFeedEvents.filter((event) => event.id !== deletedEventId);
    setIsSavingFeedEvents(true);
    setActivitySaveLabel("idle");
    const saved = await updateFeedEvents(remaining);
    setIsSavingFeedEvents(false);

    if (!saved) {
      setActivitySaveLabel("error");
      return;
    }

    setDraftFeedEvents(remaining);
    setEditingFeedEventId((current) => {
      if (current !== deletedEventId) return current;
      return remaining[0]?.id ?? null;
    });
    if (feedModalEventId === deletedEventId) {
      setFeedModalEventId(null);
      setFeedModalDraft(null);
    }
    setPendingDeleteFeedEvent(null);
    setActivitySaveLabel("saved");
  };

  const handleSaveFeedEvents = async () => {
    setIsSavingFeedEvents(true);
    setActivitySaveLabel("idle");
    const saved = await updateFeedEvents(draftFeedEvents);
    setIsSavingFeedEvents(false);
    setActivitySaveLabel(saved ? "saved" : "error");
  };

  const handleNotifyFeedEvent = (feedEventId: string) => {
    const sent = sendFeedEventNotification(feedEventId);
    if (!sent) return;

    setNotifiedFeedEventId(feedEventId);
    window.setTimeout(() => {
      setNotifiedFeedEventId((current) => (current === feedEventId ? null : current));
    }, 2200);
  };

  const reorderFeedEvents = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const sourceIndex = draftFeedEvents.findIndex((event) => event.id === sourceId);
    const targetIndex = draftFeedEvents.findIndex((event) => event.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    setDraftFeedEvents((current) => {
      const nextEvents = [...current];
      const [movedEvent] = nextEvents.splice(sourceIndex, 1);
      nextEvents.splice(targetIndex, 0, movedEvent);
      return nextEvents;
    });
    setEditingFeedEventId(sourceId);
    setActivitySaveLabel("idle");
  };

  const handleFeedEventDragStart = (eventId: string) => {
    setDraggingFeedEventId(eventId);
    setDragOverFeedEventId(eventId);
    setActivitySaveLabel("idle");
  };

  const handleFeedEventDrop = (targetEventId: string) => {
    if (!draggingFeedEventId) return;
    reorderFeedEvents(draggingFeedEventId, targetEventId);
    setDraggingFeedEventId(null);
    setDragOverFeedEventId(null);
  };

  const handleFeedEventDragEnd = () => {
    setDraggingFeedEventId(null);
    setDragOverFeedEventId(null);
  };

  const openFeedEditorModal = (eventId: string) => {
    const selectedEvent = draftFeedEvents.find((event) => event.id === eventId);
    if (!selectedEvent) return;
    setEditingFeedEventId(eventId);
    setFeedModalEventId(eventId);
    setFeedModalDraft({ ...selectedEvent });
    setFeedModalMode("edit");
  };

  const closeFeedEditorModal = () => {
    if (feedModalMode === "create" && feedModalEventId) {
      const remaining = draftFeedEvents.filter((event) => event.id !== feedModalEventId);
      setDraftFeedEvents(remaining);
      setEditingFeedEventId(remaining[0]?.id ?? null);
    }
    setFeedModalEventId(null);
    setFeedModalDraft(null);
    setFeedModalMultiplierInput("1");
  };

  const patchFeedModalDraft = (recipe: (event: SafetyCultureFeedEvent) => SafetyCultureFeedEvent) => {
    setFeedModalDraft((current) => (current ? syncFeedEventDateLabel(recipe(current)) : current));
  };

  const handleFeedModalMultiplierChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    setFeedModalMultiplierInput(value);

    if (!value || value === ".") return;

    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    patchFeedModalDraft((current) => ({
      ...current,
      multiplier: parsed,
    }));
  };

  const handleFeedModalMultiplierBlur = () => {
    if (!feedModalDraft) return;

    if (!feedModalMultiplierInput || feedModalMultiplierInput === ".") {
      setFeedModalMultiplierInput(`${feedModalDraft.multiplier}`);
      return;
    }

    const parsed = Number(feedModalMultiplierInput);
    if (Number.isNaN(parsed)) {
      setFeedModalMultiplierInput(`${feedModalDraft.multiplier}`);
      return;
    }

    const normalized = parsed > 0 ? parsed : 1;

    patchFeedModalDraft((current) => ({
      ...current,
      multiplier: normalized,
    }));
    setFeedModalMultiplierInput(`${normalized}`);
  };

  const toggleFeedModalBonusEnabled = () => {
    patchFeedModalDraft((current) => ({
      ...current,
      enabledActions: current.enabledActions.length > 0 ? [] : ["theme-post"],
    }));
  };

  const handleFeedModalImageChange = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    patchFeedModalDraft((event) => ({
      ...event,
      imageSrc: dataUrl,
    }));
  };

  const handleApplyFeedModal = async () => {
    if (!feedModalEventId || !feedModalDraft) return;
    const normalizedMultiplier = Number(feedModalMultiplierInput);
    const nextDraft =
      feedModalDraft.bonusMode === "multiplier" && Number.isFinite(normalizedMultiplier) && normalizedMultiplier > 0
        ? {
            ...feedModalDraft,
            multiplier: normalizedMultiplier,
          }
        : feedModalDraft;
    const nextEvents = draftFeedEvents.map((event) => (event.id === feedModalEventId ? syncFeedEventDateLabel(nextDraft) : event));
    setIsSavingFeedEvents(true);
    setActivitySaveLabel("idle");
    const saved = await updateFeedEvents(nextEvents);
    setIsSavingFeedEvents(false);
    if (!saved) {
      setActivitySaveLabel("error");
      return;
    }
    setDraftFeedEvents(nextEvents);
    setEditingFeedEventId(feedModalEventId);
    setActivitySaveLabel("saved");
    setFeedModalEventId(null);
    setFeedModalDraft(null);
    setFeedModalMultiplierInput("1");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1480px] bg-[var(--background)] px-3.5 pt-2.5 pb-8 font-sarabun md:px-5">
        <SafetyCultureHero
          eyebrow="SAFETY CULTURE ADMIN"
          title={
            <>
              Admin Edit <span className="text-[var(--c-f5bb00)]">Event</span>
            </>
          }
          description="ตั้งค่าอีเว้น ดูตัวอย่างผลทันที และกด Publish ได้อย่างมั่นใจ"
          variant="community"
          backgroundImage="/images/safety-culture-hero.png"
          backgroundOverlay="linear-gradient(90deg, rgba(2, 26, 66, .82) 0%, rgba(3, 33, 78, .5) 34%, rgba(3, 33, 78, .16) 56%, rgba(3, 33, 78, 0) 70%)"
        />

        {editorMode === "bonus" ? (
        <Card className="hidden mt-4 rounded-[22px] border border-[var(--c-e4d3b3)] bg-[var(--c-fffaf0)] p-3.5 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-xl border border-[var(--c-d7c5a7)] bg-white px-3 py-2 text-[11px] font-black text-[var(--c-5c3214)]">
                สถานะ {activeStatusLabel}
              </Badge>
              <Badge className="rounded-xl border border-[var(--c-d7c5a7)] bg-[var(--c-fff6d6)] px-3 py-2 text-[11px] font-black text-[var(--c-8b5a12)]">
                ตอนนี้ {phaseLabel}
              </Badge>
              <Badge className="rounded-xl border border-[var(--c-d7c5a7)] bg-white px-3 py-2 text-[11px] font-black text-[var(--c-5c3214)]">
                โบนัส {bonusPreview}
              </Badge>
              <Badge
                className={cn(
                  "rounded-xl border px-3 py-2 text-[11px] font-black",
                  bannerVisible
                    ? "border-[#c7d8be] bg-[#f2fff2] text-[#245336]"
                    : "border-[#e2c8c8] bg-[#fff4f4] text-[#7d3434]"
                )}
              >
                Banner {bannerVisible ? "Visible" : "Hidden"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="h-10 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fff8eb)] px-4 text-[13px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
              >
                บันทึกเป็น Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!canPublish}
                className="h-10 rounded-xl bg-[var(--c-5c3214)] px-4 text-[13px] font-black text-white hover:bg-[var(--c-4a280f)] disabled:bg-[var(--c-a79885)]"
              >
                Publish Event
              </Button>
              {saveLabel !== "idle" ? (
                <div className="flex h-10 items-center rounded-xl border border-[var(--c-d7c5a7)] bg-white px-3 text-[12px] font-black text-[var(--c-5c3214)]">
                  {saveLabel === "saved" ? "บันทึก Draft แล้ว" : "Publish แล้ว"}
                </div>
              ) : null}
            </div>
          </div>
        </Card>
        ) : null}

        {editorMode === "bonus" ? (
          <Card className="mt-4 rounded-[22px] border border-[var(--c-e4d3b3)] bg-[var(--c-fffaf0)] p-3.5 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-xl border border-[var(--c-d7c5a7)] bg-white px-3 py-2 text-[11px] font-black text-[var(--c-5c3214)]">
                  สถานะ {activeStatusLabel}
                </Badge>
                <Badge className="rounded-xl border border-[var(--c-d7c5a7)] bg-[var(--c-fff6d6)] px-3 py-2 text-[11px] font-black text-[var(--c-8b5a12)]">
                  ตอนนี้ {phaseLabel}
                </Badge>
                <Badge className="rounded-xl border border-[var(--c-d7c5a7)] bg-white px-3 py-2 text-[11px] font-black text-[var(--c-5c3214)]">
                  โบนัส {bonusPreview}
                </Badge>
                <Badge
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[11px] font-black",
                    bannerVisible
                      ? "border-[#c7d8be] bg-[#f2fff2] text-[#245336]"
                      : "border-[#e2c8c8] bg-[#fff4f4] text-[#7d3434]"
                  )}
                >
                  Banner {bannerVisible ? "Visible" : "Hidden"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="h-10 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fff8eb)] px-4 text-[13px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
                >
                  บันทึกเป็น Draft
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className="h-10 rounded-xl bg-[var(--c-5c3214)] px-4 text-[13px] font-black text-white hover:bg-[var(--c-4a280f)] disabled:bg-[var(--c-a79885)]"
                >
                  Publish Event
                </Button>
                {saveLabel !== "idle" ? (
                  <div className="flex h-10 items-center rounded-xl border border-[var(--c-d7c5a7)] bg-white px-3 text-[12px] font-black text-[var(--c-5c3214)]">
                    {saveLabel === "saved" ? "บันทึก Draft แล้ว" : "Publish แล้ว"}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}

        <div
          className={cn(
            "mt-4 grid grid-cols-1 gap-4",
            editorMode === "bonus" ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "xl:grid-cols-1"
          )}
        >
          <div className="flex flex-col gap-4">
            {editorMode === "bonus" ? (
              <>
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
                    className="rounded-full border border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] px-4 py-2 text-[12px] font-black text-[var(--c-5c3214)] transition-colors hover:bg-[var(--c-fff3dd)]"
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
                    <Label htmlFor="event-name" className="text-[13px] font-black text-[var(--c-5c3214)]">
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
                      className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-code" className="text-[13px] font-black text-[var(--c-5c3214)]">
                      รหัสอีเว้น
                    </Label>
                    <Input
                      id="event-code"
                      value={eventCode}
                      onChange={(event) => updateField("eventCode", event.target.value)}
                      className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
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
                          ? "border-[var(--c-5c3214)] bg-[var(--c-5c3214)] text-white shadow-[0_10px_18px_rgba(62,36,13,0.14)]"
                          : "border-[var(--c-e3d0ae)] bg-[var(--c-fffcf5)] text-[var(--c-4f4335)] hover:border-[var(--c-c89a4f)]"
                      )}
                    >
                      <div className="text-[14px] font-black">{option.label}</div>
                      <div className={cn("mt-1 text-[11px] font-bold leading-relaxed", status === option.id ? "text-white/78" : "text-[#8E8A81]")}>
                        {option.note}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="rounded-[18px] border border-[var(--c-e3d0ae)] bg-[var(--c-fffcf5)] p-3.5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-[13px] font-black text-[var(--c-5c3214)]">การแสดง Banner บน Feed</div>
                      <div className="mt-1 text-[12px] font-bold leading-relaxed text-[#8E8A81]">
                        ซ่อนหรือแสดงแบนเนอร์กิจกรรมได้อิสระ โดยไม่กระทบสถานะอีเวนต์หรือการคำนวณโบนัส
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateField("bannerVisible", true)}
                        className={cn(
                          "rounded-[14px] border px-4 py-2.5 text-[12px] font-black transition-all",
                          bannerVisible
                            ? "border-[#245336] bg-[#245336] text-white shadow-[0_10px_18px_rgba(36,83,54,0.18)]"
                            : "border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] hover:border-[var(--c-c89a4f)]"
                        )}
                      >
                        แสดง Banner
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("bannerVisible", false)}
                        className={cn(
                          "rounded-[14px] border px-4 py-2.5 text-[12px] font-black transition-all",
                          !bannerVisible
                            ? "border-[#7d3434] bg-[#7d3434] text-white shadow-[0_10px_18px_rgba(125,52,52,0.18)]"
                            : "border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] hover:border-[var(--c-c89a4f)]"
                        )}
                      >
                        ซ่อน Banner
                      </button>
                    </div>
                  </div>
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
                  <div className="rounded-[20px] border border-[var(--c-eee2cb)] bg-[var(--c-fffcf6)] p-3.5">
                    <div className="mb-3 text-[13px] font-black text-[var(--c-5c3214)]">ช่วงเวลาอีเว้น</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="start-date" className="text-[13px] font-black text-[var(--c-5c3214)]">
                          วันที่เริ่ม
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(event) => updateField("startDate", event.target.value)}
                          className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3.5 pr-4 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="start-time" className="text-[13px] font-black text-[var(--c-5c3214)]">
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
                            className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3.5 pr-11 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => setOpenTimePicker((current) => (current === "start" ? null : "start"))}
                            className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--c-d7c5a7)] bg-[var(--c-fffaf0)] text-[var(--c-5c3214)] transition-colors hover:bg-[var(--c-fff0cf)]"
                            aria-label="เลือกเวลาเริ่ม"
                          >
                            <Clock3 className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </button>
                          {openTimePicker === "start" ? (
                            <div className="absolute top-[calc(100%+8px)] left-0 z-20 w-[280px] rounded-[18px] border border-[var(--c-e3d0ae)] bg-white p-3 shadow-[0_16px_34px_rgba(62,36,13,0.14)]">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">เลือกเวลาเริ่ม</div>
                                  <div className="mt-1 text-[18px] font-black text-[var(--c-5c3214)]">{startTime || "14:00"}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => pickTime("start", startTime || "14:00")}
                                  className="h-8 rounded-lg border-[var(--c-d7c5a7)] bg-[var(--c-fffaf0)] px-3 text-[12px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff4df)]"
                                >
                                  เสร็จสิ้น
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">ชั่วโมง</label>
                                  <Combobox
                                    value={getTimeParts(startTime).hour}
                                    onValueChange={(v) => updateTimePart("start", "hour", v)}
                                    aria-label="ชั่วโมงเริ่ม"
                                    searchPlaceholder="ชั่วโมง"
                                    className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] text-[14px] font-black text-[var(--c-5c3214)]"
                                    options={HOUR_OPTIONS.map((hour) => ({ value: hour, label: hour }))}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">นาที</label>
                                  <Combobox
                                    value={roundMinutesToNearestFive(getTimeParts(startTime).minute)}
                                    onValueChange={(v) => updateTimePart("start", "minute", v)}
                                    aria-label="นาทีเริ่ม"
                                    searchPlaceholder="นาที"
                                    className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] text-[14px] font-black text-[var(--c-5c3214)]"
                                    options={MINUTE_OPTIONS.map((minute) => ({ value: minute, label: minute }))}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="end-date" className="text-[13px] font-black text-[var(--c-5c3214)]">
                          วันที่จบ
                        </Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(event) => updateField("endDate", event.target.value)}
                          className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3.5 pr-4 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="end-time" className="text-[13px] font-black text-[var(--c-5c3214)]">
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
                            className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3.5 pr-11 text-[15px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => setOpenTimePicker((current) => (current === "end" ? null : "end"))}
                            className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--c-d7c5a7)] bg-[var(--c-fffaf0)] text-[var(--c-5c3214)] transition-colors hover:bg-[var(--c-fff0cf)]"
                            aria-label="เลือกเวลาจบ"
                          >
                            <Clock3 className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </button>
                          {openTimePicker === "end" ? (
                            <div className="absolute top-[calc(100%+8px)] left-0 z-20 w-[280px] rounded-[18px] border border-[var(--c-e3d0ae)] bg-white p-3 shadow-[0_16px_34px_rgba(62,36,13,0.14)]">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">เลือกเวลาจบ</div>
                                  <div className="mt-1 text-[18px] font-black text-[var(--c-5c3214)]">{endTime || "16:00"}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => pickTime("end", endTime || "16:00")}
                                  className="h-8 rounded-lg border-[var(--c-d7c5a7)] bg-[var(--c-fffaf0)] px-3 text-[12px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff4df)]"
                                >
                                  เสร็จสิ้น
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">ชั่วโมง</label>
                                  <Combobox
                                    value={getTimeParts(endTime).hour}
                                    onValueChange={(v) => updateTimePart("end", "hour", v)}
                                    aria-label="ชั่วโมงจบ"
                                    searchPlaceholder="ชั่วโมง"
                                    className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] text-[14px] font-black text-[var(--c-5c3214)]"
                                    options={HOUR_OPTIONS.map((hour) => ({ value: hour, label: hour }))}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8E8A81]">นาที</label>
                                  <Combobox
                                    value={roundMinutesToNearestFive(getTimeParts(endTime).minute)}
                                    onValueChange={(v) => updateTimePart("end", "minute", v)}
                                    aria-label="นาทีจบ"
                                    searchPlaceholder="นาที"
                                    className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] text-[14px] font-black text-[var(--c-5c3214)]"
                                    options={MINUTE_OPTIONS.map((minute) => ({ value: minute, label: minute }))}
                                  />
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
                          className="rounded-full border border-[var(--c-d7c5a7)] bg-white px-3 py-1.5 text-[12px] font-black text-[var(--c-5c3214)] transition-colors hover:bg-[var(--c-fff3dd)]"
                        >
                          จบใน {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[var(--c-eee2cb)] bg-[var(--c-fffcf6)] p-3.5">
                    <div className="mb-3 flex items-center gap-2 text-[13px] font-black text-[var(--c-5c3214)]">
                      <CalendarClock className="h-4 w-4 text-[var(--c-8b5a12)]" strokeWidth={2.2} />
                      สรุปช่วงเวลา
                    </div>
                    <div className="text-[13px] font-bold leading-relaxed text-[var(--c-6e6254)]">{windowLabel}</div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--c-eee2cb)] bg-[var(--c-fffcf6)] p-3.5">
                  <div className="mb-3 text-[13px] font-black text-[var(--c-5c3214)]">รูปแบบโบนัส</div>
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
                            ? "border-[var(--c-f5bb00)] bg-[var(--c-fff6d6)] text-[#1A1A1A] shadow-[inset_0_0_0_1px_var(--c-f5bb00)]"
                            : "border-[var(--c-e3d0ae)] bg-white text-[var(--c-4f4335)] hover:border-[var(--c-c89a4f)]"
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
                      <Label htmlFor="multiplier" className="text-[13px] font-black text-[var(--c-5c3214)]">
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
                        className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="fixed-points" className="text-[13px] font-black text-[var(--c-5c3214)]">
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
                        className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
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
                <div className="rounded-[20px] border border-[var(--c-eee2cb)] bg-[var(--c-fffcf6)] p-3.5">
                  <div className="mb-3 text-[13px] font-black text-[var(--c-5c3214)]">กิจกรรมที่ได้โบนัส</div>
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
                            active ? "border-[var(--c-5c3214)] bg-[var(--c-fff1dc)] shadow-[inset_0_0_0_1px_var(--c-5c3214)]" : "border-[var(--c-e3d0ae)] bg-white hover:border-[var(--c-c89a4f)]"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[14px] font-black text-[#1A1A1A]">{action.label}</span>
                            {active ? <CheckCircle2 className="h-4 w-4 text-[var(--c-5c3214)]" strokeWidth={2.4} /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--c-eee2cb)] bg-[var(--c-fffcf6)] p-3.5">
                  <div className="mb-3 text-[13px] font-black text-[var(--c-5c3214)]">ข้อความบน Feed</div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-[16px] border border-[var(--c-eadcc7)] bg-white px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">หัวข้อแนะนำ</div>
                          <div className="mt-1 truncate text-[13px] font-bold text-[var(--c-5c3214)]">{autoHeadline}</div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={resetAutoHeadline}
                          className="h-8 rounded-lg border-[var(--c-d7c5a7)] bg-white px-3 text-[12px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff4df)]"
                        >
                          ใช้
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="headline" className="text-[13px] font-black text-[var(--c-5c3214)]">
                        หัวข้อ
                      </Label>
                      <Input
                        id="headline"
                        value={headline}
                        onChange={(event) => updateField("headline", event.target.value)}
                        className="h-11 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3.5 text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                      />
                      {!usingAutoHeadline ? <div className="text-[12px] font-bold text-[var(--c-8b5a12)]">กำลังใช้หัวข้อแบบกำหนดเอง</div> : null}
                    </div>

                    <div className="rounded-[16px] border border-[var(--c-eadcc7)] bg-white px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8E8A81]">ข้อความรองแนะนำ</div>
                          <div className="mt-1 line-clamp-2 text-[13px] font-bold text-[var(--c-5c3214)]">{autoSupportingText}</div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={resetAutoSupportingText}
                          className="h-8 rounded-lg border-[var(--c-d7c5a7)] bg-white px-3 text-[12px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff4df)]"
                        >
                          ใช้
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="supporting-text" className="text-[13px] font-black text-[var(--c-5c3214)]">
                        ข้อความรอง
                      </Label>
                      <Textarea
                        id="supporting-text"
                        value={supportingText}
                        onChange={(event) => updateField("supportingText", event.target.value)}
                        className="min-h-[104px] rounded-[18px] border-[var(--c-d7c5a7)] bg-white px-3.5 py-3 text-[14px] font-bold leading-relaxed text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                      />
                      {!usingAutoSupportingText ? <div className="text-[12px] font-bold text-[var(--c-8b5a12)]">กำลังใช้ข้อความรองแบบกำหนดเอง</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
              </>
            ) : null}

            {editorMode === "feed" ? (
            <SectionCard
              title="กิจกรรมบน Feed"
              description="สร้างการ์ดกิจกรรมสำหรับหน้า Feed และกำหนดรายละเอียดที่จะเปิดเป็น Popup เมื่อผู้ใช้กดดูเพิ่มเติม"
              icon={<Sparkles className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="overflow-hidden rounded-[22px] border border-[var(--c-e7d8bc)] bg-[var(--c-fffdf7)] shadow-[0_10px_24px_rgba(62,36,13,0.05)]">
                  <div className="flex flex-col gap-3 border-b border-[var(--c-eee2cb)] px-4 py-4 md:flex-row md:items-start md:justify-between md:px-5">
                    <div>
                      <div className="text-[16px] font-black text-[var(--c-2d241b)] md:text-[18px]">Activities Management</div>
                      <div className="text-[12px] font-bold leading-relaxed text-[#8E8A81]">จัดการ Event แบบ Card ให้แก้ไขง่ายขึ้น เลือกรายการจากตารางแล้วค่อยลงรายละเอียดด้านล่าง</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleAddFeedEvent}
                        disabled={isSavingFeedEvents}
                        className="h-10 rounded-[14px] bg-[var(--brand-text)] px-4 text-[13px] font-black text-white shadow-[0_8px_18px_var(--brand-shadow)] hover:bg-[var(--brand-nav)]"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        สร้างกิจกรรม
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveFeedEvents}
                        disabled={isSavingFeedEvents}
                        className="h-10 rounded-[14px] border-[var(--c-d7c5a7)] bg-[var(--c-fff8eb)] px-4 text-[13px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
                      >
                        {isSavingFeedEvents ? "กำลังบันทึก..." : "บันทึกรายการ"}
                      </Button>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div className="grid grid-cols-[minmax(260px,1.6fr)_110px_180px_120px_120px_108px_96px] gap-3 border-b border-[var(--c-eee2cb)] bg-[var(--c-fffaf0)] px-5 py-3 text-[12px] font-black text-[var(--c-6e6254)]">
                      <div>ชื่อกิจกรรม</div>
                      <div>คะแนน</div>
                      <div>ระยะเวลา</div>
                      <div>สถานะ</div>
                      <div>ผู้เข้าร่วม</div>
                      <div>แจ้งเตือน</div>
                      <div className="text-right">จัดการ</div>
                    </div>

                      <div className="divide-y divide-[var(--c-eee2cb)]">
                      {draftFeedEvents.map((activity) => {
                        const statusMeta = getFeedEventStatusMeta(activity.status);
                        const active = activity.id === editingFeedEventId;
                        const participantCount = feedEventParticipantCounts.get(activity.id) ?? 0;
                        const isDragging = draggingFeedEventId === activity.id;
                        const isDropTarget = dragOverFeedEventId === activity.id && draggingFeedEventId !== activity.id;

                        return (
                          <div
                            key={activity.id}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", activity.id);
                              handleFeedEventDragStart(activity.id);
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              if (draggingFeedEventId && draggingFeedEventId !== activity.id) {
                                event.dataTransfer.dropEffect = "move";
                                setDragOverFeedEventId(activity.id);
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleFeedEventDrop(activity.id);
                            }}
                            onDragEnd={handleFeedEventDragEnd}
                            className={cn(
                              "grid grid-cols-[minmax(260px,1.6fr)_110px_180px_120px_120px_108px_96px] gap-3 px-5 py-4 transition-all",
                              active ? "bg-[var(--c-fff4e3)]" : "bg-white hover:bg-[var(--c-fffaf2)]",
                              isDragging ? "scale-[0.995] opacity-60" : "",
                              isDropTarget ? "ring-2 ring-[var(--c-5c3214)] ring-inset" : ""
                            )}
                          >
                            <button type="button" onClick={() => setEditingFeedEventId(activity.id)} className="flex min-w-0 items-start gap-3 text-left">
                              <div className="flex h-[54px] w-[22px] flex-shrink-0 items-center justify-center text-[var(--c-5c3214)]">
                                <GripVertical className="h-4 w-4" strokeWidth={2.3} />
                              </div>
                              <div className="relative h-[54px] w-[54px] flex-shrink-0 overflow-hidden rounded-[12px] border border-[var(--c-eadcc7)] bg-white">
                                {activity.imageSrc ? (
                                  <img src={activity.imageSrc} alt={activity.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center px-1 text-center text-[9px] font-black text-[#8E8A81]">
                                    {activity.imageText}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-[15px] font-black text-[#1A1A1A]">{activity.title}</div>
                                <div className="mt-1 line-clamp-2 text-[12px] font-bold leading-relaxed text-[var(--c-7a6d5d)]">{getFeedEventCardCopy(activity)}</div>
                              </div>
                            </button>

                            <div className="flex items-center">
                              <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-black text-[var(--brand-text)]">+{activity.points} pts</span>
                            </div>

                            <div className="flex items-center text-[12px] font-bold text-[var(--c-5f5344)]">{activity.dateLabel}</div>

                            <div className="flex items-center">
                              <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", statusMeta.tone)}>{statusMeta.label}</span>
                            </div>

                            <div className="flex items-center gap-2 text-[12px] font-black text-[var(--c-5f5344)]">
                              <Users className="h-4 w-4 text-[#7a869a]" strokeWidth={2.1} />
                              <span>{participantCount}</span>
                            </div>

                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => handleNotifyFeedEvent(activity.id)}
                                className={cn(
                                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-black transition-colors",
                                  notifiedFeedEventId === activity.id
                                    ? "border-[#bcdcc7] bg-[#effcf4] text-[#1c7b51]"
                                    : "border-[#c9d2df] bg-[#f8fbff] text-[#52637a] hover:border-[#2f69a3] hover:text-[#2f69a3]"
                                )}
                                aria-label={`แจ้งเตือนผู้ใช้เกี่ยวกับ ${activity.title}`}
                                title="ส่งแจ้งเตือนถึงผู้ใช้"
                              >
                                <BellRing className="h-3.5 w-3.5" strokeWidth={2.1} />
                                {notifiedFeedEventId === activity.id ? "Sent" : "Notify"}
                              </button>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openFeedEditorModal(activity.id)}
                                className={cn(
                                  "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                                  active
                                    ? "border-[var(--c-5c3214)] bg-[var(--c-5c3214)] text-white"
                                    : "border-[#c9d2df] bg-[#f8fbff] text-[#52637a] hover:border-[var(--c-5c3214)] hover:text-[var(--c-5c3214)]"
                                )}
                                aria-label={`แก้ไข ${activity.title}`}
                                title="แก้ไขกิจกรรม"
                              >
                                <SquarePen className="h-4 w-4" strokeWidth={2.1} />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteFeedEvent(activity.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#edd1d1] bg-white text-[#c94f4f] transition-colors hover:bg-[#fff5f5]"
                                aria-label={`ลบ ${activity.title}`}
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                    {draftFeedEvents.map((activity) => {
                      const statusMeta = getFeedEventStatusMeta(activity.status);
                      const active = activity.id === editingFeedEventId;
                      const participantCount = feedEventParticipantCounts.get(activity.id) ?? 0;
                      const isDragging = draggingFeedEventId === activity.id;
                      const isDropTarget = dragOverFeedEventId === activity.id && draggingFeedEventId !== activity.id;

                      return (
                        <div
                          key={activity.id}
                          role="button"
                          tabIndex={0}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", activity.id);
                            handleFeedEventDragStart(activity.id);
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            if (draggingFeedEventId && draggingFeedEventId !== activity.id) {
                              event.dataTransfer.dropEffect = "move";
                              setDragOverFeedEventId(activity.id);
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleFeedEventDrop(activity.id);
                          }}
                          onDragEnd={handleFeedEventDragEnd}
                          onClick={() => setEditingFeedEventId(activity.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setEditingFeedEventId(activity.id);
                            }
                          }}
                          className={cn(
                            "rounded-[18px] border p-3 text-left transition-all",
                            active
                              ? "border-[var(--c-5c3214)] bg-[var(--c-fff6ea)] shadow-[0_10px_18px_rgba(62,36,13,0.08)]"
                              : "border-[var(--c-e3d0ae)] bg-white",
                            isDragging ? "scale-[0.99] opacity-60" : "",
                            isDropTarget ? "ring-2 ring-[var(--c-5c3214)]" : ""
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-[68px] w-[24px] flex-shrink-0 items-center justify-center text-[var(--c-5c3214)]">
                              <GripVertical className="h-4 w-4" strokeWidth={2.3} />
                            </div>
                            <div className="relative h-[68px] w-[68px] flex-shrink-0 overflow-hidden rounded-[14px] border border-[var(--c-eadcc7)] bg-white">
                              {activity.imageSrc ? (
                                <img src={activity.imageSrc} alt={activity.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-black text-[#8E8A81]">
                                  {activity.imageText}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-[14px] font-black text-[#1A1A1A]">{activity.title}</div>
                                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black", statusMeta.tone)}>{statusMeta.label}</span>
                              </div>
                              <div className="mt-1 line-clamp-2 text-[12px] font-bold leading-relaxed text-[var(--c-6e6254)]">{getFeedEventCardCopy(activity)}</div>
                              <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black">
                                <span className="text-[#8E8A81]">{activity.dateLabel}</span>
                                <span className="text-[#18b989]">+{activity.points} pts</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-[11px] font-black text-[#7a869a]">
                                  <Users className="h-3.5 w-3.5" strokeWidth={2.1} />
                                  {participantCount}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleNotifyFeedEvent(activity.id);
                                    }}
                                    className={cn(
                                      "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-[#f8fbff] transition-colors",
                                      notifiedFeedEventId === activity.id
                                        ? "border-[#bcdcc7] bg-[#effcf4] text-[#1c7b51]"
                                        : "border-[#c9d2df] text-[#52637a]"
                                    )}
                                    aria-label={`แจ้งเตือนผู้ใช้เกี่ยวกับ ${activity.title}`}
                                    title="ส่งแจ้งเตือนถึงผู้ใช้"
                                  >
                                    <BellRing className="h-3.5 w-3.5" strokeWidth={2.1} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openFeedEditorModal(activity.id);
                                    }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c9d2df] bg-[#f8fbff] text-[#52637a]"
                                    aria-label={`แก้ไข ${activity.title}`}
                                    title="แก้ไขกิจกรรม"
                                  >
                                    <SquarePen className="h-3.5 w-3.5" strokeWidth={2.1} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-[var(--c-eee2cb)] bg-[var(--c-fffaf1)] px-4 py-3 md:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[12px] font-black text-[#8E8A81]">{draftFeedEvents.length} activities</div>
                      {activitySaveLabel === "saved" ? (
                        <div className="rounded-full border border-[#bfd7c0] bg-[#f2fff2] px-3 py-1.5 text-[12px] font-black text-[#245336]">
                          บันทึกกิจกรรมเรียบร้อยแล้ว
                        </div>
                      ) : null}
                      {activitySaveLabel === "error" ? (
                        <div className="rounded-full border border-[#efc9c9] bg-[#fff7f7] px-3 py-1.5 text-[12px] font-black text-[#b74242]">
                          บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
            </SectionCard>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
            {editorMode === "bonus" ? (
              <>
            <Card className="rounded-[24px] border border-[var(--c-e3d0ae)] bg-[var(--c-fffdfa)] p-4 shadow-[0_8px_18px_rgba(62,36,13,0.04)] md:p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--c-fff1c9)] text-[var(--c-6d4716)]">
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

            <Card className="hidden overflow-hidden rounded-[24px] border border-[var(--c-c89a4f)] bg-[linear-gradient(135deg,var(--c-3f210d)_0%,var(--c-5b3214)_55%,var(--c-714413)_100%)] p-0 text-white shadow-[0_14px_28px_rgba(62,36,13,0.16)] xl:block">
              <div className="h-2 bg-[repeating-linear-gradient(-45deg,var(--c-ffb000),var(--c-ffb000)_10px,var(--c-15120e)_10px,var(--c-15120e)_20px)]" />
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-[var(--c-d89b09)] bg-[rgba(255,176,0,0.14)] px-3 py-1 text-[10px] font-black tracking-[0.12em] text-[var(--c-ffd96a)]">
                    ตัวอย่างบน FEED
                  </span>
                  <span className="text-[12px] font-black text-[var(--c-ffe7b0)]">{windowLabel}</span>
                </div>
                {!bannerVisible ? (
                  <div className="mb-3 rounded-[16px] border border-white/14 bg-white/10 px-3 py-2 text-[12px] font-black text-[var(--c-ffe7b0)]">
                    Banner นี้ถูกตั้งค่าให้ซ่อนบนหน้า Feed
                  </div>
                ) : null}
                <h3 className="text-[24px] font-black leading-tight text-white">{headline || autoHeadline}</h3>
                <p className="mt-2 text-[13px] font-bold leading-relaxed text-[var(--c-f8ead7)]">{supportingText || autoSupportingText}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-black text-[var(--c-ffe7b0)]">
                    โบนัส {bonusPreview}
                  </span>
                  {selectedActions.map((action) => (
                    <span key={action.id} className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-black text-[var(--c-ffe7b0)]">
                      {action.label}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
              </>
            ) : null}

          </div>
        </div>
      </div>

      <Dialog open={feedModalOpen && !!feedModalDraft} onOpenChange={(open) => !open && closeFeedEditorModal()}>
        <DialogContent showCloseButton={false} aria-label={feedModalTitle} className="max-w-[980px] border-0 bg-transparent p-0 shadow-none sm:max-w-[980px]">
          {feedModalDraft ? (
          <AppModalPanel
            className="max-h-[94vh] max-w-[980px] animate-[scaleUp_0.22s_cubic-bezier(0.175,0.885,0.32,1.12)_both]"
          >
            <AppModalHeader>
              <div>
                <div className="text-[28px] font-black text-[var(--c-2b2119)]">{feedModalTitle}</div>
                <div className="text-[14px] font-bold text-[#8E8A81]">{feedModalDescription}</div>
              </div>
              <AppModalCloseButton onClick={closeFeedEditorModal} />
            </AppModalHeader>

            <AppModalBody className="overflow-y-auto">
              <div className="rounded-[22px] border border-[var(--c-eadcc7)] bg-[var(--c-fffaf2)] p-4">
                <div className="flex flex-col gap-3">
                  <div className="text-[15px] font-black text-[var(--c-2d241b)]">ข้อมูลหลักของกิจกรรม</div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                    <div className="flex flex-col gap-3">
                      <Label className="text-[13px] font-black text-[var(--c-5c3214)]">หัวข้อกิจกรรม</Label>
                      <Input
                        value={feedModalDraft.title}
                        onChange={(event) => patchFeedModalDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="เช่น เดินสำรวจความปลอดภัย"
                        className="h-11 rounded-[14px] border-[var(--c-d7c5a7)] bg-white text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                      />

                      <div className="flex flex-col gap-2">
                        <Label className="text-[13px] font-black text-[var(--c-5c3214)]">รายละเอียดกิจกรรม</Label>
                        <Textarea
                          value={feedModalDraft.details}
                          onChange={(event) => patchFeedModalDraft((current) => ({ ...current, details: event.target.value }))}
                          placeholder="อธิบายวัตถุประสงค์ เงื่อนไข วิธีเข้าร่วม และสิ่งที่ผู้ใช้ต้องส่งให้ครบในส่วนนี้"
                          className="min-h-[140px] rounded-[18px] border-[var(--c-d7c5a7)] bg-white text-[14px] font-bold leading-relaxed text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="rounded-[20px] border border-[var(--c-eadcc7)] bg-white p-4">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[13px] font-black text-[var(--c-5c3214)]">คะแนนกิจกรรม</Label>
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={`${feedModalDraft.points}`}
                            onChange={(event) =>
                              patchFeedModalDraft((current) => ({
                                ...current,
                                points: Number(event.target.value) || 0,
                              }))
                            }
                            className="h-11 rounded-[14px] border-[var(--c-d7c5a7)] bg-white text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                          />
                          <div className="text-[12px] font-bold leading-relaxed text-[#8E8A81]">คะแนนหลักของกิจกรรม</div>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[var(--c-eadcc7)] bg-white p-4">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[13px] font-black text-[var(--c-5c3214)]">ข้อความรองบนการ์ด</Label>
                          <Input
                            value={feedModalDraft.subtitle}
                            onChange={(event) => patchFeedModalDraft((current) => ({ ...current, subtitle: event.target.value }))}
                            placeholder="เช่น รายละเอียดและการส่งกิจกรรม"
                            className="h-11 rounded-[14px] border-[var(--c-d7c5a7)] bg-white text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                          />
                          <div className="text-[12px] font-bold leading-relaxed text-[#8E8A81]">ข้อความรองสั้น ๆ บนการ์ดหรือ popup</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)_minmax(180px,0.6fr)]">
                    <div className="flex flex-col gap-3 rounded-[20px] border border-[var(--c-eadcc7)] bg-white p-4">
                      <Label className="text-[13px] font-black text-[var(--c-5c3214)]">ช่วงเวลากิจกรรม</Label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-black text-[var(--c-7a6d5d)]">วันที่เริ่ม</Label>
                          <Input
                            type="date"
                            value={feedModalDraft.startDate || ""}
                            onChange={(event) =>
                              patchFeedModalDraft((current) => ({
                                ...current,
                                startDate: event.target.value,
                                endDate:
                                  current.endDate && event.target.value && current.endDate < event.target.value
                                    ? event.target.value
                                    : current.endDate,
                              }))
                            }
                            className="h-11 rounded-[14px] border-[var(--c-d7c5a7)] bg-white text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-black text-[var(--c-7a6d5d)]">วันที่สิ้นสุด</Label>
                          <Input
                            type="date"
                            min={feedModalDraft.startDate || undefined}
                            value={feedModalDraft.endDate || ""}
                            onChange={(event) =>
                              patchFeedModalDraft((current) => ({
                                ...current,
                                endDate: event.target.value,
                              }))
                            }
                            className="h-11 rounded-[14px] border-[var(--c-d7c5a7)] bg-white text-[14px] font-bold text-[#1A1A1A] focus-visible:border-[var(--c-5c3214)] focus-visible:ring-0"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[7, 14, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            disabled={!feedModalDraft.startDate}
                            onClick={() =>
                              patchFeedModalDraft((current) => ({
                                ...current,
                                endDate: addDaysToDateString(current.startDate || "", days - 1),
                              }))
                            }
                            className="rounded-full border border-[var(--c-d7c5a7)] bg-white px-3 py-1.5 text-[12px] font-black text-[var(--c-5c3214)] transition-colors hover:bg-[var(--c-fff2d8)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {days} วัน
                          </button>
                        ))}
                      </div>
                      <div className={cn("text-[12px] font-bold leading-relaxed", feedModalDurationMeta.tone)}>
                        {feedModalDurationMeta.label}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[var(--c-eadcc7)] bg-white p-4">
                      <div className="flex flex-col gap-2">
                        <Label className="text-[13px] font-black text-[var(--c-5c3214)]">สถานะ</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(["open", "closed"] as const).map((statusOption) => {
                            const meta = getFeedEventStatusMeta(statusOption);
                            return (
                              <button
                                key={statusOption}
                                type="button"
                                onClick={() => patchFeedModalDraft((current) => ({ ...current, status: statusOption }))}
                                className={cn(
                                  "min-h-[52px] rounded-[14px] border px-3 py-2 text-[12px] font-black leading-tight transition-all",
                                  feedModalDraft.status === statusOption ? meta.tone : "border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] text-[var(--c-5c3214)]"
                                )}
                              >
                                {meta.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[12px] font-bold leading-relaxed text-[#8E8A81]">เปิดหรือปิดรับกิจกรรม</div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[var(--c-eadcc7)] bg-white p-4">
                      <div className="flex flex-col gap-2">
                        <Label className="text-[13px] font-black text-[var(--c-5c3214)]">การแสดงผล</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => patchFeedModalDraft((current) => ({ ...current, published: true }))}
                            className={cn(
                              "min-h-[52px] rounded-[14px] border px-3 py-2 text-[12px] font-black leading-tight transition-all",
                              feedModalDraft.published ? "border-[#245336] bg-[#245336] text-white" : "border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] text-[var(--c-5c3214)]"
                            )}
                          >
                            แสดง
                          </button>
                          <button
                            type="button"
                            onClick={() => patchFeedModalDraft((current) => ({ ...current, published: false }))}
                            className={cn(
                              "min-h-[52px] rounded-[14px] border px-3 py-2 text-[12px] font-black leading-tight transition-all",
                              !feedModalDraft.published ? "border-[#7d3434] bg-[#7d3434] text-white" : "border-[var(--c-d7c5a7)] bg-[var(--c-fffcf5)] text-[var(--c-5c3214)]"
                            )}
                          >
                            ซ่อน
                          </button>
                        </div>
                        <div className="text-[12px] font-bold leading-relaxed text-[#8E8A81]">เลือกให้แสดงหรือซ่อนบน Feed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-[var(--c-eadcc7)] bg-[var(--c-fffaf2)] p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-black text-[var(--c-2d241b)]">การแสดงผลบนการ์ด</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-black text-[var(--c-5c3214)]">รูปกิจกรรม</Label>
                      <div className="overflow-hidden rounded-[20px] border border-[var(--c-eadcc7)] bg-white">
                        <div className="relative min-h-[220px] overflow-hidden bg-[var(--c-faf3e3)] lg:min-h-[260px]">
                          {feedModalDraft.imageSrc ? (
                            <img src={feedModalDraft.imageSrc} alt={feedModalDraft.title} className="absolute inset-0 block h-full w-full object-cover" />
                          ) : (
                            <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-[16px] font-black text-[#8E8A81] lg:min-h-[260px]">
                              {feedModalDraft.imageText}
                            </div>
                          )}
                        </div>
                      </div>

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          void handleFeedModalImageChange(event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => imageInputRef.current?.click()}
                          className="h-10 rounded-[14px] border-[var(--c-d7c5a7)] bg-white text-[12px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff4df)]"
                        >
                          <FileImage className="mr-1 h-4 w-4" />
                          เปลี่ยนรูป
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => patchFeedModalDraft((current) => ({ ...current, imageSrc: null }))}
                          className="h-10 rounded-[14px] border-[var(--c-d7c5a7)] bg-white text-[12px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff4df)]"
                        >
                          ล้างรูป
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AppModalBody>

            <AppModalFooter className="bg-[var(--c-fffaf2)]">
              <Button
                type="button"
                onClick={handleApplyFeedModal}
                disabled={isSavingFeedEvents}
                className="h-10 rounded-[14px] bg-[var(--brand-text)] px-4 text-[13px] font-black text-white shadow-[0_8px_18px_var(--brand-shadow)] hover:bg-[var(--brand-nav)]"
              >
                {isSavingFeedEvents ? "กำลังบันทึก..." : feedModalSubmitLabel}
              </Button>
            </AppModalFooter>
          </AppModalPanel>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDeleteFeedEvent} onOpenChange={(open) => !open && closeDeleteFeedEventPrompt()}>
        <DialogContent showCloseButton={false} aria-label="ยืนยันการลบกิจกรรม" className="z-[125] max-w-[440px] border-0 bg-transparent p-0 shadow-none sm:max-w-[440px]">
          {pendingDeleteFeedEvent ? (
          <AppModalPanel
            tone="danger"
            className="max-w-[440px] animate-[scaleUp_0.22s_cubic-bezier(0.175,0.885,0.32,1.12)_both]"
          >
            <AppModalHeader>
              <div>
                <div className="text-[24px] font-black text-[#7d3434]">ยืนยันก่อนลบ</div>
                <div className="mt-1 text-[13px] font-bold leading-relaxed text-[#8E8A81]">
                  กิจกรรมนี้จะถูกลบออกจากรายการบน Feed ทันทีเมื่อกดยืนยัน
                </div>
              </div>
              <AppModalCloseButton onClick={closeDeleteFeedEventPrompt} />
            </AppModalHeader>

            <AppModalBody>
              <div className="rounded-[20px] border border-[#f0d8d8] bg-[#fff7f7] px-4 py-4">
                <div className="text-[12px] font-black uppercase tracking-[0.12em] text-[#c05a5a]">Delete Activity</div>
                <div className="mt-2 text-[18px] font-black text-[#2b2119]">{pendingDeleteFeedEvent.title}</div>
                <div className="mt-2 text-[13px] font-bold leading-relaxed text-[#7b6d63]">
                  หากลบแล้วจะต้องสร้างกิจกรรมใหม่หรือกู้คืนจากข้อมูลเดิมด้วยตนเอง
                </div>
              </div>
            </AppModalBody>

            <AppModalFooter className="bg-[var(--c-fffaf2)]">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteFeedEventPrompt}
                className="h-10 rounded-[14px] border-[var(--c-d7c5a7)] bg-white px-4 text-[13px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff4df)]"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteFeedEvent}
                disabled={isSavingFeedEvents}
                className="h-10 rounded-[14px] bg-[#b74242] px-4 text-[13px] font-black text-white hover:bg-[#a33636]"
              >
                {isSavingFeedEvents ? "กำลังลบ..." : "ลบกิจกรรมนี้"}
              </Button>
            </AppModalFooter>
          </AppModalPanel>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
