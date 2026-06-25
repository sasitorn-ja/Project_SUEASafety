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
  className?: string;
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
  className,
}: SafetyCultureHeroProps) {
  const hasActions = !!actions;
  const sideActions = hasActions && actionsLayout === "side";
  const { theme, mascot, themedImage } = useAppTheme();
  const showMascot = Boolean(mascotSrc);
  const isCommunity = variant === "community";
  const themedMascotSrc = !mascotSrc
    ? ""
    : isCommunity
    ? themedImage(mascotSrc)
    : theme === "wangjai"
      ? mascot(mascotAction)
      : themedImage(mascotSrc);
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
      "relative overflow-hidden font-sarabun",
      isCommunity
        ? "min-h-[100px] rounded-[16px] border border-[#D7EAFE] bg-[linear-gradient(135deg,#EAF6FF_0%,#F7FBFF_46%,#E1F1FF_100%)] shadow-[0_8px_22px_rgba(185,223,255,0.45),inset_0_1px_0_rgba(255,255,255,0.75)] sm:min-h-[116px] sm:rounded-[20px] xl:min-h-[148px]"
        : "rounded-[18px] border-[2px] border-[#0B82F0] bg-[linear-gradient(135deg,#35A8FF_0%,#0B82F0_50%,#006AD6_100%)] shadow-[0_12px_28px_rgba(185,223,255,0.45)]",
      className
    )}
    style={(backgroundImage || backgroundOverlay)
      ? ({
          ...(backgroundImage
            ? {
                background: isCommunity
                  ? `url("${backgroundImage}") center / cover no-repeat`
                  : `${backgroundOverlay || "linear-gradient(90deg, rgba(2,26,66,.82) 0%, rgba(3,33,78,.5) 34%, rgba(3,33,78,.16) 56%, rgba(3,33,78,0) 70%)"}, url("${backgroundImage}") right center / cover no-repeat`,
              }
            : {}),
        } as CSSProperties)
      : undefined}
    onMouseMove={handleMascotPointer}
    onMouseLeave={resetMascotPointer}>
      <div
        className={cn(
          "absolute inset-0",
          isCommunity
            ? "bg-transparent"
            : "bg-[radial-gradient(circle_at_84%_34%,rgba(53,168,255,0.20),transparent_28%),linear-gradient(90deg,rgba(11,47,107,0.24),transparent_54%)]"
        )}
      />
      {!isCommunity ? (
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(-45deg,#35A8FF,#35A8FF_12px,#0B2F6B_12px,#0B2F6B_24px)] md:h-[13px]" />
      ) : null}

      <div
        className={cn(
          "relative z-10 grid items-start gap-2 px-3.5 pt-[6px] pb-[22px] sm:px-4 md:px-6 md:pt-[10px] md:pb-[30px]",
          isCommunity && "min-h-[100px] items-center px-3 py-2 sm:min-h-[116px] sm:grid-cols-[minmax(0,1fr)_160px] sm:px-[18px] sm:py-2.5 xl:min-h-[148px] xl:grid-cols-[minmax(0,1fr)_230px] xl:px-[28px] xl:pt-3 xl:pb-0",
          sideActions
            ? showMascot
              ? "grid-cols-[minmax(0,1fr)_84px] md:grid-cols-[minmax(0,1fr)_132px_minmax(300px,410px)] md:items-center md:gap-5"
              : "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(300px,410px)] md:items-center md:gap-5"
            : !showMascot
            ? "grid-cols-1"
            : hasActions
            ? "grid-cols-[1fr_96px] md:grid-cols-[1fr_150px]"
            : "grid-cols-[1fr_118px] md:grid-cols-[1fr_152px]"
        )}
      >
        <div className={cn("flex min-w-0 flex-col items-start gap-1", isCommunity && "z-[2] gap-[5px] sm:gap-1.5")}>
          <span
            className={cn(
              "mb-[4px] w-fit rounded-full border-[1.2px] px-2.5 py-[3px] text-[10px] leading-none font-extrabold tracking-[0.03em] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] md:text-[11px]",
              isCommunity
                ? "rounded-[7px] border-[#0B82F0] bg-white/85 text-[#0B82F0]"
                : "border-[#35A8FF] bg-white/15 text-white"
            )}
          >
            {eyebrow}
          </span>
          <div
            className={cn(
              "font-extrabold leading-tight",
              isCommunity
                ? "whitespace-nowrap text-[21px] text-[#0B2F6B] [&_span]:text-[#0B82F0] [&_strong]:text-[#0B82F0] sm:text-[24px] xl:text-[30px]"
                : "text-[22px] text-white sm:text-[28px] md:text-[42px]",
              sideActions ? "max-w-[220px] whitespace-normal sm:max-w-[260px] md:max-w-none md:whitespace-nowrap" : "whitespace-nowrap"
            )}
          >
            {title}
          </div>
          <p
            className={cn(
              "mt-1 text-[12px] font-bold leading-[1.45] md:text-[13.5px]",
              isCommunity ? "text-[9px] text-[#55739B] drop-shadow-none sm:text-[12px] xl:text-[13.5px]" : "text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]",
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
                "suea-hero-mascot absolute right-[-2px] bottom-[-10px] h-auto sm:right-[-6px] sm:bottom-[-12px] md:right-0 md:bottom-[-14px]",
                isCommunity && "right-[4px] bottom-[-2px] w-[92px] sm:right-[10px] sm:bottom-[-4px] sm:w-[128px] xl:right-[clamp(14px,2vw,36px)] xl:bottom-[-8px] xl:w-[clamp(142px,12vw,184px)]",
                sideActions && "safety-culture-hero-mascot-side",
                !isCommunity && sideActions
                  ? "w-[74px] sm:w-[86px] md:right-auto md:left-1/2 md:w-[138px] md:-translate-x-1/2 lg:w-[158px]"
                  : !isCommunity && hasActions
                  ? "w-[82px] sm:w-[92px] md:w-[118px] lg:w-[132px]"
                  : !isCommunity
                  ? "w-[112px] sm:w-[122px] md:w-[134px] lg:w-[146px]"
                  : ""
              )}
              data-mascot-action={mascotAction}
            >
              <Image
                src={themedMascotSrc}
                alt={mascotAlt ?? ""}
                width={180}
                height={180}
                priority
                className={cn(
                  "h-auto w-full object-contain",
                  isCommunity
                    ? "drop-shadow-[0_8px_12px_rgba(11,130,240,0.18)]"
                    : "drop-shadow-[0_12px_14px_rgba(0,0,0,0.30)]"
                )}
              />
            </div>
          </div>
        ) : null}

        {sideActions ? <div className="hidden md:flex md:min-w-0 md:justify-end">{actions}</div> : null}
      </div>
    </Card>
  );
}
