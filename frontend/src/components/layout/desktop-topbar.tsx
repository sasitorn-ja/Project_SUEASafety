"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, FileText, Gift, Heart, Home, LayoutDashboard, LogOut, ShieldCheck, Trophy, UserRound } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { cn } from "@/lib/utils";
import { isExactNavActive, isMainNavActive } from "@/lib/navigation";
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
    label: "ฟีด",
    href: "/safety-culture",
    icon: Heart,
    description: "แชร์พฤติกรรมความปลอดภัยและเรื่องราวของทีมในฟีด",
  },
  {
    label: "Leaderboard",
    href: "/safety-culture/leaderboard",
    icon: Trophy,
    description: "ติดตามอันดับทีมและ Coin ส่วนตัว",
  },
  {
    label: "ของรางวัล",
    href: "/safety-culture/rewards",
    icon: Gift,
    description: "ดู Coin และของรางวัลที่สามารถแลกได้",
  },
] as const;

const PROFILE_ITEMS = [
  {
    label: "ข้อมูลส่วนตัว",
    href: "/profile",
    icon: UserRound,
  },
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

const ENABLED_HREFS = new Set(["/", "/dashboard", "/category", "/safety-culture", "/safety-admin", "/notifications", "/login"]);

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
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#D7EAFE] bg-[#F5FAFF] text-[#0B82F0]">
          <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[12.5px] font-extrabold leading-[16px] text-[#0B2F6B]">{node.label}</span>
        {node.description && <span className="mt-0.5 block text-[10.5px] font-semibold leading-[14px] text-[#55739B]">{node.description}</span>}
      </span>
    </>
  );

  // asLabel: หัวข้อหมวด (เช่น Safety Effort / Safety Culture) — แสดงเป็นชื่อหมวดเฉยๆ ไม่ลิงก์ไปหน้า
  if (asLabel || !node.href) {
    return <div className="flex items-center gap-2.5 rounded-lg p-2 text-[#0B2F6B]">{content}</div>;
  }

  return (
    <NavTo
      href={node.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg p-2 text-[#0B2F6B] transition-colors hover:bg-[#F5FAFF]",
        isExactNavActive(pathname, node.href) && "bg-[#EEF7FF]"
      )}
    >
      {content}
    </NavTo>
  );
}

function AdminFlyoutSection({
  section,
  pathname,
  onNavigate,
  open,
  onOpen,
  onClose,
}: {
  section: MenuNode;
  pathname: string;
  onNavigate: () => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const children = section.children.filter((node) => node.enabled);
  const submenuId = `admin-submenu-${section.id}`;

  if (children.length === 0) {
    return <ConfiguredMenuLink node={section} pathname={pathname} onClick={onNavigate} compact />;
  }

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center rounded-lg text-left transition-colors hover:bg-[#F5FAFF] focus-visible:bg-[#F5FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FC8FF]"
        aria-expanded={open}
        aria-controls={submenuId}
        onFocus={onOpen}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
      >
        <div className="min-w-0 flex-1">
          <ConfiguredMenuLink node={section} pathname={pathname} compact asLabel />
        </div>
        <ChevronDown
          className={cn("mr-2 h-3.5 w-3.5 shrink-0 -rotate-90 text-[#55739B] transition-transform", open && "text-[#0B82F0]")}
          strokeWidth={2.5}
        />
      </button>
      <div
        id={submenuId}
        className={cn(
          "invisible absolute left-full top-0 z-50 w-[min(300px,calc(100vw-32px))] -translate-x-1 pl-1.5 opacity-0 transition-all duration-150",
          open && "visible translate-x-0 opacity-100",
        )}
      >
        <div className="max-h-[calc(100dvh-var(--topbar-h)-24px)] overflow-y-auto rounded-xl border border-[#D7EAFE] bg-white p-1.5 shadow-[0_18px_44px_rgba(185,223,255,0.55)] backdrop-blur-xl">
          {children.map((child) => (
            <ConfiguredMenuLink key={child.id} node={child} pathname={pathname} onClick={onNavigate} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesktopTopbar() {
  const { mascot, theme } = useAppTheme();
  const { inboxNotifications } = useAppState();
  const pathname = usePathname() ?? "";
  const [configuredMenu, setConfiguredMenu] = useState<MenuNode[]>([]);
  const { user: sessionUser } = useSessionUser();
  const isWangjai = theme === "wangjai";
  const [desktopMenu, setDesktopMenu] = useState<"dashboard" | "safety-culture" | "admin" | "profile" | null>(null);
  const [adminSubmenuId, setAdminSubmenuId] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const unreadNotificationCount = inboxNotifications.filter((item) => !item.read).length;

  const isActive = (href: string) => isMainNavActive(pathname, href);

  useEffect(() => {
    setDesktopMenu(null);
    setAdminSubmenuId(null);
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
  const activeAdminSectionId = adminSections.find((section) =>
    section.children.some(
      (child) => child.enabled && child.href && (pathname === child.href || pathname.startsWith(`${child.href}/`)),
    ),
  )?.id;
  const visibleAdminSubmenuId = adminSubmenuId === null ? activeAdminSectionId : adminSubmenuId;
  const displayName = sessionUser ? getSessionDisplayName(sessionUser) : "ผู้ใช้งาน";
  const displayImage = getSessionProfileImage(sessionUser);
  const handleMenuButtonKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    menuId: "safety-culture" | "admin" | "profile",
  ) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setDesktopMenu(menuId);
    }
  };

  useEffect(() => {
    setProfileImageFailed(false);
  }, [displayImage]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 hidden items-center lg:flex",
        "border-b border-[#D7EAFE] bg-white/95 shadow-[0_6px_20px_rgba(185,223,255,0.45)] backdrop-blur-xl",
        "[transition:margin-left_200ms_ease-out]",
        "ml-0"
      )}
      style={{ fontFamily: "var(--font-sans)", height: "var(--topbar-h)" }}
    >
      <div className="desktop-topbar-inner flex h-full w-full items-center justify-between gap-2 px-6">
        <NavTo href="/" className="flex min-w-[234px] items-center gap-3.5">
          <Image src="/images/brand/LOGO1_trim.png" alt="Safety Caring" width={300} height={52} priority className="h-[40px] w-auto object-contain" />
        </NavTo>

        <nav ref={desktopNavRef} className="desktop-nav-visible flex min-w-0 flex-1 items-center justify-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const enabled = ENABLED_HREFS.has(item.href);

            if (item.id === "admin") {
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseLeave={() => {
                    setDesktopMenu((current) => (current === "admin" ? null : current));
                    setAdminSubmenuId(null);
                  }}
                >
                  <button type="button" onMouseEnter={() => setDesktopMenu("admin")} onClick={() => setDesktopMenu((current) => current === "admin" ? null : "admin")} onKeyDown={(event) => handleMenuButtonKeyDown(event, "admin")} aria-expanded={desktopMenu === "admin"} aria-haspopup="menu" className={cn("desktop-nav-item inline-flex h-11 min-w-[100px] items-center justify-center gap-2 rounded-[13px] border border-transparent px-[15px] text-[14.5px] font-bold whitespace-nowrap transition-all", active ? "bg-[linear-gradient(135deg,#35A8FF_0%,#0B82F0_55%,#006AD6_100%)] text-white" : "bg-transparent text-[#0B2F6B] hover:border-[#D7EAFE] hover:bg-[#F5FAFF] hover:text-[#0B82F0]")}>
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                    <span className="desktop-nav-label">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", desktopMenu === "admin" && "rotate-180")} />
                  </button>
                  <div
                    onMouseEnter={() => setDesktopMenu("admin")}
                    className={cn(
                      "absolute right-[clamp(0px,calc(1400px-100vw),170px)] top-full z-50 w-[320px] pt-2 transition-all duration-150",
                      desktopMenu === "admin" ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-1 opacity-0"
                    )}
                  >
                    <div className="overflow-visible rounded-xl border border-[#D7EAFE] bg-white p-1.5 text-[#0B2F6B] shadow-[0_18px_44px_rgba(185,223,255,0.55)] backdrop-blur-xl">
                      {adminSections.map((section) => (
                        <AdminFlyoutSection
                          key={section.id}
                          section={section}
                          pathname={pathname}
                          onNavigate={() => setDesktopMenu(null)}
                          open={visibleAdminSubmenuId === section.id}
                          onOpen={() => setAdminSubmenuId(section.id)}
                          onClose={() => setAdminSubmenuId((current) => current === section.id ? "" : current)}
                        />
                      ))}
                      {adminSections.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs font-bold text-[#55739B]">ยังไม่มีเมนูย่อย Admin</div>
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
                  onMouseLeave={() => setDesktopMenu((current) => (current === menuId ? null : current))}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setDesktopMenu(menuId)}
                    onClick={() => setDesktopMenu((current) => current === menuId ? null : menuId)}
                    onKeyDown={(event) => handleMenuButtonKeyDown(event, menuId)}
                    aria-expanded={desktopMenu === menuId}
                    aria-haspopup="menu"
                    className={cn(
                      "desktop-nav-item inline-flex h-11 min-w-[100px] items-center justify-center gap-2 rounded-[13px] border border-transparent px-[15px] text-[14.5px] font-bold whitespace-nowrap transition-all",
                      active ? "bg-[linear-gradient(135deg,#35A8FF_0%,#0B82F0_55%,#006AD6_100%)] text-white shadow-[0_8px_20px_rgba(11,130,240,0.22)]" : "bg-transparent text-[#0B2F6B] hover:border-[#D7EAFE] hover:bg-[#F5FAFF] hover:text-[#0B82F0]"
                    )}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                    <span className="desktop-nav-label">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", desktopMenu === menuId && "rotate-180")} />
                  </button>

                  <div
                    onMouseEnter={() => setDesktopMenu(menuId)}
                    className={cn(
                      "absolute left-1/2 top-full z-50 w-[320px] -translate-x-1/2 pt-2 transition-all duration-150",
                      desktopMenu === menuId ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-1 opacity-0"
                    )}
                  >
                    <div className="max-h-[calc(100vh-var(--topbar-h)-24px)] overflow-y-auto rounded-xl border border-[#D7EAFE] bg-white p-1.5 text-[#0B2F6B] shadow-[0_18px_44px_rgba(185,223,255,0.55)] backdrop-blur-xl">
                      {submenuItems.map((subitem) => {
                        const SubIcon = subitem.icon;

                        return (
                          <NavTo
                            key={subitem.href}
                            href={subitem.href}
                            onClick={() => setDesktopMenu(null)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg p-2 text-[#0B2F6B] transition-colors hover:bg-[#F5FAFF] focus:bg-[#F5FAFF] focus:outline-none",
                              isExactNavActive(pathname, subitem.href) && "bg-[#EEF7FF]"
                            )}
                          >
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#D7EAFE] bg-[#F5FAFF] text-[#0B82F0]">
                              <SubIcon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[12.5px] font-extrabold leading-[16px] text-[#0B2F6B]">{subitem.label}</span>
                              <span className="mt-0.5 block text-[10.5px] font-semibold leading-[14px] text-[#55739B]">{subitem.description}</span>
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
                  "desktop-nav-item inline-flex h-11 min-w-[100px] items-center justify-center gap-2 rounded-[13px] border border-transparent px-[15px] text-[14.5px] font-bold whitespace-nowrap transition-all",
                  active && enabled ? "bg-[linear-gradient(135deg,#35A8FF_0%,#0B82F0_55%,#006AD6_100%)] text-white shadow-[0_8px_20px_rgba(11,130,240,0.22)]" : "bg-transparent text-[#0B2F6B] hover:border-[#D7EAFE] hover:bg-[#F5FAFF] hover:text-[#0B82F0]",
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
                "bg-transparent text-[#0B82F0] transition-opacity hover:opacity-70",
                notificationOpen && "bg-[#F5FAFF]"
              )}
              aria-label="Notifications"
              title="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell className="h-5 w-5" strokeWidth={2.3} />
              {unreadNotificationCount > 0 ? (
                <span
                  className="absolute -top-[5px] -right-[5px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0B82F0] px-[3px] text-[10px] font-bold text-white"
                  style={{ outline: "2px solid #FFFFFF" }}
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
            onMouseLeave={() => setDesktopMenu((current) => (current === "profile" ? null : current))}
          >
            <button
              type="button"
              onMouseEnter={() => setDesktopMenu("profile")}
              onClick={() => setDesktopMenu((current) => (current === "profile" ? null : "profile"))}
              onKeyDown={(event) => handleMenuButtonKeyDown(event, "profile")}
              aria-label="โปรไฟล์ของฉัน"
              aria-haspopup="menu"
              aria-expanded={desktopMenu === "profile"}
              className={cn(
                "inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white p-0 text-[#0B82F0]",
                "shadow-[0_8px_18px_rgba(185,223,255,0.45)] transition-colors hover:bg-[#F5FAFF]"
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
            </button>

            <div
              onMouseEnter={() => setDesktopMenu("profile")}
              className={cn(
                "absolute right-0 top-full z-50 min-w-full pt-2 transition-all duration-150",
                desktopMenu === "profile" ? "visible pointer-events-auto translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-1 opacity-0"
              )}
            >
              <div className="rounded-xl border border-[#D7EAFE] bg-white p-1.5 text-[#0B2F6B] shadow-[0_18px_44px_rgba(185,223,255,0.55)] backdrop-blur-xl">
                {PROFILE_ITEMS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavTo
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 text-[#0B2F6B] transition-colors hover:bg-[#F5FAFF] focus:bg-[#F5FAFF] focus:outline-none",
                        isExactNavActive(pathname, item.href) && "bg-[#EEF7FF]"
                      )}
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#D7EAFE] bg-[#F5FAFF] text-[#0B82F0]">
                        <Icon className="h-[17px] w-[17px]" strokeWidth={2.35} />
                      </span>
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap text-[11.5px] font-extrabold leading-[15px] text-[#0B2F6B]">{item.label}</span>
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
