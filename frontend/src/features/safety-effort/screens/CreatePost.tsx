// @ts-nocheck
import { useState } from "react";
import { useLocation, useNavigate } from "@/lib/app-navigation";
import TigerMascot from "@/components/TigerMascot";

const T = {
  background: "var(--background)",
  card: "#ffffff",
  foreground: "#0e0f12",
  foreground2: "#33312c",
  foreground3: "#767269",
  primary: "var(--brand-accent)",
  primaryFg: "#0e0f12",
  border: "rgba(14,15,18,0.10)",
};

export default function CreatePost() {
  const navigate = useNavigate();
  const location = useLocation();
  const checkin = location.state?.checkin ?? null;
  const activity = location.state?.activity ?? null;
  const linewalkData = location.state?.linewalkData ?? null;
  const [caption, setCaption] = useState(linewalkData?.safetyContactText ?? "");

  function handleSave() {
    navigate("/category", {
      state: {
        checkin,
        activity,
        linewalkData: {
          ...(linewalkData ?? {}),
          safetyContactText: caption.trim(),
        },
      },
    });
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: `linear-gradient(180deg, var(--secondary) 0%, ${T.background} 180px, ${T.background} 100%)`,
        padding: "20px 16px 32px",
        color: T.foreground,
        fontFamily: "'Prompt','Sarabun',sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            boxShadow: "0 10px 28px rgba(34,25,11,0.08)",
            padding: "22px 20px 18px",
            display: "grid",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.foreground3, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Create Post
              </div>
              <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.2, fontWeight: 900 }}>
                บันทึกโพสต์ความปลอดภัย
              </h1>
              <p style={{ margin: 0, color: T.foreground2, fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>
                หน้านี้ถูกกู้คืนกลับมาเพื่อให้ flow เดิมยังใช้งานต่อได้
              </p>
            </div>
            <TigerMascot action="createThumb" size="92px" animation="float" />
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              <div style={{ borderRadius: 12, background: "var(--c-f8f4ea)", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.foreground3, textTransform: "uppercase" }}>Location</div>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800 }}>{checkin?.name ?? "-"}</div>
              </div>
              <div style={{ borderRadius: 12, background: "var(--c-f8f4ea)", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.foreground3, textTransform: "uppercase" }}>Activity</div>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800 }}>{activity?.label ?? "-"}</div>
              </div>
              <div style={{ borderRadius: 12, background: "var(--c-f8f4ea)", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.foreground3, textTransform: "uppercase" }}>Date</div>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800 }}>{linewalkData?.date ?? "-"}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <label htmlFor="create-post-caption" style={{ fontSize: 15, fontWeight: 800 }}>
                Caption
              </label>
              <textarea
                id="create-post-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 180,
                  resize: "vertical",
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  padding: "14px 16px",
                  fontFamily: "inherit",
                  fontSize: 14,
                  color: T.foreground,
                  background: "#fff",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                minWidth: 110,
                height: 38,
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(180deg, ${T.primary} 0%, var(--c-e0ad00) 100%)`,
                color: T.primaryFg,
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 10px 18px rgba(var(--brand-accent-rgb),0.20)",
              }}
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
