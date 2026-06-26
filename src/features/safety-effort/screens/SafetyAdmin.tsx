// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CHECKLISTS,
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_OPTIONS,
  deepCloneChecklists,
  getActiveChecklistCollection,
  hydrateChecklistDraft,
  restoreChecklistDefaults,
  saveChecklistDraft,
} from "@/features/safety-effort/config/checklists";
import { uploadSafetyEffortMedia } from "@/features/safety-effort/lib/upload-media";
import { GripVertical, Eye, Trash2, Search, X, Check, Settings, ChevronDown, ChevronUp, Pencil, ClipboardList, Building, Users, MapPin } from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Dialog, DialogContent } from "@/components/ui/dialog";



const T = {
  page: "linear-gradient(180deg, #edf5ff 0, var(--background) 280px, var(--background) 100%)",
  panel: "#f4f8fc",
  card: "#ffffff",
  ink: "var(--c-1f1a17)",
  sub: "var(--c-6f665e)",
  line: "rgba(11,78,162,0.12)",
  lineStrong: "rgba(11,78,162,0.20)",
  accent: "var(--brand-accent-strong)",
  accentDeep: "var(--brand-text)",
  accentSoft: "#eaf4ff",
  soft: "#eef6ff",
  danger: "#e2553f",
  ok: "#1f7a55",
  shadow: "0 14px 32px rgba(6, 43, 99, 0.08)",
};

const fieldStyle = {
  display: "grid",
  gap: 8,
};

const fieldLabelStyle = {
  fontSize: 12.5,
  fontWeight: 800,
  color: "#5f7591",
};

const inputStyle = {
  width: "100%",
  borderRadius: 12,
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
  borderRadius: 12,
  border: "1px solid #f5c9c9",
  background: "#ffe7e7",
  color: T.danger,
  padding: "0 16px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
};

function statusMeta(status) {
  if (status === "safe") return { label: "ปลอดภัย (Safe)", color: "#1f7a55", bg: "#f0fdf4", border: "#bbf7d0" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย (Unsafe Condition)", color: "#c73a21", bg: "#fef2f2", border: "#fecaca" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย (Unsafe Act)", color: "#e67e22", bg: "#fff7ed", border: "#ffedd5" };
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

function isQuestionActive(question) {
  return question?.active !== false;
}


function PreviewCard({ question, isEditable, onGuidelinesChange }) {
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

      <div
        style={{
          border: isEditable ? "1px solid rgba(11,78,162,0.12)" : "none",
          borderRadius: isEditable ? 12 : 0,
          padding: isEditable ? "12px 14px" : 0,
          background: isEditable ? "#fff" : "transparent",
          display: "grid",
          gap: 4,
        }}
      >
        {isEditable ? (
          <textarea
            value={question.guidelines.join("\n")}
            onChange={(event) => onGuidelinesChange(event.target.value.split("\n"))}
            placeholder="ใส่รายละเอียดการตรวจแต่ละข้อแยกตามบรรทัด"
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              background: "transparent",
              resize: "none",
              fontSize: 14,
              lineHeight: 1.8,
              color: T.ink,
              fontFamily: "inherit",
              minHeight: 140,
              padding: 0,
              margin: 0,
            }}
          />
        ) : question.guidelines.length && (question.guidelines.length > 1 || question.guidelines[0] !== "") ? (
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
             {["ปลอดภัย (Safe)", "สภาพไม่ปลอดภัย (Unsafe Condition)", "พฤติกรรมไม่ปลอดภัย (Unsafe Act)"].map((lbl, idx) => (
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




  const [tempBackdateLimit, setTempBackdateLimit] = useState(5);
  const [allowedMode, setAllowedMode] = useState("all");
  const [allowedWeekdays, setAllowedWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [allowedDates, setAllowedDates] = useState([]);
  const [newAllowedDate, setNewAllowedDate] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [savingChecklists, setSavingChecklists] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [backdateMode, setBackdateMode] = useState("today");

  const handleToggleMode = (mode) => {
    if (mode === "backdate") {
      setBackdateMode("backdate");
      setShowBackdateLimitModal(true);
    } else {
      setBackdateMode("today");
      void persistBackdateSettings("today").then((saved) => { if (!saved) window.alert("บันทึกการตั้งค่าไม่สำเร็จ"); });
    }
  };

  const handleCancelBackdateModal = () => {
    setShowBackdateLimitModal(false);
  };

  const handleSaveBackdateModal = async () => {
    if (!await persistBackdateSettings("backdate")) { window.alert("บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"); return; }
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
    let cancelled = false;
    hydrateChecklistDraft()
      .then((collection) => {
        if (cancelled) return;
        const hydrated = cloneDraft(collection);
        setDraft(hydrated);
        setSavedSnapshot(cloneDraft(hydrated));
        setSelectedQuestionId(hydrated.factory[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) window.alert("โหลดแบบประเมินจาก DB ไม่สำเร็จ ระบบจะแสดงค่าเริ่มต้นไว้ก่อน");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // DB is the source of truth for shared admin settings.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/safety-settings?key=safety_backdate", { credentials: "include", cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        const raw = payload?.data?.setting?.setting_value;
        if (!raw) return;
        const value = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (cancelled || !value || typeof value !== "object") return;
        if (value.limit != null) setTempBackdateLimit(parseInt(String(value.limit), 10));
        if (value.mode) setAllowedMode(value.mode);
        if (Array.isArray(value.weekdays)) setAllowedWeekdays(value.weekdays);
        if (Array.isArray(value.dates)) setAllowedDates(value.dates);
        if (value.backdateMode) setBackdateMode(value.backdateMode);
      } catch { /* defaults remain until DB is available */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistBackdateSettings = async (mode) => {
    const value = {
      limit: tempBackdateLimit,
      mode: allowedMode,
      weekdays: allowedWeekdays,
      dates: allowedDates,
      backdateMode: mode,
    };
    try {
      const response = await fetch("/api/safety-settings?key=safety_backdate", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value }),
      });
      return response.ok;
    } catch { return false; }
  };

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

  const handleSaveDraft = async () => {
    setSavingChecklists(true);
    try {
      const saved = await saveChecklistDraft(draft);
      setDraft(cloneDraft(saved));
      setSavedSnapshot(cloneDraft(saved));
      setLastSavedAt(new Date().toLocaleString("th-TH"));
    } catch {
      window.alert("บันทึกแบบประเมินลง DB ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingChecklists(false);
    }
  };

  const handleReset = () => {
    const restored = cloneDraft(savedSnapshot);
    setDraft(restored);
    setSelectedQuestionId(restored[selectedType][0]?.id || "");
  };

  const handleRestoreDefault = async () => {
    setSavingChecklists(true);
    try {
      const restored = cloneDraft(await restoreChecklistDefaults());
      setDraft(restored);
      setSavedSnapshot(cloneDraft(restored));
      setSelectedQuestionId(restored[selectedType][0]?.id || "");
      setLastSavedAt(new Date().toLocaleString("th-TH"));
    } catch {
      window.alert("Restore Default ลง DB ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingChecklists(false);
    }
  };





  return (
    <div
      style={{
        minHeight: isMobile ? "auto" : "calc(100dvh - var(--topbar-h) - 32px)",
        background: T.page,
        color: T.ink,
        fontFamily: "'Prompt','Sarabun',sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: isMobile ? "visible" : "hidden",
      }}
    >
      <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, padding: isMobile ? "12px 14px" : "16px 20px", minHeight: isMobile ? undefined : 0 }}>
        {/* Hero */}
        <div style={{ flexShrink: 0 }}>
          <SafetyCultureHero
            eyebrow="SAFETY EFFORT ADMIN"
            title={<>จัดการแบบประเมิน</>}
            description="เพิ่ม แก้ไข และจัดเรียงข้อประเมินความปลอดภัยสำหรับ Linewalk และ Safety Contact"
            variant="community"
            backgroundImage="/images/heroes/safety-assessment-admin-hero.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
          />
        </div>
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
            borderRadius: 18,
            padding: isMobile ? "12px 14px" : "12px 20px",
            boxShadow: "0 10px 28px rgba(6, 43, 99, 0.08)",
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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", zIndex: 50 }}>
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  style={{
                    height: 40,
                    borderRadius: 12,
                    border: `1px solid rgba(11, 78, 162, 0.18)`,
                    background: "#fff",
                    color: "#1d4ed8",
                    padding: "0 16px",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    outline: "none",
                    boxShadow: "0 2px 6px rgba(11, 78, 162, 0.04)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#eff6ff";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "rgba(11, 78, 162, 0.18)";
                  }}
                >
                  {selectedType === "factory" && <Building size={16} style={{ color: "#1d4ed8" }} />}
                  {selectedType === "office" && <Users size={16} style={{ color: "#1d4ed8" }} />}
                  {selectedType === "site" && <MapPin size={16} style={{ color: "#1d4ed8" }} />}
                  <span>{LOCATION_TYPE_LABELS[selectedType]}</span>
                  <ChevronDown size={14} style={{ color: "#1d4ed8", transform: locationDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                </button>

                {/* Backdrop */}
                {locationDropdownOpen && (
                  <div
                    onClick={() => setLocationDropdownOpen(false)}
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                  />
                )}

                {/* Dropdown Menu */}
                {locationDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      width: 240,
                      background: "#fff",
                      border: `1px solid ${T.lineStrong}`,
                      borderRadius: 16,
                      boxShadow: "0 12px 36px rgba(6,43,99,0.16)",
                      zIndex: 50,
                      padding: 6,
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    {LOCATION_TYPE_OPTIONS.map((option) => {
                      const active = selectedType === option.key;
                      const count = draft[option.key].length;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            setSelectedType(option.key);
                            setSelectedQuestionId(draft[option.key][0]?.id || "");
                            setLocationDropdownOpen(false);
                            if (isMobile) setMobileActiveView("list");
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "none",
                            background: active ? "#eff6ff" : "transparent",
                            color: active ? "#1d4ed8" : T.ink,
                            fontSize: 13.5,
                            fontWeight: 800,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            outline: "none",
                          }}
                          onMouseOver={(e) => { if (!active) e.currentTarget.style.background = "#f1f5f9"; }}
                          onMouseOut={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: active ? "#fff" : "#f1f5f9",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              {option.key === "factory" && <Building size={14} style={{ color: active ? "#1d4ed8" : "#475569" }} />}
                              {option.key === "office" && <Users size={14} style={{ color: active ? "#1d4ed8" : "#475569" }} />}
                              {option.key === "site" && <MapPin size={14} style={{ color: active ? "#1d4ed8" : "#475569" }} />}
                            </div>
                            <span>{option.label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                minWidth: 22,
                                height: 22,
                                borderRadius: 999,
                                background: active ? "#fff" : "#f1f5f9",
                                color: active ? "#1d4ed8" : "#64748b",
                                display: "grid",
                                placeItems: "center",
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "0 6px",
                              }}
                            >
                              {count}
                            </span>
                            {active && <Check size={14} style={{ color: "#1d4ed8" }} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vertical Divider and Inactive Category Badges */}
              {LOCATION_TYPE_OPTIONS.filter(o => o.key !== selectedType).map((option) => {
                const count = draft[option.key].length;
                return (
                  <div key={option.key} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 8px" }} />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType(option.key);
                        setSelectedQuestionId(draft[option.key][0]?.id || "");
                        if (isMobile) setMobileActiveView("list");
                      }}
                      style={{
                        height: 38,
                        borderRadius: 999,
                        background: "#f1f5f9",
                        color: "#475569",
                        border: "none",
                        padding: "0 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 13,
                        transition: "all 0.15s ease",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                    >
                      {option.key === "factory" && <Building size={14} style={{ color: "#64748b" }} />}
                      {option.key === "office" && <Users size={14} style={{ color: "#64748b" }} />}
                      {option.key === "site" && <MapPin size={14} style={{ color: "#64748b" }} />}
                      <span>{count}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          <div
            style={{
              flex: isMobile ? "none" : 1,
              display: isMobile ? "flex" : "grid",
              gridTemplateColumns: isMobile
                ? undefined
                : "minmax(300px, 360px) minmax(0, 1fr) 300px",
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
                const isEnabled = isQuestionActive(item);

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
                          : `1px solid ${isEnabled ? T.line : "rgba(11,78,162,0.06)"}`,
                      background: active
                        ? (isEnabled ? "var(--c-fff5de)" : "rgba(255, 245, 222, 0.65)")
                        : (isEnabled ? "#fff" : "#f8fafc"),
                      borderRadius: 14,
                      padding: 10,
                      display: "grid",
                      gap: 4,
                      cursor: isDragging ? "grabbing" : "grab",
                      fontFamily: "inherit",
                      opacity: isDragging ? 0.4 : isEnabled ? 1 : 0.65,
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
                          background: active
                            ? (isEnabled ? T.accent : "#94a3b8")
                            : (isEnabled ? T.accentSoft : "#f1f5f9"),
                          color: active ? "#fff" : (isEnabled ? T.accentDeep : "#64748b"),
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </span>
                      <GripVertical size={14} style={{ color: isEnabled ? T.sub : "#94a3b8", opacity: 0.6, cursor: "grab" }} />
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        lineHeight: 1.4,
                        color: isEnabled ? T.ink : "#94a3b8",
                      }}
                    >
                      {item.title}
                    </div>
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
            <>
              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: isMobile ? "auto" : "100%",
                  minHeight: isMobile ? undefined : 0,
                  gap: 16,
                  overflowY: isMobile ? "visible" : "auto",
                  paddingRight: isMobile ? 0 : 4,
                }}
              >
                {selectedQuestion ? (
                  <>
                    {/* Question Details Editor Card */}
                    <div
                      style={{
                        background: T.card,
                        border: `1px solid ${T.line}`,
                        borderRadius: 22,
                        padding: isMobile ? 16 : 20,
                        boxShadow: "0 16px 34px rgba(6, 43, 99, 0.10)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "flex-start" : "center",
                        justifyContent: "space-between",
                        gap: 12
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
                            <span style={{ fontSize: 11, fontWeight: 900, color: "#5f7591", textTransform: "uppercase", letterSpacing: "0.04em" }}>QUESTION EDITOR</span>
                            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "4px 0 0", color: T.ink, lineHeight: 1.1 }}>{selectedQuestion.title}</h2>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, alignItems: "end" }}>
                        <label style={fieldStyle}>
                          <span style={fieldLabelStyle}>หัวข้อ</span>
                          <input
                            value={selectedQuestion.title}
                            onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, title: event.target.value }))}
                            style={{ ...inputStyle, minHeight: 42, borderRadius: 12, fontSize: 14, padding: "0 12px", boxShadow: "inset 0 1px 2px rgba(6,43,99,0.04)" }}
                          />
                        </label>

                        <label style={fieldStyle}>
                          <span style={fieldLabelStyle}>รายละเอียด</span>
                          <input
                            value={selectedQuestion.guideTitle === false ? "" : selectedQuestion.guideTitle || ""}
                            onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, guideTitle: event.target.value }))}
                            style={{ ...inputStyle, minHeight: 42, borderRadius: 12, fontSize: 14, padding: "0 12px", boxShadow: "inset 0 1px 2px rgba(6,43,99,0.04)" }}
                            placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
                          />
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
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: T.accentDeep }}>รายละเอียดข้อประเมิน</div>
                          <div style={{ fontSize: 12, color: T.sub }}>ใส่รายละเอียดที่ต้องประเมินแยกกันทีละบรรทัด (กด Enter เพื่อขึ้นบรรทัดใหม่)</div>
                        </div>
                      </div>
                      <div style={{ padding: 2 }}>
                        <PreviewCard
                          question={selectedQuestion}
                          isEditable={true}
                          onGuidelinesChange={(newLines) =>
                            updateQuestion(selectedQuestion.id, (item) => ({
                              ...item,
                              guidelines: newLines,
                            }))
                          }
                        />
                      </div>
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

              {/* Right Column: Settings Panel */}
              <aside
                style={{
                  background: T.card,
                  border: `1px solid ${T.line}`,
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: T.shadow,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  height: isMobile ? "auto" : "100%",
                  minHeight: isMobile ? undefined : 0,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 12, borderBottom: `1px solid ${T.line}` }}>
                  <Settings size={18} style={{ color: "#5f7591" }} />
                  <span style={{ fontSize: 15, fontWeight: 900, color: T.ink }}>การตั้งค่า</span>
                </div>

                {/* ระบบทำรายการ (Today/Backdate Toggle) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 900, color: T.ink }}>ระบบทำรายการ</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: T.soft, padding: 4, borderRadius: 12, border: `1px solid ${T.line}`, width: "100%" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleMode("today")}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background: backdateMode === "today" ? T.accent : "transparent",
                        color: backdateMode === "today" ? "#fff" : T.sub,
                        fontWeight: 800,
                        fontSize: 12.5,
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
                        flex: 1,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background: backdateMode === "backdate" ? T.accent : "transparent",
                        color: backdateMode === "backdate" ? "#fff" : T.sub,
                        fontWeight: 800,
                        fontSize: 12.5,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      ทำย้อนหลัง
                    </button>
                  </div>
                </div>

                {/* สถานะการบันทึก และ ปุ่มควบคุมหลัก */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      borderRadius: 10,
                      background: dirty ? "var(--c-fff2cf)" : "#edf8f2",
                      color: dirty ? T.accentDeep : T.ok,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      border: `1px solid ${dirty ? "rgba(245,158,11,0.15)" : "rgba(31,122,85,0.12)"}`
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: dirty ? T.accent : T.ok }} />
                    {dirty ? "มีแก้ไขที่ยังไม่บันทึก" : "บันทึกข้อมูลแล้ว"}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleRestoreDefault}
                      disabled={savingChecklists}
                      style={{
                        flex: 1,
                        ...buttonDangerStyle,
                        height: 38,
                        borderRadius: 10,
                        fontSize: 12.5,
                        padding: 0,
                        opacity: savingChecklists ? 0.6 : 1
                      }}
                    >
                      Restore Default
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={savingChecklists}
                      style={{
                        flex: 1,
                        ...buttonPrimaryStyle,
                        height: 38,
                        borderRadius: 10,
                        fontSize: 12.5,
                        padding: 0,
                        boxShadow: "none",
                        opacity: savingChecklists ? 0.7 : 1
                      }}
                    >
                      {savingChecklists ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                {selectedQuestion ? (
                  <>
                    <div style={{ height: 1, background: T.line }} />

                    {/* รูปแบบคำตอบ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 900, color: T.ink }}>รูปแบบคำตอบ</label>
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                          style={{
                            width: "100%",
                            height: 44,
                            borderRadius: 12,
                            border: `1px solid ${T.lineStrong}`,
                            background: "#fff",
                            color: T.ink,
                            padding: "0 14px",
                            fontSize: 13.5,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {selectedQuestion.format === "text_box" ? (
                              <>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: "#eff6ff", display: "grid", placeItems: "center" }}>
                                  <Pencil size={14} style={{ color: "#3b82f6" }} />
                                </div>
                                <span>Text Box</span>
                              </>
                            ) : (
                              <>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: "#eff6ff", display: "grid", placeItems: "center" }}>
                                  <ClipboardList size={14} style={{ color: "#3b82f6" }} />
                                </div>
                                <span>แบบตัวเลือก (เดิม)</span>
                              </>
                            )}
                          </div>
                          <ChevronDown size={16} style={{ color: T.sub, transform: formatDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                        </button>

                        {/* Backdrop overlay to close dropdown */}
                        {formatDropdownOpen && (
                          <div
                            onClick={() => setFormatDropdownOpen(false)}
                            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                          />
                        )}

                        {/* Dropdown Menu */}
                        {formatDropdownOpen && (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              left: 0,
                              width: "100%",
                              background: "#fff",
                              border: `1px solid ${T.lineStrong}`,
                              borderRadius: 12,
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                              zIndex: 1000,
                              padding: 4,
                              display: "grid",
                              gap: 2,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                updateQuestion(selectedQuestion.id, (item) => ({ ...item, format: "original" }));
                                setFormatDropdownOpen(false);
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: selectedQuestion.format !== "text_box" ? "#f1f5f9" : "transparent",
                                color: T.ink,
                                fontSize: 13,
                                fontWeight: 800,
                                textAlign: "left",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <ClipboardList size={14} style={{ color: "#3b82f6" }} />
                              <span>แบบตัวเลือก (เดิม)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateQuestion(selectedQuestion.id, (item) => ({ ...item, format: "text_box" }));
                                setFormatDropdownOpen(false);
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: selectedQuestion.format === "text_box" ? "#f1f5f9" : "transparent",
                                color: T.ink,
                                fontSize: 13,
                                fontWeight: 800,
                                textAlign: "left",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Pencil size={14} style={{ color: "#3b82f6" }} />
                              <span>Text Box</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* สถานะคำถาม */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 900, color: T.ink }}>สถานะคำถาม</label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 0",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: isQuestionActive(selectedQuestion) ? "#22c55e" : T.sub,
                            transition: "color 0.15s ease",
                          }}
                        >
                          {isQuestionActive(selectedQuestion) ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuestion(selectedQuestion.id, (item) => ({ ...item, active: !isQuestionActive(item) }))}
                          style={{
                            position: "relative",
                            display: "inline-flex",
                            width: 46,
                            height: 24,
                            borderRadius: 999,
                            background: isQuestionActive(selectedQuestion) ? "#22c55e" : "#cbd5e1",
                            border: "none",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            padding: 0,
                            outline: "none",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 3,
                              left: isQuestionActive(selectedQuestion) ? 25 : 3,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "#fff",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                              transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* ปุ่ม ลบข้อ */}
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(selectedQuestion.id)}
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 12,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontWeight: 800,
                        fontSize: 13.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        outline: "none",
                      }}
                    >
                      <Trash2 size={16} />
                      <span>ลบข้อประเมินนี้</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }} />
                    <div style={{ textAlign: "center", color: T.sub, padding: "20px 0", fontSize: 13 }}>
                      กรุณาเลือกหรือเพิ่มข้อประเมินเพื่อตั้งค่า
                    </div>
                  </>
                )}
              </aside>

            </>
          )}
        </div>
    </div>

      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent showCloseButton={false} className="safety-admin-form-popup z-[1000] p-0 sm:max-w-[460px]">
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
              ข้อนี้จะถูกลบออกจากหมวด {LOCATION_TYPE_LABELS[selectedType]} ใน draft ปัจจุบัน หากยังไม่ได้กด Save จะยังไม่บันทึกลงฐานข้อมูลถาวร
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setDeleteTargetId(null)} style={buttonGhostStyle}>ยกเลิก</button>
              <button type="button" onClick={handleDeleteConfirmed} style={buttonDangerStyle}>ลบข้อ</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddTypeModal && !!tempQuestion}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddTypeModal(false);
            setTempQuestion(null);
          }
        }}
      >
        <DialogContent showCloseButton={false} className="safety-admin-form-popup z-[1000] p-0 sm:max-w-[820px]">
          {tempQuestion ? (
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
                  <ClipboardList size={18} strokeWidth={2.2} />
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
                  <Pencil size={18} strokeWidth={2.2} />
                  <span style={{ fontWeight: 800, fontSize: 13.5 }}>แบบ Text Box</span>
                </button>
              </div>
            </div>

            {/* Editor & Preview Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 20, alignItems: "start" }}>
              
              {/* Left Column: Edit Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>หัวข้อ</span>
                  <input
                    value={tempQuestion.title}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, title: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>คำอธิบายเพิ่มเติม</span>
                  <input
                    value={tempQuestion.guideTitle === false ? "" : tempQuestion.guideTitle || ""}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, guideTitle: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                    placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>รายละเอียด</span>
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
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const media = await uploadSafetyEffortMedia(file, {
                              ownerType: "assessment_question",
                              ownerId: tempQuestion.id || null,
                              linkType: "question_image",
                            });
                            setTempQuestion(prev => ({ ...prev, image: media.url, imageMediaId: media.id }));
                          } catch (error) {
                            console.error("Failed to upload question image", error);
                            window.alert("อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
                          } finally {
                            e.target.value = "";
                          }
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
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showBackdateLimitModal} onOpenChange={(open) => !open && handleCancelBackdateModal()}>
        <DialogContent showCloseButton={false} className="safety-admin-form-popup z-[1000] p-0 sm:max-w-[460px]">
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
        </DialogContent>
      </Dialog>




    </div>
  );
}
