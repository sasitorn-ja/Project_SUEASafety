"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, FileText, Gift, Heart, Home, LayoutDashboard, Menu, ShieldCheck, Trophy, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isExactNavActive, isMainNavActive } from "@/lib/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppTheme } from "@/providers/theme-provider";
import { getProfileDisplayName, PROFILE_IMAGE_KEY, PROFILE_IMAGE_UPDATED_EVENT } from "@/lib/profile";
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
    label: "กิจกรรมของผู้ใช้งาน",
    href: "/profile/activity-history",
    icon: FileText,
  },
] as const;

const ENABLED_HREFS = new Set(["/", "/dashboard", "/category", "/were-ok", "/work-permit", "/safety-culture", "/safety-admin", "/notifications"]);

function ConfiguredMenuLink({
  node,
  pathname,
  onClick,
  compact = false,
}: {
  node: MenuNode;
  pathname: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  const Icon = getMenuIcon(node.icon);
  const content = (
    <>
      {Icon && <Icon className={compact ? "h-3.5 w-3.5 flex-shrink-0 text-[var(--brand-accent)]" : "h-4 w-4 flex-shrink-0 text-[var(--brand-hero-label)]"} strokeWidth={2.35} />}
      <span className="min-w-0">
        <span className={cn("block font-extrabold text-white", compact ? "text-[11px]" : "text-[11.5px]")}>{node.label}</span>
        {!compact && node.description && <span className="mt-0.5 block text-[9px] font-semibold leading-[11px] text-white/[0.62]">{node.description}</span>}
      </span>
    </>
  );

  if (!node.href) {
    return <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-white">{content}</div>;
  }

  return (
    <NavTo
      href={node.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-white transition-colors hover:bg-white/10",
        isExactNavActive(pathname, node.href) && "bg-white/10"
      )}
    >
      {content}
    </NavTo>
  );
}

function AdminFlyoutSection({
  section,
  pathname,
  open,
  onOpen,
}: {
  section: MenuNode;
  pathname: string;
  open: boolean;
  onOpen: () => void;
}) {
  const children = section.children.filter((node) => node.enabled);
  const Icon = getMenuIcon(section.icon);
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    return <ConfiguredMenuLink node={section} pathname={pathname} compact />;
  }

  return (
    <div className="relative" onMouseEnter={onOpen}>
      <button
        type="button"
        onPointerDown={onOpen}
        onClick={onOpen}
        className={cn(
          "flex w-full items-center rounded-lg hover:bg-white/10",
          open && "bg-white/10"
        )}
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-white">
          {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />}
          <span className="min-w-0">
            <span className="block text-[11px] font-extrabold text-white">{section.label}</span>
          </span>
        </span>
        <ChevronDown className={cn("mr-1.5 h-3 w-3 -rotate-90 text-white/70", open && "text-[var(--brand-accent)]")} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="absolute left-full top-0 z-50 w-[245px] -translate-x-1 pl-1.5 opacity-100 transition-all duration-150">
          <div className="max-h-[calc(100vh-var(--topbar-h)-24px)] overflow-y-auto rounded-lg border border-white/[0.14] bg-[rgba(var(--brand-nav-rgb),0.98)] p-1 shadow-[0_14px_32px_var(--brand-shadow)] backdrop-blur-xl">
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
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [configuredMenu, setConfiguredMenu] = useState<MenuNode[]>([]);
  const [profileImage, setProfileImage] = useState("");
  const isWangjai = theme === "wangjai";
  const [desktopMenu, setDesktopMenu] = useState<"safety-culture" | "admin" | "profile" | null>(null);
  const [openAdminSection, setOpenAdminSection] = useState<string | null>(null);

  const isActive = (href: string) => isMainNavActive(pathname, href);

  useEffect(() => {
    setDesktopMenu(null);
    setOpenAdminSection(null);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

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

  useEffect(() => {
    const refreshProfileImage = () => {
      try {
        setProfileImage(window.localStorage.getItem(PROFILE_IMAGE_KEY) || "");
      } catch {
        setProfileImage("");
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === PROFILE_IMAGE_KEY) refreshProfileImage();
    };
    refreshProfileImage();
    window.addEventListener(PROFILE_IMAGE_UPDATED_EVENT, refreshProfileImage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PROFILE_IMAGE_UPDATED_EVENT, refreshProfileImage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const configuredAdmin = findAdminMenu(configuredMenu);
  const adminSections = configuredAdmin?.children.filter((node) => node.enabled) ?? [];
  const firstAdminSectionId = adminSections[0]?.id ?? null;

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

        <div className="desktop-compact-menu-wrap">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className={cn(
              "compact-toggle-visible hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-full",
              "border border-white/[0.12] bg-white/[0.08] text-white",
              "cursor-pointer hover:bg-white/16 hover:text-white"
            )}
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            title={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" strokeWidth={2.35} /> : <Menu className="h-5 w-5" strokeWidth={2.35} />}
          </button>

          {open && (
            <div className="desktop-compact-menu-layer" role="presentation">
              <button type="button" className="desktop-compact-menu-overlay" aria-label="ปิดเมนู" onClick={() => setOpen(false)} />
              <div className="desktop-compact-menu-sheet" role="menu" aria-label="เมนูหลัก">
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
                      <UserRound className="h-3.5 w-3.5" strokeWidth={2.3} />
                      <span>Admin</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {adminSections.map((section) => (
                        <div key={section.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
                          <ConfiguredMenuLink node={section} pathname={pathname} onClick={() => setOpen(false)} compact />
                          {section.children.filter((node) => node.enabled).length > 0 && (
                            <div className="ml-3 border-l border-white/15 pl-2">
                              {section.children.filter((node) => node.enabled).map((child) => (
                                <ConfiguredMenuLink key={child.id} node={child} pathname={pathname} onClick={() => setOpen(false)} compact />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {adminSections.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-xs font-bold text-white/60">ยังไม่มีเมนูย่อย Admin</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="desktop-nav-visible flex min-w-0 flex-1 items-center justify-center gap-2" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const enabled = ENABLED_HREFS.has(item.href);

            if (item.id === "admin") {
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => {
                    setDesktopMenu("admin");
                    setOpenAdminSection((current) => current ?? firstAdminSectionId);
                  }}
                  onMouseLeave={() => {
                    setDesktopMenu(null);
                    setOpenAdminSection(null);
                  }}
                  onFocus={() => {
                    setDesktopMenu("admin");
                    setOpenAdminSection((current) => current ?? firstAdminSectionId);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (desktopMenu === "admin") {
                        setDesktopMenu(null);
                        setOpenAdminSection(null);
                      } else {
                        setDesktopMenu("admin");
                        setOpenAdminSection(firstAdminSectionId);
                      }
                    }}
                    className={cn(
                      "desktop-nav-item inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-4 text-sm font-bold whitespace-nowrap transition-all",
                      active ? "bg-[var(--brand-nav-active)] text-white" : "bg-transparent text-white/[0.82] hover:bg-white/10 hover:text-white"
                    )}
                    aria-expanded={desktopMenu === "admin"}
                    aria-haspopup="menu"
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                    <span className="desktop-nav-label">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", desktopMenu === "admin" && "rotate-180")} />
                  </button>
                  <div className={cn("absolute right-[-64px] top-full z-50 w-[220px] pt-1.5 transition-all duration-150", desktopMenu === "admin" ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0")}>
                    <div className="overflow-visible rounded-lg border border-white/[0.14] bg-[rgba(var(--brand-nav-rgb),0.96)] p-1 text-white shadow-[0_14px_32px_var(--brand-shadow)] backdrop-blur-xl">
                      {adminSections.map((section) => (
                        <AdminFlyoutSection
                          key={section.id}
                          section={section}
                          pathname={pathname}
                          open={openAdminSection === section.id}
                          onOpen={() => setOpenAdminSection(section.id)}
                        />
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

        <div className="desktop-actions flex flex-shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <NavTo
            href="/notifications"
            className={cn(
              "relative flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full",
              "bg-transparent text-white transition-opacity hover:opacity-70",
              isExactNavActive(pathname, "/notifications") && "bg-white/10"
            )}
            aria-label="การแจ้งเตือน"
            title="การแจ้งเตือน"
          >
            <Bell className="h-5 w-5" strokeWidth={2.3} />
            <span
              className="absolute -top-[5px] -right-[5px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-accent)] px-[3px] text-[10px] font-bold text-[var(--brand-accent-contrast)]"
              style={{ outline: "2px solid var(--nav-brown)" }}
            >
              3
            </span>
          </NavTo>

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
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={getProfileDisplayName()}
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
