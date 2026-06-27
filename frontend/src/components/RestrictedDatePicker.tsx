// @ts-nocheck
import { useEffect, useMemo, useState } from "react";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "July",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_LABELS_TH = [
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

// Convert a Date object to YYYY-MM-DD string
function toInputValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Build calendar days representing out-of-month padding days exactly like the reference image
function buildCalendarDays(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const cells = [];

  // Previous month padding days (rendered in grey)
  const prevMonthEnd = new Date(year, month, 0);
  const prevDaysInMonth = prevMonthEnd.getDate();
  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    cells.push({
      date: new Date(year, month - 1, prevDaysInMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // Next month padding days to round up to full week lines (rendered in grey)
  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(year, month + 1, nextMonthDay),
      isCurrentMonth: false,
    });
    nextMonthDay += 1;
  }

  return cells;
}

export default function RestrictedDatePicker({
  value,
  onChange,
  accent = "#2ecc71", // Green accent theme color matching the image
  modeLabels = { today: "ทำวันนี้", backdate: "ทำย้อนหลัง" },
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [backdateLimit, setBackdateLimit] = useState(5);
  const [allowedMode, setAllowedMode] = useState("all");
  const [allowedWeekdays, setAllowedWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [allowedDates, setAllowedDates] = useState([]);

  useEffect(() => {
    fetch("/api/safety-settings?key=safety_backdate", { credentials: "include" }).catch(() => null)
      .then(async (response) => {
        if (!response) return null;
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          console.warn("Safety settings load failed:", payload?.error || response.statusText);
          return null;
        }
        return payload.data?.setting?.setting_value || null;
      })
      .then((val) => {
        if (!val) return;
        setBackdateLimit(Number(val.limit ?? val.backdateLimit ?? 5));
        setAllowedMode(val.mode || val.allowedMode || "all");
        setAllowedWeekdays(
          Array.isArray(val.weekdays)
            ? val.weekdays
            : Array.isArray(val.allowedWeekdays)
            ? val.allowedWeekdays
            : [0, 1, 2, 3, 4, 5, 6]
        );
        setAllowedDates(
          Array.isArray(val.dates) ? val.dates : Array.isArray(val.allowedDates) ? val.allowedDates : []
        );
        setMode(val.backdateMode || "today");
      })
      .catch(() => undefined);
  }, []);

  const minBackdate = useMemo(() => startOfDay(addDays(today, -backdateLimit)), [today, backdateLimit]);
  const [mode, setMode] = useState("today");
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
  }, [mode, minBackdate]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthCells = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const minMonth = new Date(minBackdate.getFullYear(), minBackdate.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const canGoPrevYear = viewMonth.getFullYear() > minMonth.getFullYear();
  const canGoNextYear = viewMonth.getFullYear() < maxMonth.getFullYear();

  function isAllowed(date) {
    if (!date) return false;

    let allowedByLimit = false;
    if (mode === "today") {
      allowedByLimit = toInputValue(date) === toInputValue(today);
    } else {
      allowedByLimit = date >= minBackdate && date <= today;
    }
    if (!allowedByLimit) return false;

    if (allowedMode === "custom") {
      const dateDay = date.getDay();
      const dateStr = toInputValue(date);
      const matchesWeekday = allowedWeekdays.includes(dateDay);
      const matchesDate = allowedDates.includes(dateStr);
      return matchesWeekday || matchesDate;
    }

    return true;
  }

  function handlePick(date) {
    if (!isAllowed(date)) return;
    onChange(toInputValue(date));
    // Auto shift view month if out-of-month padding date is selected
    if (date.getMonth() !== viewMonth.getMonth()) {
      setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  // Check if a specific month in the current year has any selectable options
  function isMonthSelectable(monthIdx) {
    const startOfTargetMonth = new Date(viewMonth.getFullYear(), monthIdx, 1);
    const endOfTargetMonth = new Date(viewMonth.getFullYear(), monthIdx + 1, 0);
    return endOfTargetMonth >= minBackdate && startOfTargetMonth <= today;
  }

  const selectedValue = selectedDate ? toInputValue(selectedDate) : "";
  const displayDateObj = selectedDate || today;

  // Day number and weekday display name for the left pane
  const displayDayNum = displayDateObj.getDate();
  const displayWeekdayStr = displayDateObj.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const displayDateTh = `${displayDayNum} ${MONTH_LABELS_TH[displayDateObj.getMonth()]} ${displayDateObj.getFullYear() + 543}`;

  return (
    <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
      <style>{`
        .cal-container {
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid rgba(14,15,18,0.1);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.05);
          width: 100%;
          max-width: 420px;
          font-family: 'Sarabun', 'Prompt', sans-serif;
        }
        @media (min-width: 640px) {
          .cal-container {
            flex-direction: row;
          }
        }

        /* Left Pane Styling */
        .cal-left-pane {
          background: ${accent};
          padding: 16px 20px;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 100%;
          flex-shrink: 0;
          min-height: 160px;
          position: relative;
        }
        @media (min-width: 640px) {
          .cal-left-pane {
            width: 185px;
            min-height: 270px;
          }
        }

        .cal-hamburger {
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 4px;
        }
        .cal-large-day {
          font-size: 52px;
          font-weight: 800;
          line-height: 1;
          font-family: 'Prompt', sans-serif;
          letter-spacing: -0.02em;
        }
        .cal-day-name {
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          opacity: 0.95;
          margin-top: 2px;
          font-family: 'Prompt', sans-serif;
        }
        .cal-event-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.75);
          margin: 10px 0 4px;
        }
        .cal-event-desc {
          font-size: 11px;
          line-height: 1.4;
          font-weight: 700;
        }
        .cal-create-event-row {
          border-top: 1px solid rgba(255, 255, 255, 0.25);
          padding-top: 8px;
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        /* Right Pane Styling */
        .cal-right-pane {
          padding: 14px 18px;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          min-width: 0;
        }

        .cal-year-nav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          margin-bottom: 8px;
        }
        .cal-year-text {
          font-size: 13.5px;
          font-weight: 800;
          color: #d2d2d2;
          letter-spacing: 0.02em;
          font-family: 'Prompt', sans-serif;
          margin: 0 4px;
        }
        .cal-year-btn {
          background: none;
          border: none;
          color: #d2d2d2;
          cursor: pointer;
          font-size: 15px;
          padding: 0 4px;
          font-family: 'Prompt', sans-serif;
          font-weight: 800;
          transition: color 0.2s;
        }
        .cal-year-btn:not(:disabled):hover {
          color: #9c9c9c;
        }
        .cal-year-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .cal-month-list {
          display: flex;
          justify-content: space-between;
          overflow-x: auto;
          gap: 4px;
          padding-bottom: 4px;
          margin-bottom: 8px;
          border-bottom: 1px solid #f2f2f2;
          scrollbar-width: none; /* Firefox */
        }
        .cal-month-list::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .cal-month-btn {
          background: none;
          border: none;
          font-size: 11.5px;
          font-weight: 700;
          color: #c2c2c2;
          cursor: pointer;
          padding: 2px 4px;
          transition: all 0.2s;
          font-family: 'Prompt', sans-serif;
          flex-shrink: 0;
        }
        .cal-month-btn:not(:disabled):hover {
          color: #9c9c9c;
        }
        .cal-month-btn.active {
          color: ${accent} !important;
          font-weight: 900;
        }
        .cal-month-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .cal-weekday-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
          margin-bottom: 4px;
        }
        .cal-weekday-lbl {
          text-align: center;
          font-size: 10px;
          font-weight: 800;
          color: #a2a2a2;
          font-family: 'Prompt', sans-serif;
          text-transform: uppercase;
          padding: 2px 0;
        }

        .cal-days-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
        }
        .cal-day-btn {
          aspect-ratio: 1;
          border-radius: 50%;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11.5px;
          font-weight: 700;
          font-family: 'Prompt', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .cal-day-btn.out-month {
          color: #d6d6d6;
        }
        .cal-day-btn.in-month {
          color: #3f3f3f;
        }
        .cal-day-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
          background: rgba(14,15,18,0.02);
        }
        .cal-day-btn.selected {
          background: ${accent} !important;
          color: #ffffff !important;
          box-shadow: 0 4px 10px rgba(46, 204, 113, 0.35);
        }
        .cal-day-btn.today-allowed:not(.selected) {
          box-shadow: inset 0 0 0 1px ${accent};
        }
      `}</style>

      <p
        style={{
          margin: "0 0 2px",
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(14,15,18,0.62)",
          fontFamily: "'Prompt','Sarabun',sans-serif",
        }}
      >
        {mode === "today"
          ? "เลือกได้เฉพาะวันที่เข้ามาทำรายการวันนี้เท่านั้น"
          : `เลือกย้อนหลังได้ไม่เกิน ${backdateLimit} วัน รวมถึงวันปัจจุบัน`}
      </p>

      <div className="cal-container">
        {/* Right Pane: Interactive Calendar Grid */}
        <div className="cal-right-pane">
          {/* Year Nav at top-right */}
          <div className="cal-year-nav">
            <button
              type="button"
              className="cal-year-btn"
              onClick={() => canGoPrevYear && setViewMonth(new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1))}
              disabled={!canGoPrevYear}
            >
              {"<"}
            </button>
            <span className="cal-year-text">{viewMonth.getFullYear() + 543}</span>
            <button
              type="button"
              className="cal-year-btn"
              onClick={() => canGoNextYear && setViewMonth(new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1))}
              disabled={!canGoNextYear}
            >
              {">"}
            </button>
          </div>

          {/* Month List Bar */}
          <div className="cal-month-list">
            {MONTHS_SHORT.map((m, idx) => {
              const active = viewMonth.getMonth() === idx;
              const allowed = isMonthSelectable(idx);
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!allowed}
                  className={`cal-month-btn ${active ? "active" : ""}`}
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), idx, 1))}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Weekday headers */}
          <div className="cal-weekday-grid">
            {WEEKDAY_LABELS.map((lbl) => (
              <div key={lbl} className="cal-weekday-lbl">
                {lbl}
              </div>
            ))}
          </div>

          {/* Calendar Days grid */}
          <div className="cal-days-grid">
            {monthCells.map((cell, idx) => {
              const { date, isCurrentMonth } = cell;
              const allowed = isAllowed(date);
              const isSelected = selectedValue === toInputValue(date);
              const isToday = toInputValue(date) === toInputValue(today);

              return (
                <button
                  key={`${toInputValue(date)}-${idx}`}
                  type="button"
                  disabled={!allowed}
                  onClick={() => handlePick(date)}
                  className={`cal-day-btn ${isCurrentMonth ? "in-month" : "out-month"} ${isSelected ? "selected" : ""} ${isToday && allowed ? "today-allowed" : ""}`}
                >
                  {String(date.getDate()).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
