"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ClipboardCheck,
  Gift,
  Heart,
  HeartPulse,
  Home,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isExactNavActive, isMainNavActive } from "@/lib/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppTheme } from "@/providers/theme-provider";

function NavTo(props: any) {
  return <Link prefetch={false} {...props} />;
}

const MAIN_ITEMS = [
  { id: "dashboard", label: "Home", icon: Home, href: "/" },
  { id: "safety-effort", label: "Safety Effort", icon: ShieldCheck, href: "/category" },
  { id: "were-ok", label: "We're OK", icon: HeartPulse, href: "/were-ok" },
  { id: "work-permit", label: "Work Permit", icon: ClipboardCheck, href: "/work-permit" },
  { id: "safety-culture", label: "Safety Culture", icon: UsersRound, href: "/safety-culture" },
  { id: "admin", label: "Admin", icon: Settings2, href: "/safety-admin" },
];

const CULTURE_ITEMS = [
  { label: "Feed", icon: Heart, href: "/safety-culture" },
  { label: "Leaderboard", icon: Trophy, href: "/safety-culture/leaderboard" },
  { label: "Rewards", icon: Gift, href: "/safety-culture/rewards" },
];

const ADMIN_ITEMS = [
  { label: "Safety Admin", icon: ShieldCheck, href: "/safety-admin" },
  { label: "Admin Edit Event", icon: Settings2, href: "/safety-culture/admin-event" },
  { label: "Admin Edit Leaderboard", icon: Trophy, href: "/safety-culture/admin-leaderboard" },
  { label: "Admin Edit Reward", icon: Gift, href: "/safety-culture/admin-reward" },
] as const;

const ENABLED_HREFS = new Set([
  "/category",
  "/",
  "/were-ok",
  "/work-permit",
  "/safety-culture",
  "/safety-culture/leaderboard",
  "/safety-culture/rewards",
  "/safety-admin",
  "/notifications",
]);

export function MobileTopbar({ hidden = false }: { hidden?: boolean }) {
  const { mascot, theme } = useAppTheme();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const isWangjai = theme === "wangjai";

  const isActive = (href: string) => isMainNavActive(pathname, href);

  const closeDrawer = () => setOpen(false);
  const menuLabel = open ? "ปิดเมนู" : "เปิดเมนู";

  return (
    <>
      <div
        className={cn(
          "fixed top-0 right-0 left-0 z-50 flex items-center justify-between gap-2 px-2.5 md:hidden",
          "border-b border-white/[0.08] bg-[rgba(var(--brand-nav-rgb),0.96)] shadow-[0_8px_24px_var(--brand-shadow)]",
          "backdrop-blur-[14px] transition-transform duration-200",
          "[transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]",
          hidden && "-translate-y-full"
        )}
        style={{ fontFamily: "var(--font-sans)", height: "var(--mobile-topbar-h)" }}
        role="banner"
      >
        <div className="flex min-w-0 items-center gap-[9px]">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-white transition-opacity hover:opacity-70"
            aria-label={menuLabel}
            title={menuLabel}
            aria-expanded={open}
          >
            {open ? (
              <X className="h-[18px] w-[18px]" strokeWidth={2.45} />
            ) : (
              <Menu className="h-[18px] w-[18px]" strokeWidth={2.45} />
            )}
          </button>

          <NavTo href="/" onClick={closeDrawer} className="flex min-w-0 items-center gap-[9px]">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center overflow-hidden">
              <Image
                src={mascot("logo")}
                alt="SUEA Safety Logo"
                width={30}
                height={30}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex min-w-0 flex-col leading-[1.1]">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-extrabold tracking-normal text-white">
                {isWangjai ? (
                  <>
                    <strong className="text-[var(--brand-accent)]">C.P.A.C</strong> Safe +
                  </>
                ) : (
                  <>
                    <strong className="text-[var(--brand-accent)]">SUEA</strong> Safety
                  </>
                )}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] font-bold text-white/[0.58]">
                {isWangjai ? "Creating Protection And Care" : "Safety User Environment Awareness"}
              </span>
            </div>
          </NavTo>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <button
            className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-transparent text-white transition-opacity hover:opacity-70"
            aria-label="ค้นหา"
            title="ค้นหา"
          >
            <Search className="h-[17px] w-[17px]" strokeWidth={2.4} />
          </button>
          <NavTo
            href="/notifications"
            className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-transparent text-white transition-opacity hover:opacity-70"
            aria-label="การแจ้งเตือน"
            title="การแจ้งเตือน"
          >
            <Bell className="h-[17px] w-[17px]" strokeWidth={2.4} />
            <span className="absolute -top-[3px] -right-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full border-[1.5px] border-[var(--brand-nav)] bg-[var(--brand-accent-strong)] text-[10px] font-extrabold text-[var(--brand-nav)]">
              3
            </span>
          </NavTo>
        </div>
      </div>

      {open && (
        <div className="mobile-drawer-layer md:hidden">
          <button className="mobile-drawer-overlay" aria-label="ปิดเมนู" onClick={closeDrawer} />
          <aside className="mobile-drawer-aside" aria-label="เมนูหลัก">
            <div className="grid grid-cols-1 gap-2">
              {MAIN_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const enabled = ENABLED_HREFS.has(item.href);

                return (
                  <NavTo
                    key={item.id}
                    href={enabled ? item.href : "#"}
                    onClick={() => enabled && closeDrawer()}
                    className={cn(
                      "flex min-h-11 items-center gap-3 truncate rounded-xl px-3 text-xs font-extrabold transition-colors",
                      active && enabled
                        ? "bg-[var(--brand-accent-strong)] text-[var(--brand-nav)]"
                        : "bg-white/10 text-[var(--brand-soft)] hover:bg-white/[0.14]",
                      !enabled && "cursor-not-allowed opacity-60"
                    )}
                    aria-disabled={!enabled}
                  >
                    <Icon
                      className={cn("h-4 w-4 flex-shrink-0", active && enabled ? "text-[var(--brand-nav)]" : "text-[var(--brand-accent)]")}
                      strokeWidth={2.35}
                    />
                    <span className="truncate">{item.label}</span>
                  </NavTo>
                );
              })}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-[rgba(255,247,232,0.10)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="mb-1.5 flex items-center gap-2 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-hero-label)]">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
                <span>Safety Culture</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {CULTURE_ITEMS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavTo
                      key={item.href}
                      href={item.href}
                      onClick={closeDrawer}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-extrabold transition-colors hover:bg-white/[0.12]",
                        isExactNavActive(pathname, item.href) ? "bg-white/[0.12] text-[var(--brand-accent)]" : "text-[var(--brand-soft)]"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />
                      <span>{item.label}</span>
                    </NavTo>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-[rgba(255,247,232,0.10)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="mb-1.5 flex items-center gap-2 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-hero-label)]">
                <Settings2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                <span>Admin</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {ADMIN_ITEMS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavTo
                      key={item.href}
                      href={item.href}
                      onClick={closeDrawer}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-extrabold transition-colors hover:bg-white/[0.12]",
                        isExactNavActive(pathname, item.href) ? "bg-white/[0.12] text-[var(--brand-accent)]" : "text-[var(--brand-soft)]"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />
                      <span>{item.label}</span>
                    </NavTo>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
