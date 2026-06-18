"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type MascotAction, useAppTheme } from "@/providers/theme-provider";

type SafetyCultureHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  mascotSrc: string;
  mascotAlt: string;
  mascotAction?: MascotAction;
  actions?: ReactNode;
  actionsLayout?: "stacked" | "side";
};

export function SafetyCultureHero({
  eyebrow,
  title,
  description,
  mascotSrc,
  mascotAlt,
  mascotAction = "happy",
  actions,
  actionsLayout = "stacked",
}: SafetyCultureHeroProps) {
  const hasActions = !!actions;
  const sideActions = hasActions && actionsLayout === "side";
  const { theme, mascot } = useAppTheme();
  const themedMascotSrc = theme === "wangjai" ? mascot(mascotAction) : mascotSrc;

  return (
    <Card className="relative overflow-hidden rounded-[18px] border-[2px] border-[var(--brand-accent)] bg-[linear-gradient(135deg,var(--brand-hero-start)_0%,var(--brand-nav)_50%,var(--brand-hero-end)_100%)] shadow-[0_12px_28px_var(--brand-shadow)] font-sarabun">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_34%,rgba(var(--brand-accent-rgb),0.20),transparent_28%),linear-gradient(90deg,rgba(22,10,2,0.24),transparent_54%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(-45deg,var(--brand-accent-strong),var(--brand-accent-strong)_12px,var(--c-15120e)_12px,var(--c-15120e)_24px)] md:h-[13px]" />

      <div
        className={cn(
          "relative z-10 grid items-start gap-2 px-3.5 pt-[4px] pb-[10px] sm:px-4 md:px-6 md:pt-[6px] md:pb-[14px]",
          sideActions
            ? "grid-cols-[minmax(0,1fr)_84px] md:grid-cols-[minmax(0,1fr)_132px_minmax(300px,410px)] md:items-center md:gap-5"
            : hasActions
            ? "grid-cols-[1fr_96px] md:grid-cols-[1fr_150px]"
            : "grid-cols-[1fr_100px] md:grid-cols-[1fr_130px]"
        )}
      >
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span className="mb-[4px] w-fit rounded-full border-[1.2px] border-[var(--brand-accent)] bg-[rgba(var(--brand-accent-rgb),0.12)] px-2.5 py-[3px] text-[10px] md:text-[11px] leading-none font-extrabold tracking-[0.03em] text-[var(--brand-hero-label)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            {eyebrow}
          </span>
          <div
            className={cn(
              "text-[22px] sm:text-[28px] md:text-[42px] font-extrabold leading-tight text-white",
              sideActions ? "max-w-[220px] whitespace-normal sm:max-w-[260px] md:max-w-none md:whitespace-nowrap" : "whitespace-nowrap"
            )}
          >
            {title}
          </div>
          <p
            className={cn(
              "text-[12px] md:text-[13.5px] font-bold leading-[1.45] text-[var(--brand-hero-copy)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] mt-1",
              sideActions ? "max-w-[220px] sm:max-w-[270px] md:max-w-[420px]" : "max-w-[290px] sm:max-w-[400px] md:max-w-[780px]"
            )}
          >
            {description}
          </p>
          {!sideActions ? actions : null}
        </div>

        <div
          className={cn(
            "relative flex h-full min-h-[90px] items-end justify-end overflow-visible md:min-h-[110px]",
            sideActions ? "min-h-[128px] justify-end md:min-h-[150px] md:justify-center" : ""
          )}
        >
          <Image
            src={themedMascotSrc}
            alt={mascotAlt}
            width={180}
            height={180}
            priority
            className={cn(
              "suea-hero-mascot absolute right-[-2px] bottom-[-2px] h-auto object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.30)] sm:right-[-6px] md:right-0",
              sideActions
                ? "w-[74px] sm:w-[86px] md:right-auto md:left-1/2 md:w-[138px] md:-translate-x-1/2 lg:w-[158px]"
                : hasActions
                ? "w-[82px] sm:w-[92px] md:w-[118px] lg:w-[132px]"
                : "w-[92px] sm:w-[102px] md:w-[112px] lg:w-[118px]"
            )}
          />
        </div>

        {sideActions ? <div className="hidden md:flex md:min-w-0 md:justify-end">{actions}</div> : null}
      </div>
    </Card>
  );
}
