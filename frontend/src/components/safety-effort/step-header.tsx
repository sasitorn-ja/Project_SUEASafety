"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ChevronLeft, Check } from "lucide-react";

type StepHeaderProps = {
  /** Current step (1-based). */
  step: number;
  /** Total steps in the flow. */
  total?: number;
  /** Small uppercase badge, e.g. "ACTIVITY" / "LINE WALK". */
  category: string;
  /** Main heading text. */
  title: string;
  /** Back handler. Omit to hide the back button. */
  onBack?: () => void;
  /** Mascot image. Defaults to the shared Safety Effort mascot so every screen matches. */
  mascotSrc?: string;
  /** Optional control rendered on the right (e.g. a "locate me" button). */
  rightExtra?: ReactNode;
};

function StepPips({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-1.5">
            {n > 1 && (
              <span
                className="h-[2px] w-3 rounded-full"
                style={{ background: n <= current ? "var(--brand-accent)" : "rgba(255,255,255,0.15)" }}
              />
            )}
            <span
              className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9.5px] font-black"
              style={{
                background: done ? "#1f7a55" : active ? "var(--brand-accent)" : "rgba(255,255,255,0.1)",
                color: done ? "#fff" : active ? "var(--c-1a1613)" : "rgba(255,255,255,0.4)",
                boxShadow: active ? "0 0 0 3px rgba(var(--brand-accent-rgb),0.18)" : "none",
                border: !done && !active ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : n}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Shared step header for the Safety Effort flow (Activity → Check-in → Line Walk → Safety Contact). */
export function StepHeader({
  step,
  total = 4,
  category,
  title,
  onBack,
  mascotSrc = "/images/icons/safety-effort-mascot.png",
  rightExtra,
}: StepHeaderProps) {
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-none border-y border-white/10 px-4 pt-3 pb-5 text-[var(--brand-soft)] shadow-[0_8px_24px_rgba(6,43,99,0.18)] md:rounded-[16px] md:border md:px-5"
      style={{ background: "linear-gradient(105deg, var(--brand-hero-start) 0%, var(--brand-hero-end) 48%, var(--brand-nav) 100%)" }}
    >
      {/* hazard stripe */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px]"
        style={{ background: "repeating-linear-gradient(135deg, var(--brand-accent) 0 10px, #0e0f12 10px 20px)" }}
      />

      <div className="relative z-[1] flex items-center justify-between gap-3">
        {/* Left: back + titles */}
        <div className="flex min-w-0 items-center gap-2.5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="ย้อนกลับ"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-white outline-none transition-colors hover:bg-white/[0.16]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
            </button>
          ) : null}
          <div className="hidden h-6 w-px bg-white/15 sm:block" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-[rgba(255,248,230,0.85)]">
                Step {step}
              </span>
              <span className="inline-flex items-center rounded-full border border-[rgba(var(--brand-accent-rgb),0.25)] bg-[rgba(var(--brand-accent-rgb),0.16)] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-[var(--brand-accent)]">
                {category}
              </span>
            </div>
            <h1 className="mt-0.5 truncate text-[17px] font-black leading-tight text-white md:text-[19px]">{title}</h1>
          </div>
        </div>

        {/* Right: optional control + stepper + mascot (fixed position/size on every screen) */}
        <div className="flex flex-shrink-0 items-center gap-3">
          {rightExtra}
          <div className="hidden flex-col items-end gap-1 sm:flex">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[rgba(255,248,230,0.6)]">Safety Effort</span>
            <div className="flex items-center gap-1.5">
              <StepPips current={step} total={total} />
              <span className="text-[11px] font-black text-[var(--brand-accent)]">{step} / {total}</span>
            </div>
          </div>
          <Image
            src={mascotSrc}
            alt="Safety mascot"
            width={140}
            height={140}
            priority
            className="mascot-motion mascot-motion-compact h-[58px] w-auto flex-shrink-0 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
          />
        </div>
      </div>
    </div>
  );
}
