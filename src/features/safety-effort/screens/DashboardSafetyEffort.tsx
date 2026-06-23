// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/app-navigation";
import {
  ArrowLeft,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  TrendingUp
} from "lucide-react";
import * as XLSX from "xlsx";
import { Combobox } from "@/components/ui/combobox";
import dashboardStyles from "./dashboard-safety-effort.module.css";

// Design tokens matching system branding
const T = {
  background: "var(--background)",
  background2: "var(--secondary)",
  foreground: "var(--foreground)",
  foreground2: "color-mix(in srgb, var(--foreground) 78%, transparent)",
  foreground3: "color-mix(in srgb, var(--foreground) 54%, transparent)",
  card: "var(--card)",
  surface2: "var(--secondary)",
  primary: "var(--brand-accent)",
  primaryForeground: "#0e0f12",
  primarySoft: "var(--brand-soft)",
  ok: "#1f7a55",
  info: "#234c8e",
  warning: "var(--c-c97a00)",
  border: "rgba(14,15,18,0.10)",
  borderStrong: "#0e0f12",
  radius: "14px",
};

// Softer, brand-aligned chart palette (replaces harsh #FF0000 / #FFFF00 / #92D050)
const C = {
  safe: "#6FB07A",      // soft green
  safeText: "#2f8a55",
  unsafe: "#E07A6B",    // soft coral red
  unsafeText: "#c0473a",
  warn: "#E6B45A",      // soft amber
  warnText: "#a9772a",
  office: "#5B9BD5",    // soft blue
  plant: "#7FB069",     // soft green
  site: "#E6B45A",      // soft amber
  neutral: "#E2E5EA",   // light gray
};

// Extracted PPTX baseline data
const OVERALL_DATA = {
  totalChecks: 20566,
  safeRate: 97.4,
  unsafeCases: 535,
  solvedCases: 48,
  pendingCases: 8,
  unresolvedCases: 1,
};

// Baseline Chart 1 data: ภาพรวม Line walk (approx. 182-day period)
const BASELINE_CHART1_DATA = [
  { name: "Office", value: 11.8, count: 2427, color: "#5B9BD5" },
  { name: "Plant", value: 82.6, count: 16988, color: "#7FB069" },
  { name: "Site", value: 5.6, count: 1152, color: "#E6B45A" }
];

// Baseline Chart 2 data: Status Line walk
const BASELINE_CHART2_DATA = [
  {
    category: "Plant",
    safe: 16520,
    unsafeAct: 43,
    unsafeCond: 424,
    total: 16987
  },
  {
    category: "Office",
    safe: 2404,
    unsafeAct: 4,
    unsafeCond: 19,
    total: 2427
  },
  {
    category: "Site",
    safe: 1107,
    unsafeAct: 1,
    unsafeCond: 44,
    total: 1152
  }
];

// Baseline Chart 3 data: สถานะการแก้ไข
const BASELINE_CHART3_DATA = [
  { name: "Success", value: 84.2, count: 48, color: "#6FB07A" }, // Soft Green
  { name: "Pending", value: 14.0, count: 8, color: "#E6B45A" },  // Soft Amber
  { name: "Unresolved", value: 1.8, count: 1, color: "#E2E5EA" } // Light Gray
];

// Baseline Chart 4 data: Safety Line walk by Business Unit
// safeRate = ระดับความปลอดภัยที่รายงานของแต่ละหน่วยงาน (ใช้กับ badge ในตาราง)
const BASELINE_CHART4_DATA = [
  { name: "CPAC Metro", safe: 1301, unsafe: 29, solved: 7, safeRate: 97.8 },
  { name: "CPAC East", safe: 2615, unsafe: 30, solved: 6, safeRate: 98.9 },
  { name: "CPAC West", safe: 3235, unsafe: 1, solved: 3, safeRate: 100.0 },
  { name: "CPAC North", safe: 2988, unsafe: 42, solved: 15, safeRate: 95.2 },
  { name: "CPAC Northeast", safe: 3412, unsafe: 120, solved: 28, safeRate: 91.6 },
  { name: "CPAC RMC", safe: 1786, unsafe: 51, solved: 22, safeRate: 94.8 },
  { name: "CPAC SMART Structure", safe: 1229, unsafe: 11, solved: 4, safeRate: 97.1 }
];

export default function DashboardSafetyEffort() {
  const navigate = useNavigate();

  // States
  const [selectedBU, setSelectedBU] = useState("All Business Units");
  const [startDate, setStartDate] = useState("2025-10-01");
  const [endDate, setEndDate] = useState("2026-03-31");
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [scaleType, setScaleType] = useState("logarithmic");
  const [width, setWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1200);

  // Live data from the real reports API (admin). Falls back to baseline below if unavailable.
  const [liveSummary, setLiveSummary] = useState(null);     // { activities, submitted_assessments, open_findings, open_actions }
  const [liveLocations, setLiveLocations] = useState(null); // [{ id, name_th, location_type, checkins, activities }]

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch real aggregates whenever the date range changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams();
        if (startDate) qs.set("from", startDate);
        if (endDate) qs.set("to", endDate);
        const [sumRes, locRes] = await Promise.all([
          fetch(`/api/safety-effort/reports/summary?${qs.toString()}`, { credentials: "include", cache: "no-store" }),
          fetch(`/api/safety-effort/reports/by-location?${qs.toString()}&pageSize=200`, { credentials: "include", cache: "no-store" }),
        ]);
        if (sumRes.ok) {
          const p = await sumRes.json().catch(() => null);
          if (!cancelled && p?.data) setLiveSummary(p.data);
        }
        if (locRes.ok) {
          const p = await locRes.json().catch(() => null);
          if (!cancelled && Array.isArray(p?.data?.items)) setLiveLocations(p.data.items);
        }
      } catch {
        /* keep baseline data */
      }
    })();
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const exportToExcel = () => {
    const data = chart4Data.map(item => {
      const total = item.safe + item.unsafe;
      const safePercent = item.safeRate ?? (total > 0 ? (item.safe / total) * 100 : 0);
      return {
        "หน่วยงาน": item.name,
        "สแกนที่ปลอดภัย (Safe)": item.safe,
        "ความไม่ปลอดภัย (Unsafe)": item.unsafe,
        "แก้ไขแล้ว (Solved)": item.solved,
        "อัตราความปลอดภัย (%)": parseFloat(Number(safePercent).toFixed(1))
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Safety Effort Summary");
    XLSX.writeFile(workbook, `Safety_Effort_Summary_${startDate}_to_${endDate}.xlsx`);
  };

  // Calculate dynamic date scaling factor
  const getScaleFactor = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end - start;
    if (diffTime < 0) return 0; // Negative range
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    return diffDays / 182; // Baseline is 182 days (approx. 6 months)
  };
  
  const scaleFactor = getScaleFactor();

  // Chart 1 (distribution by location type) — built from REAL /reports/by-location
  // when available; otherwise falls back to the scaled baseline.
  const chart1Data = (() => {
    if (Array.isArray(liveLocations) && liveLocations.length) {
      const buckets = { Plant: 0, Office: 0, Site: 0 };
      for (const row of liveLocations) {
        const type = String(row.location_type || "").toUpperCase();
        const count = Number(row.activities || 0);
        if (type === "PLANT") buckets.Plant += count;
        else if (type === "OFFICE") buckets.Office += count;
        else if (type === "SITE") buckets.Site += count;
      }
      const total = buckets.Plant + buckets.Office + buckets.Site;
      if (total > 0) {
        const meta = {
          Office: { color: "#2F80D0" },
          Plant: { color: "#79BE4B" },
          Site: { color: "#F5BE00" },
        };
        return ["Office", "Plant", "Site"].map((name) => ({
          name,
          count: buckets[name],
          value: Number(((buckets[name] / total) * 100).toFixed(1)),
          color: meta[name].color,
        }));
      }
    }
    return BASELINE_CHART1_DATA.map(item => ({ ...item, count: Math.round(item.count * scaleFactor) }));
  })();

  // TODO(DB): chart2 (safe / unsafe-act / unsafe-cond by location type), chart3
  //   (correction status %) and chart4 (per-Business-Unit safeRate) have no backing
  //   aggregate endpoint yet. They need a richer reports endpoint that classifies
  //   each assessment answer as safe/unsafe and joins activities -> organizations (BU).
  //   Until then these remain scaled-baseline samples.
  const chart2Data = BASELINE_CHART2_DATA.map(item => ({
    ...item,
    safe: Math.round(item.safe * scaleFactor),
    unsafeAct: Math.round(item.unsafeAct * scaleFactor),
    unsafeCond: Math.round(item.unsafeCond * scaleFactor),
    total: Math.round(item.total * scaleFactor),
  }));

  const chart3Data = BASELINE_CHART3_DATA.map(item => ({
    ...item,
    count: Math.round(item.count * scaleFactor)
  }));

  const chart4Data = BASELINE_CHART4_DATA.map(item => ({
    ...item,
    safe: Math.round(item.safe * scaleFactor),
    unsafe: Math.round(item.unsafe * scaleFactor),
    solved: Math.round(item.solved * scaleFactor),
  }));

  // Derived filtered metrics
  const getFilteredMetrics = () => {
    if (selectedBU === "All Business Units") {
      // Prefer REAL summary aggregates when available.
      if (liveSummary) {
        const totalChecks = Number(liveSummary.activities || 0);
        const unsafeCases = Number(liveSummary.open_findings || 0);
        const pendingCases = Number(liveSummary.open_actions || 0);
        const solvedCases = Math.max(0, unsafeCases - pendingCases);
        const safeRate = totalChecks > 0 ? Number((((totalChecks - unsafeCases) / totalChecks) * 100).toFixed(1)) : 0;
        return { totalChecks, safeRate, unsafeCases, solvedCases, pendingCases, unresolvedCases: 0 };
      }
      return {
        totalChecks: Math.round(OVERALL_DATA.totalChecks * scaleFactor),
        safeRate: OVERALL_DATA.safeRate,
        unsafeCases: Math.round(OVERALL_DATA.unsafeCases * scaleFactor),
        solvedCases: Math.round(OVERALL_DATA.solvedCases * scaleFactor),
        pendingCases: Math.round(OVERALL_DATA.pendingCases * scaleFactor),
        unresolvedCases: Math.round(OVERALL_DATA.unresolvedCases * scaleFactor),
      };
    }
    const bu = chart4Data.find(b => b.name === selectedBU);
    if (!bu) {
      return {
        totalChecks: 0,
        safeRate: 0,
        unsafeCases: 0,
        solvedCases: 0,
        pendingCases: 0,
        unresolvedCases: 0
      };
    }
    
    const total = bu.safe + bu.unsafe;
    const rate = bu.safeRate ?? (total > 0 ? Number(((bu.safe / total) * 100).toFixed(1)) : 0);
    return {
      totalChecks: total,
      safeRate: rate,
      unsafeCases: bu.unsafe,
      solvedCases: bu.solved,
      pendingCases: Math.max(0, bu.unsafe - bu.solved),
      unresolvedCases: 0
    };
  };

  const metrics = getFilteredMetrics();
  const dateRangeDays = (() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  })();
  const correctionRate = ((metrics.solvedCases / (metrics.solvedCases + metrics.pendingCases || 1)) * 100).toFixed(1);
  const focusedBusinessUnitCount = selectedBU === "All Business Units" ? chart4Data.length : 1;
  const topBusinessUnit = [...chart4Data].sort((a, b) => (b.safe + b.unsafe) - (a.safe + a.unsafe))[0];

  // Helper to scale values for column heights
  const getScaledHeight = (val, max) => {
    if (val === 0) return 0;
    // Bar container height differs per breakpoint (desktop bars-flex = 90px,
    // tablet/mobile = 165px). Keep bars inside the container with a little headroom.
    const maxHeight = isDesktop ? 82 : 150;
    if (scaleType === "linear") {
      return (val / (max || 1)) * maxHeight;
    } else {
      const logVal = Math.log10(val + 1);
      const logMax = Math.log10(max + 1 || 1);
      return (logVal / logMax) * maxHeight;
    }
  };

  const formatNumberCompact = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + "k";
    }
    return val.toString();
  };

  return (
    <div className={`${dashboardStyles.dashboard} db-container`}>
      <style>{`
        .db-container {
          min-height: 100%;
          background: linear-gradient(180deg, var(--secondary) 0%, ${T.background} 220px, ${T.background} 100%);
          font-family: 'Prompt', 'Sarabun', sans-serif;
          color: ${T.foreground};
          padding: 16px;
        }

        @media (min-width: 1024px) {
          .db-container {
            padding: 18px 20px 22px;
          }
        }

        .db-top-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .db-top-left-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .db-header-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .db-kpi-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .db-top-right-panel {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .db-charts-row-1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .db-charts-row-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .db-metrics-summary-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: ${T.radius};
          padding: 16px;
          box-shadow: 0 6px 18px rgba(22,63,104,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .db-metrics-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          width: 100%;
        }
        .db-summary-metric-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(14,15,18,0.02);
          border: 1px solid rgba(14,15,18,0.04);
          padding: 10px 12px;
          border-radius: 10px;
        }
        .db-summary-metric-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .db-summary-metric-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .db-summary-metric-val {
          font-size: 13.5px;
          font-weight: 800;
          color: ${T.foreground};
          line-height: 1.2;
        }
        .db-summary-metric-lbl {
          font-size: 10.5px;
          color: ${T.foreground3};
          font-weight: 600;
          margin-top: 1px;
        }

        @media (min-width: 1024px) {
          .db-top-layout {
            grid-template-columns: 1.7fr 1fr;
            gap: 16px;
            margin-bottom: 12px;
          }
          .db-header-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .db-kpi-row {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .db-top-right-panel {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .db-charts-row-1 {
            grid-template-columns: 3.2fr 4.8fr 3fr;
            gap: 14px;
            margin-bottom: 12px;
          }
          .db-charts-row-2 {
            grid-template-columns: 2.14fr 1fr;
            gap: 14px;
            margin-bottom: 12px;
          }
          .db-metrics-summary-card {
            padding: 10px 12px;
            border-radius: 12px;
          }
          .db-metrics-summary-grid {
            gap: 6px;
          }
          .db-summary-metric-item {
            padding: 6px 8px;
            gap: 8px;
            border-radius: 8px;
          }
          .db-summary-metric-icon {
            width: 28px;
            height: 28px;
            border-radius: 6px;
          }
          .db-summary-metric-icon svg {
            width: 14px;
            height: 14px;
          }
          .db-summary-metric-val {
            font-size: 11.5px;
          }
          .db-summary-metric-lbl {
            font-size: 9px;
          }
        }

        .db-overview-card {
          background: linear-gradient(135deg, rgba(var(--brand-accent-rgb),0.12) 0%, ${T.card} 44%, ${T.card} 100%);
          border: 1px solid ${T.border};
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 10px 24px rgba(22,63,104,0.05);
          display: grid;
          gap: 14px;
        }

        .db-header {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 0;
        }

        @media (min-width: 1024px) {
          .db-header {
            flex-direction: row;
            align-items: stretch;
            justify-content: space-between;
          }
        }

        .db-header-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .db-overview-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .db-overview-copy {
          display: grid;
          gap: 8px;
          min-width: 0;
        }

        .db-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .db-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(14,15,18,0.08);
          background: rgba(255,255,255,0.78);
          font-size: 11.5px;
          font-weight: 800;
          color: ${T.foreground2};
        }

        .db-overview-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        @media (min-width: 768px) {
          .db-overview-stats {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .db-overview-stat {
          border: 1px solid rgba(14,15,18,0.08);
          background: rgba(255,255,255,0.82);
          border-radius: 14px;
          padding: 12px 12px 11px;
          display: grid;
          gap: 3px;
        }

        .db-overview-stat-value {
          font-size: 19px;
          font-weight: 900;
          line-height: 1.05;
        }

        .db-overview-stat-label {
          font-size: 11.5px;
          font-weight: 700;
          color: ${T.foreground3};
          line-height: 1.35;
        }

        .db-side-stack {
          display: grid;
          gap: 12px;
        }

        .db-side-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 18px;
          padding: 14px 16px;
          box-shadow: 0 8px 20px rgba(22,63,104,0.04);
          display: grid;
          gap: 12px;
        }

        .db-side-title {
          font-size: 12px;
          font-weight: 900;
          color: ${T.foreground3};
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .db-side-list {
          display: grid;
          gap: 10px;
        }

        .db-side-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
        }

        .db-side-row strong {
          font-size: 13.5px;
          color: ${T.foreground};
        }

        .db-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: ${T.card};
          border: 1px solid ${T.border};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: ${T.foreground2};
        }

        .db-back-btn:hover {
          background: ${T.surface2};
          border-color: ${T.primary};
          color: ${T.foreground};
          transform: translateX(-2px);
        }

        .db-title-area {
          display: flex;
          flex-direction: column;
        }

        .db-title {
          font-size: 25px;
          font-weight: 800;
          margin: 0;
          color: ${T.foreground};
          line-height: 1.15;
        }

        .db-subtitle {
          font-size: 13px;
          color: ${T.foreground3};
          margin-top: 0;
          font-weight: 600;
          line-height: 1.45;
        }

        .db-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .db-datepicker-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .db-date-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: ${T.card};
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid ${T.border};
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          position: relative;
        }

        .db-date-input {
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 700;
          border: none;
          background: transparent;
          color: ${T.foreground2};
          outline: none;
          cursor: pointer;
          padding: 2px 4px;
        }

        .db-date-input::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }

        .db-date-icon {
          color: ${T.foreground3};
          pointer-events: none;
          flex-shrink: 0;
        }

        .db-filter-label {
          font-size: 12px;
          font-weight: 800;
          color: ${T.foreground3};
          user-select: none;
        }

        .db-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .db-select {
          padding: 8px 36px 8px 14px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          border-radius: 10px;
          border: 1px solid ${T.border};
          background: ${T.card};
          color: ${T.foreground2};
          cursor: pointer;
          outline: none;
          appearance: none;
          transition: all 0.2s ease;
        }

        .db-select:focus {
          border-color: ${T.primary};
          box-shadow: 0 0 0 3px ${T.primarySoft};
        }

        .db-select-icon {
          position: absolute;
          right: 12px;
          pointer-events: none;
          color: ${T.foreground3};
        }

        /* Metrics Grid */
        .db-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }

        @media (min-width: 1024px) {
          .db-metrics-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .db-metric-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: ${T.radius};
          padding: 14px 16px;
          box-shadow: 0 4px 12px rgba(22,63,104,0.03);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .db-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(22,63,104,0.06);
        }

        .db-metric-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .db-metric-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .db-metric-value {
          font-size: 20px;
          font-weight: 900;
          color: ${T.foreground};
          line-height: 1.1;
        }

        .db-metric-label {
          font-size: 11.5px;
          font-weight: 700;
          color: ${T.foreground3};
          margin-top: 3px;
          line-height: 1.35;
        }

        /* Charts Layout */
        .db-charts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        @media (min-width: 1024px) {
          .db-charts-grid {
            grid-template-columns: repeat(12, 1fr);
          }
        }

        .db-card-5 {
          grid-column: span 5;
        }

        .db-card-7 {
          grid-column: span 7;
        }

        .db-chart-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: ${T.radius};
          padding: 16px;
          box-shadow: 0 6px 18px rgba(22,63,104,0.04);
          display: flex;
          flex-direction: column;
          min-height: 320px;
          position: relative;
        }

        .db-chart-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid ${T.border};
          padding-bottom: 10px;
          margin-bottom: 12px;
          gap: 10px;
        }

        .db-chart-title {
          font-size: 17.5px;
          font-weight: 850;
          color: ${T.foreground};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.35;
        }

        .db-chart-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 100%;
        }

        /* Custom Donut Chart Elements */
        .db-donut-wrapper {
          position: relative;
          width: 212px;
          height: 212px;
        }

        .db-donut-svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .db-donut-circle {
          fill: none;
          stroke-width: 13px;
          transition: stroke-width 0.2s ease, filter 0.2s ease;
          cursor: pointer;
        }

        .db-donut-circle:hover {
          stroke-width: 16px;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
        }

        .db-donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .db-donut-center-value {
          font-size: 30px;
          font-weight: 900;
          color: ${T.foreground};
          line-height: 1;
        }

        .db-donut-center-label {
          font-size: 13px;
          font-weight: 700;
          color: ${T.foreground3};
          margin-top: 4px;
          text-transform: uppercase;
        }

        .db-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 14px;
          width: 100%;
        }

        .db-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: ${T.foreground2};
          cursor: pointer;
          padding: 4px 7px;
          border-radius: 8px;
          transition: background 0.15s ease;
        }

        .db-legend-item:hover {
          background: ${T.surface2};
        }

        .db-legend-dot {
          width: 14px;
          height: 14px;
          border-radius: 4px;
        }

        /* Column Chart Elements */
        .db-col-chart-container {
          width: 100%;
          height: 214px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          border-bottom: 2px solid ${T.border};
          padding-bottom: 6px;
          margin-top: 6px;
        }

        .db-col-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: 80px;
          position: relative;
        }

        .db-col-bars-flex {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 165px;
          width: 100%;
          justify-content: center;
          overflow: hidden;
        }

        .db-col-bar {
          flex: 1;
          border-radius: 5px 5px 0 0;
          min-height: 4px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
        }

        .db-col-bar:hover {
          filter: brightness(1.04) saturate(1.08) drop-shadow(0 -2px 6px rgba(0,0,0,0.08));
        }

        .db-col-label {
          font-size: 13px;
          font-weight: 800;
          color: ${T.foreground2};
          margin-top: 8px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        /* Tooltip style */
        .db-chart-tooltip {
          position: absolute;
          background: rgba(15,23,42,0.92);
          backdrop-filter: blur(4px);
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11.5px;
          pointer-events: none;
          z-index: 50;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          gap: 3px;
          transition: opacity 0.1s ease;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .db-tooltip-title {
          font-weight: 800;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding-bottom: 3px;
          margin-bottom: 3px;
        }

        /* Scale Selector styles */
        .db-scale-toggle {
          display: flex;
          align-items: center;
          background: ${T.surface2};
          padding: 3px;
          border-radius: 8px;
          border: 1px solid ${T.border};
        }

        .db-scale-btn {
          padding: 4px 10px;
          font-size: 11.5px;
          font-weight: 700;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: ${T.foreground3};
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .db-scale-btn.active {
          background: ${T.card};
          color: ${T.foreground};
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        /* Data Table */
        .db-table-card {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: ${T.radius};
          padding: 16px;
          box-shadow: 0 6px 18px rgba(22,63,104,0.04);
          margin-bottom: 10px;
        }

        .db-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          text-align: left;
        }

        .db-table th {
          font-size: 11.5px;
          font-weight: 800;
          color: ${T.foreground3};
          padding: 10px 12px;
          border-bottom: 2px solid ${T.border};
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .db-table td {
          font-size: 12.5px;
          font-weight: 600;
          color: ${T.foreground2};
          padding: 10px 12px;
          border-bottom: 1px solid ${T.border};
        }

        .db-table tr:last-child td {
          border-bottom: none;
        }

        .db-table tr:hover td {
          background: ${T.surface2};
        }

        .db-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 800;
        }

        .db-badge-green { background: #ecfdf5; color: #1f7a55; }
        .db-badge-red { background: #fef2f2; color: #d5301a; }
        .db-badge-yellow { background: #fffbeb; color: #b7791f; }
        .db-badge-amber { background: #fff7ed; color: #c2410c; }

        @media (max-width: 767px) {
          .db-chart-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .db-overview-top {
            flex-direction: column;
          }
        }

        @media (min-width: 1024px) {
          .db-container {
            padding: 8px 12px 10px;
          }
          .db-overview-shell {
            gap: 10px;
            margin-bottom: 10px;
          }
          .db-overview-card {
            padding: 10px 12px;
            gap: 8px;
            border-radius: 12px;
          }
          .db-header {
            gap: 8px;
          }
          .db-title {
            font-size: 19px;
          }
          .db-subtitle {
            font-size: 11px;
          }
          .db-overview-top {
            gap: 6px;
          }
          .db-overview-copy div {
            font-size: 13.5px !important;
            line-height: 1.4 !important;
          }
          .db-tag {
            padding: 3px 6px;
            font-size: 10px;
          }
          .db-overview-stats {
            gap: 6px;
          }
          .db-overview-stat {
            padding: 6px 8px 5px;
            border-radius: 8px;
          }
          .db-overview-stat-value {
            font-size: 15px;
          }
          .db-overview-stat-label {
            font-size: 9.5px;
            line-height: 1.25;
          }
          .db-side-stack {
            gap: 6px;
          }
          .db-side-card {
            padding: 8px 10px;
            border-radius: 12px;
            gap: 6px;
          }
          .db-side-row {
            font-size: 11px;
            gap: 6px;
          }
          .db-side-row strong {
            font-size: 11.5px;
          }
          .db-metrics-grid {
            margin-bottom: 10px;
            gap: 8px;
          }
          .db-metric-card {
            padding: 8px 10px;
            border-radius: 12px;
            gap: 6px;
          }
          .db-metric-icon-wrapper {
            width: 30px;
            height: 30px;
            border-radius: 6px;
          }
          .db-metric-icon-wrapper svg {
            width: 16px;
            height: 16px;
          }
          .db-metric-value {
            font-size: 15px;
          }
          .db-metric-label {
            font-size: 9.5px;
            margin-top: 1px;
          }
          .db-charts-grid {
            gap: 10px;
            margin-bottom: 10px;
          }
          .db-chart-card {
            min-height: 220px;
            padding: 8px 10px;
            border-radius: 12px;
          }
          .db-chart-card-header {
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .db-chart-title {
            font-size: 12.5px;
          }
          .db-donut-wrapper {
            width: 105px;
            height: 105px;
          }
          .db-donut-circle {
            stroke-width: 8px;
          }
          .db-donut-circle:hover {
            stroke-width: 10px;
          }
          .db-donut-center-value {
            font-size: 14px;
          }
          .db-donut-center-label {
            font-size: 8px;
            margin-top: 1px;
          }
          .db-legend {
            margin-top: 4px;
            gap: 4px;
          }
          .db-legend-item {
            padding: 1px 3px;
            font-size: 9.5px;
            gap: 3px;
          }
          .db-legend-dot {
            width: 6px;
            height: 6px;
            border-radius: 1px;
          }
          .db-col-chart-container {
            height: 110px !important;
            padding-bottom: 2px;
            margin-top: 0px;
          }
          .db-col-bars-flex {
            height: 90px !important;
            gap: 2px;
          }
          .db-col-bar {
            border-radius: 2px 2px 0 0;
          }
          .db-col-label {
            font-size: 8px;
            margin-top: 2px;
          }
          .db-table-card {
            padding: 8px 12px;
            border-radius: 12px;
            margin-bottom: 0px;
          }
          .db-table-card h2 {
            font-size: 12.5px;
          }
          .db-table {
            margin-top: 4px;
          }
          .db-table th {
            padding: 4px 8px;
            font-size: 9.5px;
          }
          .db-table td {
            padding: 4px 8px;
            font-size: 10.5px;
          }
        }
      `}</style>

      <div className="db-top-layout">
        {/* Left Side: Header & KPI Cards */}
        <div className="db-top-left-panel">
          {/* Header Row */}
          <div className="db-header-row">
            <div className="db-header-left">
              <div className="db-title-area">
                <h1 className="db-title">แดชบอร์ดประเมินความปลอดภัย</h1>
                <span className="db-subtitle">Safety Effort / Line Walk Analytics Overview</span>
              </div>
            </div>

            <div className="db-filters">
              {/* Flexible Date Range Picker */}
              <div className="db-datepicker-container">
                <div className="db-date-box">
                  <input 
                    type="date" 
                    className="db-date-input" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Calendar size={13} className="db-date-icon" />
                </div>
                <span style={{ color: T.foreground3, fontWeight: "800", fontSize: "13px" }}>—</span>
                <div className="db-date-box">
                  <input 
                    type="date" 
                    className="db-date-input" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Calendar size={13} className="db-date-icon" />
                </div>
              </div>

              <div className="db-select-wrapper">
                <Filter size={14} className="db-select-icon" style={{ left: 12, right: "auto" }} />
                <Combobox
                  value={selectedBU}
                  onValueChange={setSelectedBU}
                  aria-label="กรองหน่วยงาน"
                  searchPlaceholder="ค้นหาหน่วยงาน"
                  style={{ paddingLeft: 34, minWidth: isMobile ? 160 : 200 }}
                  options={[
                    { value: "All Business Units", label: "ทุกหน่วยงาน (All BUs)" },
                    ...chart4Data.map((bu) => ({ value: bu.name, label: bu.name })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="db-kpi-row">
            <div className="db-metric-card">
              <div className="db-metric-icon-wrapper" style={{ background: "var(--brand-soft)", color: "var(--brand-text)" }}>
                <BarChart3 size={20} />
              </div>
              <div className="db-metric-info">
                <span className="db-metric-value">{metrics.totalChecks.toLocaleString()}</span>
                <span className="db-metric-label">จำนวนจุดตรวจทั้งหมด</span>
              </div>
            </div>

            <div className="db-metric-card">
              <div className="db-metric-icon-wrapper" style={{ background: "#ecfdf5", color: "#1f7a55" }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="db-metric-info">
                <span className="db-metric-value">{metrics.safeRate}%</span>
                <span className="db-metric-label">อัตราจุดปลอดภัย (Safe)</span>
              </div>
            </div>

            <div className="db-metric-card">
              <div className="db-metric-icon-wrapper" style={{ background: "#fef2f2", color: "#d5301a" }}>
                <AlertTriangle size={20} />
              </div>
              <div className="db-metric-info">
                <span className="db-metric-value">{metrics.unsafeCases.toLocaleString()}</span>
                <span className="db-metric-label">พบข้อไม่ปลอดภัย (Unsafe)</span>
              </div>
            </div>

            <div className="db-metric-card">
              <div className="db-metric-icon-wrapper" style={{ background: "#fffbeb", color: "#b7791f" }}>
                <Clock size={20} />
              </div>
              <div className="db-metric-info">
                <span className="db-metric-value">
                  {((metrics.solvedCases / (metrics.solvedCases + metrics.pendingCases || 1)) * 100).toFixed(1)}%
                </span>
                <span className="db-metric-label">สัดส่วนแก้ไขสำเร็จ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Insight & View Mode */}
        <div className="db-top-right-panel">
          <section className="db-side-card">
            <div className="db-side-title"><TrendingUp size={15} />Quick Insight</div>
            <div className="db-side-list">
              <div className="db-side-row">
                <span style={{ color: T.foreground3 }}>หน่วยงานที่มี volume สูงสุด</span>
                <strong>{topBusinessUnit?.name || "-"}</strong>
              </div>
              <div className="db-side-row">
                <span style={{ color: T.foreground3 }}>Unsafe cases</span>
                <strong style={{ color: "#d5301a" }}>{metrics.unsafeCases.toLocaleString()}</strong>
              </div>
              <div className="db-side-row">
                <span style={{ color: T.foreground3 }}>สถานะ unresolved</span>
                <strong>{metrics.unresolvedCases.toLocaleString()}</strong>
              </div>
            </div>
          </section>

          <section className="db-side-card">
            <div className="db-side-title">View Mode</div>
            <div className="db-side-list">
              <div className="db-side-row">
                <span style={{ color: T.foreground3 }}>Bar scaling</span>
                <div className="db-scale-toggle">
                  <button
                    className={`db-scale-btn ${scaleType === "logarithmic" ? "active" : ""}`}
                    onClick={() => setScaleType("logarithmic")}
                  >
                    Log
                  </button>
                  <button
                    className={`db-scale-btn ${scaleType === "linear" ? "active" : ""}`}
                    onClick={() => setScaleType("linear")}
                  >
                    Linear
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.foreground3, lineHeight: 1.4 }}>
                ใช้ `Log` เมื่อเทียบข้อมูลที่มีขนาดต่างกันมาก และ `Linear` เมื่อดูสัดส่วนจริง
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Row 2: Charts Row 1 (Pie, Bar, Donut) */}
      <div className="db-charts-row-1">
        {/* Chart 1: ภาพรวม Line walk */}
        <section className="db-chart-card">
          <div className="db-chart-card-header">
            <h2 className="db-chart-title">
              <PieChart size={18} color={T.primary} />
              ภาพรวมพื้นที่การตรวจ Line walk
            </h2>
          </div>
          <div className="db-chart-body">
            <div className="db-donut-wrapper">
              <svg className="db-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" stroke="var(--secondary)" strokeWidth="13" fill="none" />
                {chart1Data.map((item, idx) => {
                  const circumference = 219.9;
                  const strokeLength = (item.value / 100) * circumference;
                  let offset = 0;
                  for (let i = 0; i < idx; i++) {
                    offset += (chart1Data[i].value / 100) * circumference;
                  }
                  
                  return (
                    <circle
                      key={item.name}
                      className="db-donut-circle"
                      cx="50"
                      cy="50"
                      r="35"
                      stroke={item.color}
                      strokeWidth="10"
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={-offset}
                      onMouseEnter={() => setHoveredSlice({ ...item, type: "chart1" })}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                })}
              </svg>
              <div className="db-donut-center">
                <span className="db-donut-center-value">
                  {chart1Data.reduce((acc, curr) => acc + curr.count, 0).toLocaleString()}
                </span>
                <span className="db-donut-center-label">ครั้ง</span>
              </div>
            </div>

            {/* Legend */}
            <div className="db-legend">
              {chart1Data.map(item => (
                <div 
                  key={item.name} 
                  className="db-legend-item"
                  onMouseEnter={() => setHoveredSlice({ ...item, type: "chart1" })}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <span className="db-legend-dot" style={{ background: item.color }} />
                  <span className="db-legend-copy">
                    <span>{item.name} ({item.value}%)</span>
                    <strong>{item.count.toLocaleString()}</strong>
                  </span>
                </div>
              ))}
            </div>

            {/* Local Tooltip */}
            {hoveredSlice && hoveredSlice.type === "chart1" && (
              <div className="db-chart-tooltip" style={{ bottom: 8, left: 16 }}>
                <span className="db-tooltip-title">{hoveredSlice.name}</span>
                <span>จำนวนสแกนตรวจ: <strong>{hoveredSlice.count.toLocaleString()} ครั้ง</strong></span>
                <span>คิดเป็นสัดส่วน: <strong>{hoveredSlice.value}%</strong></span>
              </div>
            )}
          </div>
        </section>

        {/* Chart 2: Status Line walk */}
        <section className="db-chart-card">
          <div className="db-chart-card-header">
            <h2 className="db-chart-title">
              <BarChart3 size={18} color={T.ok} />
              สถานะความปลอดภัยแยกตามหมวด (Status Line walk)
            </h2>
          </div>

          <div className="db-chart-body">
            <div className="db-col-chart-container" style={{ gap: isDesktop ? "12px" : "28px" }}>
              {chart2Data.map(item => {
                const max = Math.max(...chart2Data.map(d => d.safe));
                const safeHeight = getScaledHeight(item.safe, max);
                const actHeight = getScaledHeight(item.unsafeAct, max);
                const condHeight = getScaledHeight(item.unsafeCond, max);
                
                return (
                  <div key={item.category} className="db-col-group">
                    <div className="db-col-bars-flex">
                      {/* Safe Bar (Green) */}
                      <div
                        className="db-col-bar"
                        style={{ height: `${safeHeight}px`, background: C.safe, width: "24px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.category} - ปลอดภัย (Safe)`, value: item.safe })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Unsafe Act Bar (Red) */}
                      <div
                        className="db-col-bar"
                        style={{ height: `${actHeight}px`, background: C.unsafe, width: "24px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.category} - Unsafe Act`, value: item.unsafeAct })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Unsafe Condition Bar (Yellow) */}
                      <div
                        className="db-col-bar"
                        style={{ height: `${condHeight}px`, background: C.warn, width: "24px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.category} - Unsafe Condition`, value: item.unsafeCond })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "5px", fontSize: "11.5px", fontWeight: "800", marginTop: "5px", justifyContent: "center" }}>
                      <span style={{ color: C.safeText }}>{formatNumberCompact(item.safe)}</span>
                      <span style={{ color: C.unsafeText }}>{formatNumberCompact(item.unsafeAct)}</span>
                      <span style={{ color: C.warnText }}>{formatNumberCompact(item.unsafeCond)}</span>
                    </div>
                    <div className="db-col-label">{item.category}</div>
                  </div>
                );
              })}
            </div>

            {/* Custom Legend */}
            <div className="db-legend">
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: C.safe }} /><span>Safe</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: C.unsafe }} /><span>Unsafe Act</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: C.warn }} /><span>Unsafe Condition</span></div>
            </div>

            {/* Tooltip */}
            {hoveredBar && (
              <div className="db-chart-tooltip" style={{ bottom: 8, left: 16 }}>
                <span className="db-tooltip-title">{hoveredBar.title}</span>
                <span>จำนวน: <strong>{hoveredBar.value.toLocaleString()} จุด</strong></span>
              </div>
            )}
          </div>
        </section>

        {/* Chart 3: สถานะการแก้ไข */}
        <section className="db-chart-card">
          <div className="db-chart-card-header">
            <h2 className="db-chart-title">
              <PieChart size={18} color={T.warning} />
              สถานะการแก้ไข (Correction Status)
            </h2>
          </div>
          <div className="db-chart-body">
            <div className="db-donut-wrapper">
              <svg className="db-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" stroke="var(--secondary)" strokeWidth="13" fill="none" />
                {chart3Data.map((item, idx) => {
                  const circumference = 219.9;
                  const strokeLength = (item.value / 100) * circumference;
                  let offset = 0;
                  for (let i = 0; i < idx; i++) {
                    offset += (chart3Data[i].value / 100) * circumference;
                  }
                  
                  return (
                    <circle
                      key={item.name}
                      className="db-donut-circle"
                      cx="50"
                      cy="50"
                      r="35"
                      stroke={item.color}
                      strokeWidth="10"
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={-offset}
                      onMouseEnter={() => setHoveredSlice({ ...item, type: "chart3" })}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                })}
              </svg>
              <div className="db-donut-center">
                <span className="db-donut-center-value">
                  {chart3Data[0].value}%
                </span>
                <span className="db-donut-center-label">แก้ไขสำเร็จ</span>
              </div>
            </div>

            {/* Legend */}
            <div className="db-legend">
              {chart3Data.map(item => (
                <div 
                  key={item.name} 
                  className="db-legend-item"
                  onMouseEnter={() => setHoveredSlice({ ...item, type: "chart3" })}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <span className="db-legend-dot" style={{ background: item.color }} />
                  <span className="db-legend-copy">
                    <span>{item.name === "Success" ? "แก้ไขแล้ว" : item.name === "Pending" ? "รอดำเนินการ" : "ยังไม่ได้ทำ"} ({item.value}%)</span>
                    <strong>{item.count.toLocaleString()}</strong>
                  </span>
                </div>
              ))}
            </div>

            {/* Local Tooltip */}
            {hoveredSlice && hoveredSlice.type === "chart3" && (
              <div className="db-chart-tooltip" style={{ bottom: 8, left: 16 }}>
                <span className="db-tooltip-title">{hoveredSlice.name}</span>
                <span>จำนวนกรณี: <strong>{hoveredSlice.count.toLocaleString()} เคส</strong></span>
                <span>สัดส่วน: <strong>{hoveredSlice.value}%</strong></span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Row 3: Charts Row 2 (BU Bar Chart & 6 Metrics Grid) */}
      <div className="db-charts-row-2">
        {/* Chart 4: Safety Line walk */}
        <section className="db-chart-card">
          <div className="db-chart-card-header">
            <h2 className="db-chart-title">
              <Building2 size={18} color={T.info} />
              ความปลอดภัยแยกตามโรงงาน (Safety Line walk BU)
            </h2>
          </div>

          <div className="db-chart-body">
            <div className="db-col-chart-container" style={{ gap: "4px" }}>
              {chart4Data.map(item => {
                const max = Math.max(...chart4Data.map(d => d.safe));
                const safeHeight = getScaledHeight(item.safe, max);
                const unsafeHeight = getScaledHeight(item.unsafe, max);
                const solvedHeight = getScaledHeight(item.solved, max);
                
                const isHighlighted = selectedBU === "All Business Units" || selectedBU === item.name;
                
                return (
                  <div 
                    key={item.name} 
                    className="db-col-group" 
                    style={{ 
                      opacity: isHighlighted ? 1 : 0.28,
                      transition: "opacity 0.25s ease"
                    }}
                  >
                    <div className="db-col-bars-flex" style={{ gap: "2px" }}>
                      {/* Safe Bar (Green) */}
                      <div
                        className="db-col-bar"
                        style={{ height: `${safeHeight}px`, background: C.safe, width: "13px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.name} - Safe`, value: item.safe })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Unsafe Bar (Red) */}
                      <div
                        className="db-col-bar"
                        style={{ height: `${unsafeHeight}px`, background: C.unsafe, width: "13px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.name} - Unsafe`, value: item.unsafe })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Solved Bar (Yellow) */}
                      <div
                        className="db-col-bar"
                        style={{ height: `${solvedHeight}px`, background: C.warn, width: "13px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.name} - Solved`, value: item.solved })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "4px", fontSize: "10.5px", fontWeight: "800", marginTop: "5px", justifyContent: "center" }}>
                      <span style={{ color: C.safeText }}>{formatNumberCompact(item.safe)}</span>
                      <span style={{ color: C.unsafeText }}>{formatNumberCompact(item.unsafe)}</span>
                      <span style={{ color: C.warnText }}>{formatNumberCompact(item.solved)}</span>
                    </div>
                    {/* Shortened Label for UI fit */}
                    <div 
                      className="db-col-label" 
                      style={{ fontSize: "9.5px", fontWeight: isHighlighted ? "800" : "500" }}
                      title={item.name}
                    >
                      {item.name.replace("CPAC ", "").replace(" - South Chain", "")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Legend */}
            <div className="db-legend">
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: C.safe }} /><span>Safe</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: C.unsafe }} /><span>Unsafe</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: C.warn }} /><span>Solved (แก้ไขแล้ว)</span></div>
            </div>
          </div>
        </section>

        {/* 6 Metrics Grid Card */}
        <div className="db-metrics-summary-card">
          <div className="db-metrics-summary-grid">
            
            {/* 1. ช่วงเวลาตรวจ */}
            <div className="db-summary-metric-item">
              <div className="db-summary-metric-icon" style={{ background: "rgba(35, 76, 142, 0.08)", color: "#234c8e" }}>
                <Calendar size={18} />
              </div>
              <div className="db-summary-metric-info">
                <span className="db-summary-metric-val">{dateRangeDays} วัน</span>
                <span className="db-summary-metric-lbl">ช่วงเวลาตรวจ</span>
              </div>
            </div>

            {/* 2. BUs ทั้งหมด */}
            <div className="db-summary-metric-item">
              <div className="db-summary-metric-icon" style={{ background: "rgba(146, 106, 69, 0.08)", color: "var(--brand-text)" }}>
                <Building2 size={18} />
              </div>
              <div className="db-summary-metric-info">
                <span className="db-summary-metric-val">{focusedBusinessUnitCount} หน่วยงาน</span>
                <span className="db-summary-metric-lbl">BUS ทั้งหมด</span>
              </div>
            </div>
            <div className="db-summary-metric-item">
              <div className="db-summary-metric-icon" style={{ background: "#ecfdf5", color: "#1f7a55" }}>
                <CheckCircle2 size={18} />
              </div>
              <div className="db-summary-metric-info">
                <span className="db-summary-metric-val">Safe Rate {metrics.safeRate}%</span>
                <span className="db-summary-metric-lbl">อัตราจุดปลอดภัย</span>
              </div>
            </div>

            {/* 4. อยู่ระหว่างติดตาม */}
            <div className="db-summary-metric-item">
              <div className="db-summary-metric-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                <Clock size={18} />
              </div>
              <div className="db-summary-metric-info">
                <span className="db-summary-metric-val">{metrics.pendingCases}</span>
                <span className="db-summary-metric-lbl">อยู่ระหว่างติดตาม</span>
              </div>
            </div>

            {/* 5. จำนวนจุดตรวจทั้งหมด */}
            <div className="db-summary-metric-item">
              <div className="db-summary-metric-icon" style={{ background: "var(--brand-soft)", color: "var(--brand-text)" }}>
                <BarChart3 size={18} />
              </div>
              <div className="db-summary-metric-info">
                <span className="db-summary-metric-val">{metrics.totalChecks.toLocaleString()}</span>
                <span className="db-summary-metric-lbl">จำนวนจุดตรวจทั้งหมด</span>
              </div>
            </div>

            {/* 6. แก้ไขสำเร็จแล้ว */}
            <div className="db-summary-metric-item">
              <div className="db-summary-metric-icon" style={{ background: "#fef2f2", color: "#d5301a" }}>
                <CheckCircle2 size={18} />
              </div>
              <div className="db-summary-metric-info">
                <span className="db-summary-metric-val">{metrics.solvedCases}</span>
                <span className="db-summary-metric-lbl">แก้ไขสำเร็จแล้ว</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Data Table */}
      <section className="db-table-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, paddingBottom: "12px", marginBottom: "12px" }}>
          <h2 className="db-chart-title" style={{ margin: 0 }}>
            ตารางสรุปผลการตรวจความปลอดภัยของหน่วยงาน
          </h2>
          <button
            type="button"
            onClick={exportToExcel}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${T.primary}`,
              background: "transparent",
              color: T.foreground,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = T.primarySoft}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <Download size={14} strokeWidth={2.6} />
            ดาวน์โหลด Excel
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="db-table">
            <thead>
              <tr>
                <th>หน่วยงาน (BUSINESS UNIT)</th>
                <th>สแกนที่ปลอดภัย (SAFE)</th>
                <th>ความไม่ปลอดภัย (UNSAFE)</th>
                <th>แก้ไขแล้ว (SOLVED)</th>
                <th>ระดับความปลอดภัย</th>
              </tr>
            </thead>
            <tbody>
              {chart4Data.map(item => {
                const total = item.safe + item.unsafe;
                const safePercent = item.safeRate ?? (total > 0 ? (item.safe / total) * 100 : 0);
                let rating = "ปลอดภัยดีมาก";
                let ratingClass = "db-badge-green";

                if (safePercent < 94) {
                  rating = "ควรปรับปรุง";
                  ratingClass = "db-badge-red";
                } else if (safePercent < 97) {
                  rating = "ปลอดภัยพอใช้";
                  ratingClass = "db-badge-amber";
                } else if (safePercent < 98) {
                  rating = "ปลอดภัยดี";
                  ratingClass = "db-badge-yellow";
                }

                return (
                  <tr 
                    key={item.name}
                    style={{ 
                      background: selectedBU === item.name ? "rgba(var(--brand-accent-rgb), 0.08)" : "transparent",
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedBU(selectedBU === item.name ? "All Business Units" : item.name)}
                  >
                    <td style={{ fontWeight: "700" }}>{item.name}</td>
                    <td style={{ color: "#1f7a55" }}>{item.safe.toLocaleString()}</td>
                    <td style={{ color: "#d5301a", fontWeight: "700" }}>{item.unsafe.toLocaleString()}</td>
                    <td style={{ color: "#b7791f", fontWeight: "700" }}>{item.solved.toLocaleString()}</td>
                    <td>
                      <span className={`db-badge ${ratingClass}`}>
                        {rating} ({safePercent.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          gap: "12px", 
          fontSize: "12px", 
          color: T.foreground3, 
          marginTop: "16px",
          paddingBottom: "8px",
          fontWeight: "600"
        }}
      >
        <span>ข้อมูล ณ วันที่ 31 มีนาคม 2026</span>
        <span>•</span>
        <span>แหล่งข้อมูล: Safety Caring System</span>
      </div>
    </div>
  );
}
