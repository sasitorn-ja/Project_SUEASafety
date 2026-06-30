"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";

import SafetyEffortProgressStepper from "@/features/safety-effort/components/SafetyEffortProgressStepper";
import { cn } from "@/lib/utils";
import { type MascotAction, useAppTheme } from "@/providers/theme-provider";

type ProgressMascotProps = {
  action: MascotAction;
  alt?: string;
  className?: string;
};

type ProgressHeaderProps = {
  title: string;
  current: number;
  mascotAction: MascotAction;
  onBack: () => void;
  subtitle?: string;
  className?: string;
};

export function ProgressHeaderBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Image
        src="/images/heroes/safety-effort-category-hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-40"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#EEF7FF_0%,rgba(238,247,255,0.96)_38%,rgba(238,247,255,0.70)_68%,rgba(238,247,255,0.38)_100%)]" />
    </div>
  );
}

export function ProgressMascot({ action, alt = "", className }: ProgressMascotProps) {
  const { mascot } = useAppTheme();

  return (
    <Image
      src={mascot(action)}
      alt={alt}
      width={360}
      height={420}
      priority
      sizes="(max-width: 639px) 92px, (max-width: 1279px) 150px, 180px"
      className={cn(
        "home-hero-mascot absolute -bottom-4 right-1 h-[108px] w-auto object-contain object-bottom drop-shadow-[0_10px_14px_rgba(4,37,86,0.18)] sm:-bottom-6 sm:right-6 sm:h-[148px] xl:-bottom-7 xl:right-10 xl:h-[180px]",
        className,
      )}
    />
  );
}

export function ProgressHeader({
  title,
  current,
  mascotAction,
  onBack,
  subtitle,
  className,
}: ProgressHeaderProps) {
  return (
    <section
      className={cn(
        "relative flex h-[148px] w-full flex-shrink-0 items-center overflow-hidden rounded-[20px] border border-[#B9DDFF]/60 bg-[#EEF7FF] px-3 py-3 shadow-[0_12px_30px_rgba(185,223,255,0.4)] sm:h-[156px] sm:px-[18px] xl:h-[168px] xl:px-[28px]",
        className,
      )}
    >
      <ProgressHeaderBackdrop />
      <ProgressMascot action={mascotAction} />

      <div className="relative z-10 flex w-full items-center pr-[108px] font-sarabun sm:pr-[190px] xl:pr-[230px]">
        <div className="flex min-w-0 flex-col items-start justify-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="ย้อนกลับ"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] border border-[#D7EAFE] bg-white text-[#0B82F0] transition-all duration-300 hover:bg-[#0B82F0] hover:text-white active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.6} />
            </button>
            <div className="min-w-0">
              <h1 className="text-[22px] font-black leading-tight text-[#0B2F6B] sm:text-[28px] xl:text-[32px]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-[13px] font-semibold leading-snug text-[#55739B] sm:text-[14px]">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <span className="text-[13px] font-extrabold uppercase text-[#55739B] sm:text-[14px]">
              ความคืบหน้า
            </span>
            <SafetyEffortProgressStepper current={current} total={4} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
