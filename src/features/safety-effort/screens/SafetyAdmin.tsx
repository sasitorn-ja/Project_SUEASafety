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
import { GripVertical } from "lucide-react";

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
    setBackdateMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("safety_backdate_mode", mode);
    }
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
    const existingIds = new Set(currentList.map((item) => item.id));
    const newQuestion = {
      id: createQuestionId(selectedType, "หัวข้อใหม่", existingIds),
      title: "หัวข้อใหม่",
      guideTitle: "",
      guidelines: ["เพิ่มรายละเอียดที่นี่"],
    };

    updateCurrentList((list) => [...list, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
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

        {/* Workspace Layout */}
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
              background: "rgba(255,255,255,0.78)",
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
                    background: "rgba(255,255,255,0.92)",
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
                    background: "rgba(255,255,255,0.92)",
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
                        height: "100%",
                        resize: "vertical",
                        padding: "12px 14px",
                        fontSize: 13,
                        lineHeight: 1.6,
                        borderRadius: 14,
                        border: `1px solid ${T.lineStrong}`,
                        fontFamily: "inherit",
                        outline: "none",
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
    </div>
  );
}
