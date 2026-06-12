// @ts-nocheck
import { useEffect, useMemo, useState } from "react";

const WEEKDAY_LABELS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTH_LABELS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toInputValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(viewMonth) {
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export default function RestrictedDatePicker({
  value,
  onChange,
  accent = "var(--brand-accent)",
  modeLabels = { today: "ทำวันนี้", backdate: "ทำย้อนหลัง" },
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const minBackdate = useMemo(() => startOfDay(addDays(today, -5)), [today]);
  const [mode, setMode] = useState("today");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("safety_backdate_mode") || "today";
      setMode(savedMode);
    }
  }, []);
  const [viewMonth, setViewMonth] = useState(today);

  const selectedDate = useMemo(() => {
    if (value) {
      const parsed = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
    }
    return null;
  }, [value]);

  useEffect(() => {
    const fallback =
      mode === "today"
        ? today
        : selectedDate && selectedDate >= minBackdate && selectedDate <= today
          ? selectedDate
          : today;
    const normalized = startOfDay(fallback);
    onChange(toInputValue(normalized));
    setViewMonth(normalized);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthCells = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const minMonth = new Date(minBackdate.getFullYear(), minBackdate.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrev =
    viewMonth.getFullYear() > minMonth.getFullYear() ||
    (viewMonth.getFullYear() === minMonth.getFullYear() && viewMonth.getMonth() > minMonth.getMonth());
  const canGoNext =
    viewMonth.getFullYear() < maxMonth.getFullYear() ||
    (viewMonth.getFullYear() === maxMonth.getFullYear() && viewMonth.getMonth() < maxMonth.getMonth());

  function isAllowed(date) {
    if (!date) return false;
    if (mode === "today") {
      return toInputValue(date) === toInputValue(today);
    }
    return date >= minBackdate && date <= today;
  }

  function handlePick(date) {
    if (!isAllowed(date)) return;
    onChange(toInputValue(date));
  }

  const selectedValue = selectedDate ? toInputValue(selectedDate) : "";

  return (
    <div style={{ display: "grid", gap: 14, width: "100%", minWidth: 0 }}>
      <style>{`
        .rdp-container {
          padding: 14px 12px 16px;
        }
        .rdp-month-label {
          font-size: clamp(18px, 6vw, 28px);
        }
        .rdp-weekday-label {
          font-size: clamp(12px, 3.8vw, 17px);
        }
        .rdp-btn {
          min-height: clamp(38px, 11vw, 52px);
          border-radius: clamp(10px, 3vw, 14px);
          font-size: clamp(14px, 5.5vw, 24px);
        }
        .rdp-btn-placeholder {
          min-height: clamp(38px, 11vw, 52px);
        }
        .rdp-drag-handle {
          width: 96px;
          height: 8px;
          border-radius: 999px;
          background: rgba(14,15,18,0.18);
          margin: 0 auto 16px;
        }
        .rdp-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .rdp-days-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
        }
        @media (min-width: 768px) {
          .rdp-container {
            padding: 10px 14px 12px !important;
          }
          .rdp-month-label {
            font-size: 18px !important;
          }
          .rdp-weekday-label {
            font-size: 12.5px !important;
          }
          .rdp-btn {
            min-height: 30px !important;
            border-radius: 6px !important;
            font-size: 14px !important;
          }
          .rdp-btn-placeholder {
            min-height: 30px !important;
          }
          .rdp-drag-handle {
            display: none !important;
          }
          .rdp-header-row {
            margin-bottom: 8px !important;
          }
          .rdp-days-grid {
            gap: 4px !important;
          }
        }
      `}</style>


      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(14,15,18,0.62)",
          fontFamily: "'Prompt','Sarabun',sans-serif",
        }}
      >
        {mode === "today"
          ? "เลือกได้เฉพาะวันที่เข้ามาทำรายการวันนี้เท่านั้น"
          : "เลือกย้อนหลังได้ไม่เกิน 5 วัน รวมถึงวันปัจจุบัน"}
      </p>

      <div
        className="rdp-container"
        style={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          border: "1px solid rgba(14,15,18,0.10)",
          borderRadius: 18,
          background: "#ffffff",
          boxShadow: "0 10px 28px rgba(34,25,11,0.05)",
          padding: "14px 12px 16px",
        }}
      >
        <div className="rdp-drag-handle" />

        <div className="rdp-header-row">
          <div
            className="rdp-month-label"
            style={{
              color: "#5215a6",
              fontSize: "clamp(18px, 6vw, 28px)",
              fontWeight: 800,
              fontFamily: "'Prompt','Sarabun',sans-serif",
              lineHeight: 1.15,
              minWidth: 0,
            }}
          >
            {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear() + 543}
          </div>

          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => canGoPrev && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              disabled={!canGoPrev}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: canGoPrev ? "#5215a6" : "rgba(82,21,166,0.22)",
                fontSize: 28,
                lineHeight: 1,
                cursor: canGoPrev ? "pointer" : "not-allowed",
              }}
            >
              {"<"}
            </button>
            <button
              type="button"
              onClick={() => canGoNext && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              disabled={!canGoNext}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: canGoNext ? "#5215a6" : "rgba(82,21,166,0.22)",
                fontSize: 28,
                lineHeight: 1,
                cursor: canGoNext ? "pointer" : "not-allowed",
              }}
            >
              {">"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6, marginBottom: 6 }}>
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="rdp-weekday-label"
              style={{
                textAlign: "center",
                fontSize: "clamp(12px, 3.8vw, 17px)",
                fontWeight: 800,
                color: "#111111",
                fontFamily: "'Prompt','Sarabun',sans-serif",
                padding: "4px 0",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="rdp-days-grid">
          {monthCells.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="rdp-btn-placeholder" style={{ minHeight: "clamp(38px, 11vw, 52px)" }} />;
            }

            const allowed = isAllowed(date);
            const isSelected = selectedValue === toInputValue(date);
            const isToday = toInputValue(date) === toInputValue(today);

            return (
              <button
                key={toInputValue(date)}
                type="button"
                onClick={() => handlePick(date)}
                disabled={!allowed}
                className="rdp-btn"
                style={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: "clamp(38px, 11vw, 52px)",
                  borderRadius: "clamp(10px, 3vw, 14px)",
                  border: isSelected ? `2px solid ${accent}` : "1px solid transparent",
                  background: isSelected ? "var(--brand-soft)" : allowed ? "transparent" : "rgba(14,15,18,0.04)",
                  color: allowed ? "#111111" : "rgba(17,17,17,0.26)",
                  fontSize: "clamp(14px, 5.5vw, 24px)",
                  fontWeight: 800,
                  fontFamily: "'Prompt','Sarabun',sans-serif",
                  cursor: allowed ? "pointer" : "not-allowed",
                  opacity: allowed ? 1 : 0.8,
                  boxShadow: isToday && allowed && !isSelected ? "inset 0 0 0 1px rgba(var(--brand-accent-rgb),0.55)" : "none",
                }}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck
