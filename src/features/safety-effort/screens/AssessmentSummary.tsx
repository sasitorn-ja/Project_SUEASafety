// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import TigerMascot from "@/components/TigerMascot";
import { getChecklistForType } from "@/features/safety-effort/config/checklists";

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

function statusMeta(status) {
  if (status === "safe") return { label: "ปลอดภัย", color: T.safe, bg: "#f0fdf4", border: "#bbf7d0" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย", color: T.issue, bg: "#fef2f2", border: "#fecaca" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย", color: T.action, bg: "#fff7ed", border: "#ffedd5" };
  return { label: "ยังไม่ตอบ", color: T.foreground3, bg: "var(--c-f8f6f1)", border: "rgba(14,15,18,0.08)" };
}

export default function AssessmentSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const checkin = location.state?.checkin ?? null;
  const activity = location.state?.activity ?? null;
  const linewalkData = location.state?.linewalkData ?? null;

  useEffect(() => {
    if (!linewalkData) {
      navigate("/category", { replace: true });
    }
  }, [linewalkData, navigate]);

  const answeredItems = useMemo(() => {
    if (!linewalkData?.itemStates) return [];
    const cl = linewalkData.locType ? getChecklistForType(linewalkData.locType) : [];
    return Object.entries(linewalkData.itemStates).map(([key, value]) => {
      const question = cl.find(q => q.id === key);
      return {
        id: key,
        title: question ? question.title : "",
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
        padding: "18px 16px 32px",
        color: T.foreground,
        fontFamily: "'Prompt','Sarabun',sans-serif",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 16 }}>
        <section
          style={{
            borderRadius: 18,
            overflow: "hidden",
            background: "linear-gradient(105deg, var(--brand-hero-start) 0%, var(--brand-hero-end) 48%, var(--brand-nav) 100%)",
            color: "var(--brand-soft)",
            boxShadow: "0 16px 32px rgba(42,26,9,0.14)",
          }}
        >
          <div style={{ padding: "22px 20px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, background: "color-mix(in srgb, var(--brand-accent) 18%, transparent)", color: "var(--brand-accent)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                {linewalkData?.isSafetyContact ? "Safety Contact Complete" : "Assessment Complete"}
              </div>
              <h1 style={{ margin: "12px 0 6px", fontSize: 28, lineHeight: 1.15, fontWeight: 900 }}>
                {linewalkData?.isSafetyContact ? "สรุปผลการทำ Safety Contact" : "สรุปผลการทำแบบประเมิน"}
              </h1>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.76)", fontSize: 14, fontWeight: 600 }}>
                {linewalkData?.isSafetyContact ? "ตรวจสอบข้อมูลที่บันทึกไว้ก่อนทำการส่งข้อมูล" : "ตรวจสอบข้อมูลที่ทำไว้ก่อนทำการบันทึกข้อมูล"}
              </p>
            </div>
            <TigerMascot action="happy" size="104px" animation="float" />
          </div>
          <div style={{ height: 10, background: "repeating-linear-gradient(135deg,var(--brand-accent) 0 18px,#0e0f12 18px 36px)" }} />
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
                const meta = statusMeta(item.status);
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
                        หมายเหตุ: {item.note}
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

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => setShowSuccessPopup(true)}
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
                <span style={{ fontSize: 16 }}>🏆</span> +10 คะแนน
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
