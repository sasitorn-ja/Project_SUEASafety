// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@/lib/app-navigation";
import TigerMascot from "@/components/TigerMascot";
import { ProgressHeader } from "@/components/safety-effort/progress-mascot";
import { getChecklistForType } from "@/features/safety-effort/config/checklists";
import {
  evidenceMediaUrls,
  normalizeEvidenceMediaList,
} from "@/features/safety-effort/lib/evidence-media";
import { linkUploadedMedia, uploadSafetyEffortMedia } from "@/features/safety-effort/lib/upload-media";
import { useAppActions } from "@/providers/app-providers";
import { getSessionDisplayName, useSessionUser } from "@/lib/session-user";
import { Dialog, DialogContent } from "@/components/ui/dialog";


const T = {
  background: "var(--background)",
  card: "#ffffff",
  foreground: "#0e0f12",
  foreground2: "#33312c",
  foreground3: "#7b7469",
  border: "rgba(14,15,18,0.08)",
  gold: "var(--brand-accent)",
  goldDeep: "var(--c-d89b00)",
  brown: "var(--brand-text)",
  brownSoft: "var(--c-f5ead7)",
  safe: "#15803d",
  issue: "#dc2626",
  action: "#ea580c",
};

const IcoBack = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IcoChevronDown = ({ rotate = false }) => (
  <svg 
    width={16} 
    height={16} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={2.5} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{
      transform: rotate ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IcoTrophy = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 0-6 6v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V8a6 6 0 0 0-6-6z" />
  </svg>
);

function statusMeta(status) {
  if (status === "safe") return { label: "ปลอดภัย (Safe)", color: T.safe, bg: "#f0fdf4", border: "#bbf7d0" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย (Unsafe Condition)", color: T.issue, bg: "#fef2f2", border: "#fecaca" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย (Unsafe Act)", color: T.action, bg: "#fff7ed", border: "#ffedd5" };
  return { label: "N/A", color: T.foreground3, bg: "var(--c-f8f6f1)", border: "rgba(14,15,18,0.08)" };
}

function normalizeNumericId(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return /^\d+$/.test(normalized) ? normalized : null;
}

function collectEvidenceMediaIds(submission) {
  const ids = new Set<string>();
  const collect = (items) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item?.id) ids.add(String(item.id));
    }
  };
  collect(submission?.metadata?.attachments);
  for (const answer of submission?.answeredItems || []) {
    collect(answer?.attachments);
  }
  return Array.from(ids);
}

function serializableEvidenceMedia(item) {
  return {
    id: item?.id ?? null,
    url: item?.url,
    originalName: item?.originalName ?? null,
    mimeType: item?.mimeType ?? null,
    provider: item?.provider ?? null,
  };
}

export default function AssessmentSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const actions = useAppActions();
  const { user: sessionUser } = useSessionUser();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasInitializedExpanded, setHasInitializedExpanded] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const checkin = location.state?.checkin ?? null;
  const activity = location.state?.activity ?? null;
  const linewalkData = location.state?.linewalkData ?? null;
  const [width, setWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1200);
  const topLevelAttachments = useMemo(
    () => normalizeEvidenceMediaList(linewalkData?.attachments ?? linewalkData?.photos ?? []),
    [linewalkData],
  );

  const answeredItems = useMemo(() => {
    if (!linewalkData?.itemStates) return [];
    const cl = linewalkData.locType ? getChecklistForType(linewalkData.locType) : [];
    return Object.entries(linewalkData.itemStates).map(([key, value]) => {
      const question = cl.find(q => q.id === key);
      return {
        id: key,
        title: question ? question.title : "",
        format: question?.format ?? "original",
        status: value?.status ?? null,
        note: value?.note ?? "",
        photos: normalizeEvidenceMediaList(value?.photos ?? value?.attachments ?? []),
      };
    });
  }, [linewalkData]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!previewImages || previewImages.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Right") {
        setPreviewIndex((prev) => (prev + 1) % previewImages.length);
      } else if (e.key === "ArrowLeft" || e.key === "Left") {
        setPreviewIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length);
      } else if (e.key === "Escape" || e.key === "Esc") {
        setPreviewImages(null);
        setPreviewIndex(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImages]);

  const isMobile = width < 768;

  useEffect(() => {
    if (!linewalkData) {
      navigate("/category", { replace: true });
    }
  }, [linewalkData, navigate]);

  useEffect(() => {
    if (answeredItems.length > 0 && !hasInitializedExpanded) {
      setExpandedId(answeredItems[0].id);
      setHasInitializedExpanded(true);
    }
  }, [answeredItems, hasInitializedExpanded]);

  const handleBack = () => {
    if (linewalkData?.isSafetyContact) {
      navigate("/safety-contact", {
        state: {
          checkin,
          activity,
          linewalkData,
          fromActivity: true,
        },
      });
    } else {
      navigate("/linewalk", {
        state: {
          checkin,
          activity,
          linewalkStarted: true,
          linewalkDate: linewalkData?.date,
          linewalkData,
        },
      });
    }
  };

  const persistActivityToDb = async (submission) => {
    const checkinId = normalizeNumericId(checkin?.checkinId);
    if (!checkinId) return; // no DB checkin → cannot satisfy safety_activities FK yet
    try {
      await fetch("/api/safety-effort/activities", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkinId,
          activityType: submission.isSafetyContact ? "SAFETY_CONTACT" : "LINE_WALK",
          title: submission.activityLabel,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          notes: JSON.stringify({
            locType: submission.locType,
            locationName: submission.locationName,
            locationTag: submission.locationTag,
            date: submission.date,
            safetyContactText: submission.safetyContactText,
            attachments: submission.metadata?.attachments || [],
            answers: submission.answeredItems,
            // report fields (used by Export Report) — not first-class activity columns
            pms: submission.pms,
            year: submission.year,
            month: submission.month,
            name: submission.name,
            email: submission.email,
            activityType: submission.activityType,
          }),
        }),
      });
    } catch { /* structured submission remains the canonical record */ }
  };

  const linkSubmissionEvidence = async (submissionId, submission) => {
    const mediaIds = collectEvidenceMediaIds(submission);
    if (!mediaIds.length) return;
    const results = await Promise.allSettled(
      mediaIds.map((id) =>
        linkUploadedMedia(id, {
          module: "safety-effort",
          ownerType: "safety_effort_submission",
          ownerId: submissionId,
          linkType: "evidence",
        }),
      ),
    );
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length) {
      console.warn("Some evidence media could not be linked", failed);
    }
  };

  const uploadPendingEvidenceList = async (items) => {
    const normalized = normalizeEvidenceMediaList(items);
    return Promise.all(
      normalized.map(async (item) => {
        if (item.file instanceof File) {
          const uploaded = await uploadSafetyEffortMedia(item.file, {
            ownerType: "safety_effort_submission",
            ownerId: null,
            linkType: "evidence",
            status: "DRAFT",
          });
          return serializableEvidenceMedia(uploaded);
        }
        return serializableEvidenceMedia(item);
      }),
    );
  };

  const handleConfirmSave = async () => {
    const submissionDate = linewalkData?.date || new Date().toISOString().split("T")[0];
    const normalizedCheckinId = normalizeNumericId(checkin?.checkinId);
    const activityLabel = activity?.label || (linewalkData?.isSafetyContact ? "Safety Contact" : "Line Walk");
    
    try {
      const uploadedTopLevelAttachments = await uploadPendingEvidenceList(topLevelAttachments);
      const uploadedAnsweredItems = await Promise.all(
        answeredItems.map(async (item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          note: item.note,
          attachments: await uploadPendingEvidenceList(item.photos),
        })),
      );
      const newSubmission = {
        timestamp: new Date().toISOString(),
        activityLabel,
        locType: linewalkData?.locType || "factory",
        locationName: checkin?.name || "-",
        locationTag: checkin?.tag || "-",
        date: submissionDate,
        isSafetyContact: !!linewalkData?.isSafetyContact,
        safetyContactText: linewalkData?.safetyContactText || "",
        answeredItems: uploadedAnsweredItems,
        pms: sessionUser?.username || sessionUser?.id || "",
        name: getSessionDisplayName(sessionUser),
        email: sessionUser?.email || "",
        activityType: linewalkData?.isSafetyContact ? "SAFETY_CONTACT" : "LINE_WALK",
        checkinId: normalizedCheckinId,
        metadata: {
          attachments: uploadedTopLevelAttachments,
        },
      };
      const response = await fetch("/api/safety-effort/submissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubmission),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !payload.data?.submission?.id) {
        throw new Error(payload?.error || "submission_save_failed");
      }
      const savedId = String(payload.data.submission.id);
      await linkSubmissionEvidence(savedId, newSubmission);
      actions.awardSafetyEffortCompletion(savedId, `${activityLabel} สำเร็จ`);
      void persistActivityToDb(newSubmission);
      
      if (newSubmission.isSafetyContact) {
        navigate("/category", { replace: true });
      } else {
        setShowSuccessPopup(true);
      }
    } catch (error) {
      console.error("Error saving submission", error);
      
      const isDemo = typeof window !== "undefined" && (
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1" || 
        window.location.hostname === "::1"
      );
      
      if (isDemo) {
        const savedId = `demo-${Date.now()}`;
        actions.awardSafetyEffortCompletion(savedId, `${activityLabel} สำเร็จ`);
        
        // Build mock submission
        const mockSubmission = {
          timestamp: new Date().toISOString(),
          activityLabel,
          locType: linewalkData?.locType || "factory",
          locationName: checkin?.name || "-",
          locationTag: checkin?.tag || "-",
          date: submissionDate,
          isSafetyContact: !!linewalkData?.isSafetyContact,
          safetyContactText: linewalkData?.safetyContactText || "",
          answeredItems: [],
          pms: sessionUser?.username || sessionUser?.id || "",
          name: getSessionDisplayName(sessionUser),
          email: sessionUser?.email || "",
          activityType: linewalkData?.isSafetyContact ? "SAFETY_CONTACT" : "LINE_WALK",
          checkinId: normalizedCheckinId,
          metadata: {
            attachments: [],
          },
        };
        void persistActivityToDb(mockSubmission);
        setShowSuccessPopup(true);
        return;
      }

      window.alert("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่");
      if (linewalkData?.isSafetyContact) {
        navigate("/category", { replace: true });
      }
    }
  };

  const counts = useMemo(() => {
    return answeredItems.reduce(
      (acc, item) => {
        if (item.status === "safe") acc.safe += 1;
        else if (item.status === "unsafe_condition") acc.condition += 1;
        else if (item.status === "unsafe_action") acc.action += 1;
        else acc.empty += 1;
        return acc;
      },
      { safe: 0, condition: 0, action: 0, empty: 0 }
    );
  }, [answeredItems]);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "linear-gradient(180deg,var(--secondary) 0%, var(--background) 160px, var(--background) 100%)",
        padding: "8px 16px 32px",
        color: T.foreground,
        fontFamily: "'Prompt','Sarabun',sans-serif",
      }}
    >
      <style>{`
        .as-back-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          color: var(--brand-soft);
        }
        .as-back-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: var(--brand-accent);
          transform: translateX(-2px);
        }
        .as-bottom-back-btn:hover {
          background: #fbfbfa !important;
          border-color: rgba(14,15,18,0.18) !important;
          transform: translateY(-1px);
        }
        .as-bottom-back-btn:active {
          transform: scale(0.98);
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 1500, margin: "0 auto", display: "grid", gap: 16 }}>
        <ProgressHeader
          title={linewalkData?.isSafetyContact ? "สรุปผลการทำ Safety Contact" : "สรุปผลการทำแบบประเมิน"}
          subtitle={linewalkData?.isSafetyContact
            ? "ตรวจสอบข้อมูลที่บันทึกไว้ก่อนทำการส่งข้อมูล"
            : "ตรวจสอบข้อมูลที่ทำไว้ก่อนทำการบันทึกข้อมูล"}
          current={4}
          mascotAction="assessHappy"
          onBack={handleBack}
        />

        <section
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: "18px 16px",
            boxShadow: "0 10px 24px rgba(34,25,11,0.05)",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            {[
              { label: "กิจกรรม", value: activity?.label || "Line Walk" },
              { label: "วันที่ทำ", value: linewalkData?.date || "-" },
              ...(checkin ? [
                { label: "สถานที่", value: checkin?.name || "-" },
                { label: "รหัสสถานที่", value: checkin?.tag || "-" },
              ] : [])
            ].map((item) => (
              <div key={item.label} style={{ background: T.brownSoft, borderRadius: 14, padding: "12px 12px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.foreground3, textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ marginTop: 4, fontSize: 17, fontWeight: 800, color: T.brown }}>{item.value}</div>
              </div>
            ))}
          </div>

          {!linewalkData?.isSafetyContact && (
            <div style={{ display: "grid", gap: 12 }}>
              {/* Row 1: Summary of Done / Not Done */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "color-mix(in srgb, var(--brand-accent) 8%, white)", border: "1px solid rgba(14,15,18,0.06)", borderRadius: 14, padding: "12px 12px 10px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: T.brown }}>ประเมินแล้ว (Done)</div>
                  <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: T.brown }}>{counts.safe + counts.condition + counts.action} ข้อ</div>
                </div>
                <div style={{ background: "var(--c-f8f6f1)", border: "1px solid rgba(14,15,18,0.06)", borderRadius: 14, padding: "12px 12px 10px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: T.foreground3 }}>ยังไม่ประเมิน (Not Done)</div>
                  <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: T.foreground2 }}>{counts.empty} ข้อ</div>
                </div>
              </div>

              {/* Row 2: Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
                {[
                  { label: "ปลอดภัย (Safe)", value: counts.safe, color: T.safe, bg: "#f0fdf4" },
                  { label: "สภาพไม่ปลอดภัย (Unsafe Condition)", value: counts.condition, color: T.issue, bg: "#fef2f2" },
                  { label: "พฤติกรรมไม่ปลอดภัย (Unsafe Act)", value: counts.action, color: T.action, bg: "#fff7ed" },
                ].map((item) => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: 14, padding: "12px 12px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.label}</div>
                    <div style={{ marginTop: 4, fontSize: 24, lineHeight: 1, fontWeight: 900, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {linewalkData?.isSafetyContact ? (
          <section
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: "20px 20px",
              boxShadow: "0 10px 24px rgba(34,25,11,0.05)",
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: T.brown, fontFamily: "'Prompt',sans-serif" }}>
              รายละเอียด Safety Contact
            </div>
            <div
              style={{
                borderRadius: 14,
                border: `1px solid ${T.border}`,
                background: "#fcfcfb",
                padding: "16px 20px",
                fontSize: 14.5,
                lineHeight: 1.6,
                color: T.foreground2,
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
              }}
            >
              {linewalkData?.safetyContactText || "-"}
            </div>

            {topLevelAttachments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.02em", fontFamily: "'Prompt',sans-serif" }}>
                  รูปภาพแนบ ({topLevelAttachments.length})
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {topLevelAttachments.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => {
                        setPreviewImages(evidenceMediaUrls(topLevelAttachments));
                        setPreviewIndex(pIdx);
                      }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid rgba(0,0,0,0.08)",
                        cursor: "zoom-in",
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={`Safety Contact Evidence ${pIdx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: "18px 16px",
              boxShadow: "0 10px 24px rgba(34,25,11,0.05)",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: T.brown }}>ตอบอะไรไปบ้าง</div>
            <div style={{ display: "grid", gap: 10 }}>
              {answeredItems.map((item, index) => {
                const isTextBox = item.format === "text_box";
                const meta = (isTextBox && item.status === "text")
                  ? { label: "ตอบแล้ว", color: T.brown, bg: T.brownSoft, border: T.gold }
                  : statusMeta(item.status);
                const isExpanded = expandedId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${meta.border}`,
                      background: meta.bg,
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      boxShadow: isExpanded ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    {/* Header: Clickable Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#64748B", flexShrink: 0 }}>
                          ข้อ {index + 1}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.foreground, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: meta.color }}>
                          {meta.label}
                        </span>
                        <div style={{ color: "#94A3B8" }}>
                          <IcoChevronDown rotate={isExpanded} />
                        </div>
                      </div>
                    </button>

                    {/* Content Section: Expanded Panel */}
                    {isExpanded && (
                      <div 
                        style={{
                          borderTop: `1px solid ${meta.border}`,
                          padding: "14px 16px 16px",
                          background: "rgba(255, 255, 255, 0.4)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {/* Note area */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                            {isTextBox ? "คำตอบ / หมายเหตุ" : (item.status === "safe" ? "หมายเหตุ / ข้อเสนอแนะ / ชื่นชม" : "หมายเหตุ / ข้อเสนอแนะ")}
                          </span>
                          {item.note ? (
                            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: T.foreground2, whiteSpace: "pre-wrap" }}>
                              {item.note}
                            </p>
                          ) : (
                            <span style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>
                              ไม่มีหมายเหตุเพิ่มเติม
                            </span>
                          )}
                        </div>

                        {/* Photos area */}
                        {!isTextBox && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                              รูปภาพแนบ ({item.photos.length})
                            </span>
                            {item.photos.length > 0 ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {item.photos.map((photoUrl, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => {
                                      setPreviewImages(evidenceMediaUrls(item.photos));
                                      setPreviewIndex(pIdx);
                                    }}
                                    style={{ display: "block", background: "none", border: "none", padding: 0, margin: 0, cursor: "zoom-in" }}
                                  >
                                    <img 
                                      src={photoUrl?.url || photoUrl} 
                                      alt={`Evidence ${pIdx + 1}`} 
                                      style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 8,
                                        objectFit: "cover",
                                        border: "1px solid rgba(0,0,0,0.06)",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                                        transition: "transform 0.15s ease",
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>
                                ไม่มีรูปภาพแนบ
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button
            type="button"
            onClick={handleBack}
            className="as-bottom-back-btn"
            style={{
              minWidth: 120,
              height: 50,
              border: `1.5px solid ${T.border}`,
              borderRadius: 14,
              background: "#fff",
              color: T.foreground2,
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              transition: "all 0.2s",
            }}
          >
            ย้อนกลับ
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            style={{
              minWidth: 220,
              height: 50,
              border: "none",
              borderRadius: 14,
              background: "linear-gradient(135deg,var(--brand-text) 0%,var(--c-1a1613) 100%)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 12px 24px rgba(26,22,19,0.18)",
            }}
          >
            บันทึกข้อมูล
          </button>
        </div>

        <Dialog open={showSuccessPopup}>
          <DialogContent
            showCloseButton={false}
            className="z-[9999] w-full max-w-[380px] border border-[#cfe0f2] bg-[linear-gradient(180deg,#ffffff,#f8fcff)] text-center shadow-[0_28px_80px_rgba(6,43,99,0.28)]"
            style={{
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              animation: "scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}>
              <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              `}</style>
              
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#e6f7ed", border: "2.5px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#15803d" }}>
                ✓
              </div>

              <div>
                <h3 style={{ margin: 0, fontFamily: "'Prompt',sans-serif", fontSize: 20, fontWeight: 900, color: "#0e3e7d" }}>
                  {linewalkData?.isSafetyContact ? "ส่งข้อมูลสำเร็จ" : "บันทึกเสร็จสิ้น"}
                </h3>
                <p style={{ margin: "6px 0 0", fontFamily: "'Prompt',sans-serif", fontSize: 13.5, fontWeight: 700, color: "#5f7591", lineHeight: 1.4 }}>
                  {linewalkData?.isSafetyContact ? "ส่งข้อมูล Safety Contact เรียบร้อยแล้ว" : "ทำบันทึกเสร็จเรียบร้อยแล้ว"}
                </p>
              </div>

              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#0B82F0",
                border: "1.5px solid rgba(255,255,255,0.55)",
                borderRadius: 99,
                padding: "7px 16px",
                fontSize: "14.5px",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                fontFamily: "'Prompt',sans-serif",
                marginTop: -4,
                boxShadow: "0 6px 14px rgba(11,130,240,0.20)"
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/icons/STCoin.png" alt="Coin" style={{ width: 17, height: 17, objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> +10 Coin
              </div>

              <button
                type="button"
                onClick={() => navigate("/category", { replace: true })}
                style={{
                  width: "100%",
                  height: 46,
                  border: "none",
                  borderRadius: 12,
                  background: "linear-gradient(180deg,#158eff,#075cc8)",
                  color: "#fff",
                  fontFamily: "'Prompt',sans-serif",
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                กลับหน้าหลัก
              </button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Photo Preview Modal Overlay */}
      {previewImages && previewImages.length > 0 && (
        <div
          onClick={() => {
            setPreviewImages(null);
            setPreviewIndex(0);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.93)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "zoom-out",
            animation: "as-fade-in 0.22s ease-out",
          }}
        >
          <style>{`
            @keyframes as-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes as-zoom-in {
              from { transform: scale(0.94); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .as-thumb-tray::-webkit-scrollbar {
              display: none;
            }
            .as-thumb-tray {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "92vh",
              display: "inline-block",
              animation: "as-zoom-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Image Index Indicator (e.g. 1/5) */}
            <div
              style={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0, 0, 0, 0.55)",
                color: "#fff",
                padding: "5px 14px",
                borderRadius: 99,
                fontSize: 13.5,
                fontWeight: 800,
                fontFamily: "'Prompt', sans-serif",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                zIndex: 10,
                pointerEvents: "none",
                letterSpacing: "0.05em",
              }}
            >
              {previewIndex + 1} / {previewImages.length}
            </div>

            <img
              src={previewImages[previewIndex]}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "82vh",
                borderRadius: 24,
                boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
                objectFit: "contain",
                cursor: "default",
                display: "block",
              }}
            />

            {/* Thumbnails list overlapping the preview at the bottom */}
            {previewImages.length > 1 && (
              <div 
                className="as-thumb-tray"
                style={{ 
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex", 
                  gap: 6, 
                  justifyContent: "center", 
                  alignItems: "center",
                  background: "rgba(0, 0, 0, 0.45)",
                  padding: "6px 8px",
                  borderRadius: 14,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  maxWidth: "90%",
                  overflowX: "auto",
                  zIndex: 10,
                }}
              >
                {previewImages.map((photoUrl, idx) => {
                  const isActive = idx === previewIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewIndex(idx)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: isActive ? "2.5px solid #ffffff" : "2.5px solid transparent",
                        opacity: isActive ? 1 : 0.5,
                        cursor: "pointer",
                        padding: 0,
                        margin: 0,
                        background: "none",
                        transition: "all 0.18s ease-in-out",
                      }}
                    >
                      <img
                        src={photoUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Elegant Close Button at top-right of screen overlay */}
          <button
            type="button"
            onClick={() => {
              setPreviewImages(null);
              setPreviewIndex(0);
            }}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.5)",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              transition: "background 0.2s, transform 0.15s ease",
              zIndex: 10000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
// @ts-nocheck
