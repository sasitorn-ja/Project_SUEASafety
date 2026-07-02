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
import { GripVertical, Eye, Trash2, Search, X, Check, Settings, ChevronDown, ChevronUp, Pencil, ClipboardList, Building, Users, MapPin, ShieldAlert, ShieldCheck, Calendar, Plus } from "lucide-react";
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
  const [dragOverPosition, setDragOverPosition] = useState(null);
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
      window.alert("คืนค่าเริ่มต้นลง DB ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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
            backgroundImage="/images/heroes/Safety-Culture-Admin-Awareness1.png"
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)"
            }}>
              <ShieldCheck size={24} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>Safety Admin</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>ระบบจัดการแบบประเมินความปลอดภัย</div>
            </div>
          </div>

          {/* Top Right Date/Backdate Pill Card */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "6px 14px",
            borderRadius: 12,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Calendar size={18} />
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>การประเมินในข้อมูลเดิม</div>
              <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 800 }}>
                {backdateMode === "backdate" ? `ทำย้อนหลังได้ (${tempBackdateLimit} วัน)` : "ทำได้เฉพาะวันนี้"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBackdateLimitModal(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center"
              }}
              title="ตั้งค่าทำย้อนหลัง"
            >
              <Pencil size={14} />
            </button>
          </div>
        </div>

        <div
          style={{
            flex: isMobile ? "none" : 1,
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: isMobile
              ? undefined
              : "320px 1fr",
            flexDirection: isMobile ? "column" : undefined,
            gap: 16,
            minHeight: isMobile ? undefined : 0,
          }}
        >
          {/* Left Column: Question list */}
          {(!isMobile || mobileActiveView === "list") && (
            <aside
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                height: isMobile ? "auto" : "100%",
                minHeight: isMobile ? undefined : 0,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>รายการข้อประเมิน</div>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  style={{
                    height: 40,
                    width: "100%",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 13.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  <Plus size={16} />
                  <span>เพิ่มข้อประเมิน</span>
                </button>

                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ค้นหาข้อประเมิน"
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      paddingLeft: 34,
                      paddingRight: 12,
                      fontSize: 13,
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{
                flex: isMobile ? "none" : 1,
                maxHeight: isMobile ? "530px" : "calc(10 * 53px)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflowY: "auto",
                marginTop: 12,
                paddingRight: 4
              }}>
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
                        const rect = e.currentTarget.getBoundingClientRect();
                        const offset = e.clientY - rect.top;
                        const position = offset < rect.height / 2 ? "top" : "bottom";
                        if (dragOverId !== item.id || dragOverPosition !== position) {
                          setDragOverId(item.id);
                          setDragOverPosition(position);
                        }
                      }}
                      onDragLeave={(e) => {
                        // Prevent flicker when moving over children
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setDragOverId(null);
                          setDragOverPosition(null);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                        setDragOverPosition(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!draggedId || draggedId === item.id) {
                          setDraggedId(null);
                          setDragOverId(null);
                          setDragOverPosition(null);
                          return;
                        }

                        const rect = e.currentTarget.getBoundingClientRect();
                        const offset = e.clientY - rect.top;
                        const dropToBottom = offset >= rect.height / 2;

                        updateCurrentList((list) => {
                          const fromIndex = list.findIndex((x) => x.id === draggedId);
                          if (fromIndex === -1) return list;

                          const next = [...list];
                          const [draggedItem] = next.splice(fromIndex, 1);
                          
                          let targetIndex = next.findIndex((x) => x.id === item.id);
                          if (targetIndex === -1) return list;
                          
                          if (dropToBottom) {
                            targetIndex += 1;
                          }

                          next.splice(targetIndex, 0, draggedItem);
                          return next;
                        });
                        setDraggedId(null);
                        setDragOverId(null);
                        setDragOverPosition(null);
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
                        border: active
                          ? "1.5px solid #3b82f6"
                          : "1px solid #e2e8f0",
                        borderTop: isOver && dragOverPosition === "top" ? "3px solid #2563eb" : active ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                        borderBottom: isOver && dragOverPosition === "bottom" ? "3px solid #2563eb" : active ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                        background: active
                          ? "#eff6ff"
                          : "#ffffff",
                        borderRadius: 10,
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        cursor: isDragging ? "grabbing" : "pointer",
                        fontFamily: "inherit",
                        opacity: isDragging ? 0.4 : isEnabled ? 1 : 0.6,
                        transition: "all 0.15s ease",
                        boxShadow: active ? "0 2px 8px rgba(37, 99, 235, 0.12)" : "none",
                        outline: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            display: "grid",
                            placeItems: "center",
                            background: active ? "#2563eb" : "#f1f5f9",
                            color: active ? "#ffffff" : "#64748b",
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: active ? 700 : 500,
                            color: active ? "#1e40af" : "#334155",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </span>
                      </div>
                      <GripVertical size={14} style={{ color: "#94a3b8", flexShrink: 0, cursor: "grab" }} />
                    </div>
                  );
                })}

                {!filteredList.length ? (
                  <div style={{ border: "1px dashed #cbd5e1", borderRadius: 10, padding: 16, color: "#64748b", fontSize: 13, textAlign: "center" }}>
                    ไม่พบข้อประเมิน
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
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: isMobile ? 16 : 20,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
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
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>QUESTION EDITOR</span>
                          <h2 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 0", color: "#0f172a" }}>{selectedQuestion.title}</h2>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                            <span>บันทึกข้อมูลล่าสุดเรียบร้อยแล้ว</span>
                          </div>
                        </div>

                        {/* Top-Right Toggle & Save */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Toggle Switch */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>เปิดใช้งาน</span>
                            <button
                              type="button"
                              onClick={() => updateQuestion(selectedQuestion.id, (item) => ({ ...item, active: !isQuestionActive(item) }))}
                              style={{
                                position: "relative",
                                width: 44,
                                height: 24,
                                borderRadius: 999,
                                background: isQuestionActive(selectedQuestion) ? "#22c55e" : "#cbd5e1",
                                border: "none",
                                cursor: "pointer",
                                transition: "background-color 0.2s ease",
                                padding: 0,
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  top: 3,
                                  left: isQuestionActive(selectedQuestion) ? 23 : 3,
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  background: "#ffffff",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                  transition: "left 0.2s ease",
                                }}
                              />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleRestoreDefault}
                            disabled={savingChecklists}
                            style={{
                              height: 36,
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#475569",
                              fontSize: 13,
                              fontWeight: 700,
                              padding: "0 14px",
                              cursor: "pointer"
                            }}
                          >
                            คืนค่าเริ่มต้น
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={savingChecklists}
                            style={{
                              height: 36,
                              borderRadius: 8,
                              border: "none",
                              background: "#2563eb",
                              color: "#ffffff",
                              fontSize: 13,
                              fontWeight: 700,
                              padding: "0 18px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                            }}
                          >
                            <Check size={16} />
                            <span>บันทึก</span>
                          </button>
                        </div>
                      </div>

                      {/* Form Row Inputs */}
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
                        <div style={fieldStyle}>
                          <span style={fieldLabelStyle}>หัวข้อ</span>
                          <input
                            value={selectedQuestion.title}
                            onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, title: event.target.value }))}
                            style={inputStylePremium}
                          />
                        </div>

                        <div style={fieldStyle}>
                          <span style={fieldLabelStyle}>รายละเอียด</span>
                          <input
                            value={selectedQuestion.guideTitle === false ? "" : selectedQuestion.guideTitle || ""}
                            onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, guideTitle: event.target.value }))}
                            placeholder="ใส่รายละเอียด"
                            style={inputStylePremium}
                          />
                        </div>

                        {/* หมวดหมู่สถานที่ */}
                        <div style={fieldStyle}>
                          <span style={fieldLabelStyle}>หมวดหมู่สถานที่</span>
                          <select
                            value={selectedType}
                            onChange={(e) => {
                              const newType = e.target.value;
                              setSelectedType(newType);
                              setSelectedQuestionId(draft[newType][0]?.id || "");
                            }}
                            style={selectStyle}
                          >
                            {LOCATION_TYPE_OPTIONS.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* รูปแบบคำตอบ */}
                        <div style={fieldStyle}>
                          <span style={fieldLabelStyle}>รูปแบบคำตอบ</span>
                          <select
                            value={selectedQuestion.format || "original"}
                            onChange={(e) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, format: e.target.value }))}
                            style={selectStyle}
                          >
                            <option value="original">แบบตัวเลือก</option>
                            <option value="text_box">แบบ Text Box</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Guidelines Details Box & Live Preview Cards */}
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>รายละเอียดข้อประเมิน</h3>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>ใส่รายละเอียดที่ต้องประเมิน</p>
                      </div>

                      {/* Guidelines Box */}
                      <div style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        background: "#ffffff",
                        padding: 16,
                        minHeight: 200,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{selectedQuestion.title}</span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>{getGuideTitle(selectedQuestion) || `แนวทางการตรวจ ${selectedQuestion.title}`}</span>
                        </div>

                        <textarea
                          value={Array.isArray(selectedQuestion.guidelines) ? selectedQuestion.guidelines.join("\n") : (selectedQuestion.guidelines || "")}
                          onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, guidelines: event.target.value.split("\n") }))}
                          placeholder="ใส่รายละเอียดที่นี่..."
                          style={{
                            width: "100%",
                            minHeight: 140,
                            border: "none",
                            outline: "none",
                            resize: "vertical",
                            fontSize: 14,
                            color: "#334155",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>

                      {/* Bottom Options / Simulated Response Preview */}
                      <div style={{ marginTop: 8 }}>
                        {selectedQuestion.format === "text_box" ? (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
                              จำลองรูปแบบการตรวจ - แบบ Text Box
                            </div>
                            <textarea
                              disabled
                              placeholder="กรอกคำตอบของคุณที่นี่..."
                              style={{
                                width: "100%",
                                borderRadius: 12,
                                border: "1px solid #cbd5e1",
                                background: "#f8fafc",
                                minHeight: 70,
                                padding: "10px 14px",
                                fontSize: 13,
                                color: "#64748b",
                                fontFamily: "inherit",
                                resize: "none",
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                              จำลองรูปแบบการตรวจ - แบบเดิม (มีตัวเลือก)
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
                              {/* Safe Option */}
                              <div style={{
                                border: "1.5px solid #22c55e",
                                background: "#f0fdf4",
                                borderRadius: 12,
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer"
                              }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#15803d" }}>ปลอดภัย (Safe)</span>
                                <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #22c55e" }} />
                              </div>

                              {/* Unsafe Condition */}
                              <div style={{
                                border: "1.5px solid #ef4444",
                                background: "#fef2f2",
                                borderRadius: 12,
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer"
                              }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#b91c1c" }}>สภาพไม่ปลอดภัย (Unsafe Condition)</span>
                                <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #ef4444" }} />
                              </div>

                              {/* Unsafe Act */}
                              <div style={{
                                border: "1.5px solid #f97316",
                                background: "#fff7ed",
                                borderRadius: 12,
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer"
                              }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#c2410c" }}>พฤติกรรมไม่ปลอดภัย (Unsafe Act)</span>
                                <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #f97316" }} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Delete Question Button */}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(selectedQuestion.id)}
                          style={{
                            height: 36,
                            borderRadius: 10,
                            border: "1px solid #fecaca",
                            background: "#fff1f2",
                            color: "#e11d48",
                            fontWeight: 700,
                            fontSize: 12.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                            padding: "0 14px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Trash2 size={15} />
                          <span>ลบข้อประเมินนี้</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: 32, textAlign: "center", color: "#64748b" }}>
                    ไม่มีข้อประเมิน
                  </div>
                )}
              </section>





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
                      placeholder="ใส่รายละเอียด"
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
        <DialogContent showCloseButton={false} className="safety-admin-form-popup z-[1000] p-0 sm:max-w-[480px]">
          <div
            style={{
              width: "min(100%, 480px)",
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <Calendar size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>ตั้งค่าการทํารายการย้อนหลัง</div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                  กําหนดว่าในปฏิทินหน้าเช็คอิน ผู้ใช้เลือกทํารายการย้อนหลังได้กี่วัน
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelBackdateModal}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#f1f5f9",
                  border: "none",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Selection Cards (เฉพาะวันนี้ vs ทำย้อนหลังได้) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setBackdateMode("today")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setBackdateMode("today")}
                style={{
                  border: backdateMode === "today" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                  background: backdateMode === "today" ? "#eff6ff" : "#ffffff",
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>เฉพาะวันนี้</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>เลือกได้แค่วันปัจจุบัน</div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setBackdateMode("backdate")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setBackdateMode("backdate")}
                style={{
                  border: backdateMode === "backdate" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                  background: backdateMode === "backdate" ? "#eff6ff" : "#ffffff",
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>ทําย้อนหลังได้</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>เปิดให้เลือกวันก่อนหน้า</div>
              </div>
            </div>

            {/* Stepper Card for Days limit (Appears when backdateMode === "backdate") */}
            {backdateMode === "backdate" && (
              <div style={{
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                borderRadius: 12,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>ให้ทําย้อนหลังได้</div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 3
                }}>
                  <button
                    type="button"
                    onClick={() => setTempBackdateLimit(Math.max(1, tempBackdateLimit - 1))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: "#eff6ff",
                      border: "none",
                      color: "#2563eb",
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", minWidth: 20, textAlign: "center" }}>
                    {tempBackdateLimit}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTempBackdateLimit(Math.min(90, tempBackdateLimit + 1))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: "#eff6ff",
                      border: "none",
                      color: "#2563eb",
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", paddingRight: 4 }}>วัน</span>
                </div>
              </div>
            )}

            {/* Calendar Preview Section */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>ตัวอย่างปฏิทินที่ผู้ใช้เห็น</div>
              <div style={{
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                background: "#ffffff",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                    <span key={d} style={{ fontSize: 9.5, fontWeight: 800, color: "#94a3b8" }}>{d}</span>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {(() => {
                    const now = new Date();
                    const todayDate = now.getDate();
                    const year = now.getFullYear();
                    const month = now.getMonth();

                    const firstDayIndex = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const prevMonthDays = new Date(year, month, 0).getDate();

                    const grid = [];

                    // Prev month padding
                    for (let i = firstDayIndex - 1; i >= 0; i--) {
                      const dayNum = prevMonthDays - i;
                      const diff = (firstDayIndex - i) + (todayDate - 1); // rough diff
                      grid.push({ day: dayNum, isCurrentMonth: false, isToday: false, allowed: false });
                    }

                    // Current month days
                    for (let d = 1; d <= daysInMonth; d++) {
                      const isToday = d === todayDate;
                      const isPast = d < todayDate;
                      const diffDays = todayDate - d;
                      const allowed = isPast && backdateMode === "backdate" && diffDays <= tempBackdateLimit;
                      grid.push({ day: d, isCurrentMonth: true, isToday, allowed });
                    }

                    // Next month padding up to 35 cells total
                    const totalCells = grid.length > 35 ? 42 : 35;
                    let nextDay = 1;
                    while (grid.length < totalCells) {
                      grid.push({ day: nextDay++, isCurrentMonth: false, isToday: false, allowed: false });
                    }

                    return grid.map((item, idx) => {
                      const isToday = item.isToday;
                      const isAllowed = item.allowed;

                      let bg = "#f8fafc";
                      let color = "#94a3b8";
                      let border = "none";

                      if (isToday) {
                        bg = "#2563eb";
                        color = "#ffffff";
                      } else if (isAllowed) {
                        bg = "#eff6ff";
                        color = "#2563eb";
                        border = "1px solid #bfdbfe";
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            height: 26,
                            borderRadius: 6,
                            background: bg,
                            color: color,
                            border: border,
                            fontSize: 11,
                            fontWeight: isToday || isAllowed ? 800 : 500,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isToday ? "0 2px 6px rgba(37, 99, 235, 0.25)" : "none"
                          }}
                        >
                          {item.day}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Legend Footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, fontSize: 11, fontWeight: 600, color: "#475569" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
                  <span>วันนี้</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#eff6ff", border: "1px solid #bfdbfe" }} />
                  <span>เลือกได้</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f8fafc" }} />
                  <span>เลือกไม่ได้</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 2 }}>
              <button
                type="button"
                onClick={handleCancelBackdateModal}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveBackdateModal}
                style={{
                  height: 36,
                  padding: "0 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(37, 99, 235, 0.3)"
                }}
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>




    </div>
  );
}
