"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, Star, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, apiJson } from "@/lib/api-client";
import { getSessionDisplayName, useSessionUser } from "@/lib/session-user";

type PointRule = {
  id: string | null;
  code: string;
  label: string;
  sourceType: string;
  points: number;
  status: string;
  source: string;
};

const RULE_ORDER = [
  "safetyAwarenessCompleted",
  "safetyPostApproved",
  "commentCreated",
  "reactionCreated",
  "safetyEffortCompleted",
] as const;

const RULE_HINTS: Record<string, string> = {
  safetyAwarenessCompleted: "ได้คะแนนเมื่อผู้ใช้ผ่าน Safety Awareness ประจำวัน",
  safetyPostApproved: "ได้คะแนนเมื่อโพสต์ Safety Post ถูกอนุมัติให้เผยแพร่",
  commentCreated: "ได้คะแนนเมื่อมีการคอมเมนต์ใน Safety Culture",
  reactionCreated: "ได้คะแนนเมื่อมีการกด Reaction",
  safetyEffortCompleted: "ได้คะแนนเมื่อทำรายการ Safety Effort สำเร็จ",
};

export default function AdminPointsPage() {
  const { user: sessionUser } = useSessionUser();
  const [rules, setRules] = useState<PointRule[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const result = await apiFetch<{ rules: PointRule[] }>("/api/safety-culture/points/rules");
    if (!result.ok || !Array.isArray(result.data?.rules)) {
      setError("โหลดข้อมูลคะแนนไม่สำเร็จ");
      setLoading(false);
      return;
    }

    const ordered = [...result.data.rules].sort((a, b) => {
      const left = RULE_ORDER.indexOf(a.code as typeof RULE_ORDER[number]);
      const right = RULE_ORDER.indexOf(b.code as typeof RULE_ORDER[number]);
      return (left === -1 ? 999 : left) - (right === -1 ? 999 : right);
    });

    setRules(ordered);
    setDraft(
      ordered.reduce<Record<string, string>>((acc, rule) => {
        acc[rule.code] = String(rule.points);
        return acc;
      }, {}),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const totalPoints = useMemo(
    () => rules.reduce((sum, rule) => sum + (Number(draft[rule.code] || rule.points) || 0), 0),
    [draft, rules],
  );

  const hasChanges = useMemo(
    () => rules.some((rule) => String(rule.points) !== String(draft[rule.code] ?? rule.points)),
    [draft, rules],
  );

  const saveRules = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      for (const rule of rules) {
        const nextPoints = Number(draft[rule.code]);
        if (!Number.isFinite(nextPoints) || nextPoints < 0) {
          throw new Error(`คะแนนของ "${rule.label}" ไม่ถูกต้อง`);
        }

        if (nextPoints === rule.points) continue;

        const result = await apiFetch<{ rule: PointRule }>(
          "/api/safety-culture/points/rules",
          apiJson("POST", {
            id: rule.id,
            code: rule.code,
            points: nextPoints,
            status: rule.status || "ACTIVE",
          }),
        );
        if (!result.ok) {
          throw new Error(`บันทึก "${rule.label}" ไม่สำเร็จ`);
        }
      }

      setMessage("บันทึกการตั้งค่าคะแนนเรียบร้อยแล้ว");
      await loadRules();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] bg-[var(--background)] px-3.5 pt-2.5 pb-8 font-sarabun md:px-5">
      <section
        className="relative min-h-[110px] overflow-hidden rounded-[20px] border border-[#D7EAFE] px-4 py-5 text-[#0B2F6B] shadow-[0_8px_22px_rgba(185,223,255,0.45)] sm:min-h-[120px] md:px-7 md:py-7 xl:min-h-[150px]"
        style={{
          background: "url('/images/heroes/admin-event-hero.png') center / cover no-repeat",
        }}
      >
        <div className="flex h-full flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-hero-label)]">
              <Star className="h-4 w-4" strokeWidth={2.5} />
              Point Settings
            </p>
            <h1 className="mt-2 text-[26px] font-black leading-tight md:text-[34px]">ตั้งค่าคะแนนในระบบ</h1>
            <p className="mt-2 max-w-[760px] text-[13px] font-bold leading-relaxed text-[#55739B] md:text-[14px]">
              กำหนดคะแนนของกิจกรรมหลักใน Safety Awareness, Safety Culture และ Safety Effort ได้จากหน้าเดียว
            </p>
          </div>
          <div className="rounded-[14px] border border-[#D7EAFE] bg-white/85 px-4 py-3 shadow-[0_8px_18px_rgba(185,223,255,0.35)]">
            <p className="text-[11px] font-bold text-[#55739B]">ผู้ใช้งานปัจจุบัน</p>
            <p className="mt-1 text-[13px] font-black text-[#0B82F0]">{getSessionDisplayName(sessionUser)}</p>
          </div>
        </div>
      </section>

      <Card className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_10px_26px_var(--brand-shadow)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[18px] font-black text-[#0B2F6B]">คะแนนกิจกรรมหลัก</h2>
            <p className="mt-1 text-[12px] font-bold text-[#55739B]">แอดมินสามารถเพิ่มหรือลดแต้มได้เอง แล้วระบบจะใช้ค่าชุดนี้ต่อจากนี้</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-[14px] border border-[#D7EAFE] bg-[#F5FAFF] px-4 py-2 text-center">
              <div className="text-[10px] font-bold text-[#55739B]">รวมคะแนนตั้งต้น</div>
              <div className="mt-0.5 text-[20px] font-black text-[#0B82F0]">{totalPoints}</div>
            </div>
            <Button type="button" variant="outline" onClick={() => void loadRules()} disabled={loading || saving} className="h-10 rounded-xl border-[#D7EAFE]">
              <RefreshCcw className="mr-2 h-4 w-4" />
              โหลดใหม่
            </Button>
            <Button type="button" onClick={() => void saveRules()} disabled={loading || saving || !hasChanges} className="h-10 rounded-xl bg-[#0B82F0]">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกคะแนน"}
            </Button>
          </div>
        </div>

        {message && <div className="mt-3 rounded-xl border border-[#C8E9D2] bg-[#EEFFF3] px-3 py-2 text-[12px] font-bold text-[#19734A]">{message}</div>}
        {error && <div className="mt-3 rounded-xl border border-[#FFD3D0] bg-[#FFF4F3] px-3 py-2 text-[12px] font-bold text-[#C7352B]">{error}</div>}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rules.map((rule) => (
            <div key={rule.code} className="rounded-[18px] border border-[#D7EAFE] bg-white p-4 shadow-[0_6px_18px_rgba(185,223,255,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-black leading-tight text-[#0B2F6B]">{rule.label}</h3>
                  <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#55739B]">{RULE_HINTS[rule.code] || rule.sourceType}</p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F5FAFF] text-[#0B82F0]">
                  <Trophy className="h-5 w-5" strokeWidth={2.3} />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-[11px] font-black text-[#55739B]">คะแนน</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={draft[rule.code] ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, [rule.code]: event.target.value }))}
                  className="h-11 rounded-xl border-[#D7EAFE] text-[18px] font-black text-[#0B2F6B]"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F5FAFF] px-2.5 py-1 text-[10px] font-black text-[#0B82F0]">{rule.code}</span>
                <span className="rounded-full bg-[#FFF7E8] px-2.5 py-1 text-[10px] font-black text-[#A56A00]">
                  {rule.source === "database" ? "ข้อมูลจริงจากระบบ" : "ค่าเริ่มต้นของระบบ"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!loading && rules.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-[#D7EAFE] bg-[#F9FBFF] px-4 py-6 text-center text-[13px] font-bold text-[#55739B]">
            ยังไม่พบกติกาคะแนนในระบบ
          </div>
        )}
      </Card>
    </div>
  );
}
