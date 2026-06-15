// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import RestrictedDatePicker from "@/components/RestrictedDatePicker";

const T = {
  background: "var(--background)",
  foreground: "#0e0f12",
  foreground2: "#33312c",
  foreground3: "#767269",
  border: "rgba(14,15,18,0.08)",
  primary: "var(--brand-accent)",
  primarySoft: "var(--brand-soft)",
  primaryDark: "var(--brand-text)",
};

const STYLES = `
  .lw-card {
    background: #fff;
    border: 1px solid rgba(14,15,18,0.06);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(34,25,11,0.04);
  }
  .lw-back-btn {
    width:32px; height:32px; border-radius:10px;
    background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all 0.2s; flex-shrink:0; color:var(--brand-soft);
  }
  .lw-back-btn:hover { background:rgba(255,255,255,0.18); border-color:var(--brand-accent); transform:translateX(-2px); }
  .lw-cta { width:100%; border-radius:14px; border:none; font-family:'Prompt',sans-serif; font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer; transition:all 0.3s; background:linear-gradient(135deg,var(--brand-text) 0%,var(--c-1a1613) 100%); color:#fff; box-shadow:0 10px 25px rgba(26,22,19,0.25); padding:14px; }
  .lw-cta:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(26,22,19,0.32); }
  .lw-cta:active { transform:scale(0.985); }
  .lw-cta:disabled { cursor:not-allowed; opacity:0.6; transform:none; box-shadow:0 10px 25px rgba(26,22,19,0.16); }
  .lw-progress-track { position:relative; height:4px; background:rgba(255,255,255,0.12); border-radius:99px; margin-top:10px; overflow:hidden; }
  .lw-progress-fill { height:100%; background:linear-gradient(90deg,var(--brand-accent),var(--c-ffe066)); border-radius:99px; transition:width 0.5s cubic-bezier(0.4,0,0.2,1); }
`;

const IcoBack    = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoShield  = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
const IcoArrow   = ({c="#fff"}) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

function StepPips({ current, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isDone = step < current, isActive = step === current;
        return (
          <div key={step} style={{ display:"flex", alignItems:"center" }}>
            {i > 0 && <div style={{ width:12, height:2, background:(isDone||isActive)?"var(--brand-accent)":"rgba(255,255,255,0.15)", transition:"all 0.3s" }} />}
            <div style={{
              width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifycontent:"center",
              fontSize:"9.5px", fontWeight:900, fontFamily:"'Prompt',sans-serif", transition:"all 0.3s",
              background:isDone?"#1f7a55":isActive?"var(--brand-accent)":"rgba(255,255,255,0.1)",
              color:isDone?"#fff":isActive?"var(--c-1a1613)":"rgba(255,255,255,0.4)",
              boxShadow:isActive?"0 0 8px rgba(var(--brand-accent-rgb),0.6)":"none",
              border:(!isDone&&!isActive)?"1px solid rgba(255,255,255,0.08)":"none"
            }}>
              {isDone ? "✓" : step}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SafetyContact() {
  const navigate = useNavigate();
  const location = useLocation();
  const checkin = location.state?.checkin ?? null;
  const activity = location.state?.activity ?? {
    id: "safety-contact",
    label: "Safety Contact",
    desc: "บันทึกการสื่อสารด้านความปลอดภัย",
  };
  const fromActivity = location.state?.fromActivity ?? false;

  const [date, setDate] = useState(location.state?.linewalkData?.date ?? "");
  const [text, setText] = useState(location.state?.linewalkData?.safetyContactText ?? "");
  const [started, setStarted] = useState(!!location.state?.linewalkData);
  const [isMobileViewport, setIsMobileViewport] = useState(() => typeof window !== "undefined" ? window.innerWidth <= 480 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleBack() {
    if (started) {
      setStarted(false);
      return;
    }
    navigate(fromActivity ? "/checkin" : "/category", {
      state: fromActivity ? { activity, checkin } : undefined,
    });
  }

  function handleStart() {
    if (!date) return;
    setStarted(true);
  }

  function handleSave() {
    if (!date || !text.trim()) return;
    navigate("/assessment-summary", {
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

  const step1Complete = !!date;
  const progressPct = !started ? 72 : 100;
  const isMobileInputScreen = isMobileViewport && started;

  return (
    <>
      <style>{STYLES}</style>
      {isMobileInputScreen && (
        <style>{`
          .mobile-bottom-nav, .app-bottomnav {
            display: none !important;
          }
        `}</style>
      )}
      <div
        style={{
          minHeight: "100%",
          background: `linear-gradient(180deg, var(--secondary) 0%, ${T.background} 180px, ${T.background} 100%)`,
          padding: isMobileInputScreen ? "8px 0" : (isMobileViewport ? "0 0 60px" : "12px 20px 20px"),
          color: T.foreground,
          fontFamily: "'Prompt','Sarabun',sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: isMobileViewport ? "100%" : 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: isMobileInputScreen ? 8 : (isMobileViewport ? 12 : 10) }}>
          
          {/* ── HEADER ── */}
          {!isMobileInputScreen && (
            <div style={{
              background: "linear-gradient(105deg, var(--brand-hero-start) 0%, var(--brand-hero-end) 48%, var(--brand-nav) 100%)",
              padding: isMobileViewport ? "14px 16px 18px" : "14px 20px 18px",
              color: "var(--brand-soft)",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(42,26,9,0.15)",
              borderRadius: isMobileViewport ? 0 : "16px",
              border: isMobileViewport ? "none" : "1px solid rgba(255,255,255,0.08)",
              marginBottom: isMobileViewport ? 0 : (started ? 2 : 6),
            }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(var(--brand-accent-rgb),0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--brand-accent-rgb),0.03) 1px,transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />
              <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, background: "radial-gradient(circle,rgba(var(--brand-accent-rgb),0.10) 0%,transparent 70%)", pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="lw-back-btn" onClick={handleBack}><IcoBack /></button>
                    <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
                    <div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        {fromActivity && (
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,248,230,0.85)", fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase" }}>
                            Step {started ? 4 : 3}
                          </span>
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, background: "rgba(var(--brand-accent-rgb),0.18)", border: "1px solid rgba(var(--brand-accent-rgb),0.25)", color: "var(--brand-accent)", fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase" }}>
                          {started ? "Safety Contact" : "Line Walk"}
                        </span>
                      </div>
                      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Prompt',sans-serif", lineHeight: 1.25 }}>
                        {started ? "ทำแบบบันทึก Safety Contact" : "ทำรายการตรวจความปลอดภัย"}
                      </h1>
                    </div>
                  </div>
                  
                  {fromActivity && !isMobileViewport && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 9, color: "rgba(255,248,230,0.55)", fontWeight: 800, fontFamily: "'Prompt',sans-serif", letterSpacing: "0.05em", display: "block" }}>SAFETY AUDIT</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                          <StepPips current={started ? 4 : 3} total={4} />
                          <span style={{ fontSize: 11, color: "var(--brand-accent)", fontWeight: 900, fontFamily: "'Prompt',sans-serif" }}>
                            {started ? 4 : 3} / 4
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lw-progress-track" style={{ marginTop: 12 }}>
                  <div className="lw-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Calendar Picker ── */}
          {!started && (
            <div className="lw-card" style={{ margin: isMobileViewport ? "0 16px" : "0 auto", width: isMobileViewport ? "auto" : "100%", maxWidth: isMobileViewport ? "none" : "540px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, fontFamily: "'Prompt',sans-serif", color: "var(--c-1a1613)", flexShrink: 0 }}>1</div>
                <span style={{ fontFamily: "'Prompt',sans-serif", fontWeight: 800, fontSize: 14, color: T.foreground }}>ข้อมูลพื้นฐาน</span>
              </div>

              <RestrictedDatePicker value={date} onChange={setDate} accent="var(--brand-accent)" />

              {!step1Complete && (
                <p style={{ fontSize: 12, color: T.foreground3, fontFamily: "'Prompt',sans-serif", fontStyle: "italic", margin: 0 }}>
                  กรุณาเลือกวันที่ดำเนินการเพื่อดำเนินการต่อ
                </p>
              )}

              {step1Complete && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button type="button" onClick={handleStart} className="lw-cta" style={{ maxWidth: 320 }}>
                    <IcoShield />
                    เริ่มทำ Safety Contact
                    <IcoArrow />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Textarea input ── */}
          {started && (
            <div className="lw-card" style={{ margin: isMobileViewport ? "0 8px" : "0 auto", width: isMobileViewport ? "auto" : "100%", maxWidth: isMobileViewport ? "none" : "540px", display: "flex", flexDirection: "column", gap: 16 }}>
              {isMobileInputScreen && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(82,52,24,0.08)", paddingBottom: 10, marginBottom: 4 }}>
                  <button className="lw-back-btn" onClick={handleBack} style={{ background: "rgba(14,15,18,0.05)", border: "1px solid rgba(14,15,18,0.1)", color: "var(--brand-text)" }}><IcoBack /></button>
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, background: "var(--brand-soft)", color: "var(--brand-text)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", marginBottom: 2 }}>
                      Safety Contact
                    </span>
                    <h1 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: T.foreground, fontFamily: "'Prompt',sans-serif" }}>
                      บันทึกการสื่อสารความปลอดภัย
                    </h1>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, fontFamily: "'Prompt',sans-serif", color: "var(--c-1a1613)", flexShrink: 0 }}>2</div>
                <span style={{ fontFamily: "'Prompt',sans-serif", fontWeight: 800, fontSize: 14, color: T.foreground }}>Safety Contact</span>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <textarea
                  id="safety-contact-text"
                  placeholder="กรุณากรอกรายละเอียด Safety Contact..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 180,
                    resize: "none",
                    borderRadius: 12,
                    border: `1px solid rgba(14,15,18,0.15)`,
                    padding: "14px 16px",
                    fontFamily: "inherit",
                    fontSize: 14,
                    color: T.foreground,
                    outline: "none",
                    background: "#fcfcfb",
                    transition: "all 0.2s",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "var(--brand-accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-soft)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "rgba(14,15,18,0.15)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#fcfcfb";
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!text.trim()}
                  className="lw-cta"
                  style={{
                    width: "100%",
                    height: 50,
                    borderRadius: 14,
                    fontSize: 15,
                    minHeight: 0,
                    background: !text.trim()
                      ? "linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)"
                      : undefined,
                    boxShadow: !text.trim() ? "none" : undefined,
                    cursor: !text.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  <IcoShield />
                  ถัดไป
                  <IcoArrow />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
