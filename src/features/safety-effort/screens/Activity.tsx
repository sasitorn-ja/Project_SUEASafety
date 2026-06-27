// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@/lib/app-navigation";
import { useAppTheme } from "@/providers/theme-provider";
import SafetyEffortProgressStepper from "@/features/safety-effort/components/SafetyEffortProgressStepper";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ฤฤฤ Design tokens ฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤ
const T = {
  background:   "var(--background)",
  background2:  "var(--secondary)",
  foreground:   "#0e0f12",
  foreground2:  "#33312c",
  foreground3:  "#767269",
  card:         "#ffffff",
  surface2:     "var(--secondary)",
  primary:      "var(--brand-accent)",
  primaryFg:    "var(--brand-accent-contrast)",
  primarySoft:  "var(--brand-soft)",
  danger:       "#d5301a",
  ok:           "#1f7a55",
  border:       "rgba(14,15,18,0.08)",
  borderStrong: "#0e0f12",
  radius:       "16px",
  // derived
  primaryDark:  "var(--brand-text)",
  primaryBdr:   "var(--brand-accent)",
  navy:         "#1c2b4a",
  navyDeep:     "#0f172a",
  okBg:         "#ecfdf5",
};

const yellow     = T.primary;
const yellowBg   = T.primarySoft;
const yellowBdr  = T.primaryBdr;
const yellowDark = T.primaryDark;
const navy       = T.navy;
const navyDeep   = T.navyDeep;

// ฤฤฤ Activity definitions ฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤ
const BASE_ACTIVITIES = [
  {
    id: "line-walk",
    label: "Line Walk",
    desc: "ตรวจสอบความปลอดภัย",
    icon: IcoLineWalk,
  },
  {
    id: "safety-contact",
    label: "Safety Contact",
    desc: "รายงานความปลอดภัย",
    icon: IcoSafetyContact,
  },
];

function restoreActivity(activity) {
  if (!activity) return null;
  return BASE_ACTIVITIES.find((item) => item.id === activity.id) ?? {
    ...activity,
    icon: activity.icon ?? IcoShield,
  };
}

const ADD_MORE = {
  id: "other",
  label: "อื่น ๆ",
  desc: "ระบุหมวดหมู่ด้วยตัวเอง",
  icon: IcoPlus,
  dashed: true,
};

const CUSTOM_ICON_OPTIONS = [
  { id: "line-walk", label: "Line Walk", Icon: IcoLineWalk },
  { id: "shield",    label: "Safety",    Icon: IcoShield   },
  { id: "warning",   label: "KYT",       Icon: IcoTriangle },
  { id: "bolt",      label: "Energy",    Icon: IcoBolt     },
  { id: "helmet",    label: "PPE",       Icon: IcoHelmet   },
  { id: "pin",       label: "Location",  Icon: IcoPin      },
  { id: "camera",    label: "Camera",    Icon: IcoCamera   },
  { id: "plus",      label: "Other",     Icon: IcoPlus     },
];

// ฤฤฤ SVG Icons ฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤ
function IcoBack() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IcoPin({ s = 14, c = "currentColor" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function IcoLineWalk() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/>
      <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/>
      <path d="M16 17h4"/>
      <path d="M4 13h4"/>
    </svg>
  );
}
function IcoSafetyContact() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <path d="m8.5 10 2.2 2.2L15 8"/>
    </svg>
  );
}
function IcoShield() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 5.5h15a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H11l-4.4 3.1v-3.1H4.5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"/>
      <path d="M12 14.1s4.1-2.1 4.1-5.2V7.6L12 6.1 7.9 7.6v1.3c0 3.1 4.1 5.2 4.1 5.2Z"/>
      <path d="m10.4 10.1 1.1 1.1 2.2-2.2"/>
    </svg>
  );
}
function IcoTriangle() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9"  x2="12"   y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IcoBolt() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IcoHelmet() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a9 9 0 0 0-9 9v1h18v-1a9 9 0 0 0-9-9z"/>
      <path d="M3 12h18"/>
      <path d="M5 12v3a7 7 0 0 0 14 0v-3"/>
    </svg>
  );
}
function IcoPlus({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5"  x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcoCamera() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
function IcoArrow({ c = "#fff" }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IcoX() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6"  y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ฤฤฤ Styles ฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤ
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&family=Sarabun:wght@300;400;500;600;700&display=swap');

  .ac, .ac * { box-sizing: border-box; }
  .ac {
    font-family: 'Sarabun', 'Prompt', sans-serif;
    background: linear-gradient(180deg, var(--secondary) 0%, ${T.background} 190px, ${T.background} 100%);
    color: ${T.foreground};
    min-height: 100%;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }

  /* ฤฤ Compact StepHeader (aligned with Checkin) ฤฤ */
  .ac-step-header-compact {
    background: linear-gradient(105deg, var(--brand-hero-start) 0%, var(--brand-hero-end) 48%, var(--brand-nav) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 12px 20px 20px;
    flex-shrink: 0;
    color: var(--brand-soft);
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(42,26,9,0.15);
    z-index: 10;
  }
  @media (min-width: 768px) {
    .ac-step-header-compact {
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 6px;
    }
  }
  .ac-step-header-compact::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(var(--brand-accent-rgb),0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--brand-accent-rgb),0.03) 1px, transparent 1px);
    background-size: 22px 22px;
    opacity: 0.6;
    pointer-events: none;
    z-index: 0;
  }
  .ac-step-header-compact::after {
    content: '';
    position: absolute;
    right: -40px; top: -40px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(var(--brand-accent-rgb),0.10) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .ac-step-header-compact > * {
    position: relative;
    z-index: 1;
  }

  .ac-hdr-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .ac-hdr-title {
    margin: 2px 0 0;
    font-size: 19px;
    font-weight: 900;
    color: #ffffff;
    font-family: 'Prompt', sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .ac-hero-badge-compact {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: rgba(255,248,230,0.85);
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .ac-hdr-mascot-compact {
    width: 46px;
    height: 46px;
    object-fit: contain;
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
    animation: mascot-float 3s ease-in-out infinite;
    flex-shrink: 0;
  }

  .ac-hdr-divider {
    width: 1px;
    height: 24px;
    background: rgba(255,255,255,0.15);
  }

  @keyframes mascot-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  /* Stepper right cluster */
  .ac-hdr-right-stepper {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    margin-left: auto;
  }
  .ac-stepper-inner-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }
  .ac-stepper-title-lbl {
    font-size: 9px;
    color: rgba(255,248,230,0.6);
    font-weight: 800;
    font-family: 'Prompt', sans-serif;
    letter-spacing: 0.05em;
  }
  .ac-stepper-row-flex {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ac-stepper-count-lbl {
    font-size: 11px;
    color: var(--brand-accent);
    font-weight: 900;
    font-family: 'Prompt', sans-serif;
  }

  /* ฤฤ Custom Stepper (matching step 2 active) ฤฤ */
  .ci-stepper-container {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ci-stepper-item-wrap {
    display: flex;
    align-items: center;
  }
  .ci-stepper-line {
    width: 12px;
    height: 2px;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s;
  }
  .ci-stepper-line.active {
    background: var(--brand-accent);
    box-shadow: 0 0 6px var(--brand-accent);
  }
  .ci-stepper-node {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9.5px;
    font-weight: 900;
    font-family: 'Prompt', sans-serif;
    transition: all 0.3s;
  }
  .ci-stepper-node.active {
    background: var(--brand-accent);
    color: var(--c-1a1613);
    box-shadow: 0 0 8px rgba(var(--brand-accent-rgb), 0.6);
  }
  .ci-stepper-node.done {
    background: #1f7a55;
    color: #fff;
  }
  .ci-stepper-node.idle {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }


  .ac-back-btn {
    width: 32px; height: 32px;
    border-radius: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    color: var(--brand-soft);
  }
  .ac-back-btn:hover {
    background: rgba(255,255,255,0.16);
    border-color: ${yellow};
    color: #fff;
    transform: translateX(-2px);
    box-shadow: 0 0 10px rgba(var(--brand-accent-rgb), 0.22);
  }

  /* ฤฤ Panel label ฤฤ */
  .ac-panel-label {
    font-size: 10px; font-weight: 800; color: ${T.foreground3};
    text-transform: uppercase; letter-spacing: 0.12em;
    font-family: 'Prompt', sans-serif;
  }

  /* ฤฤ Premium Location Badge ฤฤ */
  .ac-badge {
    display: flex; align-items: center; gap: 12px;
    background: #ffffff;
    border: 1px solid rgba(14,15,18,0.06);
    border-radius: 16px;
    padding: 12px 14px;
    box-shadow: 0 8px 24px rgba(34,25,11,0.04);
    overflow: hidden;
    position: relative;
  }
  .ac-badge::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: ${T.primary};
    box-shadow: 2px 0 8px rgba(var(--brand-accent-rgb),0.6);
  }

  .ac-badge-pin-box {
    width: 36px; height: 36px; border-radius: 10px;
    background: ${T.primarySoft};
    border: 1px solid ${T.primaryBdr};
    color: ${T.primaryDark};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(var(--brand-accent-rgb),0.15);
  }

  .ac-badge-name {
    font-size: 13.5px; font-weight: 800; color: ${T.foreground};
    font-family: 'Prompt', sans-serif; line-height: 1.2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .ac-badge-tag {
    font-size: 9.5px; font-weight: 700;
    color: ${T.primaryDark};
    background: rgba(var(--brand-accent-rgb),0.12);
    border: 1px solid rgba(var(--brand-accent-rgb),0.18);
    border-radius: 5px; padding: 1.5px 6px;
    letter-spacing: 0.04em; font-family: 'Prompt', monospace;
    white-space: nowrap;
  }
  .ac-badge-sub {
    font-size: 11px; color: ${T.foreground3};
    white-space: nowrap;
    font-weight: 500;
  }
  .ac-checked-pill {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; color: ${T.ok};
    background: ${T.okBg};
    border: 1px solid rgba(31,122,85,0.18);
    border-radius: 999px; padding: 4.5px 12px;
    white-space: nowrap; flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(31,122,85,0.03);
    font-family: 'Prompt', sans-serif;
  }
  .ac-checked-dot {
    width: 14px; height: 14px; border-radius: 50%;
    background: ${T.ok}; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; line-height: 1;
    font-weight: 800;
  }

  /* ฤฤ Ultra-compact tip style ฤฤ */
  .ac-side-tip-compact {
    margin: 10px 20px 4px;
    border: 1px solid rgba(var(--brand-accent-rgb), 0.24);
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff 0%, var(--brand-surface) 100%);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(var(--brand-accent-rgb), 0.03);
    flex-shrink: 0;
  }

  /* ฤฤ Premium Activity Card ฤฤ */
  .ac-card {
    position: relative;
    background: #ffffff;
    border: 1px solid rgba(14,15,18,0.06);
    border-radius: 16px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
    display: flex; flex-direction: column;
    min-height: 118px;
    box-shadow: 0 8px 20px rgba(34,25,11,0.04);
  }
  .ac-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 4px;
    background: transparent;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px 0 0 16px;
  }
  .ac-card:hover {
    border-color: rgba(var(--brand-accent-rgb), 0.35);
    box-shadow: 0 12px 24px rgba(34,25,11,0.06);
    transform: translateY(-2px);
  }
  .ac-card:active { transform: scale(0.99) translateY(-1px); }
  .ac-card.sel {
    background: linear-gradient(135deg, #ffffff 0%, var(--brand-surface) 100%);
    border-color: ${yellowBdr};
    box-shadow: 0 12px 28px rgba(var(--brand-accent-rgb),0.14);
  }
  .ac-card.sel::before {
    background: ${yellow};
    box-shadow: 2px 0 8px rgba(var(--brand-accent-rgb),0.6);
  }
  .ac-card.dashed {
    border-style: dashed;
    border-color: rgba(14,15,18,0.15);
    background: rgba(255,255,255,0.4);
    box-shadow: none;
  }
  .ac-card.dashed:hover {
    border-style: solid;
    border-color: ${yellow};
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(var(--brand-accent-rgb),0.06);
  }
  .ac-card.dashed.sel { border-style: solid; background: linear-gradient(135deg, #ffffff 0%, var(--brand-surface) 100%); }

  /* ฤฤ Card icon box ฤฤ */
  .ac-icon-box {
    width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(var(--brand-accent-rgb),0.13), rgba(var(--brand-accent-rgb),0.05));
    color: var(--brand-accent);
    border: 1px solid rgba(var(--brand-accent-rgb),0.22);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
  }
  .ac-card:hover:not(.sel) .ac-icon-box {
    background: linear-gradient(135deg, rgba(var(--brand-accent-rgb),0.2), rgba(var(--brand-accent-rgb),0.08));
    color: var(--brand-text);
    border-color: rgba(var(--brand-accent-rgb),0.36);
    transform: translateY(-1px);
  }
  .ac-card.sel .ac-icon-box {
    background: linear-gradient(135deg, ${yellow} 0%, var(--brand-accent-strong) 100%); color: ${T.primaryFg};
    box-shadow: 0 3px 10px rgba(var(--brand-accent-rgb),0.25);
    border-color: transparent;
  }

  /* ฤฤ Card text ฤฤ */
  .ac-card-label {
    font-size: 14px; font-weight: 800; color: ${T.foreground};
    line-height: 1.3; margin: 0;
    font-family: 'Prompt', sans-serif;
  }
  .ac-card.sel .ac-card-label { color: ${T.primaryDark}; }
  .ac-card-desc {
    font-size: 11.5px; color: ${T.foreground3};
    line-height: 1.45; margin: 4px 0 0;
    font-weight: 500;
  }
  .ac-card.sel .ac-card-desc { color: rgba(146,64,14,0.76); }

  /* ฤฤ Hot dot ฤฤ */
  .ac-hot-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: ${T.primary};
    box-shadow: 0 0 0 3px rgba(var(--brand-accent-rgb),0.22);
    animation: ac-dot-pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes ac-dot-pulse {
    0%,100% { box-shadow: 0 0 0 3px rgba(var(--brand-accent-rgb),0.22); }
    50%      { box-shadow: 0 0 0 6px rgba(var(--brand-accent-rgb),0.07); }
  }

  /* ฤฤ Check ring ฤฤ */
  .ac-check-ring {
    width: 22px; height: 22px; border-radius: 50%;
    background: linear-gradient(135deg, ${yellow} 0%, var(--brand-accent-strong) 100%);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 8px rgba(var(--brand-accent-rgb),0.3);
    animation: ac-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
    flex-shrink: 0;
  }

  /* ฤฤ Scrollbar ฤฤ */
  .ac-scroll::-webkit-scrollbar { width: 4px; }
  .ac-scroll::-webkit-scrollbar-track { background: transparent; }
  .ac-scroll::-webkit-scrollbar-thumb { background: rgba(14,15,18,0.12); border-radius: 99px; }

  /* ฤฤ Selected preview banner ฤฤ */
  .ac-preview {
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(135deg, #ffffff 0%, var(--brand-surface) 100%);
    border: 1px solid rgba(var(--brand-accent-rgb),0.35);
    border-radius: 16px;
    padding: 10px 14px;
    margin-bottom: 10px;
    animation: ac-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 10px 24px rgba(var(--brand-accent-rgb),0.1);
  }
  @keyframes ac-slide {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ฤฤ Footer ฤฤ */
    .ac-footer-panel {
      flex-shrink: 0; border-top: 1px solid rgba(14,15,18,0.08);
      margin-top: auto;
      padding: 12px 16px 16px;
      background: color-mix(in srgb, var(--brand-surface) 85%, transparent);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(76px + env(safe-area-inset-bottom));
      z-index: 20;
      box-shadow: 0 -8px 24px rgba(34,25,11,0.08);
    }
    @media (min-width: 768px) {
     .ac-footer-panel {
        position: static;
        left: auto;
        right: auto;
        bottom: auto;
        box-shadow: 0 8px 24px rgba(34,25,11,0.04);
        border: 1px solid rgba(14,15,18,0.08);
        border-radius: 16px;
        margin-top: 10px;
      }
    }

  /* ฤฤ CTA button ฤฤ */
  .ac-cta {
    width: 100%; border-radius: 14px; border: none;
    font-family: 'Prompt', inherit; font-weight: 700; font-size: 15px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    letter-spacing: 0.02em; position: relative; overflow: hidden;
  }
  .ac-cta.ready {
    background: linear-gradient(135deg, var(--brand-text) 0%, var(--c-1a1613) 100%); color: #fff;
    box-shadow: 0 10px 25px rgba(26, 22, 19, 0.25);
    padding: 10px;
  }
  .ac-cta.ready::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    animation: ac-shimmer 2.5s infinite;
  }
  @keyframes ac-shimmer { to { transform: translateX(100%); } }
  .ac-cta.ready:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(26,22,19,0.32);
    background: linear-gradient(135deg, var(--c-3d2f24) 0%, var(--brand-text) 100%);
  }
  .ac-cta.ready:active { transform: scale(0.985) translateY(-1px); }
  .ac-cta.disabled {
    background: var(--c-e8e5dc); color: #9c988f;
    cursor: not-allowed; box-shadow: none;
    padding: 10px;
    border: 1px solid rgba(0,0,0,0.03);
  }

  /* ฤฤ Custom activity modal ฤฤ */
  .ac-modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(20,13,7,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .ac-modal {
    width: 100%; max-width: 530px;
    background: var(--brand-surface); border-radius: 24px 24px 0 0;
    padding: 24px 24px 38px;
    font-family: 'Sarabun', sans-serif;
    animation: ac-modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    border-top: 1px solid var(--border);
    box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.18);
  }
  @keyframes ac-modal-in {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  @media (min-width: 768px) {
    .ac-modal-overlay {
      align-items: center;
    }
    .ac-modal {
      border-radius: 30px;
      animation: ac-modal-in-desktop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid var(--border);
      box-shadow: 0 28px 60px rgba(0,0,0,0.22);
    }
  }
  @keyframes ac-modal-in-desktop {
    from { transform: scale(0.92) translateY(20px); opacity: 0; }
    to   { transform: scale(1) translateY(0);    opacity: 1; }
  }

  /* ฤฤ Modal input ฤฤ */
  .ac-input {
    width: 100%;
    border: 1px solid rgba(14,15,18,0.1);
    background: #ffffff;
    border-radius: 12px;
    padding: 12px 14px;
    font-family: 'Sarabun', 'Prompt', sans-serif;
    font-size: 14px; color: ${T.foreground};
    outline: none; transition: all 0.2s;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);
  }
  .ac-input:focus {
    border-color: ${T.primary};
    box-shadow: 0 0 0 3.5px rgba(var(--brand-accent-rgb),0.18), inset 0 2px 4px rgba(0,0,0,0.01);
  }

  /* ฤฤ Icon grid ฤฤ */
  .ac-icon-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0,1fr));
    gap: 7px;
  }
  .ac-icon-btn {
    aspect-ratio: 1;
    border-radius: 10px;
    border: 1px solid rgba(14,15,18,0.08);
    background: #ffffff; color: ${T.foreground3};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .ac-icon-btn:hover { border-color: ${T.primaryBdr}; transform: translateY(-1.5px); box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
  .ac-icon-btn.active {
    border-color: transparent;
    background: linear-gradient(135deg, ${yellow} 0%, var(--brand-accent-strong) 100%); color: ${T.primaryFg};
    box-shadow: 0 4px 12px rgba(var(--brand-accent-rgb),0.28);
  }

  /* ฤฤ Modal close ฤฤ */
  .ac-modal-close {
    width: 40px; height: 40px; border-radius: 999px;
    background: #fff; border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; color: ${T.foreground3};
    flex-shrink: 0;
  }
  .ac-modal-close:hover { background: var(--secondary); transform: rotate(90deg); color: ${T.foreground}; }

  /* ฤฤ Modal action buttons ฤฤ */
  .ac-modal-cancel {
    flex: 1; padding: 12px; border-radius: 14px;
    border: 1px solid var(--border); background: #fff;
    color: ${T.primaryDark}; font-size: 13.5px; font-weight: 800;
    cursor: pointer; font-family: inherit; transition: background 0.15s;
  }
  .ac-modal-cancel:hover { background: var(--secondary); }
  .ac-modal-confirm {
    flex: 2; padding: 12px; border-radius: 14px;
    border: none; background: linear-gradient(135deg, var(--brand-text) 0%, var(--c-1a1613) 100%); color: #fff;
    font-size: 13.5px; font-weight: 800;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 10px 24px rgba(26,22,19,0.18);
    transition: opacity 0.15s, transform 0.15s;
  }
  .ac-modal-confirm:hover { opacity: 0.9; transform: translateY(-1px); }
  .ac-modal-confirm:disabled {
    background: var(--c-e8e5dc); color: #9c988f;
    cursor: not-allowed; box-shadow: none; transform: none; opacity: 1;
    border: 1px solid rgba(0,0,0,0.03);
  }

  .ac-section-heading {
    flex-shrink: 0;
    padding: 0px 20px 4px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  @media (max-width: 767px) {
    .ac-section-heading { padding: 0px 4px 4px; }
    .ac-hdr-flex {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
    .ac-hdr-divider {
      display: none;
    }
    .ac-hdr-mascot-compact {
      position: absolute;
      right: 0;
      top: -4px;
      width: 40px;
      height: 40px;
    }
    .ac-hdr-title {
      font-size: 17px;
    }
    .ac-hdr-right-stepper {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .ac-stepper-inner-box {
      align-items: flex-end;
    }
    .ac-stepper-row-flex {
      justify-content: flex-end;
    }
  }
`;

// ฤฤฤ Activity card ฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤ
function ActivityCard({ activity, isSelected, onClick }) {
  const cardImage = activity.id === "line-walk"
    ? "/images/heroes/Contact.png"
    : activity.id === "safety-contact"
    ? "/images/heroes/Linewalk.png"
    : "/images/heroes/safety-location-admin-hero.png";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[16px] border bg-white shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(11,130,240,0.06)] cursor-pointer group ${
        isSelected 
          ? "border-[#0B82F0] ring-2 ring-[#0B82F0]/20" 
          : "border-[#EAF0FF]"
      }`}
      onClick={onClick}
    >
      {/* Top Banner Image */}
      <div className="relative h-[130px] sm:h-[150px] md:h-[160px] w-full overflow-hidden bg-[#F0F7FF]">
        <img 
          src={cardImage} 
          alt={activity.label} 
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Selection indicator badge on the top right */}
        <div className="absolute right-3 top-3 z-10">
          {isSelected ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B82F0] text-white shadow-[0_3px_8px_rgba(11,130,240,0.3)]">
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 bg-white/40 backdrop-blur-sm transition-all duration-300 group-hover:bg-white" />
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-3 font-sarabun">
        <h3 className="text-[15px] font-black text-[#0B2F6B] tracking-tight">{activity.label}</h3>
        <p className="mt-1 text-[11.5px] font-semibold text-[#55739B] flex-1 leading-relaxed">{activity.desc}</p>
      </div>
    </div>
  );
}

// ฤฤฤ Custom-activity modal ฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤ
function CustomModal({ onConfirm, onClose }) {
  const [label,  setLabel]  = useState("");
  const [iconId, setIconId] = useState(CUSTOM_ICON_OPTIONS[0].id);

  function confirm() {
    const l = label.trim();
    if (!l) return;
    const opt = CUSTOM_ICON_OPTIONS.find(o => o.id === iconId) ?? CUSTOM_ICON_OPTIONS[0];
    onConfirm({ label: l, icon: opt.Icon });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="ac-modal p-0">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(14,15,18,0.15)" }} />
        </div>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.foreground, fontFamily: "'Prompt',sans-serif" }}>
              ระบุหมวดกิจกรรม
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: T.foreground3 }}>
              กรอกชื่อหมวดที่ต้องการสำหรับกิจกรรมนี้
            </p>
          </div>
          <button className="ac-modal-close" onClick={onClose}><IcoX /></button>
        </div>

        {/* Name input */}
        <input
          className="ac-input"
          value={label}
          maxLength={40}
          placeholder="เช่น ตรวจพื้นที่คลังสินค้า"
          autoFocus
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") confirm(); if (e.key === "Escape") onClose(); }}
        />

        {/* Icon picker */}
        <p style={{ margin: "14px 0 8px", fontSize: 11, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", color: T.foreground3, fontFamily: "'Prompt',sans-serif" }}>
          เลือกไอคอน
        </p>
        <div className="ac-icon-grid" style={{ marginBottom: 6 }}>
          {CUSTOM_ICON_OPTIONS.map(({ id, label: lbl, Icon }) => (
            <button
              key={id}
              className={`ac-icon-btn${iconId === id ? " active" : ""}`}
              title={lbl}
              onClick={() => setIconId(id)}
              type="button"
            >
              <Icon />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="ac-modal-cancel" onClick={onClose}>ยกเลิก</button>
          <button className="ac-modal-confirm" disabled={!label.trim()} onClick={confirm}>
            ยืนยัน
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ฤฤฤ Main component ฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤฤ
export default function Activity() {
  const { mascot, theme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const checkin  = location.state?.checkin ?? null;
  const fromCategoryAudit = !checkin;

  const [selected,         setSelected]         = useState(() => restoreActivity(location.state?.activity));
  const [customOpen,       setCustomOpen]        = useState(false);
  const [customActivities, setCustomActivities]  = useState([]);
  const [width,            setWidth]             = useState(window.innerWidth);

  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    if (location.state?.activity) {
      setSelected(restoreActivity(location.state.activity));
    }
  }, [location.state?.activity]);

  const isMobile = width < 768;

  function handleBack() {
    if (fromCategoryAudit) {
      navigate("/category");
      return;
    }

    navigate("/checkin", {
      state: {
        checkin,
        activity: location.state?.activity ?? null,
      },
    });
  }

  // ฤฤ ? PATCHED: เพิ่ม fromActivity: true เพื่อบอก Linewalk ว่ามาจาก Activity flow
  function handleNext() {
    if (!selected) return;
    if (fromCategoryAudit) {
      navigate("/checkin", {
        state: {
          activity: { id: selected.id, label: selected.label, desc: selected.desc },
        },
      });
      return;
    }

    const dest =
      selected.id === "line-walk"
        ? "/linewalk"
        : selected.id === "safety-contact"
          ? "/safety-contact"
          : "/create-post";
    navigate(dest, {
      state: {
        checkin,
        activity: { id: selected.id, label: selected.label, desc: selected.desc },
        fromActivity: true,   //  บอก Linewalk ว่ามาจาก Activity flow  ไป /create-post
      },
    });
  }

  function handleCardClick(act) {
    if (act.id === "other") { setCustomOpen(true); return; }
    setSelected(prev => prev?.id === act.id ? null : act);
  }

  function confirmCustom({ label, icon }) {
    const act = {
      id:    `custom-${Date.now()}`,
      label,
      desc:  "หมวดหมู่ที่ระบุเอง",
      icon,
    };
    setCustomActivities(prev => [...prev, act]);
    setSelected(act);
    setCustomOpen(false);
  }

  const displayedActivities = [...customActivities, ...BASE_ACTIVITIES];

  // ฤฤ Step header (compact dashboard style matching Checkin) ฤฤ
  // ฤฤ Step header (compact dashboard style matching Category) ฤฤ
  const StepHeader = () => (
    <div className="relative flex min-h-[100px] items-center overflow-hidden rounded-[20px] border border-[#B9DDFF]/60 bg-[#EEF7FF] px-3 py-2 shadow-[0_12px_30px_rgba(185,223,255,0.4)] sm:min-h-[116px] sm:px-[18px] sm:py-2.5 xl:min-h-[148px] xl:px-[28px] xl:py-3">
      {/* Background image container */}
      <div 
        className="absolute inset-0 bg-[url('/images/heroes/safety-effort-category-hero.png')] bg-no-repeat"
        style={{
          backgroundSize: 'auto 108%',
          backgroundPosition: 'right -20px bottom -5px',
        }}
      />
      {/* Gradient overlay to blend the image and ensure readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#EEF7FF] via-[#EEF7FF]/90 sm:via-[#EEF7FF]/40 to-transparent pointer-events-none" />

      {/* Main content container directly on the background (no glassmorphic inner container) */}
      <div className="relative z-10 w-full flex items-center justify-between font-sarabun">
        {/* Left column: Back button, Title, and Stepper info */}
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <button 
              className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white border border-[#D7EAFE] text-[#0B82F0] hover:bg-[#0B82F0] hover:text-white transition-all duration-300 active:scale-95"
              onClick={handleBack} 
              aria-label="ย้อนกลับ"
            >
              <IcoBack />
            </button>
            <h1 className="text-[20px] sm:text-[24px] xl:text-[26px] font-black leading-tight tracking-tight text-[#0B2F6B]">
              เลือกหมวดกิจกรรม
            </h1>
          </div>
          
          <div className="flex flex-col items-start gap-1 mt-1 sm:mt-1.5">
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-[#55739B] uppercase">
              ความคืบหน้า
            </span>
            <SafetyEffortProgressStepper current={1} total={4} compact />
          </div>
        </div>
      </div>
    </div>
  );

  // ฤฤ Checkin badge (styled premium)
  const CheckinBadge = () => (
    <div style={{ flexShrink: 0, padding: isMobile ? "12px 16px 0" : "12px 20px 0" }}>
      <div className="ac-badge">
        <div className="ac-badge-pin-box">
          <IcoPin s={16} c="currentColor" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ac-badge-name">
            {checkin?.name ?? "ยังไม่ได้เลือกสถานที่"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
            <span className="ac-badge-tag">{checkin?.tag ?? "LOCATION"}</span>
            {checkin?.type && <span className="ac-badge-sub">{checkin.type}</span>}
            {checkin?.dist != null && (
              <span className="ac-badge-sub" style={{ fontFamily: "'Prompt',sans-serif", fontWeight: 700, color: T.foreground3 }}>
                ?? {checkin.dist.toFixed(1)} km
              </span>
            )}
          </div>
        </div>
        <div className="ac-checked-pill">
          <div className="ac-checked-dot">?</div>
          Checked in
        </div>
      </div>
    </div>
  );

  // ฤฤ Footer Panel
  const FooterPanel = () => (
    <div className="ac-footer-panel">
      <button
        className={`ac-cta ${selected ? "ready" : "disabled"}`}
        disabled={!selected}
        onClick={handleNext}
      >
        <IcoPin s={16} />
        ถัดไป เลือกสถานที่
        <IcoArrow c={selected ? "#fff" : T.foreground3} />
      </button>
    </div>
  );

  // อออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออออ
  return (
    <>
      <style>{STYLES}</style>

      <div className="ac">
        <div style={{
          width: "100%",
          maxWidth: 1500,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 8 : 10,
          padding: isMobile ? "10px 12px calc(90px + env(safe-area-inset-bottom))" : "4px 20px 16px",
          minHeight: "100%",
        }}>
          <StepHeader />

          {/* Section label */}
          <div className="ac-section-heading" style={{ padding: isMobile ? "0 4px" : undefined }}>
            <div>
              <span className="ac-panel-label">เลือก 1 กิจกรรม</span>
              <div style={{ marginTop: 1, fontSize: 13.5, fontWeight: 800, color: T.foreground, fontFamily: "'Prompt',sans-serif" }}>
                รายการกิจกรรม
              </div>
            </div>
            <span style={{ fontSize: 10, color: T.foreground3, fontFamily: "'Prompt',sans-serif", fontWeight: 700, background: "var(--secondary)", padding: "2px 6px", borderRadius: "6px" }}>
              {displayedActivities.length} รายการ
            </span>
          </div>

          {/* Activity grid — natural height scrolling */}
          <div
            style={{
              padding: isMobile ? "0 4px 4px" : "0 20px 4px",
            }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
            }}>
              {displayedActivities.map(act => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  isSelected={selected?.id === act.id}
                  onClick={() => handleCardClick(act)}
                />
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <FooterPanel />
        </div>

        {/* Custom-activity modal */}
        {customOpen && (
          <CustomModal
            onConfirm={confirmCustom}
            onClose={() => setCustomOpen(false)}
          />
        )}
      </div>
    </>
  );
}
// @ts-nocheck
