"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarOff,
  Calendar,
  ChevronDown,
  Check,
  CheckCircle2,
  CircleSlash,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Info,
  ListChecks,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import {
  AppDialogBody,
  AppDialogContent,
  AppDialogDescription,
  AppDialogSectionFooter,
  AppDialogSectionHeader,
  AppDialogTitle,
} from "@/components/ui/app-dialog";
import {
  Dialog,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type AwarenessHoliday, useAppActions, useAppState } from "@/providers/app-providers";
import {
  createDefaultAwarenessQuestions,
  type SafetyAwarenessQuestion,
} from "@/lib/safety-awareness";

type EditorState = {
  mode: "create" | "edit";
  id: string;
  category: string;
  text: string;
  answer: boolean;
  note: string;
  enabled: boolean;
};

const EMPTY_EDITOR: EditorState = {
  mode: "create",
  id: "",
  category: "",
  text: "",
  answer: true,
  note: "",
  enabled: true,
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[18px] border border-[#B9E0FF] bg-white p-4 md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EAF6FF] text-[#0B82F0]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-black text-[#0B2F6B]">{title}</h2>
          <p className="text-[12.5px] font-bold text-[#55739B]">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}

export default function AdminAwarenessPage() {
  const { awarenessQuestions, awarenessHolidays, awarenessEnabled, awarenessActiveStartTime, awarenessActiveEndTime } = useAppState();
  const { updateAwarenessQuestions, updateAwarenessHolidays, updateAwarenessEnabled, updateAwarenessTimeWindow, showNotification } = useAppActions();

  const [startHour, startMinute] = (awarenessActiveStartTime || "08:00").split(":");
  const [endHour, endMinute] = (awarenessActiveEndTime || "17:00").split(":");

  const [tempStartHour, setTempStartHour] = useState(startHour);
  const [tempStartMinute, setTempStartMinute] = useState(startMinute);
  const [tempEndHour, setTempEndHour] = useState(endHour);
  const [tempEndMinute, setTempEndMinute] = useState(endMinute);

  const [savingTime, setSavingTime] = useState(false);

  useEffect(() => {
    const [sh, sm] = (awarenessActiveStartTime || "08:00").split(":");
    const [eh, em] = (awarenessActiveEndTime || "17:00").split(":");
    setTempStartHour(sh);
    setTempStartMinute(sm);
    setTempEndHour(eh);
    setTempEndMinute(em);
  }, [awarenessActiveStartTime, awarenessActiveEndTime]);

  const handleSaveTime = async () => {
    setSavingTime(true);
    const newStart = `${tempStartHour}:${tempStartMinute}`;
    const newEnd = `${tempEndHour}:${tempEndMinute}`;
    const ok = await updateAwarenessTimeWindow(newStart, newEnd);
    setSavingTime(false);
    if (ok) {
      showNotification({
        type: "success",
        message: `บันทึกเวลาสำเร็จ: เปลี่ยนเวลาขึ้น-ลงคำถามเป็น ${newStart} น. ถึง ${newEnd} น. เรียบร้อยแล้ว`,
      });
    }
  };

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<SafetyAwarenessQuestion | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importReplace, setImportReplace] = useState(false);
  const [importQuestions, setImportQuestions] = useState<SafetyAwarenessQuestion[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayYearFilter, setHolidayYearFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [holidayYearFilter, awarenessHolidays.length]);



  const categories = useMemo(() => {
    const set = new Set<string>();
    awarenessQuestions.forEach((q) => set.add(q.category));
    return Array.from(set);
  }, [awarenessQuestions]);

  const enabledCount = awarenessQuestions.filter((q) => q.enabled).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return awarenessQuestions.filter((q) => {
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      if (!term) return true;
      return (
        q.text.toLowerCase().includes(term) ||
        q.category.toLowerCase().includes(term) ||
        (q.note ?? "").toLowerCase().includes(term)
      );
    });
  }, [awarenessQuestions, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, SafetyAwarenessQuestion[]>();
    filtered.forEach((q) => {
      const list = map.get(q.category) ?? [];
      list.push(q);
      map.set(q.category, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const sortedHolidays = useMemo(
    () => [...awarenessHolidays].sort((a, b) => a.date.localeCompare(b.date)),
    [awarenessHolidays],
  );

  const holidayYears = useMemo(
    () => Array.from(new Set(sortedHolidays.map((holiday) => holiday.date.slice(0, 4)))).sort((a, b) => b.localeCompare(a)),
    [sortedHolidays],
  );

  const visibleHolidays = useMemo(
    () => sortedHolidays.filter((holiday) => holidayYearFilter === "all" || holiday.date.startsWith(holidayYearFilter)),
    [holidayYearFilter, sortedHolidays],
  );

  const paginatedHolidays = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return visibleHolidays.slice(startIndex, startIndex + pageSize);
  }, [visibleHolidays, currentPage, pageSize]);

  const totalPages = Math.ceil(visibleHolidays.length / pageSize) || 1;

  const toggleEnabled = (id: string) => {
    updateAwarenessQuestions(
      awarenessQuestions.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q)),
    );
  };

  const deleteQuestion = (id: string) => {
    updateAwarenessQuestions(awarenessQuestions.filter((q) => q.id !== id));
  };

  const confirmDeleteQuestion = () => {
    if (!pendingDeleteQuestion) return;
    deleteQuestion(pendingDeleteQuestion.id);
    setPendingDeleteQuestion(null);
  };

  const toggleCategoryCollapsed = (category: string) => {
    setCollapsedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  const saveEditor = () => {
    if (!editor) return;
    const text = editor.text.trim();
    if (!text) return;
    const payload: SafetyAwarenessQuestion = {
      id: editor.mode === "create" ? `sa-custom-${Date.now()}` : editor.id,
      category: editor.category.trim() || "ทั่วไป",
      text,
      answer: editor.answer,
      note: editor.note.trim() || undefined,
      enabled: editor.enabled,
    };
    if (editor.mode === "create") {
      updateAwarenessQuestions([...awarenessQuestions, payload]);
    } else {
      updateAwarenessQuestions(
        awarenessQuestions.map((q) => (q.id === editor.id ? payload : q)),
      );
    }
    setEditor(null);
  };

  const runImport = () => {
    if (importQuestions.length === 0) return;
    updateAwarenessQuestions(importReplace ? importQuestions : [...awarenessQuestions, ...importQuestions]);
    setImportQuestions([]);
    setImportErrors([]);
    setImportReplace(false);
    setImportOpen(false);
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const questions = XLSX.utils.aoa_to_sheet([
      ["category", "question", "answer", "explanation", "enabled"],
      ["กฎจราจรและการควบคุมความเร็ว", "เมื่อเลี้ยวเข้าทางร่วม ทางแยก หรือโค้งหักศอก ต้องใช้ความเร็วไม่เกิน 20 กม./ชม.", "ถูก", "เป็นข้อกำหนดความเร็วในการเลี้ยว", "ใช่"],
      ["การเตรียมความพร้อมและ KYT", "หากหัวหน้าโรงงานไม่ว่าง จบส. ไม่จำเป็นต้องทำ KYT", "ผิด", "ต้องทำ KYT ทุกครั้งก่อนเริ่มงาน", "ใช่"],
    ]);
    const guide = XLSX.utils.aoa_to_sheet([
      ["แนวทางการกรอกแบบฟอร์มคำถาม Safety Awareness"],
      ["คอลัมน์", "วิธีกรอก", "บังคับ"],
      ["category", "ชื่อหมวดหมู่ของคำถาม", "ใช่"],
      ["question", "ข้อความคำถามแบบถูก/ผิด 1 ข้อต่อ 1 แถว", "ใช่"],
      ["answer", "กรอกเฉพาะ ถูก หรือ ผิด", "ใช่"],
      ["explanation", "คำอธิบายเฉลยหลังผู้ใช้ตอบ", "ไม่บังคับ"],
      ["enabled", "กรอก ใช่ เพื่อเปิดใช้งาน หรือ ไม่ เพื่อปิดใช้งาน", "ใช่"],
      [],
      ["ข้อควรระวัง"],
      ["ห้ามเปลี่ยนชื่อหัวคอลัมน์ในชีต Questions"],
      ["ไม่ควรเว้น category, question, answer หรือ enabled"],
      ["ระบบจะข้ามแถวที่ว่าง และแจ้งแถวที่ข้อมูลไม่ถูกต้องก่อนนำเข้า"],
    ]);
    questions["!cols"] = [{ wch: 34 }, { wch: 80 }, { wch: 12 }, { wch: 60 }, { wch: 12 }];
    guide["!cols"] = [{ wch: 34 }, { wch: 80 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(workbook, questions, "Questions");
    XLSX.utils.book_append_sheet(workbook, guide, "Guide");
    XLSX.writeFile(workbook, "Safety-Awareness-Question-Template.xlsx");
  };

  const readXlsx = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets.Questions ?? workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const parsed: SafetyAwarenessQuestion[] = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const category = String(row.category ?? "").trim();
        const text = String(row.question ?? "").trim();
        const answerText = String(row.answer ?? "").trim().toLowerCase();
        const enabledText = String(row.enabled ?? "").trim().toLowerCase();
        const note = String(row.explanation ?? "").trim();
        const answer = answerText === "ถูก" ? true : answerText === "ผิด" ? false : null;
        const enabled = ["ใช่", "yes", "true", "1"].includes(enabledText)
          ? true
          : ["ไม่", "ไม่ใช่", "no", "false", "0"].includes(enabledText)
            ? false
            : null;

        if (!category && !text && !answerText && !enabledText) return;
        if (!category || !text || answer === null || enabled === null) {
          errors.push(`แถว ${rowNumber}: ต้องกรอก category, question, answer (ถูก/ผิด) และ enabled (ใช่/ไม่) ให้ถูกต้อง`);
          return;
        }
        parsed.push({
          id: `sa-xlsx-${Date.now().toString(36)}-${index + 1}`,
          category,
          text,
          answer,
          note: note || undefined,
          enabled,
        });
      });

      setImportQuestions(parsed);
      setImportErrors(errors);
    } catch {
      setImportQuestions([]);
      setImportErrors(["ไม่สามารถอ่านไฟล์ได้ กรุณาใช้ไฟล์ .xlsx จากแบบฟอร์มตัวอย่าง"]);
    }
  };

  const addHoliday = () => {
    if (!holidayDate || !holidayName.trim()) return;
    const next: AwarenessHoliday[] = [
      ...awarenessHolidays.filter((holiday) => holiday.date !== holidayDate),
      { date: holidayDate, name: holidayName.trim() },
    ];
    updateAwarenessHolidays(next);
    setHolidayDate("");
    setHolidayName("");
  };

  const resetToDefault = () => {
    updateAwarenessQuestions(createDefaultAwarenessQuestions());
  };

  return (
    <div className="page-shell-wide bg-[var(--background)] pt-2.5 pb-8 font-sarabun">
      <SafetyCultureHero
        eyebrow="SAFETY CULTURE ADMIN"
        title={
          <>
            Settings <span className="text-[var(--c-ffb000)]">Safety Awareness</span>
          </>
        }
        description="จัดการวันทำงานที่นับ KPI และคลังคำถาม Safety Awareness — เพิ่ม/แก้/ลบ เปิด-ปิด และนำเข้าจาก XLSX"
        variant="community"
        backgroundImage="/images/heroes/Home01.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
        mascotSrc="/images/mascots/wangjai/7.png"
        mascotAction="flashlight"
      />

      {/* Stat strip */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="คำถามทั้งหมด" value={awarenessQuestions.length} icon={<ListChecks className="h-5 w-5" />} />
        <StatCard label="เปิดใช้งาน" value={enabledCount} icon={<CheckCircle2 className="h-5 w-5" />} tone="ok" />
        <StatCard label="ปิดใช้งาน" value={awarenessQuestions.length - enabledCount} icon={<CircleSlash className="h-5 w-5" />} tone="muted" />
        <StatCard label="หมวดหมู่" value={categories.length} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      {/* Settings Card (Global Status & Active Hours) */}
      <Card className="mt-3 rounded-[18px] border border-[#B9E0FF] bg-white p-4 md:p-5 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2 items-center divide-y md:divide-y-0 md:divide-x divide-[#D7EAFE]">
          {/* Global Toggle */}
          <div className="pb-4 md:pb-0 md:pr-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                awarenessEnabled ? "bg-[#EAF6FF] text-[#0B82F0] shadow-sm shadow-blue-50" : "bg-[#F1F5F9] text-[#94A3B8]"
              )}>
                <ShieldCheck className="h-5.5 w-5.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[14px] font-black text-[#0B2F6B]">สถานะระบบ Safety Awareness</h3>
                <p className="text-[11.5px] font-bold text-[#55739B] mt-0.5">เปิด/ปิดการแสดงหน้าต่างคำถามประจำวันแก่ผู้ใช้ทั่วไป</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn("text-[12.5px] font-black transition-colors hidden sm:inline", awarenessEnabled ? "text-[#0B82F0]" : "text-[#94A3B8]")}>
                {awarenessEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await updateAwarenessEnabled(!awarenessEnabled);
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  awarenessEnabled ? "bg-[#0B82F0]" : "bg-[#cbd5e1]"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    awarenessEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Daily Time Window Selector */}
          <div className="pt-4 md:pt-0 md:pl-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Start Time */}
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#55739B]">เวลาเริ่มต้น</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center h-10 rounded-xl border border-[#CFE3F4] bg-white px-2.5 min-w-[90px] focus-within:border-[#0B82F0] focus-within:ring-1 focus-within:ring-[#0B82F0]">
                    <Clock className="h-4 w-4 text-[#0B82F0] mr-2" />
                    <div className="h-5 w-px bg-[#CFE3F4] mr-2" />
                    <select
                      disabled={!awarenessEnabled}
                      value={tempStartHour}
                      onChange={(e) => setTempStartHour(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-[14px] font-black text-[#0B2F6B] appearance-none pr-4 cursor-pointer"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-[#55739B] pointer-events-none" />
                  </div>

                  <div className="relative flex items-center h-10 rounded-xl border border-[#CFE3F4] bg-white px-2.5 min-w-[70px] focus-within:border-[#0B82F0] focus-within:ring-1 focus-within:ring-[#0B82F0]">
                    <select
                      disabled={!awarenessEnabled}
                      value={tempStartMinute}
                      onChange={(e) => setTempStartMinute(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-[14px] font-black text-[#0B2F6B] appearance-none pr-4 cursor-pointer"
                    >
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-[#55739B] pointer-events-none" />
                  </div>
                  <span className="text-[13px] font-black text-[#0B2F6B]">น.</span>
                </div>
              </div>

              <span className="text-[13px] font-black text-[#55739B] mt-5 self-center">ถึง</span>

              {/* End Time */}
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#55739B]">เวลาสิ้นสุด</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center h-10 rounded-xl border border-[#CFE3F4] bg-white px-2.5 min-w-[90px] focus-within:border-[#0B82F0] focus-within:ring-1 focus-within:ring-[#0B82F0]">
                    <Clock className="h-4 w-4 text-[#0B82F0] mr-2" />
                    <div className="h-5 w-px bg-[#CFE3F4] mr-2" />
                    <select
                      disabled={!awarenessEnabled}
                      value={tempEndHour}
                      onChange={(e) => setTempEndHour(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-[14px] font-black text-[#0B2F6B] appearance-none pr-4 cursor-pointer"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-[#55739B] pointer-events-none" />
                  </div>

                  <div className="relative flex items-center h-10 rounded-xl border border-[#CFE3F4] bg-white px-2.5 min-w-[70px] focus-within:border-[#0B82F0] focus-within:ring-1 focus-within:ring-[#0B82F0]">
                    <select
                      disabled={!awarenessEnabled}
                      value={tempEndMinute}
                      onChange={(e) => setTempEndMinute(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-[14px] font-black text-[#0B2F6B] appearance-none pr-4 cursor-pointer"
                    >
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-[#55739B] pointer-events-none" />
                  </div>
                  <span className="text-[13px] font-black text-[#0B2F6B]">น.</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveTime}
              disabled={!awarenessEnabled || savingTime}
              className="h-10 px-5 rounded-full bg-[#0B82F0] text-white hover:bg-[#0973d6] font-black text-[13.5px] shadow-sm flex items-center gap-2 cursor-pointer mt-5 lg:mt-5 self-end lg:self-center transition-colors"
            >
              <Check className="h-4.5 w-4.5" strokeWidth={3} />
              {savingTime ? "กำลังบันทึก..." : "บันทึกเวลา"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <SectionCard
          title="วันที่ไม่นับคะแนน Safety Awareness KPI"
          description="วันเสาร์และวันอาทิตย์ไม่นับอัตโนมัติ เพิ่มวันหยุดบริษัทหรือวันหยุดพิเศษที่ตรงกับวันทำงานได้ที่นี่ ระบบจะหักคะแนน Awareness ของวันที่ถูกเพิ่มย้อนหลังถ้ามีคนทำไว้แล้ว"
          icon={<CalendarOff className="h-6 w-6" strokeWidth={2.2} />}
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-xl border border-[#CFE3F4] bg-[#F1F8FE] px-3.5 py-3 text-[12.5px] font-bold text-[#24567F]">
              <div className="flex items-center gap-2 font-black">
                <Info className="h-4 w-4 flex-shrink-0" />
                ระบบไม่นับวันเสาร์และวันอาทิตย์ทุกสัปดาห์
              </div>
              <p className="mt-1 pl-6">
                วันที่เพิ่มด้านล่างจะไม่แสดงป็อปอัพคำถาม และไม่ถูกนำไปคิดเปอร์เซ็นต์ KPI บนหน้า Home
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#D7EAFE] bg-[#F8FCFF] p-3 text-center">
              <div>
                <div className="text-[22px] font-black leading-none text-[#0B82F0]">{awarenessHolidays.length}</div>
                <div className="mt-1 text-[10.5px] font-black text-[#55739B]">วันหยุดเพิ่มเอง</div>
              </div>
              <div>
                <div className="text-[22px] font-black leading-none text-[#0B2F6B]">{holidayYears.length}</div>
                <div className="mt-1 text-[10.5px] font-black text-[#55739B]">ปีที่มีข้อมูล</div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-[190px_1fr_auto]">
            <Input
              type="date"
              value={holidayDate}
              onChange={(event) => setHolidayDate(event.target.value)}
              className="h-10 rounded-xl border-[#B9E0FF] bg-white text-[13px] font-bold"
            />
            <Input
              value={holidayName}
              onChange={(event) => setHolidayName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addHoliday()}
              placeholder="ชื่อวันหยุด เช่น วันหยุดบริษัทประจำปี"
              className="h-10 rounded-xl border-[#B9E0FF] bg-white text-[13px] font-bold"
            />
            <Button
              onClick={addHoliday}
              disabled={!holidayDate || !holidayName.trim()}
              className="h-10 rounded-full bg-[#0B82F0] px-4 text-[12.5px] font-black text-white hover:bg-[#0973d6] disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" /> เพิ่มวันไม่นับคะแนน
            </Button>
          </div>

          <div className="mt-3 rounded-2xl border border-[#D7EAFE] bg-[#F8FCFF] p-3">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="text-[14px] font-black text-[#0B2F6B]">รายการวันที่ไม่นับคะแนนเพิ่มเติม</div>
                <div className="rounded-full bg-[#E5F2FF] px-2 py-0.5 text-[11px] font-bold text-[#0B82F0]">
                  {visibleHolidays.length} รายการ
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#55739B]">กรองตามปี</span>
                <Combobox
                  value={holidayYearFilter}
                  onValueChange={setHolidayYearFilter}
                  aria-label="กรองปีวันหยุด"
                  searchPlaceholder="ค้นหาปี"
                  searchable={false}
                  preserveScrollOnOpen
                  className="h-9 border-[#B9E0FF] bg-white text-[12.5px] font-bold text-[#0B2F6B] sm:w-[130px] rounded-xl"
                  options={[
                    { value: "all", label: "ทุกปี" },
                    ...holidayYears.map((year) => ({ value: year, label: String(Number(year) + 543) })),
                  ]}
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#B9E0FF] bg-white text-[#0B82F0]">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
            
            {awarenessHolidays.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#B9E0FF] bg-white px-4 py-4 text-center text-[12.5px] font-bold text-[#55739B]">
                ยังไม่มีวันหยุดเพิ่มเติม ระบบไม่นับเฉพาะวันเสาร์และวันอาทิตย์
              </p>
            ) : visibleHolidays.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#B9E0FF] bg-white px-4 py-4 text-center text-[12.5px] font-bold text-[#55739B]">
                ไม่พบรายการในปีที่เลือก
              </p>
            ) : (
              <div>
                <div className="overflow-hidden border border-[#D7EAFE] rounded-xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#D7EAFE] bg-[#F8FCFF] text-[12px] font-black text-[#55739B]">
                        <th className="px-4 py-3">วันที่</th>
                        <th className="px-4 py-3">ชื่อวันหยุด</th>
                        <th className="px-4 py-3">เพิ่มโดย</th>
                        <th className="px-4 py-3">ปี</th>
                        <th className="px-4 py-3 text-center w-28">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D7EAFE]">
                      {paginatedHolidays.map((holiday) => {
                        const [y, m, d] = holiday.date.split("-");
                        const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                        const monthsFull = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
                        const dayNum = Number(d);
                        const monthShort = monthsShort[Number(m) - 1] || "";
                        const monthFull = monthsFull[Number(m) - 1] || "";
                        const thaiYear = Number(y) + 543;
                        
                        const daysOfWeek = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
                        const dayOfWeek = daysOfWeek[new Date(holiday.date).getDay()];

                        return (
                          <tr key={holiday.date} className="hover:bg-[#F8FCFF] transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[#F0F7FF] text-[#0A82F0] border border-[#B9E0FF] flex-shrink-0">
                                  <span className="text-[16px] font-black leading-none">{dayNum}</span>
                                  <span className="text-[10px] font-bold mt-0.5">{monthShort}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-black text-[#0B2F6B]">
                                    {dayNum} {monthFull} {thaiYear}
                                  </span>
                                  <span className="text-[11.5px] font-bold text-[#55739B] mt-0.5">
                                    {dayOfWeek}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-[13.5px] font-black text-[#0B2F6B] truncate max-w-[220px]">
                              {holiday.name}
                            </td>
                            <td className="px-4 py-2.5 text-[13px] font-bold text-[#0B2F6B]">
                              Admin
                            </td>
                            <td className="px-4 py-2.5 text-[13px] font-bold text-[#0B2F6B]">
                              {thaiYear}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  title="แก้ไขวันไม่นับ"
                                  onClick={() => {
                                    const newName = prompt("แก้ไขชื่อวันหยุด", holiday.name);
                                    if (newName && newName.trim() && newName.trim() !== holiday.name) {
                                      updateAwarenessHolidays(
                                        awarenessHolidays.map((item) =>
                                          item.date === holiday.date ? { ...item, name: newName.trim() } : item
                                        )
                                      );
                                    }
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#CFE3F4] bg-white text-[#0B82F0] hover:bg-[#F0F7FF] transition-colors cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  title="ลบวันไม่นับ"
                                  onClick={() =>
                                    updateAwarenessHolidays(
                                      awarenessHolidays.filter((item) => item.date !== holiday.date),
                                    )
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#ECCDC6] bg-white text-[#B3271A] hover:bg-[#FBE3DF] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-1">
                  <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#55739B]">
                    <span>แสดง</span>
                    <div className="relative flex items-center h-8 rounded-xl border border-[#CFE3F4] bg-white px-2 pr-6 focus-within:border-[#0B82F0] focus-within:ring-1 focus-within:ring-[#0B82F0]">
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-transparent border-none outline-none text-[12.5px] font-black text-[#0B2F6B] appearance-none cursor-pointer w-10"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 h-3.5 w-3.5 text-[#55739B] pointer-events-none" />
                    </div>
                    <span>รายการต่อหน้า</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 justify-between sm:justify-end">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#CFE3F4] bg-white text-[#55739B] hover:bg-[#F8FCFF] disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                      >
                        {"<<"}
                      </button>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#CFE3F4] bg-white text-[#55739B] hover:bg-[#F8FCFF] disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                      >
                        {"<"}
                      </button>

                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B82F0] text-white font-black text-[13px] shadow-sm shadow-blue-100">
                        {currentPage}
                      </div>

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#CFE3F4] bg-white text-[#55739B] hover:bg-[#F8FCFF] disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                      >
                        {">"}
                      </button>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#CFE3F4] bg-white text-[#55739B] hover:bg-[#F8FCFF] disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                      >
                        {">>"}
                      </button>
                    </div>

                    <span className="text-[12.5px] font-bold text-[#55739B]">
                      {currentPage} จาก {totalPages} หน้า
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="คลังคำถาม"
          description="ป็อปอัพจะสุ่ม 3 ข้อจากคำถามที่ 'เปิดใช้งาน' เท่านั้น"
          icon={<ListChecks className="h-6 w-6" strokeWidth={2.2} />}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setImportOpen(true)}
                variant="outline"
                className="h-9 rounded-xl border-[#B9E0FF] bg-[#F5FAFF] px-3.5 text-[12.5px] font-black text-[#0B82F0] hover:bg-[#EAF6FF]"
              >
                <FileSpreadsheet className="h-4 w-4" /> นำเข้า XLSX
              </Button>
              <Button
                onClick={() => setEditor({ ...EMPTY_EDITOR })}
                className="h-9 rounded-full bg-[#0B82F0] px-3.5 text-[12.5px] font-black text-white hover:bg-[#0973d6] transition-colors"
              >
                <Plus className="h-4 w-4" /> เพิ่มคำถาม
              </Button>
            </div>
          }
        >
          {/* Filters */}
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8a72]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาคำถาม / หมวด / เฉลย"
                className="h-10 rounded-xl border-[#B9E0FF] bg-white pl-9 text-[13px] font-bold"
              />
            </div>
            <Combobox
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              aria-label="กรองตามหมวดหมู่"
              searchPlaceholder="ค้นหาหมวดหมู่"
              className="h-10 border-[#B9E0FF] bg-white text-[13px] font-black text-[#0B2F6B] md:w-[280px]"
              options={[
                { value: "all", label: `ทุกหมวดหมู่ (${awarenessQuestions.length})` },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>

          {grouped.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#B9E0FF] bg-[#F8FCFF] px-4 py-8 text-center text-[13px] font-bold text-[#55739B]">
              ไม่พบคำถามที่ตรงกับเงื่อนไข
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#D7EAFE] bg-[#F8FCFF]">
              {grouped.map(([category, items]) => (
                <div key={category} className="border-b border-[#D7EAFE] last:border-b-0">
                  <div className="flex items-center gap-2 bg-white px-3 py-2.5 md:px-4">
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapsed(category)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#B9E0FF] bg-[#F5FAFF] text-[#0B82F0] hover:bg-[#EAF6FF]"
                      aria-label={`สลับการแสดงหมวด ${category}`}
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          collapsedCategories[category] ? "-rotate-90" : "rotate-0"
                        )}
                        strokeWidth={2.4}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[13.5px] font-black text-[#0B2F6B]">{category}</h3>
                      <p className="text-[11px] font-bold text-[#55739B]">
                        เปิดใช้งาน {items.filter((item) => item.enabled).length} / {items.length} ข้อ
                      </p>
                    </div>
                    <Badge className="rounded-full border border-[#B9E0FF] bg-[#EAF6FF] px-2.5 py-1 text-[10.5px] font-black text-[#0B82F0]">
                      {items.length} ข้อ
                    </Badge>
                  </div>
                  {!collapsedCategories[category] ? <div className="divide-y divide-[#D7EAFE]">
                    {items.map((q, index) => (
                      <div
                        key={q.id}
                        className={cn(
                          "grid gap-3 px-3 py-3 md:grid-cols-[48px_minmax(0,1fr)_112px_112px] md:items-center md:px-4",
                          q.enabled
                            ? "bg-white"
                            : "bg-[#F4F8FC] opacity-75",
                        )}
                      >
                        <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#EAF6FF] text-[12px] font-black text-[#0B82F0] md:flex">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
                            <span className="rounded-full bg-[#EAF6FF] px-2 py-0.5 text-[10px] font-black text-[#0B82F0]">#{index + 1}</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", q.enabled ? "bg-[#EAFBF3] text-[#16845A]" : "bg-[#EEF2F7] text-[#667085]")}>
                              {q.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                            </span>
                          </div>
                          <p className="text-[13.5px] font-bold leading-relaxed text-[#0B2F6B]">
                            {q.text}
                          </p>
                          {q.note && (
                            <p className="mt-1 line-clamp-2 text-[12px] font-bold text-[#55739B]">เฉลย: {q.note}</p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "flex h-8 w-fit items-center gap-1 rounded-full px-2.5 text-[10.5px] font-black md:justify-self-start",
                            q.answer ? "bg-[#DAF5E6] text-[#19734A]" : "bg-[#FBE3DF] text-[#B3271A]",
                          )}
                        >
                          {q.answer ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {q.answer ? "ถูก" : "ผิด"}
                        </span>
                        <div className="flex items-center justify-between gap-2 md:justify-end">
                          <span className={cn("hidden rounded-full px-2.5 py-1 text-[10.5px] font-black md:inline-flex", q.enabled ? "bg-[#EAFBF3] text-[#16845A]" : "bg-[#EEF2F7] text-[#667085]")}>
                            {q.enabled ? "เปิด" : "ปิด"}
                          </span>
                          <button
                            type="button"
                            title={q.enabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                            onClick={() => toggleEnabled(q.id)}
                            className={cn(
                              "inline-flex size-8 min-h-0 min-w-0 flex-shrink-0 items-center justify-center rounded-[10px] border p-0 transition-colors",
                              q.enabled
                                ? "border-[#B8E7D2] bg-[#EFFCF6] text-[#16845A] hover:bg-[#E5F8EF]"
                                : "border-[#D7EAFE] bg-white text-[#667085] hover:bg-[#F5FAFF]",
                            )}
                          >
                            {q.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            title="แก้ไข"
                            onClick={() =>
                              setEditor({
                                mode: "edit",
                                id: q.id,
                                category: q.category,
                                text: q.text,
                                answer: q.answer,
                                note: q.note ?? "",
                                enabled: q.enabled,
                              })
                            }
                            className="inline-flex size-8 min-h-0 min-w-0 flex-shrink-0 items-center justify-center rounded-[10px] border border-[#B9E0FF] bg-white p-0 text-[#0B82F0] transition-colors hover:bg-[#EAF6FF]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="ลบ"
                            onClick={() => setPendingDeleteQuestion(q)}
                            className="inline-flex size-8 min-h-0 min-w-0 flex-shrink-0 items-center justify-center rounded-[10px] border border-[#F3B9AE] bg-white p-0 text-[#D92D20] transition-colors hover:bg-[#FFF1EE]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div> : null}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-[#D7EAFE] pt-3">
            <Button
              onClick={resetToDefault}
              variant="outline"
              className="h-8 rounded-lg border-[#B9E0FF] bg-white px-3 text-[12px] font-black text-[#0B82F0] hover:bg-[#EAF6FF]"
            >
              คืนค่าชุดคำถามเริ่มต้น
            </Button>
            <span className="ml-2 text-[11.5px] font-bold text-[#55739B]">
              (แทนที่คลังปัจจุบันด้วยชุดมาตรฐาน 120 ข้อ)
            </span>
          </div>
        </SectionCard>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={!!editor} onOpenChange={(open) => !open && setEditor(null)}>
        <AppDialogContent size="md">
          <AppDialogSectionHeader>
            <AppDialogTitle className="text-[var(--c-3b1d07)]">
              {editor?.mode === "edit" ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}
            </AppDialogTitle>
            <AppDialogDescription>กรอกข้อความคำถาม กำหนดเฉลย (ถูก/ผิด) และคำอธิบายเพิ่มเติม</AppDialogDescription>
          </AppDialogSectionHeader>

          {editor && (
            <AppDialogBody className="flex flex-col gap-3">
              <div>
                <Label className="text-[12.5px] font-black text-[var(--c-5c3214)]">หมวดหมู่</Label>
                <Combobox
                  value={editor.category}
                  onValueChange={(category) => setEditor({ ...editor, category })}
                  placeholder="เช่น กฎจราจรและการควบคุมความเร็ว"
                  searchPlaceholder="ค้นหาหรือพิมพ์ชื่อหมวดใหม่"
                  emptyText="พิมพ์ชื่อหมวดใหม่ได้"
                  allowCustomValue
                  customValueLabel={(value) => `สร้างหมวด “${value}”`}
                  options={categories.map((category) => ({ value: category, label: category }))}
                  className="mt-1 h-10 rounded-xl border-[var(--c-d7c5a7)] text-[13px] font-bold"
                  contentClassName="min-w-[320px]"
                />
              </div>

              <div>
                <Label className="text-[12.5px] font-black text-[var(--c-5c3214)]">ข้อความคำถาม</Label>
                <Textarea
                  value={editor.text}
                  onChange={(e) => setEditor({ ...editor, text: e.target.value })}
                  placeholder="พิมพ์ข้อความสถานการณ์/กฎ ที่ให้ผู้ใช้ตัดสินว่าถูกหรือผิด"
                  className="mt-1 min-h-[84px] rounded-xl border-[var(--c-d7c5a7)] text-[13px] font-bold"
                />
              </div>

              <div>
                <Label className="text-[12.5px] font-black text-[var(--c-5c3214)]">เฉลย</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {([true, false] as const).map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setEditor({ ...editor, answer: value })}
                      className={cn(
                        "flex h-10 items-center justify-center gap-1.5 rounded-xl border-[1.5px] text-[14px] font-black",
                        editor.answer === value
                          ? value
                            ? "border-[#1f7a55] bg-[#daf5e6] text-[#19734a]"
                            : "border-[#d5301a] bg-[#fbe3df] text-[#b3271a]"
                          : "border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)]",
                      )}
                    >
                      {value ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {value ? "ถูก" : "ผิด"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[12.5px] font-black text-[var(--c-5c3214)]">คำอธิบายเฉลย (ไม่บังคับ)</Label>
                <Input
                  value={editor.note}
                  onChange={(e) => setEditor({ ...editor, note: e.target.value })}
                  placeholder="เช่น ต้องสวมทุกครั้งที่ออกนอกรถ"
                  className="mt-1 h-10 rounded-xl border-[var(--c-d7c5a7)] text-[13px] font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => setEditor({ ...editor, enabled: !editor.enabled })}
                className="flex items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "flex h-6 w-11 items-center rounded-full px-0.5 transition-colors",
                    editor.enabled ? "bg-[#1f7a55]" : "bg-[var(--c-d7c5a7)]",
                  )}
                >
                  <span
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      editor.enabled ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </span>
                <span className="text-[12.5px] font-black text-[var(--c-5c3214)]">
                  เปิดใช้งาน (ให้สุ่มในป็อปอัพ)
                </span>
              </button>
            </AppDialogBody>
          )}

          <AppDialogSectionFooter>
            <Button
              onClick={saveEditor}
              disabled={!editor?.text.trim()}
              className="h-9 rounded-full bg-[#0B82F0] px-4 text-[12.5px] font-black text-white hover:bg-[#0973d6] disabled:opacity-50 transition-colors"
            >
              บันทึก
            </Button>
          </AppDialogSectionFooter>
        </AppDialogContent>
      </Dialog>

      <Dialog open={!!pendingDeleteQuestion} onOpenChange={(open) => !open && setPendingDeleteQuestion(null)}>
        <AppDialogContent size="sm">
          <AppDialogSectionHeader>
            <AppDialogTitle className="text-[var(--c-3b1d07)]">ยืนยันการลบคำถาม</AppDialogTitle>
            <AppDialogDescription>
              หากยืนยัน คำถามข้อนี้จะถูกลบออกจากคลังคำถามทันที
            </AppDialogDescription>
          </AppDialogSectionHeader>

          {pendingDeleteQuestion ? (
            <AppDialogBody>
              <div className="rounded-xl border border-[#eccdc6] bg-[#fff8f6] px-4 py-3">
              <div className="text-[12px] font-black text-[#b3271a]">{pendingDeleteQuestion.category}</div>
              <div className="mt-1 text-[13px] font-bold leading-relaxed text-[var(--c-3b1d07)]">
                {pendingDeleteQuestion.text}
              </div>
              </div>
            </AppDialogBody>
          ) : null}

          <AppDialogSectionFooter>
            <Button
              onClick={confirmDeleteQuestion}
              className="h-9 rounded-xl bg-[#b3271a] px-4 text-[12.5px] font-black text-white hover:bg-[#962113]"
            >
              ลบคำถาม
            </Button>
          </AppDialogSectionFooter>
        </AppDialogContent>
      </Dialog>

      {/* XLSX import dialog */}
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) {
            setImportQuestions([]);
            setImportErrors([]);
          }
        }}
      >
        <AppDialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
          <AppDialogSectionHeader>
            <AppDialogTitle className="flex items-center gap-2 text-[var(--c-3b1d07)]">
              <FileSpreadsheet className="h-5 w-5" /> นำเข้าคำถามจาก XLSX
            </AppDialogTitle>
            <AppDialogDescription>
              ดาวน์โหลดแบบฟอร์ม กรอกคำถามในชีต Questions แล้วนำไฟล์กลับเข้าระบบ
            </AppDialogDescription>
          </AppDialogSectionHeader>

          <AppDialogBody>
          <div className="rounded-xl border border-[#cfe3f4] bg-[#f1f8fe] p-3.5 text-[12px] font-bold text-[#24567f]">
            <p className="flex items-center gap-2 text-[12.5px] font-black">
              <Info className="h-4 w-4" /> แนวทางการกรอกที่ถูกต้อง
            </p>
            <div className="mt-2 grid gap-1 md:grid-cols-2">
              <p><b>category</b>: ชื่อหมวดหมู่</p>
              <p><b>question</b>: คำถามถูก/ผิด 1 ข้อต่อแถว</p>
              <p><b>answer</b>: กรอกเฉพาะ “ถูก” หรือ “ผิด”</p>
              <p><b>explanation</b>: คำอธิบายเฉลย (ไม่บังคับ)</p>
              <p><b>enabled</b>: กรอก “ใช่” หรือ “ไม่”</p>
            </div>
            <p className="mt-2 text-[#b3271a]">ห้ามเปลี่ยนชื่อหัวคอลัมน์ในชีต Questions</p>
          </div>

          <Button
            onClick={downloadTemplate}
            className="h-10 w-full rounded-xl border border-[var(--c-d7c5a7)] bg-[var(--c-fff8eb)] px-4 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
          >
            <Download className="h-4 w-4" /> ดาวน์โหลดแบบฟอร์ม XLSX พร้อมตัวอย่างและคู่มือ
          </Button>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] px-4 py-6 text-center hover:bg-[var(--c-fff8eb)]">
            <Upload className="h-7 w-7 text-[var(--c-9a6a24)]" />
            <span className="mt-2 text-[13px] font-black text-[var(--c-5c3214)]">
              เลือกไฟล์คำถาม .xlsx
            </span>
            <span className="text-[11.5px] font-bold text-[var(--c-6d5a46)]">
              ระบบจะตรวจข้อมูลแต่ละแถวก่อนนำเข้า
            </span>
            <input type="file" accept=".xlsx" onChange={readXlsx} className="sr-only" />
          </label>

          {(importQuestions.length > 0 || importErrors.length > 0) && (
            <div className="rounded-xl border border-[var(--c-e6dcc6)] bg-white p-3">
              <p className="text-[12.5px] font-black text-[var(--c-3b1d07)]">
                ตรวจพบคำถามที่พร้อมนำเข้า {importQuestions.length} ข้อ
              </p>
              {importErrors.length > 0 && (
                <div className="mt-2 max-h-[120px] overflow-y-auto rounded-lg bg-[#fff2ef] px-3 py-2 text-[11.5px] font-bold text-[#b3271a]">
                  {importErrors.map((error) => <p key={error}>{error}</p>)}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={importReplace}
              onChange={(e) => setImportReplace(e.target.checked)}
              className="h-4 w-4 accent-[var(--c-5c3214)]"
            />
            <span className="text-[12.5px] font-black text-[var(--c-5c3214)]">
              แทนที่คลังคำถามทั้งหมด (ถ้าไม่ติ๊ก = เพิ่มต่อท้าย)
            </span>
          </label>
          </AppDialogBody>

          <AppDialogSectionFooter>
            <Button
              onClick={() => setImportOpen(false)}
              className="h-9 rounded-xl border border-[var(--c-d7c5a7)] bg-white px-4 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={runImport}
              disabled={importQuestions.length === 0}
              className="h-9 rounded-xl bg-[var(--c-5c3214)] px-4 text-[12.5px] font-black text-white hover:bg-[var(--c-4a280f)] disabled:opacity-50"
            >
              นำเข้า {importQuestions.length > 0 ? `(${importQuestions.length} ข้อ)` : ""}
            </Button>
          </AppDialogSectionFooter>
        </AppDialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "ok" | "muted";
}) {
  const toneCls =
    tone === "ok"
      ? "text-[#19734a] bg-[#eafaf1]"
      : tone === "muted"
        ? "text-[var(--c-9a8a72,#9a8a72)] bg-[var(--c-f6f1e6)]"
        : "text-[var(--c-6d4716)] bg-[var(--c-fff1c9)]";
  return (
    <Card className="flex min-h-[68px] items-center justify-center gap-2 rounded-xl border border-[#B9E0FF] bg-white px-3 py-2 text-center">
      <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg [&_svg]:h-4 [&_svg]:w-4", toneCls)}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[18px] font-black leading-none text-[#0B2F6B]">{value}</div>
        <div className="text-[10.5px] font-bold leading-tight text-[#55739B]">{label}</div>
      </div>
    </Card>
  );
}
