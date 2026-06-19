// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CHECKLISTS,
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_OPTIONS,
  deepCloneChecklists,
  getActiveChecklistCollection,
  restoreChecklistDefaults,
  saveChecklistDraft,
} from "@/features/safety-effort/config/checklists";
import { GripVertical, Eye, Trash2, Search, X, Check, Settings, ChevronDown, ChevronUp, Pencil, ClipboardList } from "lucide-react";



const T = {
  page: "var(--background)",
  panel: "var(--brand-soft)",
  card: "#ffffff",
  ink: "var(--c-1f1a17)",
  sub: "var(--c-6f665e)",
  line: "rgba(31,26,23,0.10)",
  lineStrong: "rgba(31,26,23,0.18)",
  accent: "var(--brand-accent-strong)",
  accentDeep: "var(--brand-text)",
  accentSoft: "var(--brand-soft)",
  danger: "#c73a21",
  ok: "#1f7a55",
  shadow: "0 20px 40px rgba(63, 37, 17, 0.08)",
};

const fieldStyle = {
  display: "grid",
  gap: 8,
};

const fieldLabelStyle = {
  fontSize: 12.5,
  fontWeight: 800,
  color: T.sub,
};

const inputStyle = {
  width: "100%",
  borderRadius: 14,
  border: `1px solid ${T.lineStrong}`,
  background: "#fff",
  color: T.ink,
  minHeight: 46,
  padding: "0 14px",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

const inputStylePremium = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  minHeight: 38,
  height: 38,
  padding: "0 12px",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s ease-in-out",
};

const selectStyle = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  minHeight: 38,
  height: 38,
  padding: "0 12px",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  transition: "border-color 0.15s ease-in-out",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundPosition: "right 10px center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "18px",
  paddingRight: "30px",
};

const buttonPrimaryStyle = {
  height: 44,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, var(--brand-accent-strong) 0%, var(--brand-accent) 100%)",
  color: "#fff",
  padding: "0 18px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "0 10px 24px var(--brand-shadow)",
};

const buttonGhostStyle = {
  height: 44,
  borderRadius: 14,
  border: `1px solid ${T.lineStrong}`,
  background: "#fff",
  color: T.ink,
  padding: "0 16px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
};

const buttonDangerStyle = {
  height: 44,
  borderRadius: 14,
  border: "none",
  background: "#fbe9e4",
  color: T.danger,
  padding: "0 16px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
};

function statusMeta(status) {
  if (status === "safe") return { label: "ปลอดภัย", color: "#1f7a55", bg: "#f0fdf4", border: "#bbf7d0" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย", color: "#c73a21", bg: "#fef2f2", border: "#fecaca" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย", color: "#e67e22", bg: "#fff7ed", border: "#ffedd5" };
  return { label: "N/A", color: "var(--c-6f665e)", bg: "#fbfbfa", border: "rgba(31,26,23,0.10)" };
}

function cloneDraft(data) {
  return deepCloneChecklists(data);
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createQuestionId(type, title, existingIds) {
  const base = slugify(title) || `${type}-question`;
  let candidate = `${type}-${base}`;
  let index = 2;
  while (existingIds.has(candidate)) {
    candidate = `${type}-${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function getGuideTitle(question) {
  if (question.guideTitle === false) return null;
  return question.guideTitle || `แนวทางการตรวจ ${question.title.split(":")[0]}`;
}

function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}


function PreviewCard({ question }) {
  const guideTitle = getGuideTitle(question);

  return (
    <div
      style={{
        border: `1px solid ${T.line}`,
        borderRadius: 18,
        background: "var(--brand-surface)",
        padding: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.accentDeep, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Preview
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{question.title || "หัวข้อคำถาม"}</div>
        {guideTitle ? (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>{guideTitle}</div>
        ) : (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>ซ่อน guide title ในหน้าประเมิน</div>
        )}
      </div>

      {question.image && (
        <div style={{ width: "100%", maxHeight: 180, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.line}`, background: "#fff", display: "flex", justifyContent: "center" }}>
          <img src={question.image} alt="Question" style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }} />
        </div>
      )}

      <div style={{ display: "grid", gap: 4 }}>
        {question.guidelines.length && (question.guidelines.length > 1 || question.guidelines[0] !== "") ? (
          question.guidelines.map((line, index) => (
            <div
              key={`${question.id}-preview-${index}`}
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                minHeight: line.trim() === "" ? "1.2em" : "auto",
              }}
            >
              {line}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 14, color: T.sub }}>ยังไม่มีรายละเอียดสำหรับข้อนี้</div>
        )}
      </div>

      {question.format === "text_box" ? (
        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 8, display: "grid", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.sub }}>จำลองรูปแบบการตอบ: แบบ Text Box</div>
          <textarea
            disabled
            placeholder="กรอกคำตอบของคุณที่นี่..."
            style={{
              width: "100%",
              borderRadius: 10,
              border: `1px solid ${T.lineStrong}`,
              background: "#fdfdfb",
              minHeight: 60,
              padding: "10px 12px",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              color: T.sub,
            }}
          />
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 8, display: "grid", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.sub }}>จำลองรูปแบบการตอบ: แบบเดิม (มีตัวเลือก)</div>
          <div style={{ display: "grid", gap: 6 }}>
            {["ปลอดภัย", "สภาพไม่ปลอดภัย", "พฤติกรรมไม่ปลอดภัย"].map((lbl, idx) => (
              <div
                key={idx}
                style={{
                  border: `2px solid ${idx === 0 ? "#22c55e" : idx === 1 ? "#ef4444" : "#f97316"}`,
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: idx === 0 ? "#15803d" : idx === 1 ? "#b91c1c" : "#c2410c",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{lbl}</span>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.15)" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SafetyAdmin() {
  const [draft, setDraft] = useState(() => cloneDraft(getActiveChecklistCollection()));
  const [savedSnapshot, setSavedSnapshot] = useState(() => cloneDraft(getActiveChecklistCollection()));
  const [selectedType, setSelectedType] = useState("factory");
  const [selectedQuestionId, setSelectedQuestionId] = useState(() => getActiveChecklistCollection().factory[0]?.id || "");
  const [query, setQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [tempQuestion, setTempQuestion] = useState(null);
  const [showBackdateLimitModal, setShowBackdateLimitModal] = useState(false);




  const [tempBackdateLimit, setTempBackdateLimit] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("safety_backdate_limit") || "5", 10);
    }
    return 5;
  });
  const [allowedMode, setAllowedMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("safety_allowed_mode") || "all";
    }
    return "all";
  });
  const [allowedWeekdays, setAllowedWeekdays] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("safety_allowed_weekdays");
        if (stored) return JSON.parse(stored);
      } catch (e) { }
    }
    return [0, 1, 2, 3, 4, 5, 6];
  });
  const [allowedDates, setAllowedDates] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("safety_allowed_dates");
        if (stored) return JSON.parse(stored);
      } catch (e) { }
    }
    return [];
  });
  const [newAllowedDate, setNewAllowedDate] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [backdateMode, setBackdateMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("safety_backdate_mode") || "today";
    }
    return "today";
  });

  const handleToggleMode = (mode) => {
    if (mode === "backdate") {
      if (typeof window !== "undefined") {
        setTempBackdateLimit(parseInt(localStorage.getItem("safety_backdate_limit") || "5", 10));
        setAllowedMode(localStorage.getItem("safety_allowed_mode") || "all");
        try {
          setAllowedWeekdays(JSON.parse(localStorage.getItem("safety_allowed_weekdays")) || [0, 1, 2, 3, 4, 5, 6]);
          setAllowedDates(JSON.parse(localStorage.getItem("safety_allowed_dates")) || []);
        } catch (e) { }
      }
      setBackdateMode("backdate");
      setShowBackdateLimitModal(true);
    } else {
      setBackdateMode("today");
      if (typeof window !== "undefined") {
        localStorage.setItem("safety_backdate_mode", "today");
      }
    }
  };

  const handleCancelBackdateModal = () => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("safety_backdate_mode") || "today";
      setBackdateMode(savedMode);
    } else {
      setBackdateMode("today");
    }
    setShowBackdateLimitModal(false);
  };

  const handleSaveBackdateModal = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("safety_backdate_limit", String(tempBackdateLimit));
      localStorage.setItem("safety_allowed_mode", allowedMode);
      localStorage.setItem("safety_allowed_weekdays", JSON.stringify(allowedWeekdays));
      localStorage.setItem("safety_allowed_dates", JSON.stringify(allowedDates));
      localStorage.setItem("safety_backdate_mode", "backdate");
    }
    setBackdateMode("backdate");
    setShowBackdateLimitModal(false);
  };

  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const isMobile = width < 768;
  const [mobileActiveView, setMobileActiveView] = useState("list"); // "list" | "editor"

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const currentList = draft[selectedType];
    if (!currentList.some((item) => item.id === selectedQuestionId)) {
      setSelectedQuestionId(currentList[0]?.id || "");
    }
  }, [draft, selectedQuestionId, selectedType]);

  const currentList = draft[selectedType];
  const filteredList = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return currentList;
    return currentList.filter((item) => item.title.toLowerCase().includes(term) || item.guidelines.some((line) => line.toLowerCase().includes(term)));
  }, [currentList, query]);




  const selectedQuestion = currentList.find((item) => item.id === selectedQuestionId) || currentList[0] || null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedSnapshot);

  const updateCurrentList = (updater) => {
    setDraft((prev) => {
      const next = cloneDraft(prev);
      next[selectedType] = updater(next[selectedType]);
      return next;
    });
  };

  const updateQuestion = (questionId, updater) => {
    updateCurrentList((list) => list.map((item) => (item.id === questionId ? updater({ ...item, guidelines: [...item.guidelines] }) : item)));
  };

  const handleAddQuestion = () => {
    setTempQuestion({
      title: "หัวข้อใหม่",
      guideTitle: "",
      guidelines: ["เพิ่มรายละเอียดที่นี่"],
      format: "original",
      image: undefined,
    });
    setShowAddTypeModal(true);
  };

  const confirmAddQuestion = (qData) => {
    const existingIds = new Set(currentList.map((item) => item.id));
    const newQuestion = {
      ...qData,
      id: createQuestionId(selectedType, qData.title, existingIds),
    };

    updateCurrentList((list) => [...list, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    setShowAddTypeModal(false);
    setTempQuestion(null);
    if (isMobile) setMobileActiveView("editor");
  };

  const handleDuplicateQuestion = () => {
    if (!selectedQuestion) return;

    const existingIds = new Set(currentList.map((item) => item.id));
    const duplicate = {
      ...selectedQuestion,
      id: createQuestionId(selectedType, `${selectedQuestion.title} copy`, existingIds),
      title: `${selectedQuestion.title} copy`,
      guidelines: [...selectedQuestion.guidelines],
    };

    updateCurrentList((list) => {
      const index = list.findIndex((item) => item.id === selectedQuestion.id);
      const next = [...list];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
    setSelectedQuestionId(duplicate.id);
    if (isMobile) setMobileActiveView("editor");
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTargetId) return;

    updateCurrentList((list) => list.filter((item) => item.id !== deleteTargetId));
    if (selectedQuestionId === deleteTargetId) {
      const remaining = currentList.filter((item) => item.id !== deleteTargetId);
      setSelectedQuestionId(remaining[0]?.id || "");
    }
    setDeleteTargetId(null);
  };

  const handleMove = (direction) => {
    if (!selectedQuestion) return;
    const currentIndex = currentList.findIndex((item) => item.id === selectedQuestion.id);
    updateCurrentList((list) => moveItem(list, currentIndex, currentIndex + direction));
  };

  const handleSaveDraft = () => {
    saveChecklistDraft(draft);
    setSavedSnapshot(cloneDraft(draft));
    setLastSavedAt(new Date().toLocaleString("th-TH"));
  };

  const handleReset = () => {
    const restored = cloneDraft(savedSnapshot);
    setDraft(restored);
    setSelectedQuestionId(restored[selectedType][0]?.id || "");
  };

  const handleRestoreDefault = () => {
    restoreChecklistDefaults();
    const restored = cloneDraft(DEFAULT_CHECKLISTS);
    setDraft(restored);
    setSavedSnapshot(cloneDraft(DEFAULT_CHECKLISTS));
    setSelectedQuestionId(restored[selectedType][0]?.id || "");
    setLastSavedAt("");
  };





  return (
    <div
      style={{
        height: isMobile ? "auto" : "100%",
        background: `radial-gradient(circle at top right, rgba(var(--brand-accent-rgb),0.18), transparent 28%), ${T.page}`,
        color: T.ink,
        fontFamily: "'Prompt','Sarabun',sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: isMobile ? "visible" : "hidden",
      }}
    >
      <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, padding: isMobile ? "12px 14px" : "16px 20px", minHeight: isMobile ? undefined : 0 }}>
        {/* Compact Header & Controls Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: 12,
            background: "#fff",
            border: `1px solid ${T.line}`,
            borderRadius: 20,
            padding: isMobile ? "12px 14px" : "12px 20px",
            boxShadow: "0 4px 12px rgba(63, 37, 17, 0.04)",
            flexShrink: 0,
          }}
        >
          {/* Left: Title + Tabs */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 12 : 24
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.ink, lineHeight: 1.1 }}>Safety Admin</div>
              {lastSavedAt && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>เซฟล่าสุด: {lastSavedAt}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {LOCATION_TYPE_OPTIONS.map((option) => {
                const active = selectedType === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setSelectedType(option.key);
                      setSelectedQuestionId(draft[option.key][0]?.id || "");
                      if (isMobile) setMobileActiveView("list");
                    }}
                    style={{
                      border: active ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
                      background: active ? T.accentSoft : "#fff",
                      color: active ? T.accentDeep : T.ink,
                      borderRadius: 999,
                      height: 36,
                      padding: "0 14px",
                      fontFamily: "inherit",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{option.label}</span>
                    <span
                      style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 999,
                        background: active ? "#fff" : T.accentSoft,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 11,
                      }}
                    >
                      {draft[option.key].length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Status badge & Actions */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: 12
          }}>
            {/* Toggle switch for Today vs Backdate */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f3f0", padding: 4, borderRadius: 12, border: `1px solid ${T.line}` }}>
              <button
                type="button"
                onClick={() => handleToggleMode("today")}
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "none",
                  background: backdateMode === "today" ? T.accent : "transparent",
                  color: backdateMode === "today" ? "#fff" : T.sub,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ทำวันนี้
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode("backdate")}
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "none",
                  background: backdateMode === "backdate" ? T.accent : "transparent",
                  color: backdateMode === "backdate" ? "#fff" : T.sub,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ทำย้อนหลัง
              </button>
            </div>

            {/* Old action buttons removed as requested. Switch selection is now the unified entry point. */}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: isMobile ? "center" : "flex-start",
                gap: 6,
                borderRadius: 999,
                background: dirty ? "var(--c-fff2cf)" : "#edf8f2",
                color: dirty ? T.accentDeep : T.ok,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: dirty ? T.accent : T.ok }} />
              {dirty ? "มีแก้ไขที่ยังไม่บันทึก" : "บันทึกแล้ว"}
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: isMobile ? "space-between" : "flex-start" }}>
              <button type="button" onClick={handleReset} style={{ ...buttonGhostStyle, height: 32, borderRadius: 8, fontSize: isMobile ? 11.5 : 13, padding: isMobile ? "0 8px" : "0 12px" }}>Reset</button>
              <button type="button" onClick={handleRestoreDefault} style={{ ...buttonDangerStyle, height: 32, borderRadius: 8, fontSize: isMobile ? 11.5 : 13, padding: isMobile ? "0 8px" : "0 12px" }}>Restore Default</button>
              <button type="button" onClick={handleSaveDraft} style={{ ...buttonPrimaryStyle, height: 32, borderRadius: 8, fontSize: isMobile ? 11.5 : 13, padding: isMobile ? "0 10px" : "0 14px", boxShadow: "none" }}>Save Draft</button>
            </div>
          </div>
        </div>

          <div
            style={{
              flex: isMobile ? "none" : 1,
              display: isMobile ? "flex" : "grid",
              gridTemplateColumns: isMobile ? undefined : "minmax(300px, 360px) minmax(0, 1fr)",
              flexDirection: isMobile ? "column" : undefined,
              gap: 16,
              minHeight: isMobile ? undefined : 0,
            }}
          >
          {/* Left Column: Question list */}
          {(!isMobile || mobileActiveView === "list") && (
            <aside
            style={{
              background: T.card,
              border: `1px solid ${T.line}`,
              borderRadius: 24,
              padding: 16,
              boxShadow: T.shadow,
              display: "flex",
              flexDirection: "column",
              height: isMobile ? "auto" : "100%",
              minHeight: isMobile ? undefined : 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.accentDeep }}>รายการข้อประเมิน</div>
                  <div style={{ fontSize: 12.5, color: T.sub }}>{LOCATION_TYPE_LABELS[selectedType]}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleDuplicateQuestion}
                    disabled={!selectedQuestion}
                    style={{
                      ...buttonGhostStyle,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      opacity: !selectedQuestion ? 0.5 : 1,
                      cursor: !selectedQuestion ? "not-allowed" : "pointer",
                    }}
                  >
                    Duplicate
                  </button>
                  <button type="button" onClick={handleAddQuestion} style={{ ...buttonPrimaryStyle, height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12.5, boxShadow: "none" }}>
                    + เพิ่มข้อ
                  </button>
                </div>
              </div>

              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อข้อหรือรายละเอียด" style={{ ...inputStyle, minHeight: 38, borderRadius: 10, fontSize: 13 }} />
            </div>

            <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", gap: 8, overflowY: isMobile ? "visible" : "auto", marginTop: 12, paddingRight: 4 }}>
              {filteredList.map((item, index) => {
                const active = item.id === selectedQuestionId;
                const isDragging = draggedId === item.id;
                const isOver = dragOverId === item.id;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      setDraggedId(item.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnter={() => {
                      if (draggedId && draggedId !== item.id) {
                        setDragOverId(item.id);
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverId((prev) => (prev === item.id ? null : prev));
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedId || draggedId === item.id) return;

                      updateCurrentList((list) => {
                        const fromIndex = list.findIndex((x) => x.id === draggedId);
                        const toIndex = list.findIndex((x) => x.id === item.id);
                        if (fromIndex === -1 || toIndex === -1) return list;

                        const next = [...list];
                        const [draggedItem] = next.splice(fromIndex, 1);
                        next.splice(toIndex, 0, draggedItem);
                        return next;
                      });
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    onClick={() => {
                      setSelectedQuestionId(item.id);
                      if (isMobile) setMobileActiveView("editor");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedQuestionId(item.id);
                        if (isMobile) setMobileActiveView("editor");
                      }
                    }}
                    style={{
                      textAlign: "left",
                      border: isOver
                        ? `2px dashed ${T.accent}`
                        : active
                          ? `1px solid ${T.accent}`
                          : `1px solid ${T.line}`,
                      background: active ? "var(--c-fff5de)" : "#fff",
                      borderRadius: 14,
                      padding: 10,
                      display: "grid",
                      gap: 4,
                      cursor: isDragging ? "grabbing" : "grab",
                      fontFamily: "inherit",
                      opacity: isDragging ? 0.4 : 1,
                      transition: "all 0.15s ease",
                      transform: isOver ? "scale(0.98)" : "none",
                      outline: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          background: active ? T.accent : T.accentSoft,
                          color: active ? "#fff" : T.accentDeep,
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </span>
                      <GripVertical size={14} style={{ color: T.sub, opacity: 0.6, cursor: "grab" }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.4, color: T.ink }}>{item.title}</div>
                  </div>
                );
              })}

              {!filteredList.length ? (
                <div style={{ border: `1px dashed ${T.lineStrong}`, borderRadius: 18, padding: 18, color: T.sub, fontSize: 13 }}>
                  ไม่พบข้อที่ตรงกับคำค้น
                </div>
              ) : null}
            </div>
          </aside>
          )}

          {/* Right Column: Question & Guidelines Editor */}
          {(!isMobile || mobileActiveView === "editor") && (
            <section
            style={{
              display: "flex",
              flexDirection: "column",
              height: isMobile ? "auto" : "100%",
              minHeight: isMobile ? undefined : 0,
              gap: 16,
            }}
          >
            {selectedQuestion ? (
              <>
                {/* Question Details Editor Card */}
                <div
                  style={{
                    background: T.card,
                    border: `1px solid ${T.line}`,
                    borderRadius: 24,
                    padding: 16,
                    boxShadow: T.shadow,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    gap: 12,
                    borderBottom: `1px solid ${T.line}`,
                    paddingBottom: 10
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {isMobile && (
                        <button
                          type="button"
                          onClick={() => setMobileActiveView("list")}
                          style={{
                            ...buttonGhostStyle,
                            height: 32,
                            borderRadius: 8,
                            fontSize: 12,
                            padding: "0 10px",
                            borderColor: T.accentDeep,
                            color: T.accentDeep,
                            marginRight: 6,
                          }}
                        >
                          ← กลับรายการ
                        </button>
                      )}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.accentDeep, textTransform: "uppercase" }}>Question Editor</span>
                        <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: T.ink }}>{selectedQuestion.title}</h2>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                      <button type="button" onClick={() => setDeleteTargetId(selectedQuestion.id)} style={{ ...buttonDangerStyle, height: 30, borderRadius: 8, fontSize: 11.5, padding: "0 10px" }}>ลบข้อ</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Question Title</span>
                      <input
                        value={selectedQuestion.title}
                        onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, title: event.target.value }))}
                        style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                      />
                    </label>

                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Guide Title</span>
                      <input
                        value={selectedQuestion.guideTitle === false ? "" : selectedQuestion.guideTitle || ""}
                        onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, guideTitle: event.target.value }))}
                        style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                        placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
                      />
                    </label>

                    <label style={{ ...fieldStyle, justifyItems: "end" }}>
                      <span style={fieldLabelStyle}>Show Guide Title</span>
                      <button
                        type="button"
                        onClick={() => updateQuestion(selectedQuestion.id, (item) => ({ ...item, guideTitle: item.guideTitle === false ? "" : false }))}
                        style={{
                          ...buttonGhostStyle,
                          height: 36,
                          minWidth: 100,
                          borderRadius: 8,
                          fontSize: 12,
                          background: selectedQuestion.guideTitle === false ? "var(--c-fff0ea)" : "#fff",
                          borderColor: selectedQuestion.guideTitle === false ? "rgba(199,58,33,0.25)" : T.lineStrong,
                          color: selectedQuestion.guideTitle === false ? T.danger : T.ink,
                          padding: "0 12px",
                        }}
                      >
                        {selectedQuestion.guideTitle === false ? "ซ่อนอยู่" : "เปิดอยู่"}
                      </button>
                    </label>
                  </div>


                </div>

                {/* Guidelines Editor & Live Preview Card */}
                <div
                  style={{
                    background: T.card,
                    border: `1px solid ${T.line}`,
                    borderRadius: 24,
                    padding: 16,
                    boxShadow: T.shadow,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flex: isMobile ? "none" : 1,
                    minHeight: isMobile ? undefined : 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.accentDeep }}>รายละเอียด & Preview</div>
                      <div style={{ fontSize: 12, color: T.sub }}>ใส่รายละเอียดข้อประเมินแยกกันทีละบรรทัด (กด Enter เพื่อขึ้นบรรทัดใหม่)</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", background: T.soft, borderRadius: 8, padding: 3, border: `1px solid ${T.line}` }}>
                        <button
                          type="button"
                          onClick={() => setShowPreview(false)}
                          style={{
                            height: 26,
                            padding: "0 12px",
                            borderRadius: 6,
                            border: "none",
                            background: !showPreview ? "#fff" : "transparent",
                            color: !showPreview ? T.accentDeep : T.sub,
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: "pointer",
                            boxShadow: !showPreview ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                          }}
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          style={{
                            height: 26,
                            padding: "0 12px",
                            borderRadius: 6,
                            border: "none",
                            background: showPreview ? "#fff" : "transparent",
                            color: showPreview ? T.accentDeep : T.sub,
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: "pointer",
                            boxShadow: showPreview ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                          }}
                        >
                          Preview จริง
                        </button>
                      </div>
                    </div>
                  </div>

                  {showPreview ? (
                    <div style={{ overflowY: isMobile ? "visible" : "auto", flex: isMobile ? "none" : 1, paddingRight: 4 }}>
                      <PreviewCard question={selectedQuestion} />
                    </div>
                  ) : (
                    <textarea
                      value={selectedQuestion.guidelines.join("\n")}
                      onChange={(event) =>
                        updateQuestion(selectedQuestion.id, (item) => ({
                          ...item,
                          guidelines: event.target.value.split("\n"),
                        }))
                      }
                      placeholder="ใส่รายละเอียดการตรวจแต่ละข้อแยกตามบรรทัด"
                      style={{
                        ...inputStyle,
                        flex: 1,
                        minHeight: 180,
                        resize: "vertical",
                        padding: "12px 14px",
                        fontSize: 13,
                        lineHeight: 1.6,
                        borderRadius: 14,
                        border: `1px solid ${T.lineStrong}`,
                        fontFamily: "inherit",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  border: `1px dashed ${T.lineStrong}`,
                  borderRadius: 24,
                  padding: 28,
                  background: "var(--brand-surface)",
                  color: T.sub,
                }}
              >
                ยังไม่มีข้อประเมินในหมวดนี้
              </div>
            )}
          </section>
          )}
        </div>
    </div>

      {deleteTargetId ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31, 26, 23, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "min(100%, 460px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }}>ยืนยันการลบข้อประเมิน</div>
            <div style={{ fontSize: 14.5, color: T.sub, lineHeight: 1.7 }}>
              ข้อนี้จะถูกลบออกจากหมวด {LOCATION_TYPE_LABELS[selectedType]} ใน draft ปัจจุบัน หากยังไม่ได้กด Save Draft สามารถกด Reset เพื่อย้อนกลับได้
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setDeleteTargetId(null)} style={buttonGhostStyle}>ยกเลิก</button>
              <button type="button" onClick={handleDeleteConfirmed} style={buttonDangerStyle}>ลบข้อ</button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddTypeModal && tempQuestion ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31, 26, 23, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "min(100%, 820px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, textAlign: "center", borderBottom: `1px solid ${T.line}`, paddingBottom: 10 }}>
              เพิ่มข้อประเมินใหม่
            </div>

            {/* Format Selector */}
            <div style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>เลือกรูปแบบข้อคำถามที่ต้องการเพิ่ม</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setTempQuestion(prev => ({ ...prev, format: "original" }))}
                  style={{
                    ...buttonGhostStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    borderRadius: 12,
                    gap: 8,
                    border: `2px solid ${tempQuestion.format === "original" ? T.accent : T.lineStrong}`,
                    background: tempQuestion.format === "original" ? "var(--brand-soft)" : "#fff",
                    color: tempQuestion.format === "original" ? T.accentDeep : T.ink,
                  }}
                >
                  <span style={{ fontSize: 18 }}>✔️</span>
                  <span style={{ fontWeight: 800, fontSize: 13.5 }}>แบบตัวเลือก (เดิม)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTempQuestion(prev => ({ ...prev, format: "text_box" }))}
                  style={{
                    ...buttonGhostStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    borderRadius: 12,
                    gap: 8,
                    border: `2px solid ${tempQuestion.format === "text_box" ? T.accent : T.lineStrong}`,
                    background: tempQuestion.format === "text_box" ? "var(--brand-soft)" : "#fff",
                    color: tempQuestion.format === "text_box" ? T.accentDeep : T.ink,
                  }}
                >
                  <span style={{ fontSize: 18 }}>📝</span>
                  <span style={{ fontWeight: 800, fontSize: 13.5 }}>แบบ Text Box</span>
                </button>
              </div>
            </div>

            {/* Editor & Preview Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 20, alignItems: "start" }}>
              
              {/* Left Column: Edit Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Question Title (ชื่อข้อ)</span>
                  <input
                    value={tempQuestion.title}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, title: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Guide Title (คำอธิบายเพิ่มเติม)</span>
                  <input
                    value={tempQuestion.guideTitle === false ? "" : tempQuestion.guideTitle || ""}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, guideTitle: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                    placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Guidelines (รายละเอียดแยกบรรทัด)</span>
                  <textarea
                    value={tempQuestion.guidelines.join("\n")}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, guidelines: e.target.value.split("\n") }))}
                    style={{
                      ...inputStyle,
                      minHeight: 90,
                      padding: "8px 10px",
                      fontSize: 13,
                      lineHeight: 1.5,
                      borderRadius: 8,
                      resize: "vertical",
                    }}
                    placeholder="ใส่รายละเอียดแต่ละบรรทัด..."
                  />
                </label>

                {/* Upload Image inside Modal */}
                <div style={fieldStyle}>
                  <span style={fieldLabelStyle}>รูปภาพประกอบคำถาม</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label
                      style={{
                        ...buttonGhostStyle,
                        height: 36,
                        borderRadius: 8,
                        fontSize: 12.5,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "0 12px",
                        background: "#fff",
                        border: `1px solid ${T.lineStrong}`,
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>อัปโหลดรูปภาพ</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTempQuestion(prev => ({ ...prev, image: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {tempQuestion.image && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", border: `1px solid ${T.line}` }}>
                          <img src={tempQuestion.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setTempQuestion(prev => ({ ...prev, image: undefined }))}
                          style={{
                            ...buttonDangerStyle,
                            height: 30,
                            borderRadius: 6,
                            padding: "0 8px",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          ลบรูป
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Preview Card */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={fieldLabelStyle}>ตัวอย่างการแสดงผลจริง (Live Preview)</span>
                <div style={{ border: `1px solid ${T.line}`, borderRadius: 18, background: "#fff", padding: 4 }}>
                  <PreviewCard question={tempQuestion} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddTypeModal(false);
                  setTempQuestion(null);
                }}
                style={buttonGhostStyle}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => confirmAddQuestion(tempQuestion)}
                style={{ ...buttonPrimaryStyle, background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)` }}
              >
                เพิ่มข้อประเมิน
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBackdateLimitModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31, 26, 23, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "min(100%, 460px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, textAlign: "center" }}>ตั้งค่าระบบทำย้อนหลัง</div>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, textAlign: "center" }}>
              กำหนดจำนวนวันที่อนุญาตให้ทำรายการย้อนหลังได้ และเลือกตั้งค่าเปิดระบบเฉพาะบางวันได้
            </div>

            {/* Part 1: Backdate Day Limit */}
            <div style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>จำนวนวันย้อนหลัง (วัน)</span>
              <input
                type="number"
                min="0"
                max="90"
                value={tempBackdateLimit}
                onChange={(e) => setTempBackdateLimit(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 14, textAlign: "center" }}
              />
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${T.line}`, margin: "4px 0" }} />

            {/* Part 2: Custom Allowed Days/Dates */}
            <div style={{ display: "grid", gap: 10 }}>
              <span style={fieldLabelStyle}>กำหนดวันเปิดระบบ</span>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>
                <input
                  type="radio"
                  name="allowedMode"
                  value="all"
                  checked={allowedMode === "all"}
                  onChange={() => setAllowedMode("all")}
                />
                อนุญาตทุกวัน (ค่าเริ่มต้น)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>
                <input
                  type="radio"
                  name="allowedMode"
                  value="custom"
                  checked={allowedMode === "custom"}
                  onChange={() => setAllowedMode("custom")}
                />
                กำหนดวันเปิดระบบด้วยตนเอง
              </label>
            </div>

            {allowedMode === "custom" && (
              <div style={{ display: "grid", gap: 14, borderTop: `1px dashed ${T.lineStrong}`, paddingTop: 14 }}>
                {/* Weekday Selection */}
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>เลือกวันในสัปดาห์ที่เปิดระบบ</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      { key: 0, label: "อา" },
                      { key: 1, label: "จ" },
                      { key: 2, label: "อ" },
                      { key: 3, label: "พ" },
                      { key: 4, label: "พฤ" },
                      { key: 5, label: "ศ" },
                      { key: 6, label: "ส" },
                    ].map(day => {
                      const checked = allowedWeekdays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            setAllowedWeekdays(prev =>
                              prev.includes(day.key)
                                ? prev.filter(k => k !== day.key)
                                : [...prev, day.key]
                            );
                          }}
                          style={{
                            height: 32,
                            padding: "0 10px",
                            borderRadius: 8,
                            border: checked ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
                            background: checked ? T.accentSoft : "#fff",
                            color: checked ? T.accentDeep : T.ink,
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Date Picker */}
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>เพิ่มวันที่ที่เปิดระบบเพิ่มเติม</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="date"
                      value={newAllowedDate}
                      onChange={(e) => setNewAllowedDate(e.target.value)}
                      style={{ ...inputStyle, minHeight: 36, padding: "0 10px", borderRadius: 8, fontSize: 13, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAllowedDate && !allowedDates.includes(newAllowedDate)) {
                          setAllowedDates(prev => [...prev, newAllowedDate].sort());
                          setNewAllowedDate("");
                        }
                      }}
                      style={{ ...buttonPrimaryStyle, height: 36, borderRadius: 8, fontSize: 12.5, boxShadow: "none", padding: "0 14px" }}
                    >
                      เพิ่มวัน
                    </button>
                  </div>

                  {/* Render list of specific dates */}
                  {allowedDates.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, maxHeight: 100, overflowY: "auto", padding: 4, background: "#fdfdfb", borderRadius: 8, border: `1px solid ${T.line}` }}>
                      {allowedDates.map(dateStr => (
                        <span
                          key={dateStr}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "2px 8px",
                            background: "var(--brand-soft)",
                            border: `1px solid ${T.line}`,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 800,
                          }}
                        >
                          {dateStr}
                          <button
                            type="button"
                            onClick={() => setAllowedDates(prev => prev.filter(d => d !== dateStr))}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: T.danger,
                              fontSize: 11,
                              fontWeight: 900,
                              cursor: "pointer",
                              padding: "0 2px",
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={handleCancelBackdateModal}
                style={{ ...buttonGhostStyle, height: 38, borderRadius: 10, fontSize: 13 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveBackdateModal}
                style={{ ...buttonPrimaryStyle, height: 38, borderRadius: 10, fontSize: 13, background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)`, boxShadow: "none" }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      ) : null}




    </div>
  );
}
