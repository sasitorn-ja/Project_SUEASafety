"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, ClipboardCheck, FileText, Gift, Heart, Home, LayoutDashboard, Menu, Settings2, ShieldCheck, Trophy, UserRound, UsersRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isExactNavActive, isMainNavActive } from "@/lib/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppTheme } from "@/providers/theme-provider";

function NavTo(props: any) {
  return <Link prefetch={false} {...props} />;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "safety-effort", label: "Safety Effort", icon: ShieldCheck, href: "/category" },
  { id: "were-ok", label: "We're OK", icon: UsersRound, href: "/were-ok" },
  { id: "work-permit", label: "Work Permit", icon: ClipboardCheck, href: "/work-permit" },
  { id: "safety-culture", label: "Safety Culture", icon: Heart, href: "/safety-culture" },
];

const SAFETY_CULTURE_ITEMS = [
  {
    label: "Feed",
    href: "/safety-culture",
    icon: Heart,
    description: "Share safe behaviors and team stories in the feed",
  },
  {
    label: "Leaderboard",
    href: "/safety-culture/leaderboard",
    icon: Trophy,
    description: "Track team and personal ranking progress",
  },
  {
    label: "Rewards",
    href: "/safety-culture/rewards",
    icon: Gift,
    description: "Review points and available redemption rewards",
  },
  {
    label: "Settings Edit Event",
    href: "/safety-culture/admin-event",
    icon: Settings2,
    description: "Manage Happy Hour Bonus and future event settings",
  },
  {
    label: "Settings Edit Leaderboard",
    href: "/safety-culture/admin-leaderboard",
    icon: Trophy,
    description: "Update teams, leaders, scores, and spotlight rankings",
  },
  {
    label: "Settings Edit Reward",
    href: "/safety-culture/admin-reward",
    icon: Gift,
    description: "Manage reward items, featured rewards, and point costs",
  },
  {
    label: "Settings Safety Awareness",
    href: "/safety-culture/admin-awareness",
    icon: ShieldCheck,
    description: "จัดการคลังคำถาม Safety Awareness และนำเข้าข้อคำถาม",
  },
] as const;

const SAFETY_EFFORT_ITEMS = [
  {
    label: "Settings Safety Effort",
    href: "/safety-admin",
    icon: Settings2,
    description: "จัดการแบบประเมินและรายการตรวจ Safety Effort",
  },
] as const;

const PROFILE_ITEMS = [
  {
    label: "กิจกรรมของผู้ใช้งาน",
    href: "/profile/activity-history",
    icon: FileText,
  },
] as const;

const ENABLED_HREFS = new Set(["/", "/dashboard", "/category", "/were-ok", "/work-permit", "/safety-culture", "/notifications"]);

export function DesktopTopbar() {
  const { mascot, theme } = useAppTheme();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const isWangjai = theme === "wangjai";
  const [desktopMenu, setDesktopMenu] = useState<"safety-effort" | "safety-culture" | "profile" | null>(null);

  const isActive = (href: string) => isMainNavActive(pathname, href);

  useEffect(() => {
    setDesktopMenu(null);
  }, [pathname]);

  return (
    <header
      className={cn(
        "hidden md:flex fixed top-0 left-0 right-0 z-40 items-center",
        "bg-[rgba(var(--brand-nav-rgb),0.92)] border-b border-white/10",
        "shadow-[0_10px_30px_var(--brand-shadow)] backdrop-blur-[16px]",
        "[transition:margin-left_200ms_ease-out]",
        "ml-0"
      )}
      style={{ fontFamily: "var(--font-sans)", height: "var(--topbar-h)" }}
    >
      <div className="desktop-topbar-inner mx-auto flex h-full w-full max-w-[1540px] items-center justify-between gap-[22px] px-6 xl:px-12">
        <NavTo href="/" className="desktop-brand flex min-w-[270px] items-center gap-3">
          <div className="desktop-brand-logo flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md">
            <Image src={mascot("logo")} alt="SUEA Safety Logo" width={46} height={46} className="h-full w-full object-contain" />
          </div>
          <div className="desktop-brand-copy overflow-hidden">
            <div className="desktop-brand-title whitespace-nowrap text-2xl font-extrabold leading-none tracking-normal text-white">
              {isWangjai ? (
                <>
                  <span className="text-[var(--brand-accent)]">CPAC</span> Safe +
                </>
              ) : (
                <>
                  <span className="text-[var(--brand-accent)]">SUEA</span> Safety
                </>
              )}
            </div>
            <div className="desktop-brand-subtitle mt-1 whitespace-nowrap text-[10px] font-semibold text-white/[0.62]">
              {isWangjai ? "Creating Protection And Care" : "Safety User Environment Awareness"}
            </div>
          </div>
        </NavTo>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              "compact-toggle-visible hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-full",
              "border border-white/[0.12] bg-white/[0.08] text-white",
              "cursor-pointer hover:bg-white/16 hover:text-white"
            )}
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            title={open ? "ปิดเมนู" : "เปิดเมนู"}
          >
            {open ? <X className="h-5 w-5" strokeWidth={2.35} /> : <Menu className="h-5 w-5" strokeWidth={2.35} />}
          </SheetTrigger>
          <SheetContent side="top" showCloseButton={false} className="desktop-compact-menu-sheet">
            <div className="flex flex-col gap-3">
              <div className="desktop-compact-grid">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const enabled = ENABLED_HREFS.has(item.href);

                  return (
                    <NavTo
                      key={item.id}
                      href={enabled ? item.href : "#"}
                      onClick={() => enabled && setOpen(false)}
                      className={cn(
                        "flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-bold transition-colors",
                        active && enabled ? "bg-[var(--brand-accent)] text-[var(--brand-nav)]" : "bg-white/[0.08] text-white/[0.82] hover:bg-white/10",
                        !enabled && "cursor-not-allowed opacity-[0.58]"
                      )}
                    >
                      <Icon className="h-[17px] w-[17px]" />
                      {item.label}
                    </NavTo>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5">
                <div className="mb-2 flex items-center gap-2 px-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-hero-label)]">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.3} />
                  <span>Safety Culture</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                  {SAFETY_CULTURE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavTo
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors hover:bg-white/10",
                          isExactNavActive(pathname, item.href) ? "bg-white/10 text-[var(--brand-accent)]" : "text-white/[0.86]"
                        )}
                      >
                        <Icon className="h-[17px] w-[17px] text-[var(--brand-accent)]" strokeWidth={2.3} />
                        {item.label}
                      </NavTo>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5">
                <div className="mb-2 flex items-center gap-2 px-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-hero-label)]">
                  <Settings2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                  <span>Safety Effort Settings</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                  {SAFETY_EFFORT_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavTo
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors hover:bg-white/10",
                          isExactNavActive(pathname, item.href) ? "bg-white/10 text-[var(--brand-accent)]" : "text-white/[0.86]"
                        )}
                      >
                        <Icon className="h-[17px] w-[17px] text-[var(--brand-accent)]" strokeWidth={2.3} />
                        {item.label}
                      </NavTo>
                    );
                  })}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <nav className="desktop-nav-visible flex min-w-0 flex-1 items-center justify-center gap-2" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const enabled = ENABLED_HREFS.has(item.href);

            if (item.id === "safety-effort" || item.id === "safety-culture") {
              const menuId = item.id as "safety-effort" | "safety-culture";
              const submenuItems = item.id === "safety-effort" ? SAFETY_EFFORT_ITEMS : SAFETY_CULTURE_ITEMS;
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setDesktopMenu(menuId)}
                  onMouseLeave={() => setDesktopMenu(null)}
                  onFocus={() => setDesktopMenu(menuId)}
                >
                  <NavTo
                    href={item.href}
                    className={cn(
                      "desktop-nav-item inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap transition-all",
                      active ? "bg-[var(--brand-nav-active)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_rgba(0,0,0,0.18)]" : "bg-transparent text-white/[0.82] hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                    <span className="desktop-nav-label">{item.label}</span>
                  </NavTo>

                  <div
                    className={cn(
                      "absolute left-1/2 top-full z-50 w-[320px] -translate-x-1/2 pt-2 transition-all duration-150",
                      desktopMenu === menuId ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                    )}
                  >
                    <div className="max-h-[calc(100vh-var(--topbar-h)-24px)] overflow-y-auto rounded-xl border border-white/[0.14] bg-[rgba(var(--brand-nav-rgb),0.96)] p-1.5 text-white shadow-[0_18px_44px_var(--brand-shadow)] backdrop-blur-xl">
                      {submenuItems.map((subitem) => {
                        const SubIcon = subitem.icon;

                        return (
                          <NavTo
                            key={subitem.href}
                            href={subitem.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg p-2 text-white transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none",
                              isExactNavActive(pathname, subitem.href) && "bg-white/10"
                            )}
                          >
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-[rgba(var(--brand-accent-rgb),0.18)] text-[var(--brand-hero-label)]">
                              <SubIcon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[12.5px] font-extrabold leading-[16px] text-white">{subitem.label}</span>
                              <span className="mt-0.5 block text-[10.5px] font-semibold leading-[14px] text-white/[0.68]">{subitem.description}</span>
                            </span>
                          </NavTo>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavTo
                key={item.id}
                href={enabled ? item.href : "#"}
                className={cn(
                  "desktop-nav-item inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap transition-all",
                  active && enabled ? "bg-[var(--brand-nav-active)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_rgba(0,0,0,0.18)]" : "bg-transparent text-white/[0.82] hover:bg-white/10",
                  !enabled && "cursor-not-allowed opacity-[0.62] hover:bg-transparent"
                )}
                style={{ transition: "background 0.18s ease, color 0.18s ease, transform 0.18s ease" }}
                aria-disabled={!enabled}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                <span className="desktop-nav-label">{item.label}</span>
              </NavTo>
            );
          })}
        </nav>

        <div className="desktop-actions flex items-center gap-2">
          <ThemeToggle />
          <button
            className={cn(
              "relative flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full",
              "bg-transparent text-white transition-opacity hover:opacity-70"
            )}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" strokeWidth={2.3} />
            <span
              className="absolute -top-[5px] -right-[5px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-accent)] px-[3px] text-[10px] font-bold text-[var(--brand-accent-contrast)]"
              style={{ outline: "2px solid var(--nav-brown)" }}
            >
              3
            </span>
          </button>

          <div
            className="relative"
            onMouseEnter={() => setDesktopMenu("profile")}
            onMouseLeave={() => setDesktopMenu((current) => (current === "profile" ? null : current))}
            onFocus={() => setDesktopMenu("profile")}
          >
            <NavTo
              href="/profile"
              aria-label="โปรไฟล์ของฉัน"
              title="โปรไฟล์ของฉัน"
              className={cn(
                "login-btn-compact inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-[18px] text-sm font-extrabold text-white",
                "shadow-[0_8px_18px_rgba(var(--brand-accent-rgb),0.22)] transition-colors hover:bg-[var(--brand-accent)]"
              )}
            >
              <span className="login-text-visible">โปรไฟล์ของฉัน</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-150", desktopMenu === "profile" && "rotate-180")} strokeWidth={2.6} />
              <UserRound className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </NavTo>

            <div
              className={cn(
                "absolute right-0 top-full z-50 min-w-full pt-2 transition-all duration-150",
                desktopMenu === "profile" ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
              )}
            >
              <div className="rounded-xl border border-white/[0.14] bg-[rgba(var(--brand-nav-rgb),0.96)] p-1.5 text-white shadow-[0_18px_44px_var(--brand-shadow)] backdrop-blur-xl">
                {PROFILE_ITEMS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavTo
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 text-white transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none",
                        isExactNavActive(pathname, item.href) && "bg-white/10"
                      )}
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-[rgba(var(--brand-accent-rgb),0.18)] text-[var(--brand-hero-label)]">
                        <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                      </span>
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap text-[11.5px] font-extrabold leading-[15px] text-white">{item.label}</span>
                      </span>
                    </NavTo>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
