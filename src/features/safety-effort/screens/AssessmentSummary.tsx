// @ts-nocheck
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import TigerMascot from "@/components/TigerMascot";

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
  safe: "var(--c-8b5a14)",
  issue: "var(--c-8f3b16)",
  action: "var(--brand-text)",
};

function statusMeta(status) {
  if (status === "safe") return { label: "ปลอดภัย", color: T.safe, bg: "var(--c-fff6db)", border: "var(--c-d5a21a)" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย", color: T.issue, bg: "var(--c-fff1e8)", border: "var(--c-db7b4f)" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย", color: T.action, bg: "var(--c-f6ece1)", border: "var(--brand-text)" };
  return { label: "ยังไม่ตอบ", color: T.foreground3, bg: "var(--c-f8f6f1)", border: "rgba(14,15,18,0.08)" };
}

export default function AssessmentSummary() {
  const navigate = useNavigate();
  const location = useLocation();
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
    return Object.entries(linewalkData.itemStates).map(([key, value]) => ({
      id: key,
      status: value?.status ?? null,
      note: value?.note ?? "",
      photos: value?.photos ?? [],
    }));
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
                Assessment Complete
              </div>
              <h1 style={{ margin: "12px 0 6px", fontSize: 28, lineHeight: 1.15, fontWeight: 900 }}>
                สรุปผลการทำแบบประเมิน
              </h1>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.76)", fontSize: 14, fontWeight: 600 }}>
                ตรวจสอบข้อมูลที่ทำไว้ก่อนกลับไปหน้าหมวดกิจกรรม
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
              { label: "สถานที่", value: checkin?.name || "-" },
              { label: "รหัสสถานที่", value: checkin?.tag || "-" },
            ].map((item) => (
              <div key={item.label} style={{ background: T.brownSoft, borderRadius: 14, padding: "12px 12px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.foreground3, textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: T.brown }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
            {[
              { label: "ปลอดภัย", value: counts.safe, color: T.safe, bg: "var(--c-fff6db)" },
              { label: "สภาพไม่ปลอดภัย", value: counts.condition, color: T.issue, bg: "var(--c-fff1e8)" },
              { label: "พฤติกรรมไม่ปลอดภัย", value: counts.action, color: T.action, bg: "var(--c-f6ece1)" },
            ].map((item) => (
              <div key={item.label} style={{ background: item.bg, borderRadius: 14, padding: "12px 12px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: item.color }}>{item.label}</div>
                <div style={{ marginTop: 4, fontSize: 24, lineHeight: 1, fontWeight: 900, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>

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
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.foreground }}>
                      ข้อ {index + 1}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: meta.color }}>
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

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/category", { replace: true })}
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
            กลับหน้าหมวดกิจกรรม
          </button>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck
