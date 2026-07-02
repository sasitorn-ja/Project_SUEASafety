import React from "react";
import { cn } from "@/lib/utils";

interface CoinBadgeProps {
  amount: number | string;
  prefix?: string;
  suffix?: string;
  size?: "sm" | "md" | "lg";
  variant?: "blue" | "lightBlue" | "white" | "gradient";
  className?: string;
  showCoinIcon?: boolean;
}

export function CoinBadge({
  amount,
  prefix = "+",
  suffix = "Coin",
  size = "md",
  variant = "blue",
  className,
  showCoinIcon = true,
}: CoinBadgeProps) {
  const formattedAmount =
    typeof amount === "number" ? amount.toLocaleString("en-US") : amount;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px] gap-1.5",
    md: "px-3.5 py-1.5 text-[13px] sm:text-[14px] gap-2",
    lg: "px-5 py-2 text-[15px] sm:text-[16px] gap-2.5",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5 sm:h-5 sm:w-5",
    lg: "h-5.5 w-5.5 sm:h-6 sm:w-6",
  };

  const variantClasses = {
    blue: "bg-[#0b82f0] text-white shadow-[0_4px_12px_rgba(11,130,240,0.3)] border border-blue-400/30",
    lightBlue: "bg-[#e6f4ff] text-[#0b82f0] border border-[#b3d8ff] shadow-sm",
    white: "bg-white text-[#0b82f0] border border-[#d9e5f3] shadow-sm",
    gradient: "bg-gradient-to-r from-[#188fff] to-[#0663d2] text-white shadow-[0_4px_14px_rgba(24,143,255,0.35)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-black leading-none transition-all select-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {showCoinIcon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/icons/STCoin.png"
          alt="Coin"
          className={cn("object-contain shrink-0 drop-shadow-sm", iconSizes[size])}
        />
      )}
      <span className="tracking-wide">
        {prefix}
        {formattedAmount} {suffix}
      </span>
    </span>
  );
}
