// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@/lib/app-navigation";
import TigerMascot from "@/components/TigerMascot";
import { getChecklistForType } from "@/features/safety-effort/config/checklists";
import { useAppActions } from "@/providers/app-providers";
import { getSessionDisplayName, useSessionUser } from "@/lib/session-user";

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
  if (status === "safe") return { label: "ปลอดภัย", color: T.safe, bg: "#f0fdf4", border: "#bbf7d0" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย", color: T.issue, bg: "#fef2f2", border: "#fecaca" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย", color: T.action, bg: "#fff7ed", border: "#ffedd5" };
  return { label: "N/A", color: T.foreground3, bg: "var(--c-f8f6f1)", border: "rgba(14,15,18,0.08)" };
}

export default function AssessmentSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const actions = useAppActions();
  const { user: sessionUser } = useSessionUser();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const checkin = location.state?.checkin ?? null;
  const activity = location.state?.activity ?? null;
  const linewalkData = location.state?.linewalkData ?? null;
  const [width, setWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;

  useEffect(() => {
    if (!linewalkData) {
      navigate("/category", { replace: true });
    }
  }, [linewalkData, navigate]);

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
    const checkinId = checkin?.checkinId ?? null;
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

  const handleConfirmSave = async () => {
    const submissionDate = linewalkData?.date || new Date().toISOString().split("T")[0];
    const newSubmission = {
      timestamp: new Date().toISOString(),
      activityLabel: activity?.label || (linewalkData?.isSafetyContact ? "Safety Contact" : "Line Walk"),
      locType: linewalkData?.locType || "factory",
      locationName: checkin?.name || "-",
      locationTag: checkin?.tag || "-",
      date: submissionDate,
      isSafetyContact: !!linewalkData?.isSafetyContact,
      safetyContactText: linewalkData?.safetyContactText || "",
      answeredItems: answeredItems.map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        note: item.note,
        photos: item.photos,
      })),
      pms: sessionUser?.username || sessionUser?.id || "",
      name: getSessionDisplayName(sessionUser),
      email: sessionUser?.email || "",
      activityType: linewalkData?.isSafetyContact ? "SAFETY_CONTACT" : "LINE_WALK",
      checkinId: checkin?.checkinId || null,
    };
    try {
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
      actions.awardSafetyEffortCompletion(savedId, `${newSubmission.activityLabel} สำเร็จ`);
      void persistActivityToDb(newSubmission);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error saving submission", error);
      window.alert("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่");
    }
  };

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
        photos: value?.photos ?? [],
      };
    });
  }, [linewalkData]);

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
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 16 }}>
        <section
          style={{
            borderRadius: isMobile ? 14 : 18,
            overflow: "hidden",
            background: "linear-gradient(105deg, var(--brand-hero-start) 0%, var(--brand-hero-end) 48%, var(--brand-nav) 100%)",
            color: "var(--brand-soft)",
            boxShadow: isMobile ? "0 8px 16px rgba(42,26,9,0.1)" : "0 16px 32px rgba(42,26,9,0.14)",
          }}
        >
          <div style={{ padding: isMobile ? "14px 14px 16px" : "22px 20px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMobile ? 10 : 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, minWidth: 0, flex: 1 }}>
              <button type="button" className="as-back-btn" onClick={handleBack} aria-label="ย้อนกลับ">
                <IcoBack />
              </button>
              <div style={{ width: 1, height: isMobile ? 32 : 52, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "inline-flex", alignItems: "center", padding: isMobile ? "2px 8px" : "4px 10px", borderRadius: 999, background: "color-mix(in srgb, var(--brand-accent) 18%, transparent)", color: "var(--brand-accent)", fontSize: isMobile ? 9 : 11, fontWeight: 800, textTransform: "uppercase" }}>
                  {linewalkData?.isSafetyContact ? "Safety Contact Complete" : "Assessment Complete"}
                </div>
                <h1 style={{ margin: isMobile ? "6px 0 4px" : "12px 0 6px", fontSize: isMobile ? 18 : 28, lineHeight: 1.2, fontWeight: 900, fontFamily: "'Prompt', sans-serif" }}>
                  {linewalkData?.isSafetyContact ? "สรุปผลการทำ Safety Contact" : "สรุปผลการทำแบบประเมิน"}
                </h1>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.76)", fontSize: isMobile ? 11.5 : 14, fontWeight: 600 }}>
                  {linewalkData?.isSafetyContact ? "ตรวจสอบข้อมูลที่บันทึกไว้ก่อนทำการส่งข้อมูล" : "ตรวจสอบข้อมูลที่ทำไว้ก่อนทำการบันทึกข้อมูล"}
                </p>
              </div>
            </div>
            <TigerMascot action="happy" size={isMobile ? "56px" : "104px"} animation="float" />
          </div>
          <div style={{ height: isMobile ? 6 : 10, background: isMobile ? "repeating-linear-gradient(135deg,var(--brand-accent) 0 10px,#0e0f12 10px 20px)" : "repeating-linear-gradient(135deg,var(--brand-accent) 0 18px,#0e0f12 18px 36px)" }} />
        </section>

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
                <div style={{ fontSize: 11, fontWeight: 800, color: T.foreground3, textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: T.brown }}>{item.value}</div>
              </div>
            ))}
          </div>

          {!linewalkData?.isSafetyContact && (
            <div style={{ display: "grid", gap: 12 }}>
              {/* Row 1: Summary of Done / Not Done */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "color-mix(in srgb, var(--brand-accent) 8%, white)", border: "1px solid rgba(14,15,18,0.06)", borderRadius: 14, padding: "12px 12px 10px" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: T.brown }}>ประเมินแล้ว (Done)</div>
                  <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: T.brown }}>{counts.safe + counts.condition + counts.action} ข้อ</div>
                </div>
                <div style={{ background: "var(--c-f8f6f1)", border: "1px solid rgba(14,15,18,0.06)", borderRadius: 14, padding: "12px 12px 10px" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: T.foreground3 }}>ยังไม่ประเมิน (Not Done)</div>
                  <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: T.foreground2 }}>{counts.empty} ข้อ</div>
                </div>
              </div>

              {/* Row 2: Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
                {[
                  { label: "ปลอดภัย", value: counts.safe, color: T.safe, bg: "#f0fdf4" },
                  { label: "สภาพไม่ปลอดภัย", value: counts.condition, color: T.issue, bg: "#fef2f2" },
                  { label: "พฤติกรรมไม่ปลอดภัย", value: counts.action, color: T.action, bg: "#fff7ed" },
                ].map((item) => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: 14, padding: "12px 12px 10px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: item.color }}>{item.label}</div>
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
                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${meta.border}`,
                      background: meta.bg,
                      padding: "12px 12px 10px",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.foreground, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ flexShrink: 0 }}>ข้อ {index + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.foreground2 }}>
                          {item.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: meta.color, flexShrink: 0 }}>
                        {meta.label}
                      </div>
                    </div>
                    {item.note && (
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.foreground2 }}>
                        {isTextBox ? "คำตอบ: " : "หมายเหตุ: "}{item.note}
                      </div>
                    )}
                    {!!item.photos.length && (
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.foreground2 }}>
                        แนบรูป: {item.photos.length} รูป
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

        {showSuccessPopup && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(14,15,18,0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "fadeIn 0.25s ease-out",
          }}>
            <div style={{
              background: "#fff",
              border: "1px solid rgba(82,52,24,0.08)",
              borderRadius: 24,
              boxShadow: "0 20px 48px rgba(34,25,11,0.2)",
              width: "100%",
              maxWidth: 380,
              padding: "28px 24px",
              textAlign: "center",
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
                <h3 style={{ margin: 0, fontFamily: "'Prompt',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--brand-text)" }}>
                  {linewalkData?.isSafetyContact ? "ส่งข้อมูลสำเร็จ" : "บันทึกเสร็จสิ้น"}
                </h3>
                <p style={{ margin: "6px 0 0", fontFamily: "'Prompt',sans-serif", fontSize: 13.5, fontWeight: 500, color: "var(--brand-text-soft)", lineHeight: 1.4 }}>
                  {linewalkData?.isSafetyContact ? "ส่งข้อมูล Safety Contact เรียบร้อยแล้ว" : "ทำบันทึกเสร็จเรียบร้อยแล้ว"}
                </p>
              </div>

              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#fef8e6",
                border: "1.5px solid var(--brand-accent)",
                borderRadius: 99,
                padding: "6px 16px",
                fontSize: "14.5px",
                fontWeight: 900,
                color: "var(--brand-text)",
                fontFamily: "'Prompt',sans-serif",
                marginTop: -4,
                boxShadow: "0 4px 12px rgba(var(--brand-accent-rgb),0.15)"
              }}>
                <IcoTrophy size={16} color={T.goldDeep} /> +10 คะแนน
              </div>

              <button
                type="button"
                onClick={() => navigate("/category", { replace: true })}
                style={{
                  width: "100%",
                  height: 46,
                  border: "none",
                  borderRadius: 12,
                  background: "linear-gradient(135deg,var(--brand-text) 0%,var(--c-1a1613) 100%)",
                  color: "#fff",
                  fontFamily: "'Prompt',sans-serif",
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 8px 18px rgba(26,22,19,0.18)",
                }}
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// @ts-nocheck
