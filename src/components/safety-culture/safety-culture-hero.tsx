"use client";

import Image from "next/image";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type MascotAction, useAppTheme } from "@/providers/theme-provider";

type SafetyCultureHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  mascotSrc?: string;
  mascotAlt?: string;
  mascotAction?: MascotAction;
  actions?: ReactNode;
  actionsLayout?: "stacked" | "side";
  variant?: "default" | "community";
  backgroundImage?: string;
  backgroundOverlay?: string;
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
  variant = "default",
  backgroundImage,
  backgroundOverlay,
}: SafetyCultureHeroProps) {
  const hasActions = !!actions;
  const sideActions = hasActions && actionsLayout === "side";
  const { theme, mascot } = useAppTheme();
  const showMascot = Boolean(mascotSrc);
  const themedMascotSrc = !mascotSrc
    ? ""
    : variant === "community"
    ? mascotSrc
    : theme === "wangjai"
      ? mascot(mascotAction)
      : mascotSrc;
  const handleMascotPointer = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    event.currentTarget.style.setProperty("--mascot-look-x", `${Math.max(-1, Math.min(1, x)) * 5}px`);
    event.currentTarget.style.setProperty("--mascot-look-y", `${Math.max(-1, Math.min(1, y)) * 4}px`);
    event.currentTarget.style.setProperty("--mascot-look-rotate", `${Math.max(-1, Math.min(1, x)) * 2.5}deg`);
  };

  const resetMascotPointer = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--mascot-look-x", "0px");
    event.currentTarget.style.setProperty("--mascot-look-y", "0px");
    event.currentTarget.style.setProperty("--mascot-look-rotate", "0deg");
  };

  return (
    <Card className={cn(
      "relative overflow-hidden rounded-[18px] border-[2px] border-[var(--brand-accent)] bg-[linear-gradient(135deg,var(--brand-hero-start)_0%,var(--brand-nav)_50%,var(--brand-hero-end)_100%)] shadow-[0_12px_28px_var(--brand-shadow)] font-sarabun",
      variant === "community" && "safety-culture-community-hero"
    )}
    style={(backgroundImage || backgroundOverlay)
      ? ({
          ...(backgroundImage ? { "--sc-hero-image": `url("${backgroundImage}")` } : {}),
          ...(backgroundOverlay ? { "--sc-hero-overlay": backgroundOverlay } : {}),
          // For the default (non-community) variant the CSS variables above are
          // unused, so apply the photo background inline as well.
          ...(backgroundImage && variant !== "community"
            ? {
                background: `${backgroundOverlay || "linear-gradient(90deg, rgba(2,26,66,.82) 0%, rgba(3,33,78,.5) 34%, rgba(3,33,78,.16) 56%, rgba(3,33,78,0) 70%)"}, url("${backgroundImage}") center / cover no-repeat`,
              }
            : {}),
        } as CSSProperties)
      : undefined}
    onMouseMove={handleMascotPointer}
    onMouseLeave={resetMascotPointer}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_34%,rgba(var(--brand-accent-rgb),0.20),transparent_28%),linear-gradient(90deg,rgba(22,10,2,0.24),transparent_54%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(-45deg,var(--brand-accent-strong),var(--brand-accent-strong)_12px,var(--c-15120e)_12px,var(--c-15120e)_24px)] md:h-[13px]" />

      <div
        className={cn(
          "safety-culture-hero-grid relative z-10 grid items-start gap-2 px-3.5 pt-[6px] pb-[22px] sm:px-4 md:px-6 md:pt-[10px] md:pb-[30px]",
          sideActions
            ? showMascot
              ? "grid-cols-[minmax(0,1fr)_84px] md:grid-cols-[minmax(0,1fr)_132px_minmax(300px,410px)] md:items-center md:gap-5"
              : "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(300px,410px)] md:items-center md:gap-5"
            : !showMascot
            ? "grid-cols-1"
            : hasActions
            ? "grid-cols-[1fr_96px] md:grid-cols-[1fr_150px]"
            : "grid-cols-[1fr_100px] md:grid-cols-[1fr_130px]"
        )}
      >
        <div className="safety-culture-hero-copy flex min-w-0 flex-col items-start gap-1">
          <span className="mb-[4px] w-fit rounded-full border-[1.2px] border-[var(--brand-accent)] bg-[rgba(var(--brand-accent-rgb),0.12)] px-2.5 py-[3px] text-[10px] md:text-[11px] leading-none font-extrabold tracking-[0.03em] text-[var(--brand-hero-label)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            {eyebrow}
          </span>
          <div
            className={cn(
              "safety-culture-hero-title",
              "text-[22px] sm:text-[28px] md:text-[42px] font-extrabold leading-tight text-white",
              sideActions ? "max-w-[220px] whitespace-normal sm:max-w-[260px] md:max-w-none md:whitespace-nowrap" : "whitespace-nowrap"
            )}
          >
            {title}
          </div>
          <p
            className={cn(
              "safety-culture-hero-description",
              "text-[12px] md:text-[13.5px] font-bold leading-[1.45] text-[var(--brand-hero-copy)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] mt-1",
              sideActions ? "max-w-[220px] sm:max-w-[270px] md:max-w-[420px]" : "max-w-[290px] sm:max-w-[400px] md:max-w-[780px]"
            )}
          >
            {description}
          </p>
          {!sideActions ? actions : null}
        </div>

        {showMascot ? (
          <div
            className={cn(
              "relative flex h-full min-h-[90px] items-end justify-end overflow-visible md:min-h-[110px]",
              sideActions ? "min-h-[128px] justify-end md:min-h-[150px] md:justify-center" : ""
            )}
          >
            <div
              className={cn(
                "suea-hero-mascot safety-culture-hero-mascot absolute right-[-2px] bottom-[-2px] h-auto sm:right-[-6px] md:right-0",
                sideActions && "safety-culture-hero-mascot-side",
                sideActions
                  ? "w-[74px] sm:w-[86px] md:right-auto md:left-1/2 md:w-[138px] md:-translate-x-1/2 lg:w-[158px]"
                  : hasActions
                  ? "w-[82px] sm:w-[92px] md:w-[118px] lg:w-[132px]"
                  : "w-[92px] sm:w-[102px] md:w-[112px] lg:w-[118px]"
              )}
              data-mascot-action={mascotAction}
            >
              <Image
                src={themedMascotSrc}
                alt={mascotAlt ?? ""}
                width={180}
                height={180}
                priority
                className="safety-culture-hero-mascot-image h-auto w-full object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.30)]"
              />
            </div>
          </div>
        ) : null}

        {sideActions ? <div className="hidden md:flex md:min-w-0 md:justify-end">{actions}</div> : null}
      </div>
    </Card>
  );
}
