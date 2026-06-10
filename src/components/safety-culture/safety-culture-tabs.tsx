"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Trophy, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/safety-culture", label: "Feed", icon: Heart },
  { href: "/safety-culture/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/safety-culture/rewards", label: "Rewards", icon: Gift },
];

export function SafetyCultureTabs() {
  const pathname = usePathname();

  return (
    <div className="flex w-full justify-start font-sarabun">
      <div className="flex w-full sm:max-w-[480px] items-center rounded-full border-[2.8px] border-[#5c3214] bg-[#FFFDF7] p-[3px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_4px_10px_rgba(92,50,20,0.04)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;

          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <Button
                variant="ghost"
                className={cn(
                  "h-[32px] w-full rounded-full text-[13px] md:text-[13.5px] font-bold tracking-[-0.1px] md:h-[36px] transition-all duration-200",
                  active
                    ? "bg-[#5c3214] text-white hover:bg-[#5c3214] hover:text-white shadow-[0_3px_8px_rgba(92,50,20,0.25)]"
                    : "text-[#5c3214]/75 hover:bg-transparent hover:text-[#5c3214]"
                )}
              >
                <Icon className="mr-1.5 h-[13px] w-[13px]" strokeWidth={2} />
                {tab.label}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
