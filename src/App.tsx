// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Route, Routes, useLocation, useNavigate } from "./lib/router-compat";
import { useAppTheme } from "@/providers/theme-provider";

const screenLoading = (label) => (
  <div
    style={{
      minHeight: "100%",
      display: "grid",
      placeItems: "center",
      background: "var(--background)",
      color: "#33312c",
      fontFamily: "'Sarabun','Prompt',sans-serif",
      fontWeight: 700,
    }}
  >
    กำลังโหลด{label}...
  </div>
);

const Category = dynamic(() => import("@/features/safety-effort/screens/Category"), {
  ssr: false,
  loading: () => screenLoading("หน้า Safety Effort"),
});

const Activity = dynamic(() => import("@/features/safety-effort/screens/Activity"), {
  ssr: false,
  loading: () => screenLoading("หน้ากิจกรรม"),
});

const CreatePost = dynamic(() => import("@/features/safety-effort/screens/CreatePost"), {
  ssr: false,
  loading: () => screenLoading("หน้าสร้างโพสต์"),
});

const Linewalk = dynamic(() => import("@/features/safety-effort/screens/Linewalk"), {
  ssr: false,
  loading: () => screenLoading("หน้า Line Walk"),
});

const SafetyContact = dynamic(() => import("@/features/safety-effort/screens/SafetyContact"), {
  ssr: false,
  loading: () => screenLoading("หน้าติดต่อ Safety"),
});

const AssessmentSummary = dynamic(() => import("@/features/safety-effort/screens/AssessmentSummary"), {
  ssr: false,
  loading: () => screenLoading("หน้าสรุปผล"),
});

const Checkin = dynamic(() => import("@/features/safety-effort/screens/Checkin"), {
  ssr: false,
  loading: () => screenLoading("หน้าเช็คอิน"),
});

const SafetyAdmin = dynamic(() => import("@/features/safety-effort/screens/SafetyAdmin"), {
  ssr: false,
  loading: () => screenLoading("หน้า Admin"),
});

const DashboardSafetyEffort = dynamic(() => import("@/features/safety-effort/screens/Dashboard Safety Effort"), {
  ssr: false,
  loading: () => screenLoading("หน้าแดชบอร์ดความปลอดภัย"),
});

const Login = dynamic(() => import("@/features/safety-effort/screens/Login"), {
  ssr: false,
  loading: () => screenLoading("หน้าเข้าสู่ระบบ"),
});

// ─────────────────────────────────────────────────────────
// DESIGN TOKENS — navigation-design-spec.md §2 & §10
// ─────────────────────────────────────────────────────────
const T = {
  background:  "var(--background)",
  background2: "var(--secondary)",
  foreground:  "#0e0f12",
  foreground2: "#33312c",
  foreground3: "#767269",
  card:        "#ffffff",
  surface2:    "var(--secondary)",
  primary:     "var(--brand-accent)",
  primaryFg:   "#0e0f12",
  primarySoft: "var(--brand-soft)",
  danger:      "#d5301a",
  ok:          "#1f7a55",
  border:      "rgba(14,15,18,0.10)",
  borderStrong:"#0e0f12",
};

// ─────────────────────────────────────────────────────────
// NAV ITEMS — spec §1
// ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "safety-effort",  label: "Safety Effort",  labelMobile: "Safety\nEffort", route: "/category",       section: "SUEA SAFETY" },
  { id: "were-ok",        label: "We're OK",       labelMobile: "We're OK",       route: "/were-ok",        section: "SUEA SAFETY" },
  { id: "work-permit",    label: "Work Permit",    labelMobile: "Work\nPermit",   route: "/work-permit",    section: "Operations"  },
  { id: "safety-culture", label: "Safety Culture", labelMobile: "Safety\nCulture",route: "/safety-culture", section: "Operations"  },
  { id: "notifications",  label: "Notifications",  labelMobile: "Notifications",  route: "/notifications",  section: "Operations", badge: 3 },
];

const SECTION_ORDER = ["SUEA SAFETY", "Operations"];

// Routes that belong to the "safety-effort" nav section
const SAFETY_EFFORT_ROUTES = ["/category", "/checkin", "/activity", "/create-post", "/linewalk", "/safety-contact", "/assessment-summary", "/dashboard-safety-effort", "/dashboard"];
// Routes where main content is fixed-height (no outer scroll)
const FIXED_CONTENT_ROUTES = ["/safety-admin", "/checkin"];

// ─────────────────────────────────────────────────────────
// INLINE SVG ICONS — no external dependency
// ─────────────────────────────────────────────────────────
const Ico = ({ d, sw = 2.1, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d}
  </svg>
);

const IcoHome    = ({ size, sw }) => <Ico size={size} sw={sw} d={<><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"/><path d="M9 21V12h6v9"/></>}/>;
const IcoShield  = ({ size, sw }) => <Ico size={size} sw={sw} d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>}/>;
const IcoHeart   = ({ size, sw }) => <Ico size={size} sw={sw} d={<><path d="M19.5 13.6 12 21l-7.78-7.78a5.5 5.5 0 0 1 7.78-7.78L12 5.67l1.06-1.06a5.5 5.5 0 0 1 7.78 7.78"/><path d="M3 12h4l2-3 3 6 2-3h7"/></>}/>;
const IcoClip    = ({ size, sw }) => <Ico size={size} sw={sw} d={<><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14l2 2 4-4"/></>}/>;
const IcoUsers   = ({ size, sw }) => <Ico size={size} sw={sw} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const IcoBell    = ({ size, sw }) => <Ico size={size} sw={sw} d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}/>;
const IcoMenu    = ({ size })     => <Ico size={size} sw={2}  d={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}/>;
const IcoSearch  = ({ size, sw }) => <Ico size={size} sw={sw} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoUser    = ({ size })     => <Ico size={size} sw={2}  d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.7a5 5 0 0 1 10 0"/></>}/>;

const NAV_ICONS = [IcoShield, IcoHeart, IcoClip, IcoUsers, IcoBell];

// ─────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────
function Logo({ size = 28 }) {
  const { mascot, theme } = useAppTheme();
  return (
    <img
      src={mascot("logo")}
      alt={theme === "wangjai" ? "น้องวางใจ Safety" : "SUEA Safety tiger"}
      style={{
        width: size, height: size,
        objectFit: "contain", flexShrink: 0, display: "block",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────
// GLOBAL STYLES — spec tokens only
// ─────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&family=Sarabun:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  html, body, #root {
    height: 100%; margin: 0; padding: 0;
    background: var(--background);
    font-family: 'Sarabun','Prompt',sans-serif;
    color: #0e0f12;
  }

  /* ── Sidebar — spec §3.1 ── */
  .app-sidebar {
    position: fixed; left: 0; top: 0;
    width: 256px; height: 100vh;
    background: var(--background);
    border-right: 1px solid rgba(14,15,18,0.10);
    display: flex; flex-direction: column;
    z-index: 40; overflow-y: auto;
    transition: transform 200ms ease-out;
  }
  /* Sidebar scroll-hide: driven by inline style transform */

  /* Brand header */
  .sb-brand {
    height: 60px; padding: 0 16px; flex-shrink: 0;
    border-bottom: 1px solid rgba(14,15,18,0.10);
    display: flex; align-items: center; gap: 12px;
  }

  .sb-section {
    display: block;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: #767269;
    padding: 0 12px; margin-bottom: 8px;
  }

  .sb-item {
    display: flex; align-items: center; gap: 10px;
    height: 40px; width: 100%;
    border-radius: 6px; padding: 0 12px;
    border: none; background: transparent;
    color: #767269;
    font-size: 13.5px; font-weight: 600;
    cursor: pointer; text-align: left;
    position: relative;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    transition: background 0.15s, color 0.15s;
    font-family: inherit;
  }
  .sb-item:hover  { background: var(--secondary); color: #0e0f12; }
  .sb-item.active { background: var(--brand-soft); color: #0e0f12; }

  .sb-rail {
    position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 20px;
    border-radius: 0 999px 999px 0;
    background: var(--brand-accent);
  }

  /* ── Desktop header — spec §3.2: height 60px ── */
  .app-dheader {
    height: 60px; flex-shrink: 0;
    background: var(--background);
    border-bottom: 1px solid rgba(14,15,18,0.10);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; z-index: 30;
    transition: transform 200ms ease-out;
  }
  @media(min-width:1024px){ .app-dheader { padding: 0 32px; } }

  .dh-toggle {
    width: 32px; height: 32px; border-radius: 6px;
    border: 1px solid transparent;
    background: transparent; color: #767269;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
    font-family: inherit;
  }
  .dh-toggle:hover { background: var(--secondary); border-color: rgba(14,15,18,0.10); color: #0e0f12; }

  .dh-notif {
    position: relative;
    width: 32px; height: 32px; border-radius: 6px;
    border: 1px solid rgba(14,15,18,0.10);
    background: var(--brand-surface); color: #33312c;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s;
    font-family: inherit;
  }
  .dh-notif:hover { background: var(--secondary); }

  .dh-user {
    display: flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 10px;
    border: 1px solid rgba(14,15,18,0.10);
    background: var(--brand-surface); border-radius: 6px;
    color: #33312c; font-size: 14px; font-family: inherit;
    max-width: 192px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ── Mobile top bar — spec §4.1 ── */
  .app-topbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: var(--brand-nav);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 2px 10px rgba(0,0,0,0.12);
    transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1);
  }
  .app-topbar-inner {
    height: 52px; padding: 0 16px;
    display: flex; align-items: center; justify-content: space-between;
  }

  /* ── Mobile bottom nav — spec §4.2 & §10 ── */
  .app-bottomnav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    min-height: calc(76px + env(safe-area-inset-bottom));
    padding-bottom: calc(6px + env(safe-area-inset-bottom));
    background: var(--brand-nav);
    border-top: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.10);
    transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1);
    font-family: 'Prompt','Sarabun',sans-serif;
  }
  .app-bottomnav-grid {
    display: grid;
    grid-template-columns: repeat(5,minmax(0,1fr));
    height: 68px; padding: 6px 4px 0;
  }
  .bn-item {
    position: relative;
    display: flex; flex-direction: column;
    align-items: center; justify-content: flex-start; gap: 3px;
    min-height: 58px; padding: 6px 2px 0;
    border-radius: 10px; border: none; background: transparent;
    color: rgba(217, 195, 176, 0.6);
    font-size: 10px; font-weight: 600;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: color 0.15s; font-family: inherit;
  }
  .bn-item.active { color: var(--brand-accent); font-weight: 800; }
  .bn-item:active { background: rgba(255,255,255,0.06); }

  .bn-icon {
    position: relative;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 999px;
    background: transparent;
    transition: background 0.2s;
  }
  .bn-item.active .bn-icon { background: var(--brand-accent); color: var(--brand-nav); }

  .bn-indicator {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 26px; height: 3px; border-radius: 999px;
    background: var(--brand-accent); opacity: 0; transition: opacity 0.2s;
  }
  .bn-item.active .bn-indicator { opacity: 1; }

  .bn-badge {
    position: absolute; top: -4px; right: -7px;
    min-width: 16px; height: 16px; border-radius: 999px;
    background: #d5301a; color: #fff;
    font-size: 10px; font-weight: 800; line-height: 16px;
    display: flex; align-items: center; justify-content: center;
    outline: 2px solid var(--brand-nav); padding: 0 3px;
  }

  .sb-badge {
    min-width: 16px; height: 16px; border-radius: 999px;
    background: #d5301a; color: #fff;
    font-size: 10px; font-weight: 700; line-height: 16px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
  }

  .dh-badge {
    position: absolute; top: -8px; right: -5px;
    min-width: 16px; height: 16px; border-radius: 999px;
    background: #d5301a; color: #fff;
    font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    outline: 2px solid var(--brand-nav); padding: 0 3px;
  }

  .bn-label {
    max-width: 62px; text-align: center; line-height: 1.05;
    display: flex; flex-direction: column; align-items: center;
    overflow: hidden;
  }
`;

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function getActiveId(pathname) {
  if (pathname === "/safety-admin") return "safety-admin";
  if (pathname === "/were-ok" || pathname.startsWith("/were-ok/")) return "were-ok";
  if (pathname === "/safety-culture" || pathname.startsWith("/safety-culture/")) return "safety-culture";
  if (SAFETY_EFFORT_ROUTES.includes(pathname)) return "safety-effort";
  return NAV_ITEMS.find((item) => item.route === pathname)?.id ?? "safety-effort";
}

// ─────────────────────────────────────────────────────────
// DESKTOP SIDEBAR — spec §3.1
// ─────────────────────────────────────────────────────────
function DesktopSidebar({ activeId, onNav, open, navVisible }) {
  // Combine open/close state with scroll-hide visibility
  const translateX = !open
    ? "-100%"
    : navVisible
      ? "0"
      : "-100%";

  return (
    <nav
      aria-label="เมนูหลักบนเดสก์ท็อป"
      className="app-sidebar"
      style={{ transform: `translateX(${translateX})` }}
    >
      {/* Brand */}
      <div className="sb-brand">
        <Logo size={28} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.foreground, lineHeight: 1.2 }}>SUEA Safety</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: T.foreground3, marginTop: 2 }}>Safety workspace</div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: "12px 10px", flex: 1 }}>
        {SECTION_ORDER.map((section, si) => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section} style={{ marginBottom: si < SECTION_ORDER.length - 1 ? 20 : 0 }}>
              <span className="sb-section">{section}</span>
              {items.map(item => {
                const idx    = NAV_ITEMS.indexOf(item);
                const Icon   = NAV_ICONS[idx];
                const active = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sb-item${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onNav(item)}
                  >
                    {active && <span className="sb-rail" />}
                    <Icon size={16} sw={active ? 2.35 : 2.05} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="sb-badge">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// DESKTOP HEADER — spec §3.2
// ─────────────────────────────────────────────────────────
function DesktopHeader({ sidebarOpen, setSidebarOpen, navVisible }) {
  return (
    <header
      className="app-dheader"
      style={{ transform: navVisible ? "translateY(0)" : "translateY(-100%)" }}
    >
      {/* Left cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="dh-toggle"
          aria-label={sidebarOpen ? "ซ่อนเมนู" : "แสดงเมนู"}
          onClick={() => setSidebarOpen(v => !v)}
        >
          <IcoMenu size={16} />
        </button>
        {!sidebarOpen && <Logo size={28} />}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.foreground, lineHeight: 1.2 }}>SUEA Safety</div>
          <div style={{ fontSize: 12, color: T.foreground3, marginTop: 2 }}>Safety operations workspace</div>
        </div>
      </div>

      {/* Right cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="dh-notif" aria-label="Notifications">
          <IcoBell size={16} />
          <span className="dh-badge">3</span>
        </button>
        <div className="dh-user">
          <IcoUser size={16} style={{ flexShrink: 0 }} />
          <span>ผู้ใช้งาน</span>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// DESKTOP TOP NAVBAR — spec §3
// ─────────────────────────────────────────────────────────
function DesktopNavbar({ activeId, onNav, navVisible }) {
  const navigate = useNavigate();
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 68,
        background: "var(--brand-nav)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        zIndex: 1000,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        transition: "transform 200ms ease-out",
        transform: navVisible ? "translateY(0)" : "translateY(-100%)",
        fontFamily: "'Prompt','Sarabun',sans-serif",
      }}
    >
      {/* Left part: Mascot Logo + Title Stack */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/category")}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
          <Logo size={28} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", lineHeight: 1.2, letterSpacing: "0.02em" }}>
            SUEA Safety
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 500, color: "var(--c-d9c3b0)", marginTop: 1 }}>
            Safety User Environment Awareness
          </span>
        </div>
      </div>

      {/* Center part: Horizontal Navigation links */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { id: "safety-effort", label: "Safety Effort", icon: IcoShield, route: "/category" },
          { id: "were-ok", label: "We're OK", icon: IcoUsers, route: "/were-ok" },
          { id: "work-permit", label: "Work Permit", icon: IcoClip, route: "/work-permit" },
          { id: "safety-culture", label: "Safety Culture", icon: IcoHeart, route: "/safety-culture" },
          { id: "safety-admin", label: "Admin", icon: IcoUser, route: "/safety-admin" },
        ].map(item => {
          const active = activeId === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: "999px",
                border: "none",
                background: active ? "var(--brand-nav-active)" : "transparent",
                color: active ? "#ffffff" : "var(--c-d9c3b0)",
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--c-d9c3b0)";
                }
              }}
            >
              <Icon size={14} sw={active ? 2.3 : 1.9} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right part: Notification + Login/CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Notification Bell */}
        <button
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
        >
          <IcoBell size={17} />
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--brand-accent)",
              color: "var(--brand-nav)",
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            3
          </span>
        </button>

        {/* CTA Login Button */}
        <button
          onClick={() => navigate("/login")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-accent) 100%)",
            border: "none",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(255,111,0,0.3)",
            transition: "all 0.2s ease-in-out",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-1.5px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,111,0,0.45)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,111,0,0.3)";
          }}
        >
          เข้าสู่ระบบ / เริ่มใช้งาน
          <span style={{ fontSize: 13, fontWeight: "bold" }}>→</span>
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────
// MOBILE TOP BAR — spec §4.1
// ─────────────────────────────────────────────────────────
function MobileTopBar({ visible }) {
  return (
    <div
      className="app-topbar"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <div className="app-topbar-inner">
        {/* Left: Mascot + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <Logo size={22} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{
              fontSize: 13, fontWeight: 800, color: "#ffffff",
              fontFamily: "'Prompt',sans-serif", lineHeight: 1.2
            }}>SUEA Safety</span>
            <span style={{
              fontSize: 8.5, color: "var(--c-d9c3b0)",
              fontFamily: "'Prompt',sans-serif", marginTop: 1
            }}>Safety User Environment Awareness</span>
          </div>
        </div>

        {/* Right: Search and Notification */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "transparent", border: "none", color: "#ffffff", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <IcoSearch size={18} />
          </button>
          <button style={{ position: "relative", background: "transparent", border: "none", color: "#ffffff", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <IcoBell size={18} />
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                minWidth: 14,
                height: 14,
                borderRadius: "50%",
                background: "var(--brand-accent)",
                color: "var(--brand-nav)",
                fontSize: 9,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              3
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MOBILE BOTTOM NAV — spec §4.2 & CSS §10
// ─────────────────────────────────────────────────────────
function MobileBottomNav({ activeId, onNav, visible }) {
  return (
    <nav
      aria-label="เมนูหลักบนมือถือ"
      className="app-bottomnav"
      style={{
        transform: visible
          ? "translateY(0)"
          : "translateY(calc(100% + env(safe-area-inset-bottom)))",
      }}
    >
      <div className="app-bottomnav-grid">
        {NAV_ITEMS.map(item => {
          const idx    = NAV_ITEMS.indexOf(item);
          const Icon   = NAV_ICONS[idx];
          const active = activeId === item.id;
          const lines  = item.labelMobile.split("\n");
          return (
            <button
              key={item.id}
              className={`bn-item${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onNav(item)}
            >
              <span className="bn-indicator" />
              <span className="bn-icon">
                <Icon size={22} sw={active ? 2.45 : 2.1} />
                {item.badge && (
                  <span className="bn-badge">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span className="bn-label">
                {lines.map((l, i) => <span key={i}>{l}</span>)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────
function AppRoutes({ onScroll }) {
  return (
    <Routes>
      {/* "/" is now a real Next.js page (HomePage). The legacy shell must NOT
          claim the index route, otherwise transitions through "/" (e.g. on
          logout/login) get hijacked and redirected to /category. */}
      <Route path="category"    element={<Category />} />
      <Route path="checkin"     element={<Checkin />} />
      <Route path="activity"    element={<Activity />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="linewalk"    element={<Linewalk />} />
        <Route path="safety-contact" element={<SafetyContact />} />
        <Route path="assessment-summary" element={<AssessmentSummary />} />
        <Route path="safety-admin" element={<SafetyAdmin />} />
        <Route path="dashboard-safety-effort" element={<DashboardSafetyEffort />} />
        <Route path="dashboard" element={<DashboardSafetyEffort />} />
        <Route path="login" element={<Login />} />
      </Routes>
    );
  }

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────
export default function App() {
  const location      = useLocation();
  const { pathname }  = location;
  const [width,        setWidth]       = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [navVisible,   setNavVisible]  = useState(true);
  const mainRef        = useRef(null);
  const lastScrollY    = useRef(0);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Reset scroll + nav visibility on route change
  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0, left: 0 });
    setNavVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  const isLoginPage             = pathname === "/login";
  const isMobile                = width < 768;
  const activeId                = getActiveId(pathname);
  const isLinewalkQuestionScreen = pathname === "/linewalk" && !!location.state?.linewalkStarted;
  const isLinewalkCalendarDesktop = pathname === "/linewalk" && !isMobile && !isLinewalkQuestionScreen;
  const isFixedContent          = (FIXED_CONTENT_ROUTES.includes(pathname) && (!isMobile || pathname !== "/safety-admin")) || isLinewalkQuestionScreen || isLinewalkCalendarDesktop;
  const hideBottomNav           = isLinewalkQuestionScreen;
  // Unified scroll-hide handler — threshold 10px (mobile + desktop)
  function handleScroll(e) {
    if (pathname === "/checkin") return;
    const y    = e.currentTarget.scrollTop;
    const diff = y - lastScrollY.current;
    if (Math.abs(diff) >= 10) {
      setNavVisible(diff < 0 || y < 30);
      lastScrollY.current = y;
    }
  }

  // ── Mobile layout ─────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ height: "100vh", overflow: "hidden", background: T.background, fontFamily: "'Prompt','Sarabun',sans-serif", color: T.foreground }}>
          <main
            ref={mainRef}
            onScroll={handleScroll}
              style={{
                position: "absolute", inset: 0,
                paddingTop: isLoginPage ? 0 : 48,
                paddingBottom: isLoginPage
                  ? 0
                  : (isLinewalkQuestionScreen
                      ? "env(safe-area-inset-bottom)"
                      : (pathname === "/checkin"
                          ? "calc(76px + env(safe-area-inset-bottom))"
                          : "calc(112px + env(safe-area-inset-bottom))")),
                overflow: isFixedContent ? "hidden" : "auto",
                minWidth: 0,
              }}
          >
            <AppRoutes onScroll={handleScroll} />
          </main>
        </div>
      </>
    );
  }

  // ── Desktop layout ────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ height: "100vh", overflow: "hidden", background: T.background, fontFamily: "'Prompt','Sarabun',sans-serif", color: T.foreground }}>
        <div style={{
          position: "absolute", inset: 0,
          paddingTop: isLoginPage ? 0 : 68,
          display: "flex", flexDirection: "column",
        }}>
          <main
            ref={mainRef}
            onScroll={handleScroll}
            style={{
              flex: 1, minHeight: 0,
              overflow: isFixedContent ? "hidden" : "auto",
              position: "relative",
            }}
          >
            <AppRoutes onScroll={handleScroll} />
          </main>
        </div>
      </div>
    </>
  );
}
// @ts-nocheck
// @ts-nocheck
