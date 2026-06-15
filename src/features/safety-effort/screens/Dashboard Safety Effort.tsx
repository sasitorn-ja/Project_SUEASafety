// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
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
  Download
} from "lucide-react";
import * as XLSX from "xlsx";

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

// Extracted PPTX baseline data
const OVERALL_DATA = {
  totalChecks: 20680,
  safeRate: 97.4,
  unsafeCases: 538,
  solvedCases: 48,
  pendingCases: 8,
  unresolvedCases: 1,
};

// Baseline Chart 1 data: ภาพรวม Line walk (approx. 182-day period)
const BASELINE_CHART1_DATA = [
  { name: "Office", value: 11.8, count: 2436, color: "#FFFF00" }, // Yellow
  { name: "Plant", value: 82.6, count: 17087, color: "#0070C0" }, // Blue
  { name: "Site", value: 5.6, count: 1157, color: "#FFC000" }     // Orange
];

// Baseline Chart 2 data: Status Line walk
const BASELINE_CHART2_DATA = [
  {
    category: "Plant",
    safe: 16618,
    unsafeAct: 44,
    unsafeCond: 425,
    total: 17087
  },
  {
    category: "Office",
    safe: 2413,
    unsafeAct: 4,
    unsafeCond: 19,
    total: 2436
  },
  {
    category: "Site",
    safe: 1112,
    unsafeAct: 1,
    unsafeCond: 44,
    total: 1157
  }
];

// Baseline Chart 3 data: สถานะการแก้ไข
const BASELINE_CHART3_DATA = [
  { name: "Success", value: 84.2, count: 48, color: "#92D050" }, // Light Green
  { name: "Pending", value: 14.0, count: 8, color: "#FFC000" },  // Orange
  { name: "Unresolved", value: 1.8, count: 1, color: "#E5E7EB" } // Gray
];

// Baseline Chart 4 data: Safety Line walk by Business Unit
const BASELINE_CHART4_DATA = [
  { name: "CPAC Metro", safe: 1308, unsafe: 29, solved: 7 },
  { name: "CPAC East", safe: 2629, unsafe: 30, solved: 6 },
  { name: "CPAC West", safe: 3253, unsafe: 1, solved: 3 },
  { name: "CPAC North", safe: 1768, unsafe: 73, solved: 6 },
  { name: "CPAC Northeast", safe: 4465, unsafe: 219, solved: 14 },
  { name: "RMC - South Chain", safe: 2077, unsafe: 74, solved: 7 },
  { name: "SMART Structure", safe: 1059, unsafe: 41, solved: 0 }
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

  const exportToExcel = () => {
    const data = chart4Data.map(item => {
      const total = item.safe + item.unsafe;
      const safePercent = total > 0 ? (item.safe / total) * 100 : 0;
      return {
        "หน่วยงาน": item.name,
        "สแกนที่ปลอดภัย (Safe)": item.safe,
        "ความไม่ปลอดภัย (Unsafe)": item.unsafe,
        "แก้ไขแล้ว (Solved)": item.solved,
        "อัตราความปลอดภัย (%)": parseFloat(safePercent.toFixed(1))
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

  // Apply scale factor to charts dynamically
  const chart1Data = BASELINE_CHART1_DATA.map(item => ({
    ...item,
    count: Math.round(item.count * scaleFactor)
  }));

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
    const rate = total > 0 ? ((bu.safe / total) * 100).toFixed(1) : 0;
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
    if (scaleType === "linear") {
      return (val / (max || 1)) * 180; // max height 180px
    } else {
      const logVal = Math.log10(val + 1);
      const logMax = Math.log10(max + 1 || 1);
      return (logVal / logMax) * 180;
    }
  };

  return (
    <div className="db-container">
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

        .db-overview-shell {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        @media (min-width: 1024px) {
          .db-overview-shell {
            grid-template-columns: minmax(0, 1.65fr) minmax(340px, 1fr);
            align-items: stretch;
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
          background: ${T.card};
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid ${T.border};
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        .db-date-input {
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          border: none;
          background: transparent;
          color: ${T.foreground2};
          outline: none;
          cursor: pointer;
          padding: 2px 4px;
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
          font-size: 15px;
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
          width: 176px;
          height: 176px;
        }

        .db-donut-svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .db-donut-circle {
          fill: none;
          stroke-width: 10px;
          transition: stroke-width 0.2s ease, filter 0.2s ease;
          cursor: pointer;
        }

        .db-donut-circle:hover {
          stroke-width: 12px;
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
          font-size: 22px;
          font-weight: 900;
          color: ${T.foreground};
          line-height: 1;
        }

        .db-donut-center-label {
          font-size: 11px;
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
          font-size: 12px;
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
          width: 12px;
          height: 12px;
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
          height: 164px;
          width: 100%;
          justify-content: center;
        }

        .db-col-bar {
          flex: 1;
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
        }

        .db-col-bar:hover {
          filter: brightness(1.08) drop-shadow(0 -2px 6px rgba(0,0,0,0.12));
        }

        .db-col-label {
          font-size: 10.5px;
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

        @media (max-width: 767px) {
          .db-chart-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .db-overview-top {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="db-overview-shell">
        <section className="db-overview-card">
          <header className="db-header">
        <div className="db-header-left">
          <button className="db-back-btn" onClick={() => navigate("/category")} aria-label="กลับหน้าหลัก">
            <ArrowLeft size={18} strokeWidth={2.6} />
          </button>
          <div className="db-title-area">
            <h1 className="db-title">แดชบอร์ดประเมินความปลอดภัย</h1>
            <span className="db-subtitle">Safety Effort / Line Walk Analytics Overview</span>
          </div>
        </div>

        <div className="db-filters">
          {/* Flexible Date Range Picker */}
          <div className="db-datepicker-container">
            <Calendar size={15} style={{ color: T.foreground3, marginRight: 4 }} />
            <span className="db-filter-label">ตั้งแต่:</span>
            <input 
              type="date" 
              className="db-date-input" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="db-filter-label" style={{ margin: "0 4px" }}>—</span>
            <span className="db-filter-label">ถึง:</span>
            <input 
              type="date" 
              className="db-date-input" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="db-select-wrapper">
            <Filter size={15} className="db-select-icon" style={{ left: 12, right: "auto" }} />
            <select 
              className="db-select" 
              value={selectedBU} 
              onChange={(e) => setSelectedBU(e.target.value)}
              style={{ paddingLeft: 34 }}
            >
              <option value="All Business Units">ทุกหน่วยงาน (All BUs)</option>
              {chart4Data.map(bu => (
                <option key={bu.name} value={bu.name}>{bu.name}</option>
              ))}
            </select>
          </div>
        </div>
          </header>

          <div className="db-overview-top">
            <div className="db-overview-copy">
              <div className="db-tag-row">
                <span className="db-tag"><Calendar size={13} /> {dateRangeDays || 0} วัน</span>
                <span className="db-tag"><Building2 size={13} /> {focusedBusinessUnitCount} หน่วยงาน</span>
                <span className="db-tag"><CheckCircle2 size={13} /> Safe Rate {metrics.safeRate}%</span>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.55, color: T.foreground2, maxWidth: 780 }}>
                มุมมองนี้สรุปปริมาณการตรวจ สัดส่วนความปลอดภัย สถานะการแก้ไข และผลแยกตาม Business Unit ในหน้าเดียว เพื่อให้เห็นภาพรวมได้เร็วขึ้นโดยไม่ต้องไล่ลงไปทีละการ์ด
              </div>
            </div>
            <div style={{ minWidth: 120, textAlign: "right" }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: T.foreground3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Focus</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.foreground, marginTop: 4 }}>
                {selectedBU === "All Business Units" ? "All BUs" : selectedBU}
              </div>
            </div>
          </div>

          <div className="db-overview-stats">
            <div className="db-overview-stat">
              <div className="db-overview-stat-value">{metrics.totalChecks.toLocaleString()}</div>
              <div className="db-overview-stat-label">จำนวนจุดตรวจรวมในช่วงเวลาที่เลือก</div>
            </div>
            <div className="db-overview-stat">
              <div className="db-overview-stat-value" style={{ color: T.ok }}>{metrics.solvedCases.toLocaleString()}</div>
              <div className="db-overview-stat-label">แก้ไขสำเร็จแล้ว</div>
            </div>
            <div className="db-overview-stat">
              <div className="db-overview-stat-value" style={{ color: T.warning }}>{metrics.pendingCases.toLocaleString()}</div>
              <div className="db-overview-stat-label">อยู่ระหว่างติดตาม</div>
            </div>
            <div className="db-overview-stat">
              <div className="db-overview-stat-value">{correctionRate}%</div>
              <div className="db-overview-stat-label">Correction completion</div>
            </div>
          </div>
        </section>

        <aside className="db-side-stack">
          <section className="db-side-card">
            <div className="db-side-title">Quick Insight</div>
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
              <div style={{ fontSize: 12, color: T.foreground3, lineHeight: 1.45 }}>
                ใช้ `Log` เมื่อต้องการเทียบแท่งข้อมูลที่ขนาดต่างกันมาก และใช้ `Linear` เมื่อต้องการดูสัดส่วนจริงแบบตรงไปตรงมา
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Metrics Row */}
      <section className="db-metrics-grid">
        <div className="db-metric-card">
          <div className="db-metric-icon-wrapper" style={{ background: "var(--brand-soft)", color: "var(--brand-text)" }}>
            <BarChart3 size={24} />
          </div>
          <div className="db-metric-info">
            <span className="db-metric-value">{metrics.totalChecks.toLocaleString()}</span>
            <span className="db-metric-label">จำนวนจุดตรวจทั้งหมด</span>
          </div>
        </div>

        <div className="db-metric-card">
          <div className="db-metric-icon-wrapper" style={{ background: "#ecfdf5", color: "#1f7a55" }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="db-metric-info">
            <span className="db-metric-value">{metrics.safeRate}%</span>
            <span className="db-metric-label">อัตราจุดปลอดภัย (Safe)</span>
          </div>
        </div>

        <div className="db-metric-card">
          <div className="db-metric-icon-wrapper" style={{ background: "#fef2f2", color: "#d5301a" }}>
            <AlertTriangle size={24} />
          </div>
          <div className="db-metric-info">
            <span className="db-metric-value">{metrics.unsafeCases.toLocaleString()}</span>
            <span className="db-metric-label">พบข้อไม่ปลอดภัย (Unsafe)</span>
          </div>
        </div>

        <div className="db-metric-card">
          <div className="db-metric-icon-wrapper" style={{ background: "#fffbeb", color: "#b7791f" }}>
            <Clock size={24} />
          </div>
          <div className="db-metric-info">
            <span className="db-metric-value">
              {((metrics.solvedCases / (metrics.solvedCases + metrics.pendingCases || 1)) * 100).toFixed(1)}%
            </span>
            <span className="db-metric-label">สัดส่วนแก้ไขสำเร็จ</span>
          </div>
        </div>
      </section>

      {/* Grid Charts */}
      <main className="db-charts-grid">
        
        {/* Chart 1: ภาพรวม Line walk */}
        <section className="db-chart-card db-card-5">
          <div className="db-chart-card-header">
            <h2 className="db-chart-title">
              <PieChart size={18} color={T.primary} />
              ภาพรวมพื้นที่การตรวจ Line walk
            </h2>
          </div>
          <div className="db-chart-body">
            <div className="db-donut-wrapper">
              <svg className="db-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" stroke="var(--secondary)" strokeWidth="8" fill="none" />
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
                  <span>{item.name} ({item.value}%)</span>
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
        <section className="db-chart-card db-card-7">
          <div className="db-chart-card-header">
            <h2 className="db-chart-title">
              <BarChart3 size={18} color={T.ok} />
              สถานะความปลอดภัยแยกตามหมวด (Status Line walk)
            </h2>
          </div>

          <div className="db-chart-body">
            <div className="db-col-chart-container" style={{ gap: "28px" }}>
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
                        style={{ height: `${safeHeight}px`, background: "#92D050", width: "16px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.category} - ปลอดภัย (Safe)`, value: item.safe })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Unsafe Act Bar (Red) */}
                      <div 
                        className="db-col-bar"
                        style={{ height: `${actHeight}px`, background: "#FF0000", width: "16px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.category} - Unsafe Act`, value: item.unsafeAct })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Unsafe Condition Bar (Yellow) */}
                      <div 
                        className="db-col-bar"
                        style={{ height: `${condHeight}px`, background: "#FFFF00", width: "16px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.category} - Unsafe Condition`, value: item.unsafeCond })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </div>
                    <div className="db-col-label">{item.category}</div>
                  </div>
                );
              })}
            </div>

            {/* Custom Legend */}
            <div className="db-legend">
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: "#92D050" }} /><span>Safe</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: "#FF0000" }} /><span>Unsafe Act</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: "#FFFF00" }} /><span>Unsafe Condition</span></div>
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
        <section className="db-chart-card db-card-5">
          <div className="db-chart-card-header">
            <h2 className="db-chart-title">
              <PieChart size={18} color={T.warning} />
              สถานะการแก้ไข (Correction Status)
            </h2>
          </div>
          <div className="db-chart-body">
            <div className="db-donut-wrapper">
              <svg className="db-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" stroke="var(--secondary)" strokeWidth="8" fill="none" />
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
                  <span>{item.name === "Success" ? "แก้ไขแล้ว" : item.name === "Pending" ? "รอดำเนินการ" : "ยังไม่ได้ทำ"} ({item.value}%)</span>
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

        {/* Chart 4: Safety Line walk */}
        <section className="db-chart-card db-card-7">
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
                        style={{ height: `${safeHeight}px`, background: "#92D050", width: "8px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.name} - Safe`, value: item.safe })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Unsafe Bar (Red) */}
                      <div 
                        className="db-col-bar"
                        style={{ height: `${unsafeHeight}px`, background: "#FF0000", width: "8px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.name} - Unsafe`, value: item.unsafe })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Solved Bar (Yellow) */}
                      <div 
                        className="db-col-bar"
                        style={{ height: `${solvedHeight}px`, background: "#FFFF00", width: "8px" }}
                        onMouseEnter={() => setHoveredBar({ title: `${item.name} - Solved`, value: item.solved })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
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
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: "#92D050" }} /><span>Safe</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: "#FF0000" }} /><span>Unsafe</span></div>
              <div className="db-legend-item"><span className="db-legend-dot" style={{ background: "#FFFF00" }} /><span>Solved (แก้ไขแล้ว)</span></div>
            </div>
          </div>
        </section>

      </main>

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
            ดึงไฟล์ Excel
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="db-table">
            <thead>
              <tr>
                <th>หน่วยงาน (Business Unit)</th>
                <th>สแกนที่ปลอดภัย (Safe)</th>
                <th>ความไม่ปลอดภัย (Unsafe)</th>
                <th>แก้ไขแล้ว (Solved)</th>
                <th>ระดับความปลอดภัย</th>
              </tr>
            </thead>
            <tbody>
              {chart4Data.map(item => {
                const total = item.safe + item.unsafe;
                const safePercent = total > 0 ? (item.safe / total) * 100 : 0;
                let rating = "ปลอดภัยดีมาก";
                let ratingClass = "db-badge-green";
                
                if (safePercent < 95) {
                  rating = "ควรเฝ้าระวัง";
                  ratingClass = "db-badge-red";
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
                    <td style={{ color: "#d5301a" }}>{item.unsafe}</td>
                    <td style={{ color: "#b7791f" }}>{item.solved}</td>
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
    </div>
  );
}
