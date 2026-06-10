import type { ReactNode } from "react";

type SafetyCulturePageHeaderProps = {
  eyebrow: string;
  title: string;
  pointsLabel?: string;
  pointsValue?: string;
  rightSlot?: ReactNode;
};

export function SafetyCulturePageHeader({
  eyebrow,
  title,
  pointsLabel,
  pointsValue,
  rightSlot,
}: SafetyCulturePageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-[#8E8A81]">
          {eyebrow}
        </span>
        <h1 className="text-[26px] font-[850] tracking-tight text-[#1A1A1A]">
          {title}
        </h1>
      </div>

      {rightSlot ?? (pointsLabel && pointsValue ? (
        <div className="flex min-w-[90px] flex-col items-center justify-center rounded-2xl border-[1.5px] border-[#DDD9CD] bg-white px-4 py-2 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
          <span className="text-[8.5px] font-extrabold tracking-wide text-[#8E8A81]">
            {pointsLabel}
          </span>
          <span className="text-lg font-black leading-tight text-[#1A1A1A]">
            {pointsValue}
          </span>
        </div>
      ) : null)}
    </div>
  );
}
