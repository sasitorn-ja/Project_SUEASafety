"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
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
  backgroundPosition?: string;
  backgroundSize?: string;
  contentFrame?: boolean;
  contentClassName?: string;
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
  backgroundPosition,
  backgroundSize,
  contentFrame = false,
  contentClassName,
  className,
}: SafetyCultureHeroProps) {
  const hasActions = !!actions;
  const sideActions = hasActions && actionsLayout === "side";
  const { theme, mascot, themedImage } = useAppTheme();
  const showMascot = Boolean(mascotSrc);
  const isCommunity = variant === "community";
  const shouldShowContentFrame = contentFrame || isCommunity;
  const themedMascotSrc = !mascotSrc
    ? ""
    : theme === "wangjai"
      ? mascot(mascotAction)
      : themedImage(mascotSrc);

  return (
    <Card className={cn(
      "relative left-1/2 w-[calc(100vw-20px)] max-w-none -translate-x-1/2 overflow-hidden font-sarabun lg:w-[calc(100vw-48px)] flex flex-col items-stretch py-0",
      isCommunity
        ? "min-h-[100px] rounded-[16px] border border-[#D7EAFE] bg-[linear-gradient(135deg,#EAF6FF_0%,#F7FBFF_46%,#E1F1FF_100%)] shadow-[0_8px_22px_rgba(185,223,255,0.45),inset_0_1px_0_rgba(255,255,255,0.75)] sm:min-h-[116px] sm:rounded-[20px] xl:min-h-[148px]"
        : "rounded-[18px] border-[2px] border-[#0B82F0] bg-[linear-gradient(135deg,#35A8FF_0%,#0B82F0_50%,#006AD6_100%)] shadow-[0_12px_28px_rgba(11,130,240,0.45)]",
      className
    )}
      style={(backgroundImage || backgroundOverlay)
        ? ({
          ...(backgroundImage
            ? {
              background: isCommunity
                ? `${backgroundOverlay ? backgroundOverlay + ", " : ""}url("${backgroundImage}") ${backgroundPosition || "center"} / ${backgroundSize || "cover"} no-repeat`
                : `${backgroundOverlay || "linear-gradient(90deg, rgba(2,26,66,.82) 0%, rgba(3,33,78,.5) 34%, rgba(3,33,78,.16) 56%, rgba(3,33,78,0) 70%)"}, url("${backgroundImage}") ${backgroundPosition || "right center"} / ${backgroundSize || "cover"} no-repeat`,
            }
            : {}),
        } as CSSProperties)
        : undefined}
    >
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
          "relative z-10 grid items-start gap-2 px-3.5 pt-[18px] pb-[34px] sm:px-4 md:px-6 md:pt-[22px] md:pb-[42px] h-full flex-1",
          isCommunity && "h-full min-h-[100px] items-center px-3 pt-5 pb-5 sm:min-h-[116px] sm:grid-cols-[minmax(0,1fr)_160px] sm:px-[18px] sm:pt-[22px] sm:pb-[22px] xl:min-h-[148px] xl:grid-cols-[minmax(0,1fr)_230px] xl:px-[28px] xl:pt-6 xl:pb-6",
          contentClassName,
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
        <div
          className={cn(
            "flex min-w-0 flex-col items-start gap-1",
            isCommunity && "z-[2] gap-[5px] sm:gap-1.5",
            shouldShowContentFrame &&
            "w-fit max-w-[min(100%,540px)] rounded-[18px] border border-white/75 bg-white/60 px-3 py-2.5 shadow-[0_12px_28px_rgba(11,130,240,.16)] backdrop-blur-[4px] sm:px-4 sm:py-3"
          )}
        >
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
                ? "text-[21px] leading-[1.12] text-[#0B2F6B] [text-wrap:balance] [&_span]:text-[#0B82F0] [&_strong]:text-[#0B82F0] sm:text-[24px] xl:text-[30px]"
                : "text-[22px] text-white sm:text-[28px] md:text-[42px]",
              sideActions
                ? "max-w-[220px] whitespace-normal sm:max-w-[260px] md:max-w-none md:whitespace-nowrap"
                : isCommunity
                  ? "max-w-[190px] whitespace-normal sm:max-w-[250px] sm:whitespace-normal md:max-w-none"
                  : "whitespace-nowrap"
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
              "relative flex h-full min-h-[90px] items-end justify-end overflow-visible md:min-h-[110px] self-stretch",
              sideActions ? "min-h-[128px] justify-end md:min-h-[150px] md:justify-center" : ""
            )}
          >
            <div
              className={cn(
                "suea-hero-mascot safety-culture-hero-mascot absolute right-[-2px] bottom-[-34px] md:bottom-[-42px] translate-y-[7%] h-auto sm:right-[-6px] md:right-0",
                isCommunity && "right-[4px] bottom-[-20px] w-[114px] sm:right-[10px] sm:bottom-[-22px] sm:w-[140px] md:w-[158px] lg:w-[158px] xl:right-[clamp(14px,2vw,36px)] xl:bottom-[-24px] xl:w-[172px]",
                sideActions && "safety-culture-hero-mascot-side",
                !isCommunity && sideActions
                  ? "w-[86px] sm:w-[96px] md:right-auto md:left-1/2 md:w-[152px] md:-translate-x-1/2 lg:w-[172px]"
                  : !isCommunity && hasActions
                    ? "w-[96px] sm:w-[106px] md:w-[132px] lg:w-[146px]"
                    : !isCommunity
                      ? "w-[128px] sm:w-[142px] md:w-[158px] lg:w-[172px]"
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
                  "safety-culture-hero-mascot-image h-auto w-full object-contain",
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
