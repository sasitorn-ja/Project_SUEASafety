"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, FileText, Gift, Heart, Home, LayoutDashboard, LogOut, Menu, ShieldCheck, Trophy, UserRound, X } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { cn } from "@/lib/utils";
import { isExactNavActive, isMainNavActive } from "@/lib/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppState } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";
import { getSessionDisplayName, getSessionProfileImage, hasAdminAccess, useSessionUser } from "@/lib/session-user";
import {
  MENU_STORAGE_KEY,
  MENU_UPDATED_EVENT,
  type MenuNode,
  findAdminMenu,
  getMenuIcon,
  loadMenu,
} from "@/lib/menu-config";

function NavTo(props: any) {
  return <Link prefetch={false} {...props} />;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "safety-effort", label: "Safety Effort", icon: ShieldCheck, href: "/category" },
  { id: "safety-culture", label: "Safety Culture", icon: Heart, href: "/safety-culture" },
  { id: "admin", label: "Admin", icon: UserRound, href: "/safety-admin" },
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
] as const;

const PROFILE_ITEMS = [
  {
    label: "\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e02\u0e2d\u0e07\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19",
    href: "/profile/activity-history",
    icon: FileText,
  },
  {
    label: "ออกจากระบบ",
    href: "/api/auth/logout",
    icon: LogOut,
  },
] as const;

const ENABLED_HREFS = new Set(["/", "/dashboard", "/category", "/were-ok", "/work-permit", "/safety-culture", "/safety-admin", "/notifications", "/login"]);

function ConfiguredMenuLink({
  node,
  pathname,
  onClick,
  compact = false,
  asLabel = false,
}: {
  node: MenuNode;
  pathname: string;
  onClick?: () => void;
  compact?: boolean;
  asLabel?: boolean;
}) {
  const Icon = getMenuIcon(node.icon);
  const content = (
    <>
      {Icon && (
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-[rgba(var(--brand-accent-rgb),0.18)] text-[var(--brand-hero-label)]">
          <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[12.5px] font-extrabold leading-[16px] text-white">{node.label}</span>
        {node.description && <span className="mt-0.5 block text-[10.5px] font-semibold leading-[14px] text-white/[0.68]">{node.description}</span>}
      </span>
    </>
  );

  // asLabel: หัวข้อหมวด (เช่น Safety Effort / Safety Culture) — แสดงเป็นชื่อหมวดเฉยๆ ไม่ลิงก์ไปหน้า
  if (asLabel || !node.href) {
    return <div className="flex items-center gap-2.5 rounded-lg p-2 text-white">{content}</div>;
  }

  return (
    <NavTo
      href={node.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg p-2 text-white transition-colors hover:bg-white/10",
        isExactNavActive(pathname, node.href) && "bg-white/10"
      )}
    >
      {content}
    </NavTo>
  );
}

function AdminFlyoutSection({ section, pathname }: { section: MenuNode; pathname: string }) {
  const children = section.children.filter((node) => node.enabled);

  if (children.length === 0) {
    return <ConfiguredMenuLink node={section} pathname={pathname} compact />;
  }

  return (
    <div className="group/admin-section relative">
      <div className="flex cursor-default items-center rounded-lg hover:bg-white/10">
        <div className="min-w-0 flex-1">
          <ConfiguredMenuLink node={section} pathname={pathname} compact asLabel />
        </div>
        {children.length > 0 && <ChevronDown className="mr-1.5 h-3 w-3 -rotate-90 text-white/70" strokeWidth={2.5} />}
      </div>
      {children.length > 0 && (
        <div className="invisible absolute left-full top-0 z-50 w-[min(300px,calc(100vw-32px))] -translate-x-1 pl-1.5 opacity-0 transition-all duration-150 group-hover/admin-section:visible group-hover/admin-section:translate-x-0 group-hover/admin-section:opacity-100">
          <div className="max-h-[calc(100vh-var(--topbar-h)-24px)] overflow-y-auto rounded-xl border border-white/[0.14] bg-[rgba(var(--brand-nav-rgb),0.98)] p-1.5 shadow-[0_18px_44px_var(--brand-shadow)] backdrop-blur-xl">
            {children.map((child) => (
              <ConfiguredMenuLink key={child.id} node={child} pathname={pathname} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DesktopTopbar() {
  const { mascot, theme } = useAppTheme();
  const { inboxNotifications } = useAppState();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [configuredMenu, setConfiguredMenu] = useState<MenuNode[]>([]);
  const { user: sessionUser } = useSessionUser();
  const isWangjai = theme === "wangjai";
  const [desktopMenu, setDesktopMenu] = useState<"dashboard" | "safety-culture" | "admin" | "profile" | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const unreadNotificationCount = inboxNotifications.filter((item) => !item.read).length;

  const isActive = (href: string) => isMainNavActive(pathname, href);

  useEffect(() => {
    setDesktopMenu(null);
    setNotificationOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (!desktopNavRef.current?.contains(event.target as Node)) {
        setDesktopMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDesktopMenu(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const refreshMenu = () => setConfiguredMenu(loadMenu());
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === MENU_STORAGE_KEY) refreshMenu();
    };
    refreshMenu();
    window.addEventListener(MENU_UPDATED_EVENT, refreshMenu);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(MENU_UPDATED_EVENT, refreshMenu);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);


  const configuredAdmin = findAdminMenu(configuredMenu);
  const canUseAdmin = hasAdminAccess(sessionUser);
  const navItems = canUseAdmin ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== "admin");
  const adminSections = canUseAdmin ? configuredAdmin?.children.filter((node) => node.enabled) ?? [] : [];
  const displayName = sessionUser ? getSessionDisplayName(sessionUser) : "ผู้ใช้งาน";
  const displayImage = getSessionProfileImage(sessionUser);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [displayImage]);

  return (
    <header
      className={cn(
        "hidden min-[1100px]:flex fixed top-0 left-0 right-0 z-50 items-center",
        "home-desktop-topbar",
        "bg-[rgba(var(--brand-nav-rgb),0.92)] border-b border-white/10",
        "shadow-[0_10px_30px_var(--brand-shadow)] backdrop-blur-[16px]",
        "[transition:margin-left_200ms_ease-out]",
        "ml-0"
      )}
      style={{ fontFamily: "var(--font-sans)", height: "var(--topbar-h)" }}
    >
      <div className="desktop-topbar-inner mx-auto flex h-full w-full max-w-[1540px] items-center justify-between gap-[22px] px-6 xl:px-12">
        <NavTo href="/" className="desktop-brand flex min-w-[200px] items-center gap-3.5">
          <Image src="/images/LOGO1_trim.png" alt="Safety Caring" width={300} height={52} priority className="h-[40px] w-auto object-contain" />
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
                {navItems.map((item) => {
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
                  <Heart className="h-3.5 w-3.5" strokeWidth={2.3} />
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
                  <UserRound className="h-3.5 w-3.5" strokeWidth={2.3} />
                  <span>Admin</span>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {adminSections.map((section) => (
                    <div key={section.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
                      <ConfiguredMenuLink
                        node={section}
                        pathname={pathname}
                        onClick={() => setOpen(false)}
                        compact
                        asLabel={section.children.filter((node) => node.enabled).length > 0}
                      />
                      {section.children.filter((node) => node.enabled).length > 0 && (
                        <div className="ml-3 border-l border-white/15 pl-2">
                          {section.children.filter((node) => node.enabled).map((child) => (
                            <ConfiguredMenuLink key={child.id} node={child} pathname={pathname} onClick={() => setOpen(false)} compact />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <nav ref={desktopNavRef} className="desktop-nav-visible flex min-w-0 flex-1 items-center justify-center gap-2" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const enabled = ENABLED_HREFS.has(item.href);

            if (item.id === "admin") {
              return (
                <div key={item.id} className="relative">
                  <button type="button" onClick={() => setDesktopMenu((current) => current === "admin" ? null : "admin")} aria-expanded={desktopMenu === "admin"} aria-haspopup="menu" className={cn("desktop-nav-item home-desktop-nav-item inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-bold whitespace-nowrap transition-all", active && "is-home-active", active ? "bg-[var(--brand-nav-active)] text-white" : "bg-transparent text-white/[0.82] hover:bg-white/10 hover:text-white")}>
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                    <span className="desktop-nav-label">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", desktopMenu === "admin" && "rotate-180")} />
                  </button>
                  <div className={cn("absolute right-0 top-full z-50 w-[320px] pt-2 transition-all duration-150", desktopMenu === "admin" ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0")}>
                    <div className="overflow-visible rounded-xl border border-white/[0.14] bg-[rgba(var(--brand-nav-rgb),0.96)] p-1.5 text-white shadow-[0_18px_44px_var(--brand-shadow)] backdrop-blur-xl">
                      {adminSections.map((section) => (
                        <AdminFlyoutSection key={section.id} section={section} pathname={pathname} />
                      ))}
                      {adminSections.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs font-bold text-white/60">ยังไม่มีเมนูย่อย Admin</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (item.id === "safety-culture") {
              const menuId = "safety-culture";
              const submenuItems = SAFETY_CULTURE_ITEMS;
              return (
                <div
                  key={item.id}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => setDesktopMenu((current) => current === menuId ? null : menuId)}
                    aria-expanded={desktopMenu === menuId}
                    aria-haspopup="menu"
                    className={cn(
                      "desktop-nav-item inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-bold whitespace-nowrap transition-all",
                      "home-desktop-nav-item",
                      active && "is-home-active",
                      active ? "bg-[var(--brand-nav-active)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_rgba(0,0,0,0.18)]" : "bg-transparent text-white/[0.82] hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                    <span className="desktop-nav-label">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", desktopMenu === menuId && "rotate-180")} />
                  </button>

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
                            onClick={() => setDesktopMenu(null)}
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
                  "desktop-nav-item inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-bold whitespace-nowrap transition-all",
                  "home-desktop-nav-item",
                  active && "is-home-active",
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

        <div className="desktop-actions flex flex-shrink-0 items-center gap-1.5">
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen((current) => !current)}
              className={cn(
                "relative flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full",
                "bg-transparent text-white transition-opacity hover:opacity-70",
                notificationOpen && "bg-white/10"
              )}
              aria-label="Notifications"
              title="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell className="h-5 w-5" strokeWidth={2.3} />
              {unreadNotificationCount > 0 ? (
                <span
                  className="absolute -top-[5px] -right-[5px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-accent)] px-[3px] text-[10px] font-bold text-[var(--brand-accent-contrast)]"
                  style={{ outline: "2px solid var(--nav-brown)" }}
                >
                  {Math.min(unreadNotificationCount, 9)}
                </span>
              ) : null}
            </button>

            <div
              className={cn(
                "absolute right-0 top-full z-50 w-[312px] max-w-[calc(100vw-32px)] pt-2 transition-all duration-150",
                notificationOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
              )}
            >
              <div className="rounded-[22px] border border-[#e5e7eb] bg-white p-2 text-[#111827] shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                <NotificationCenter compact onItemClick={() => setNotificationOpen(false)} />
              </div>
            </div>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setDesktopMenu("profile")}
            onMouseLeave={() => setDesktopMenu((current) => (current === "profile" ? null : current))}
            onFocus={() => setDesktopMenu("profile")}
          >
            <NavTo
              href="/profile"
              aria-label="โปรไฟล์ของฉัน"
              className={cn(
                "login-btn-compact inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[var(--brand-accent)] p-0 text-white",
                "shadow-[0_8px_18px_rgba(var(--brand-accent-rgb),0.22)] transition-colors hover:bg-[var(--brand-accent)]"
              )}
            >
              {displayImage && !profileImageFailed ? (
                <img
                  src={displayImage}
                  alt={displayName}
                  onError={() => setProfileImageFailed(true)}
                  className="h-full w-full rounded-full border-2 border-white/75 object-cover"
                />
              ) : (
                <UserRound className="h-[18px] w-[18px]" strokeWidth={2.5} />
              )}
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
