"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, LayoutDashboard, ShieldCheck, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMainNavActive } from "@/lib/navigation";
import { useAppState } from "@/providers/app-providers";

function NavTo(props: any) {
  return <Link prefetch={false} {...props} />;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "safety-effort", label: "Safety Effort", icon: ShieldCheck, href: "/category" },
  { id: "safety-culture", label: "Safety Culture", icon: UsersRound, href: "/safety-culture" },
  { id: "notifications", label: "Notice", icon: Bell, href: "/notifications" },
];

const ENABLED_HREFS = new Set(["/", "/dashboard", "/category", "/were-ok", "/work-permit", "/safety-culture", "/notifications"]);

export function MobileBottomNav({ hidden = false }: { hidden?: boolean }) {
  const { inboxNotifications } = useAppState();
  const pathname = usePathname() ?? "";
  const unreadNotificationCount = inboxNotifications.filter((item) => !item.read).length;

  const isActive = (href: string) => isMainNavActive(pathname, href);

  return (
    <nav
      className={cn(
        "min-[1100px]:hidden fixed bottom-0 left-0 right-0 z-50",
        "home-mobile-bottom-nav",
        "bg-[rgba(var(--brand-nav-rgb),0.96)] border-t border-white/[0.08]",
        "shadow-[0_-10px_28px_var(--brand-shadow)] backdrop-blur-[16px]",
        "mobile-bottom-nav",
        hidden && "pointer-events-none is-hidden"
      )}
      style={{
        fontFamily: "var(--font-sans)",
        minHeight: "calc(var(--mobile-bottomnav-h) + env(safe-area-inset-bottom))",
        paddingBottom: "calc(5px + env(safe-area-inset-bottom))",
      }}
      aria-label="Mobile main navigation"
    >
      <div className="grid h-[60px] w-full grid-cols-5 px-1 pt-[5px]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const enabled = ENABLED_HREFS.has(item.href);
          const showBadge = item.id === "notifications" && unreadNotificationCount > 0;

          return (
            <NavTo
              key={item.id}
              href={enabled ? item.href : "#"}
              className={cn(
                "relative flex min-h-[54px] cursor-pointer select-none flex-col items-center gap-[2px] rounded-[10px] pt-1 pb-0 text-center",
                "home-bottom-nav-item",
                active && "is-home-active",
                "[-webkit-tap-highlight-color:transparent]",
                active && enabled ? "font-black text-[var(--brand-accent)]" : "font-bold text-white/[0.62]",
                !enabled && "cursor-not-allowed opacity-[0.56]",
                !enabled && "active:bg-transparent"
              )}
              style={{
                fontSize: "8.5px",
                fontWeight: active && enabled ? 900 : 700,
                lineHeight: 1.05,
                transition: "background 150ms",
              }}
              aria-disabled={!enabled}
            >
              <span
                className={cn(
                  "absolute -top-[1px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-[var(--brand-accent)] transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <span
                className={cn(
                  "relative flex h-[26px] w-[26px] items-center justify-center rounded-full transition-all",
                  active && enabled ? "bg-[var(--brand-accent)] text-[var(--brand-nav)] shadow-[0_8px_16px_var(--brand-shadow)]" : "bg-transparent"
                )}
                style={{ transition: "background 150ms" }}
              >
                <Icon className="h-[18px] w-[18px] transition-all" strokeWidth={active && enabled ? 2.45 : 2.1} />
                {showBadge ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-accent-strong)] px-[3px] text-[9px] font-black text-[var(--brand-nav)]">
                    {Math.min(unreadNotificationCount, 9)}
                  </span>
                ) : null}
              </span>
              <span
                className="max-w-[52px] overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {item.label}
              </span>
            </NavTo>
          );
        })}
      </div>
    </nav>
  );
}
