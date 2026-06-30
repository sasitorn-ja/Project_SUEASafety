"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save, Trophy } from "lucide-react";

import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPointRules, savePointRule } from "@/services/pointRulesServices";
import type { PointRule } from "@/types/pointRulesType";
import { POINT_RULE_HINTS, POINT_RULE_ORDER } from "@/utils/point-rules/pointRulesConfig";

export function PointRulesManager() {
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

    const result = await getPointRules();
    if (!result.ok || !Array.isArray(result.data?.rules)) {
      setError("โหลดข้อมูล Coin ไม่สำเร็จ");
      setLoading(false);
      return;
    }

    const ordered = [...result.data.rules].sort((a, b) => {
      const left = POINT_RULE_ORDER.indexOf(a.code as typeof POINT_RULE_ORDER[number]);
      const right = POINT_RULE_ORDER.indexOf(b.code as typeof POINT_RULE_ORDER[number]);
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

  const groups = useMemo(() => {
    const awareness: PointRule[] = [];
    const culture: PointRule[] = [];
    const effort: PointRule[] = [];
    const other: PointRule[] = [];

    rules.forEach((rule) => {
      const code = rule.code.toLowerCase();
      if (code.includes("awareness")) {
        awareness.push(rule);
      } else if (code.includes("post") || code.includes("comment") || code.includes("reaction") || code.includes("reply") || code.includes("culture")) {
        culture.push(rule);
      } else if (code.includes("effort") || code.includes("linewalk") || code.includes("checklist")) {
        effort.push(rule);
      } else {
        other.push(rule);
      }
    });

    return [
      { id: "awareness", name: "Safety Awareness", rules: awareness, color: "text-[#0B82F0] bg-[#EAF6FF] border-[#B9DDFF]" },
      { id: "culture", name: "Safety Culture", rules: culture, color: "text-[#E67E22] bg-[#FDF2E9] border-[#FADBD8]" },
      { id: "effort", name: "Safety Effort", rules: effort, color: "text-[#27AE60] bg-[#E8F8F5] border-[#D1F2EB]" },
      ...(other.length > 0 ? [{ id: "other", name: "อื่นๆ", rules: other, color: "text-[#7F8C8D] bg-[#F2F4F4] border-[#E5E8E8]" }] : []),
    ];
  }, [rules]);

  const onSaveRules = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      for (const rule of rules) {
        const nextPoints = Number(draft[rule.code]);
        if (!Number.isFinite(nextPoints) || nextPoints < 0) {
          throw new Error(`Coin ของ "${rule.label}" ไม่ถูกต้อง`);
        }

        if (nextPoints === rule.points) continue;

        const result = await savePointRule({
          id: rule.id,
          code: rule.code,
          points: nextPoints,
          status: rule.status || "ACTIVE",
        });

        if (!result.ok) {
          throw new Error(`บันทึก "${rule.label}" ไม่สำเร็จ`);
        }
      }

      setMessage("บันทึกการตั้งค่า Coin เรียบร้อยแล้ว");
      await loadRules();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell-wide bg-background pt-2.5 pb-8 font-sarabun">
      <SafetyCultureHero
        eyebrow="POINT SETTINGS"
        title={<>ตั้งค่า Coin ในระบบ</>}
        description="กำหนด Coin ของกิจกรรมหลักใน Safety Awareness, Safety Culture และ Safety Effort ได้จากหน้าเดียว"
        variant="community"
        backgroundImage="/images/heroes/Home01.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
        mascotSrc="/images/mascots/wangjai/17.png"
        mascotAction="idea"
      />

      <Card className="mt-4 rounded-[18px] border border-border bg-(--brand-surface) p-4 shadow-[0_10px_26px_var(--brand-shadow)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[18px] font-black text-[#0B2F6B]">Coin กิจกรรมหลัก</h2>
            <p className="mt-1 text-[12px] font-bold text-[#55739B]">แอดมินสามารถเพิ่มหรือลด Coin ได้เอง แล้วระบบจะใช้ค่าชุดนี้ต่อจากนี้</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-[14px] border border-[#D7EAFE] bg-[#F5FAFF] px-4 py-2 text-center">
              <div className="text-[10px] font-bold text-[#55739B]">รวม Coin ตั้งต้น</div>
              <div className="mt-0.5 text-[20px] font-black text-[#0B82F0]">{totalPoints}</div>
            </div>
            <Button type="button" variant="outline" onClick={() => void loadRules()} disabled={loading || saving} className="h-10 rounded-xl border-[#D7EAFE]">
              <RefreshCcw className="mr-2 h-4 w-4" />
              โหลดใหม่
            </Button>
            <Button type="button" onClick={() => void onSaveRules()} disabled={loading || saving || !hasChanges} className="h-10 rounded-full bg-[#0B82F0] hover:bg-[#0973d6] text-white transition-colors">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึก Coin"}
            </Button>
          </div>
        </div>

        {message && <div className="mt-3 rounded-xl border border-[#C8E9D2] bg-[#EEFFF3] px-3 py-2 text-[12px] font-bold text-[#19734A]">{message}</div>}
        {error && <div className="mt-3 rounded-xl border border-[#FFD3D0] bg-[#FFF4F3] px-3 py-2 text-[12px] font-bold text-[#C7352B]">{error}</div>}

        {groups.map((group) => {
          if (group.rules.length === 0) return null;

          return (
            <div key={group.id} className="mt-6 first:mt-4">
              {/* Group Section Title */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${group.color}`}>
                  {group.name}
                </span>
                <div className="h-[1px] flex-1 bg-[var(--border)]" />
              </div>

              {/* Group Grid Cards */}
              <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {group.rules.map((rule) => (
                  <div key={rule.code} className="rounded-[18px] border border-[#D7EAFE] bg-white p-4 shadow-[0_6px_18px_rgba(185,223,255,0.12)] transition-all duration-200 hover:border-[#0B82F0] hover:shadow-[0_8px_22px_var(--brand-shadow)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-black leading-tight text-[#0B2F6B]">{rule.label}</h3>
                        <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#55739B]">{POINT_RULE_HINTS[rule.code] || rule.sourceType}</p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5FAFF] text-[#0B82F0]">
                        <Trophy className="h-5 w-5" strokeWidth={2.3} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-[11px] font-black text-[#55739B]">Coin</label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={draft[rule.code] ?? ""}
                        onChange={(event) => setDraft((current) => ({ ...current, [rule.code]: event.target.value }))}
                        className="h-11 rounded-xl border-[#D7EAFE] text-[18px] font-black text-[#0B2F6B] focus:border-[#0B82F0]"
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
            </div>
          );
        })}

        {!loading && rules.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-[#D7EAFE] bg-[#F9FBFF] px-4 py-6 text-center text-[13px] font-bold text-[#55739B]">
            ยังไม่พบกติกา Coin ในระบบ
          </div>
        )}
      </Card>
    </div>
  );
}
