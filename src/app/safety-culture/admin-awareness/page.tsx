"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import {
  CalendarOff,
  ChevronDown,
  CheckCircle2,
  CircleSlash,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
    <Card className="rounded-[18px] border border-[var(--c-e6dcc6)] bg-white p-4 md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--c-fff1c9)] text-[var(--c-6d4716)]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-black text-[var(--c-3b1d07)]">{title}</h2>
          <p className="text-[12.5px] font-bold text-[var(--c-6d5a46)]">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}

export default function AdminAwarenessPage() {
  const { awarenessQuestions, awarenessHolidays } = useAppState();
  const { updateAwarenessQuestions, updateAwarenessHolidays } = useAppActions();

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
    <div className="mx-auto w-full max-w-[1480px] bg-[var(--background)] px-3.5 pt-2.5 pb-8 font-sarabun md:px-5">
      <SafetyCultureHero
        eyebrow="SAFETY CULTURE ADMIN"
        title={
          <>
            Settings <span className="text-[var(--c-ffb000)]">Safety Awareness</span>
          </>
        }
        description="จัดการวันทำงานที่นับ KPI และคลังคำถาม Safety Awareness — เพิ่ม/แก้/ลบ เปิด-ปิด และนำเข้าจาก XLSX"
        variant="community"
        backgroundImage="/images/heroes/admin-awareness-hero.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
      />

      {/* Stat strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="คำถามทั้งหมด" value={awarenessQuestions.length} icon={<ListChecks className="h-5 w-5" />} />
        <StatCard label="เปิดใช้งาน" value={enabledCount} icon={<CheckCircle2 className="h-5 w-5" />} tone="ok" />
        <StatCard label="ปิดใช้งาน" value={awarenessQuestions.length - enabledCount} icon={<CircleSlash className="h-5 w-5" />} tone="muted" />
        <StatCard label="หมวดหมู่" value={categories.length} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="mt-4">
        <SectionCard
          title="วันที่ไม่นับคะแนน Safety Awareness KPI"
          description="วันเสาร์และวันอาทิตย์ไม่นับอัตโนมัติ เพิ่มวันหยุดบริษัทหรือวันหยุดพิเศษที่ตรงกับวันทำงานได้ที่นี่ ระบบจะหักคะแนน Awareness ของวันที่ถูกเพิ่มย้อนหลังถ้ามีคนทำไว้แล้ว"
          icon={<CalendarOff className="h-6 w-6" strokeWidth={2.2} />}
        >
          <div className="rounded-xl border border-[#cfe3f4] bg-[#f1f8fe] px-3.5 py-3 text-[12.5px] font-bold text-[#24567f]">
            <div className="flex items-center gap-2 font-black">
              <Info className="h-4 w-4 flex-shrink-0" />
              ระบบไม่นับวันเสาร์และวันอาทิตย์ทุกสัปดาห์
            </div>
            <p className="mt-1 pl-6">
              วันที่เพิ่มด้านล่างจะไม่แสดงป็อปอัพคำถาม และไม่ถูกนำไปคิดเปอร์เซ็นต์ KPI บนหน้า Home
            </p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-[190px_1fr_auto]">
            <Input
              type="date"
              value={holidayDate}
              onChange={(event) => setHolidayDate(event.target.value)}
              className="h-10 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] text-[13px] font-bold"
            />
            <Input
              value={holidayName}
              onChange={(event) => setHolidayName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addHoliday()}
              placeholder="ชื่อวันหยุด เช่น วันหยุดบริษัทประจำปี"
              className="h-10 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] text-[13px] font-bold"
            />
            <Button
              onClick={addHoliday}
              disabled={!holidayDate || !holidayName.trim()}
              className="h-10 rounded-xl bg-[var(--c-5c3214)] px-4 text-[12.5px] font-black text-white hover:bg-[var(--c-4a280f)] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> เพิ่มวันไม่นับคะแนน
            </Button>
          </div>

          <div className="mt-3">
            {awarenessHolidays.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] px-4 py-4 text-center text-[12.5px] font-bold text-[var(--c-6d5a46)]">
                ยังไม่มีวันหยุดเพิ่มเติม ระบบไม่นับเฉพาะวันเสาร์และวันอาทิตย์
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {[...awarenessHolidays]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday) => (
                    <div
                      key={holiday.date}
                      className="flex items-center gap-3 rounded-xl border border-[var(--c-e6dcc6)] bg-[var(--c-fffdf8)] px-3 py-2.5"
                    >
                      <CalendarOff className="h-4 w-4 flex-shrink-0 text-[#b3271a]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-black text-[var(--c-3b1d07)]">{holiday.name}</p>
                        <p className="text-[11.5px] font-bold text-[var(--c-6d5a46)]">{holiday.date}</p>
                      </div>
                      <button
                        type="button"
                        title="ลบวันไม่นับ"
                        onClick={() =>
                          updateAwarenessHolidays(
                            awarenessHolidays.filter((item) => item.date !== holiday.date),
                          )
                        }
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#eccdc6] bg-white text-[#b3271a] hover:bg-[#fbe3df]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
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
                className="h-9 rounded-xl border border-[var(--c-d7c5a7)] bg-[var(--c-fff8eb)] px-3.5 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
              >
                <FileSpreadsheet className="h-4 w-4" /> นำเข้า XLSX
              </Button>
              <Button
                onClick={() => setEditor({ ...EMPTY_EDITOR })}
                className="h-9 rounded-xl bg-[var(--c-5c3214)] px-3.5 text-[12.5px] font-black text-white hover:bg-[var(--c-4a280f)]"
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
                className="h-10 rounded-xl border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] pl-9 text-[13px] font-bold"
              />
            </div>
            <Combobox
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              aria-label="กรองตามหมวดหมู่"
              searchPlaceholder="ค้นหาหมวดหมู่"
              className="h-10 border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] text-[13px] font-black text-[var(--c-5c3214)] md:w-[280px]"
              options={[
                { value: "all", label: `ทุกหมวดหมู่ (${awarenessQuestions.length})` },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>

          {grouped.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] px-4 py-8 text-center text-[13px] font-bold text-[var(--c-6d5a46)]">
              ไม่พบคำถามที่ตรงกับเงื่อนไข
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {grouped.map(([category, items]) => (
                <div key={category}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <h3 className="text-[13px] font-black text-[var(--c-3b1d07)]">{category}</h3>
                    <Badge className="rounded-full border border-[var(--c-d7c5a7)] bg-[var(--c-fff6d6)] px-2 py-0.5 text-[10.5px] font-black text-[var(--c-8b5a12)]">
                      {items.length} ข้อ
                    </Badge>
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapsed(category)}
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
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
                  </div>
                  {!collapsedCategories[category] ? <div className="flex flex-col gap-2">
                    {items.map((q) => (
                      <div
                        key={q.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border-[1.5px] px-3 py-2.5",
                          q.enabled
                            ? "border-[var(--c-e6dcc6)] bg-white"
                            : "border-[var(--c-e6dcc6)] bg-[var(--c-f6f1e6)] opacity-70",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-6 flex-shrink-0 items-center gap-1 rounded-full px-2 text-[10.5px] font-black",
                            q.answer ? "bg-[#daf5e6] text-[#19734a]" : "bg-[#fbe3df] text-[#b3271a]",
                          )}
                        >
                          {q.answer ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {q.answer ? "ถูก" : "ผิด"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-bold leading-relaxed text-[var(--c-2c2c2c,#2c2c2c)]">
                            {q.text}
                          </p>
                          {q.note && (
                            <p className="mt-0.5 text-[12px] font-bold text-[var(--c-9a6a24)]">เฉลย: {q.note}</p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <button
                            type="button"
                            title={q.enabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                            onClick={() => toggleEnabled(q.id)}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg border",
                              q.enabled
                                ? "border-[#bfe6cf] bg-[#eafaf1] text-[#19734a]"
                                : "border-[var(--c-d7c5a7)] bg-white text-[var(--c-9a8a72,#9a8a72)]",
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
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--c-d7c5a7)] bg-white text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="ลบ"
                            onClick={() => setPendingDeleteQuestion(q)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eccdc6] bg-white text-[#b3271a] hover:bg-[#fbe3df]"
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

          <div className="mt-4 border-t border-[var(--c-e6dcc6)] pt-3">
            <Button
              onClick={resetToDefault}
              className="h-8 rounded-lg border border-[var(--c-d7c5a7)] bg-white px-3 text-[12px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
            >
              คืนค่าชุดคำถามเริ่มต้น
            </Button>
            <span className="ml-2 text-[11.5px] font-bold text-[var(--c-6d5a46)]">
              (แทนที่คลังปัจจุบันด้วยชุดมาตรฐาน 120 ข้อ)
            </span>
          </div>
        </SectionCard>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={!!editor} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="font-sarabun sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--c-3b1d07)]">
              {editor?.mode === "edit" ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}
            </DialogTitle>
            <DialogDescription>กรอกข้อความคำถาม กำหนดเฉลย (ถูก/ผิด) และคำอธิบายเพิ่มเติม</DialogDescription>
          </DialogHeader>

          {editor && (
            <div className="flex flex-col gap-3">
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
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={saveEditor}
              disabled={!editor?.text.trim()}
              className="h-9 rounded-xl bg-[var(--c-5c3214)] px-4 text-[12.5px] font-black text-white hover:bg-[var(--c-4a280f)] disabled:opacity-50"
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDeleteQuestion} onOpenChange={(open) => !open && setPendingDeleteQuestion(null)}>
        <DialogContent className="font-sarabun sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--c-3b1d07)]">ยืนยันการลบคำถาม</DialogTitle>
            <DialogDescription>
              หากยืนยัน คำถามข้อนี้จะถูกลบออกจากคลังคำถามทันที
            </DialogDescription>
          </DialogHeader>

          {pendingDeleteQuestion ? (
            <div className="rounded-xl border border-[#eccdc6] bg-[#fff8f6] px-4 py-3">
              <div className="text-[12px] font-black text-[#b3271a]">{pendingDeleteQuestion.category}</div>
              <div className="mt-1 text-[13px] font-bold leading-relaxed text-[var(--c-3b1d07)]">
                {pendingDeleteQuestion.text}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              onClick={confirmDeleteQuestion}
              className="h-9 rounded-xl bg-[#b3271a] px-4 text-[12.5px] font-black text-white hover:bg-[#962113]"
            >
              ลบคำถาม
            </Button>
          </DialogFooter>
        </DialogContent>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto font-sarabun sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--c-3b1d07)]">
              <FileSpreadsheet className="h-5 w-5" /> นำเข้าคำถามจาก XLSX
            </DialogTitle>
            <DialogDescription>
              ดาวน์โหลดแบบฟอร์ม กรอกคำถามในชีต Questions แล้วนำไฟล์กลับเข้าระบบ
            </DialogDescription>
          </DialogHeader>

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

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
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
    <Card className="flex min-h-[122px] flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--c-e6dcc6)] bg-white p-3 text-center">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneCls)}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[20px] font-black leading-none text-[var(--c-3b1d07)]">{value}</div>
        <div className="text-[11.5px] font-bold text-[var(--c-6d5a46)]">{label}</div>
      </div>
    </Card>
  );
}
