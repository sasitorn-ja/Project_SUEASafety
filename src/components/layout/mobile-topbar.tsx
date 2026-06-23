"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  Gift,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isExactNavActive, isMainNavActive } from "@/lib/navigation";
import { getSessionDisplayName, getSessionInitials, getSessionProfileImage, hasAdminAccess, useSessionUser } from "@/lib/session-user";
import { useAppTheme } from "@/providers/theme-provider";
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

const CULTURE_ITEMS = [
  { label: "Feed", icon: Heart, href: "/safety-culture" },
  { label: "Leaderboard", icon: Trophy, href: "/safety-culture/leaderboard" },
  { label: "Rewards", icon: Gift, href: "/safety-culture/rewards" },
];

const PROFILE_MENU_ITEMS = [
  { label: "กิจกรรมของผู้ใช้งาน", icon: FileText, href: "/profile/activity-history" },
  { label: "ออกจากระบบ", icon: LogOut, href: "/api/auth/logout" }
];

type NavNode = {
  id: string;
  label: string;
  icon: typeof Home;
  href?: string;
  children?: ReadonlyArray<{ label: string; icon: typeof Home; href: string }>;
};

const NAV_TREE: NavNode[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "safety-effort", label: "Safety Effort", icon: ShieldCheck, href: "/category" },
  { id: "safety-culture", label: "Safety Culture", icon: UsersRound, href: "/safety-culture", children: CULTURE_ITEMS },
  { id: "admin", label: "Admin", icon: UserRound },
];

const ENABLED_HREFS = new Set([
  "/category",
  "/",
  "/dashboard",
  "/were-ok",
  "/work-permit",
  "/safety-culture",
  "/safety-culture/leaderboard",
  "/safety-culture/rewards",
  "/safety-admin",
  "/notifications",
  "/profile",
  "/profile/activity-history",
  "/login",
]);

function MobileConfiguredNode({
  node,
  pathname,
  openSections,
  toggleSection,
  closeDrawer,
}: {
  node: MenuNode;
  pathname: string;
  openSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  closeDrawer: () => void;
}) {
  const Icon = getMenuIcon(node.icon);
  const children = node.children.filter((child) => child.enabled);
  const isOpen = !!openSections[node.id];
  const active = !!node.href && isExactNavActive(pathname, node.href);

  if (children.length === 0) {
    const content = (
      <>
        {Icon && <Icon className="h-[14px] w-[14px] flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />}
        <span className="truncate">{node.label}</span>
      </>
    );
    if (!node.href) {
      return <div className="flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[11px] font-bold text-[var(--brand-soft)]">{content}</div>;
    }
    return (
      <NavTo
        href={node.href}
        onClick={closeDrawer}
        className={cn(
          "flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[11px] font-bold hover:bg-white/[0.12]",
          active ? "bg-white/[0.12] text-[var(--brand-accent)]" : "text-[var(--brand-soft)]"
        )}
      >
        {content}
      </NavTo>
    );
  }

  return (
    <div>
      <div className={cn("flex min-h-9 items-stretch rounded-lg", active && "bg-white/[0.08]")}>
        {node.href ? (
          <NavTo href={node.href} onClick={closeDrawer} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-[11.5px] font-extrabold text-[var(--brand-accent)] hover:bg-white/[0.12]">
            {Icon && <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={2.35} />}
            <span className="truncate">{node.label}</span>
          </NavTo>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-[11.5px] font-extrabold text-[var(--brand-accent)]">
            {Icon && <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={2.35} />}
            <span className="truncate">{node.label}</span>
          </div>
        )}
        <button type="button" onClick={() => toggleSection(node.id)} aria-expanded={isOpen} className="flex w-10 items-center justify-center rounded-r-lg text-[var(--brand-accent)] outline-none hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]">
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} strokeWidth={2.5} />
        </button>
      </div>
      {isOpen && (
        <div className="mt-1 ml-[18px] grid grid-cols-1 gap-1 border-l border-white/15 pl-2">
          {children.map((child) => (
            <MobileConfiguredNode
              key={child.id}
              node={child}
              pathname={pathname}
              openSections={openSections}
              toggleSection={toggleSection}
              closeDrawer={closeDrawer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileTopbar({ hidden = false }: { hidden?: boolean }) {
  const { mascot, theme } = useAppTheme();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const { user: sessionUser } = useSessionUser();
  const [configuredMenu, setConfiguredMenu] = useState<MenuNode[]>([]);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const isWangjai = theme === "wangjai";

  const isActive = (href: string) => isMainNavActive(pathname, href);
  const dashboardActive = pathname === "/dashboard";
  const cultureActive = CULTURE_ITEMS.some((item) => isExactNavActive(pathname, item.href));
  const adminActive = pathname.startsWith("/safety-admin") || pathname.startsWith("/safety-culture/admin-");
  const profileSectionActive = pathname === "/profile" || pathname.startsWith("/profile/");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    "dashboard": dashboardActive,
    "safety-culture": cultureActive,
    admin: adminActive,
    "admin-safety-effort": pathname.startsWith("/safety-admin"),
    "admin-safety-culture": pathname.startsWith("/safety-culture/admin-"),
    profile: profileSectionActive,
  }));


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
  const navTree = canUseAdmin ? NAV_TREE : NAV_TREE.filter((item) => item.id !== "admin");
  const adminSections = canUseAdmin ? configuredAdmin?.children.filter((node) => node.enabled) ?? [] : [];
  const displayName = sessionUser ? getSessionDisplayName(sessionUser) : "ผู้ใช้งาน";
  const displayInitials = sessionUser ? getSessionInitials(sessionUser) : "U";
  const displayUsername = sessionUser?.username || sessionUser?.email || "-";
  const displayImage = getSessionProfileImage(sessionUser);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [displayImage]);

  const toggleSection = (id: string) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const closeDrawer = () => setOpen(false);
  const menuLabel = open ? "à¸›à¸´à¸”à¹€à¸¡à¸™à¸¹" : "à¹€à¸›à¸´à¸”à¹€à¸¡à¸™à¸¹";

  return (
    <>
      <div
        className={cn(
          "fixed top-0 right-0 left-0 z-50 flex items-center justify-between gap-2 px-2.5 min-[1100px]:hidden",
          "home-mobile-topbar",
          "border-b border-white/[0.08] bg-[rgba(var(--brand-nav-rgb),0.96)] shadow-[0_8px_24px_var(--brand-shadow)]",
          "backdrop-blur-[14px] transition-transform duration-200",
          "[transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]",
          hidden && "pointer-events-none -translate-y-full"
        )}
        style={{ fontFamily: "var(--font-sans)", height: "var(--mobile-topbar-h)" }}
        role="banner"
      >
        <div className="flex min-w-0 items-center gap-[9px]">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-white transition-opacity hover:opacity-70"
            aria-label={menuLabel}
            title={menuLabel}
            aria-expanded={open}
          >
            {open ? <X className="h-[23px] w-[23px]" strokeWidth={2.45} /> : <Menu className="h-[23px] w-[23px]" strokeWidth={2.45} />}
          </button>

          <NavTo href="/" onClick={closeDrawer} className="flex min-w-0 items-center">
            <Image src="/images/LOGO1_trim.png" alt="Safety Caring" width={210} height={36} priority className="h-[30px] w-auto object-contain" />
          </NavTo>
        </div>
      </div>

      {open && (
        <div className="mobile-drawer-layer min-[1100px]:hidden">
          <button className="mobile-drawer-overlay" aria-label="ปิดเมนู" onClick={closeDrawer} />
          <aside className="mobile-drawer-aside" aria-label="เมนูหลัก">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div
                  className={cn(
                    "flex min-h-11 w-full items-stretch rounded-xl border border-white/12 bg-white/[0.14] text-white transition-colors hover:bg-white/[0.18]",
                    profileSectionActive && "ring-1 ring-[var(--brand-accent)]"
                  )}
                >
                  <NavTo href="/profile" onClick={closeDrawer} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/12">
                      {displayImage && !profileImageFailed ? (
                        <img src={displayImage} alt={displayName} onError={() => setProfileImageFailed(true)} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[12px] font-black tracking-[0.08em] text-[var(--brand-accent)]">{displayInitials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-black">{displayName}</div>
                      <div className="truncate text-[11px] font-bold text-white/65">@{displayUsername}</div>
                    </div>
                  </NavTo>
                  <button
                    type="button"
                    onClick={() => toggleSection("profile")}
                    aria-expanded={!!openSections.profile}
                    aria-label="\u0e40\u0e1b\u0e34\u0e14\u0e40\u0e21\u0e19\u0e39\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e02\u0e2d\u0e07\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19"
                    className="flex w-12 flex-shrink-0 items-center justify-center rounded-r-xl text-[var(--brand-accent)] outline-none transition-colors hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", openSections.profile && "rotate-180")} strokeWidth={2.5} />
                  </button>
                </div>

                {openSections.profile && (
                  <div className="mt-1 ml-[18px] grid grid-cols-1 gap-1 border-l border-white/15 pl-2">
                    {PROFILE_MENU_ITEMS.map((item) => {
                      const Icon = item.icon;

                      return (
                        <NavTo
                          key={item.href}
                          href={item.href}
                          onClick={closeDrawer}
                          className={cn(
                            "flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[11.5px] font-bold transition-colors hover:bg-white/[0.12]",
                            isExactNavActive(pathname, item.href) ? "bg-white/[0.12] text-[var(--brand-accent)]" : "text-[var(--brand-soft)]"
                          )}
                        >
                          <Icon className="h-[15px] w-[15px] flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />
                          <span className="truncate">{item.label}</span>
                        </NavTo>
                      );
                    })}
                  </div>
                )}
              </div>

              {navTree.map((item) => {
                const Icon = item.icon;

                if (item.id === "admin") {
                  const isOpen = !!openSections.admin;

                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleSection("admin")}
                        aria-expanded={isOpen}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-xs font-extrabold outline-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]",
                          adminActive ? "bg-white/[0.14] text-[var(--brand-accent)]" : "bg-white/10 text-[var(--brand-soft)] hover:bg-white/[0.14]"
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} strokeWidth={2.5} />
                      </button>

                      {isOpen && (
                        <div className="mt-1 ml-[18px] grid grid-cols-1 gap-1 border-l border-white/15 pl-2">
                          {adminSections.map((section) => (
                            <MobileConfiguredNode
                              key={section.id}
                              node={section}
                              pathname={pathname}
                              openSections={openSections}
                              toggleSection={toggleSection}
                              closeDrawer={closeDrawer}
                            />
                          ))}
                          {adminSections.length === 0 && (
                            <div className="px-2.5 py-3 text-[11px] font-bold text-white/55">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹€à¸¡à¸™à¸¹à¸¢à¹ˆà¸­à¸¢ Admin</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.children) {
                  const isOpen = !!openSections[item.id];
                  const sectionActive = item.id === "safety-culture" ? cultureActive : item.id === "dashboard" ? dashboardActive : false;

                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleSection(item.id)}
                        aria-expanded={isOpen}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-xs font-extrabold outline-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]",
                          sectionActive ? "bg-white/[0.14] text-[var(--brand-accent)]" : "bg-white/10 text-[var(--brand-soft)] hover:bg-white/[0.14]"
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} strokeWidth={2.5} />
                      </button>

                      {isOpen && (
                        <div className="mt-1 ml-[18px] grid grid-cols-1 gap-1 border-l border-white/15 pl-2">
                          {item.children.map((sub) => {
                            const SubIcon = sub.icon;

                            return (
                              <NavTo
                                key={sub.href}
                                href={sub.href}
                                onClick={closeDrawer}
                                className={cn(
                                  "flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[11.5px] font-bold transition-colors hover:bg-white/[0.12]",
                                  isExactNavActive(pathname, sub.href) ? "bg-white/[0.12] text-[var(--brand-accent)]" : "text-[var(--brand-soft)]"
                                )}
                              >
                                <SubIcon className="h-[15px] w-[15px] flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.35} />
                                <span className="truncate">{sub.label}</span>
                              </NavTo>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const href = item.href ?? "#";
                const active = isActive(href);
                const enabled = ENABLED_HREFS.has(href);

                return (
                  <NavTo
                    key={item.id}
                    href={enabled ? href : "#"}
                    onClick={() => enabled && closeDrawer()}
                    className={cn(
                      "flex min-h-11 items-center gap-3 truncate rounded-xl px-3 text-xs font-extrabold transition-colors",
                      active && enabled ? "bg-[var(--brand-accent-strong)] text-[var(--brand-nav)]" : "bg-white/10 text-[var(--brand-soft)] hover:bg-white/[0.14]",
                      !enabled && "cursor-not-allowed opacity-60"
                    )}
                    aria-disabled={!enabled}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", active && enabled ? "text-[var(--brand-nav)]" : "text-[var(--brand-accent)]")} strokeWidth={2.35} />
                    <span className="truncate">{item.label}</span>
                  </NavTo>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
