"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, ChevronDown, Gift, Heart, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type MascotAction, useAppTheme } from "@/providers/theme-provider";
import { useAppState } from "@/providers/app-providers";

type AssistantContext = {
  action: MascotAction;
  greeting: string;
  message: string;
};

function getAssistantContext(pathname: string, awarenessDoneToday: boolean): AssistantContext {
  if (pathname.startsWith("/safety-culture/rewards")) {
    return { action: "happy", greeting: "เลือกรางวัลกันไหม?", message: "คะแนนของคุณพร้อมแลกเป็นรางวัลแล้ว" };
  }
  if (pathname.startsWith("/safety-culture/leaderboard")) {
    return { action: "salute", greeting: "มาดูอันดับกัน", message: "ติดตามคะแนนของคุณและทีมได้ที่นี่" };
  }
  if (pathname.startsWith("/safety-culture/post")) {
    return { action: "clipboard", greeting: "มีเรื่องดี ๆ มาแชร์ไหม?", message: "แชร์พฤติกรรมปลอดภัยเพื่อสร้างแรงบันดาลใจ" };
  }
  if (pathname.startsWith("/safety-culture/admin-")) {
    return { action: "radio", greeting: "พร้อมช่วยจัดการ", message: "ตรวจข้อมูลให้เรียบร้อยก่อนบันทึกนะ" };
  }
  if (pathname.startsWith("/safety-culture")) {
    return { action: "announce", greeting: "สวัสดีจาก Safety Culture", message: "แวะดูเรื่องราวความปลอดภัยล่าสุดกัน" };
  }
  if (!awarenessDoneToday) {
    return { action: "flashlight", greeting: "อย่าลืม Safety Awareness", message: "ตอบคำถามประจำวันให้ครบก่อนเริ่มงาน" };
  }
  return { action: "happy", greeting: "วันนี้ทำได้ดีมาก", message: "สะสมคะแนน Safety ต่อกันนะ" };
}

export function FloatingSafetyAssistant() {
  const pathname = usePathname() ?? "";
  const { mascot } = useAppTheme();
  const { currentUserPoints, awarenessDoneToday } = useAppState();
  const [open, setOpen] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const context = useMemo(
    () => getAssistantContext(pathname, awarenessDoneToday),
    [pathname, awarenessDoneToday]
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ปิดเมื่อกดที่ว่างด้านนอก หรือกด Esc
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (asideRef.current && !asideRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <aside
      ref={asideRef}
      className="floating-safety-assistant fixed bottom-[calc(var(--mobile-bottomnav-h)+14px)] right-3 z-[35] flex flex-col items-end font-sans md:bottom-5 md:right-5"
      aria-label="ผู้ช่วยน้องวางใจ"
    >
      <div
        className={cn(
          "mb-2 w-[270px] origin-bottom-right overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(var(--brand-nav-rgb),0.97)] text-white shadow-[0_18px_46px_var(--brand-shadow)] backdrop-blur-xl transition-all duration-200",
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2 scale-95 opacity-0"
        )}
      >
        <div className="flex items-start gap-2.5 border-b border-white/10 p-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--brand-accent)]">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-black">{context.greeting}</p>
            <p className="mt-0.5 text-[10.5px] font-bold leading-relaxed text-white/65">{context.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/65 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            aria-label="ย่อผู้ช่วย"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-2">
          <div className="col-span-2 flex items-center justify-between rounded-xl bg-white/[0.08] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-white/70">
              <Trophy className="h-3.5 w-3.5 text-[var(--brand-accent)]" strokeWidth={2.5} />
              คะแนนของฉัน
            </span>
            <span className="text-[15px] font-black text-[var(--brand-accent)]">{currentUserPoints.toLocaleString()}</span>
          </div>
          <Link href="/" className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-2.5 py-2 text-[10.5px] font-extrabold hover:bg-white/[0.14]">
            <Award className="h-4 w-4 text-[var(--brand-accent)]" strokeWidth={2.4} />
            หน้าคะแนน
          </Link>
          <Link href="/safety-culture/rewards" className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-2.5 py-2 text-[10.5px] font-extrabold hover:bg-white/[0.14]">
            <Gift className="h-4 w-4 text-[var(--brand-accent)]" strokeWidth={2.4} />
            แลกรางวัล
          </Link>
          <Link href="/safety-culture" className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-2.5 py-2 text-[10.5px] font-extrabold hover:bg-white/[0.14]">
            <Heart className="h-4 w-4 text-[var(--brand-accent)]" strokeWidth={2.4} />
            Safety Culture
          </Link>
          <Link href="/safety-culture/leaderboard" className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-2.5 py-2 text-[10.5px] font-extrabold hover:bg-white/[0.14]">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-accent)]" strokeWidth={2.4} />
            ดูอันดับ
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "floating-safety-assistant-trigger group relative flex h-[56px] w-[56px] items-center justify-center rounded-full border-2 border-white/70 bg-[rgba(var(--brand-nav-rgb),0.90)] shadow-[0_14px_34px_var(--brand-shadow)] outline-none backdrop-blur-lg transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-[var(--brand-accent)] md:h-[64px] md:w-[64px]",
          open && "scale-105"
        )}
        aria-expanded={open}
        aria-label={open ? "ย่อผู้ช่วยน้องวางใจ" : "เปิดผู้ช่วยน้องวางใจ"}
      >
        <span className="absolute -left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--brand-nav)] bg-[var(--brand-accent)] text-[9px] font-black text-[var(--brand-accent-contrast)]">
          !
        </span>
        <Image
          src={mascot(context.action)}
          alt="น้องวางใจ ผู้ช่วย Safety"
          width={96}
          height={96}
          className="floating-safety-assistant-image h-[66px] w-[66px] max-w-none object-contain md:h-[76px] md:w-[76px]"
        />
      </button>
    </aside>
  );
}
