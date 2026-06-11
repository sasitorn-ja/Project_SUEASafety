// @ts-nocheck
import { useState } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import RestrictedDatePicker from "@/components/RestrictedDatePicker";

const T = {
  background: "var(--background)",
  card: "#ffffff",
  foreground: "#0e0f12",
  foreground2: "#33312c",
  foreground3: "#767269",
  primary: "#2f63df",
  primaryDark: "#264fba",
  border: "rgba(14,15,18,0.10)",
  soft: "#f6f4ee",
};

export default function SafetyContact() {
  const navigate = useNavigate();
  const location = useLocation();
  const checkin = location.state?.checkin ?? null;
  const activity = location.state?.activity ?? {
    id: "safety-contact",
    label: "Safety Contact",
    desc: "บันทึกการสื่อสารด้านความปลอดภัย",
  };
  const [date, setDate] = useState("");
  const [text, setText] = useState("");

  function handleSave() {
    if (!date || !text.trim()) return;
    navigate("/create-post", {
      state: {
        checkin,
        activity,
        linewalkData: {
          isSafetyContact: true,
          activeTab: "safety_contact",
          date,
          safetyContactText: text.trim(),
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
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            boxShadow: "0 10px 28px rgba(34,25,11,0.08)",
            padding: "22px 20px 18px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 22,
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/linewalk", { state: location.state })}
              style={{
                height: 40,
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: T.soft,
                color: T.foreground2,
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Line Walk
            </button>
            <button
              type="button"
              style={{
                height: 40,
                borderRadius: 10,
                border: `1px solid ${T.primary}`,
                background: `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: "#fff",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 700,
                cursor: "default",
              }}
            >
              Safety Contact
            </button>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <RestrictedDatePicker value={date} onChange={setDate} accent="#2f63df" />

            <div style={{ display: "grid", gap: 10 }}>
              <label
                htmlFor="safety-contact-text"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: T.foreground,
                }}
              >
                Safety Contact
              </label>

              <textarea
                id="safety-contact-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 136,
                  resize: "vertical",
                  borderRadius: 10,
                  border: `1px solid rgba(47,99,223,0.28)`,
                  padding: "14px 16px",
                  fontFamily: "inherit",
                  fontSize: 14,
                  color: T.foreground,
                  outline: "none",
                  background: "#fff",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={!date || !text.trim()}
              style={{
                minWidth: 88,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: !date || !text.trim()
                  ? "linear-gradient(180deg, #9fb6ef 0%, #8aa8ea 100%)"
                  : `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: "#fff",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                cursor: !date || !text.trim() ? "not-allowed" : "pointer",
                boxShadow: !date || !text.trim() ? "none" : "0 10px 18px rgba(47,99,223,0.20)",
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
// @ts-nocheck

