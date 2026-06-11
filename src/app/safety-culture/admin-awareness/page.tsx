"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleSlash,
  Eye,
  EyeOff,
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
import { useAppActions, useAppState } from "@/providers/app-providers";
import {
  createDefaultAwarenessQuestions,
  parseAwarenessBulk,
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
  const { awarenessQuestions } = useAppState();
  const { updateAwarenessQuestions } = useAppActions();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importReplace, setImportReplace] = useState(false);

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
    const parsed = parseAwarenessBulk(importText, "sa-import");
    if (parsed.length === 0) return;
    updateAwarenessQuestions(importReplace ? parsed : [...awarenessQuestions, ...parsed]);
    setImportText("");
    setImportReplace(false);
    setImportOpen(false);
  };

  const resetToDefault = () => {
    updateAwarenessQuestions(createDefaultAwarenessQuestions());
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] bg-[var(--background)] px-3.5 pt-2 pb-8 font-sarabun md:px-4">
      <SafetyCultureHero
        eyebrow="SAFETY CULTURE ADMIN"
        title={
          <>
            Settings <span className="text-[var(--c-ffb000)]">Safety Awareness</span>
          </>
        }
        description="จัดการคลังคำถาม Safety Awareness ที่ใช้สุ่มในป็อปอัพประจำวัน — เพิ่ม/แก้/ลบ เปิด-ปิด และนำเข้าแบบวางข้อความ"
        mascotSrc="/images/mascots/gallery/line-walk-3.png"
        mascotAlt="SUEA Mascot"
        actions={
          <div className="mt-[12px] flex flex-wrap gap-2">
            <Link href="/safety-culture">
              <Button className="h-[34px] rounded-full border border-white/30 bg-white/10 px-4 text-[12.5px] font-black text-white hover:bg-white/14">
                <ArrowLeft className="h-4 w-4" /> กลับ Safety Culture
              </Button>
            </Link>
          </div>
        }
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
          title="คลังคำถาม"
          description="ป็อปอัพจะสุ่ม 3 ข้อจากคำถามที่ 'เปิดใช้งาน' เท่านั้น"
          icon={<ListChecks className="h-6 w-6" strokeWidth={2.2} />}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setImportOpen(true)}
                className="h-9 rounded-xl border border-[var(--c-d7c5a7)] bg-[var(--c-fff8eb)] px-3.5 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
              >
                <Upload className="h-4 w-4" /> นำเข้า
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
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-[var(--c-d7c5a7)] bg-[var(--c-fffdf8)] px-3 text-[13px] font-black text-[var(--c-5c3214)] md:w-[280px]"
            >
              <option value="all">ทุกหมวดหมู่ ({awarenessQuestions.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
                  </div>
                  <div className="flex flex-col gap-2">
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
                            onClick={() => deleteQuestion(q.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eccdc6] bg-white text-[#b3271a] hover:bg-[#fbe3df]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                <Input
                  value={editor.category}
                  onChange={(e) => setEditor({ ...editor, category: e.target.value })}
                  placeholder="เช่น กฎจราจรและการควบคุมความเร็ว"
                  list="awareness-categories"
                  className="mt-1 h-10 rounded-xl border-[var(--c-d7c5a7)] text-[13px] font-bold"
                />
                <datalist id="awareness-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
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
              onClick={() => setEditor(null)}
              className="h-9 rounded-xl border border-[var(--c-d7c5a7)] bg-white px-4 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff2d8)]"
            >
              ยกเลิก
            </Button>
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

      {/* Bulk import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="font-sarabun sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--c-3b1d07)]">นำเข้าคำถาม (วางข้อความ)</DialogTitle>
            <DialogDescription>
              วาง 1 คำถามต่อ 1 บรรทัด ลงท้ายด้วย (ถูก) หรือ (ผิด) — ใส่คำอธิบายได้เป็น (ผิด - คำอธิบาย)
              และขึ้นบรรทัดที่ขึ้นต้นด้วย “หมวด” เพื่อกำหนดหมวดหมู่
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"หมวดที่ 1: การเตรียมความพร้อม\nจบส. ต้องตรวจวัดแอลกอฮอล์ทุกวันก่อนปฏิบัติงาน (ถูก)\nการสวมหมวกเซฟตี้จำเป็นเฉพาะตอนเทคอนกรีต (ผิด - ต้องสวมทุกครั้งที่ออกนอกรถ)"}
            className="min-h-[180px] rounded-xl border-[var(--c-d7c5a7)] text-[13px] font-bold"
          />

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
              disabled={parseAwarenessBulk(importText).length === 0}
              className="h-9 rounded-xl bg-[var(--c-5c3214)] px-4 text-[12.5px] font-black text-white hover:bg-[var(--c-4a280f)] disabled:opacity-50"
            >
              นำเข้า {parseAwarenessBulk(importText).length > 0 ? `(${parseAwarenessBulk(importText).length} ข้อ)` : ""}
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
    <Card className="flex items-center gap-3 rounded-2xl border border-[var(--c-e6dcc6)] bg-white p-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneCls)}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[20px] font-black leading-none text-[var(--c-3b1d07)]">{value}</div>
        <div className="text-[11.5px] font-bold text-[var(--c-6d5a46)]">{label}</div>
      </div>
    </Card>
  );
}
