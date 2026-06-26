// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "@/lib/app-navigation";
import RestrictedDatePicker from "@/components/RestrictedDatePicker";
import SafetyEffortProgressStepper from "@/features/safety-effort/components/SafetyEffortProgressStepper";
import { useSessionUser, getSessionDisplayName } from "@/lib/session-user";

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
  .lw-step1-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    align-items: stretch;
    max-width: 1000px;
    width: 100%;
    margin: 0 auto;
  }
  @media (min-width: 768px) {
    .lw-step1-grid {
      grid-template-columns: minmax(0, 1fr) minmax(320px, 1.2fr);
    }
  }
  @media (min-width: 1200px) {
    .lw-step1-grid {
      grid-template-columns: minmax(360px, 1fr) minmax(320px, 1.3fr);
    }
  }
`;

const IcoBack = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoShield = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
const IcoArrow = ({ c = "#fff" }) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IcoCalendarLocal = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0B82F0" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoMapPinLocal = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0B82F0" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IcoTagLocal = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0B82F0" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IcoInfoLocal = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D89B00" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const MOCK_SAFETY_IMAGES = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1531834672005-539f180738f8?auto=format&fit=crop&w=600&q=80"
];

const IcoUpload  = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoX       = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function SafetyContact() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: sessionUser } = useSessionUser();
  const userDisplayName = getSessionDisplayName(sessionUser);
  const checkin = location.state?.checkin ?? null;
  const activity = location.state?.activity ?? {
    id: "safety-contact",
    label: "Safety Contact",
    desc: "รายงานการสื่อสารความปลอดภัย",
  };
  const fromActivity = location.state?.fromActivity ?? false;

  const [date, setDate] = useState(location.state?.linewalkData?.date ?? "");
  const [text, setText] = useState(location.state?.linewalkData?.safetyContactText ?? "");
  const [started, setStarted] = useState(!!location.state?.linewalkData);
  const [isMobileViewport, setIsMobileViewport] = useState(() => typeof window !== "undefined" ? window.innerWidth <= 480 : false);
  const [photos, setPhotos] = useState<string[]>(location.state?.linewalkData?.photos ?? []);

  function handleMockPhotoAdd() {
    if (photos.length >= 5) return;
    const nextMock = MOCK_SAFETY_IMAGES[photos.length % MOCK_SAFETY_IMAGES.length];
    setPhotos((prev) => [...prev, nextMock]);
  }

  function handleDeletePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

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
          photos,
        },
      },
    });
  }

  const step1Complete = !!date;
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
          padding: isMobileInputScreen ? "8px 0" : (isMobileViewport ? "10px 12px calc(80px + env(safe-area-inset-bottom))" : "8px 20px 20px"),
          color: T.foreground,
          fontFamily: "'Prompt','Sarabun',sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: isMobileViewport ? "100%" : 1500, margin: "0 auto", display: "flex", flexDirection: "column", gap: isMobileInputScreen ? 8 : (isMobileViewport ? 10 : 16) }}>
          {!isMobileInputScreen && (
            <div className="relative overflow-hidden rounded-[20px] border border-[#B9DDFF]/60 bg-[#EEF7FF] p-3.5 sm:p-5 lg:p-6 min-h-[120px] sm:min-h-[145px] xl:min-h-[160px] flex items-center shadow-[0_12px_30px_rgba(185,223,255,0.4)]" style={{ marginBottom: isMobileViewport ? 2 : (started ? 2 : 6) }}>
              <div
                className="absolute inset-0 bg-[url('/images/heroes/safety-effort-category-hero.png')] bg-no-repeat"
                style={{
                  backgroundSize: "auto 108%",
                  backgroundPosition: "right -20px bottom -5px",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#EEF7FF] via-[#EEF7FF]/90 sm:via-[#EEF7FF]/40 to-transparent pointer-events-none" />

              {/* Main content container directly on the background (no glassmorphic inner container) */}
              <div className="relative z-10 w-full flex items-center justify-between font-sarabun">
                {/* Left column: Back button, Title, and Stepper info */}
                <div className="flex flex-col items-start gap-2">
                  {started && (
                    <div style={{ display:"flex", gap:6, marginBottom: 2, flexWrap:"wrap", alignItems: "center" }}>
                      {fromActivity && (
                        <span 
                          style={{
                            display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99, border:"1px solid #D7EAFE", background:"#fff", color:"#55739B", fontSize:"9.5px", fontWeight:800, textTransform:"uppercase"
                          }}
                        >
                          Step 4
                        </span>
                      )}
                      <span 
                        style={{
                          display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99, background:"#E6F2FF", border:"1px solid #B9DDFF", color:"#0B82F0", fontSize:"9.5px", fontWeight:800, textTransform:"uppercase"
                        }}
                      >
                        Safety Contact
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white border border-[#D7EAFE] text-[#0B82F0] shadow-[0_2px_8px_rgba(11,130,240,0.06)] hover:bg-[#0B82F0] hover:text-white transition-all duration-300 active:scale-95"
                      onClick={handleBack}
                      aria-label="ย้อนกลับ"
                    >
                      <IcoBack />
                    </button>
                    <h1 className="text-[20px] sm:text-[24px] xl:text-[26px] font-black leading-tight tracking-tight text-[#0B2F6B]">
                      {started ? "ทำแบบบันทึก Safety Contact" : "ทำรายการตรวจความปลอดภัย"}
                    </h1>
                  </div>

                  <div className="flex flex-col items-start gap-1 mt-1 sm:mt-1.5">
                    {fromActivity && (
                      <>
                        <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-[#55739B] uppercase">
                          ความคืบหน้า
                        </span>
                        <SafetyEffortProgressStepper current={started ? 4 : 3} total={4} compact />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!started && (
            <div style={{ margin: "0 auto", maxWidth: "100%", width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="lw-step1-grid">
                <div style={{ minWidth: 0, display: "flex", justifyContent: isMobileViewport ? "stretch" : "center" }}>
                  <RestrictedDatePicker value={date} onChange={setDate} accent="var(--brand-accent)" />
                </div>

                <div className="lw-card" style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: isMobileViewport ? undefined : 380, padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px solid #F0F7FF", paddingBottom: 10, marginBottom: 4 }}>
                    <div style={{ width: 4, height: 16, backgroundColor: "#0B82F0", borderRadius: 4 }}></div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0B2F6B", fontFamily: "'Prompt', sans-serif" }}>
                      {checkin ? "รายละเอียดการตรวจเช็คอิน" : "ข้อมูลกิจกรรมและวันทำรายการ"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Item 1: กิจกรรม */}
                    <div style={{
                      background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "0 2px 8px rgba(11,130,240,0.02)"
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", flexShrink: 0 }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748B", fontFamily: "'Prompt', sans-serif" }}>กิจกรรม</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0B2F6B", fontFamily: "'Prompt', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Safety Contact
                        </span>
                      </div>
                    </div>

                    {/* Item 2: วันที่ทำ */}
                    <div style={{
                      background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "0 2px 8px rgba(11,130,240,0.02)"
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", flexShrink: 0 }}>
                        <IcoCalendarLocal />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748B", fontFamily: "'Prompt', sans-serif" }}>วันที่ทำ</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0B2F6B", fontFamily: "'Prompt', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {date || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Item 3: สถานที่ */}
                    <div style={{
                      background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "0 2px 8px rgba(11,130,240,0.02)"
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", flexShrink: 0 }}>
                        <IcoMapPinLocal />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748B", fontFamily: "'Prompt', sans-serif" }}>สถานที่</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0B2F6B", fontFamily: "'Prompt', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {checkin?.name || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Item 4: รหัสสถานที่ */}
                    <div style={{
                      background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "0 2px 8px rgba(11,130,240,0.02)"
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", flexShrink: 0 }}>
                        <IcoTagLocal />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#64748B", fontFamily: "'Prompt', sans-serif" }}>รหัสสถานที่</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0B2F6B", fontFamily: "'Prompt', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {checkin?.tag || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning/Instructional banner */}
                  <div style={{
                    background: "linear-gradient(135deg, #FFFDF5 0%, #FEFBF0 100%)",
                    border: "1px solid #FCD34D",
                    borderRadius: 12,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "start",
                    gap: 8,
                    marginTop: 6
                  }}>
                    <div style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }}>
                      <IcoInfoLocal />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#92400E", fontFamily: "'Prompt', sans-serif" }}>คำแนะนำการบันทึก</span>
                      <span style={{ fontSize: 10.5, color: "#B45309", fontFamily: "'Prompt', sans-serif", lineHeight: "1.4" }}>
                        กรุณาตรวจสอบข้อมูลและเลือกวันที่ดำเนินการให้ถูกต้องในปฏิทินก่อนเริ่มทำรายการ
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {!step1Complete && (
                      <p style={{ fontSize: 11.5, color: "#EF4444", fontWeight: 600, margin: 0, textAlign: "center" }}>
                        * กรุณาเลือกวันที่ดำเนินการในปฏิทินเพื่อเริ่มทำรายการ
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={!step1Complete}
                      className="lw-cta"
                      style={{
                        width: "100%",
                        height: 46,
                        borderRadius: 12,
                        fontSize: 14.5,
                        minHeight: 0,
                        background: !step1Complete
                          ? "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)"
                          : "linear-gradient(135deg, #0B2F6B 0%, #081C43 100%)",
                        cursor: !step1Complete ? "not-allowed" : "pointer",
                        boxShadow: !step1Complete ? "none" : "0 4px 14px rgba(11, 47, 107, 0.25)",
                        border: "none",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <IcoShield />
                      เริ่มทำ Safety Contact
                      <IcoArrow />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {started && (
            <div className="lw-card" style={{ margin: isMobileViewport ? "0 4px" : "0 auto", width: isMobileViewport ? "auto" : "100%", maxWidth: isMobileViewport ? "none" : "540px", display: "flex", flexDirection: "column", gap: 16 }}>
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
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--brand-accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-soft)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(14,15,18,0.15)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#fcfcfb";
                  }}
                />
              </div>

              {/* Photo Upload for Safety Contact */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                <span style={{ fontFamily: "'Prompt',sans-serif", fontSize: isMobileViewport ? "10.5px" : "11.5px", fontWeight: 800, color: T.foreground3, textTransform: "uppercase" }}>
                  แนบรูปภาพ ({photos.length} / 5 รูป)
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: isMobileViewport ? 6 : 8, alignItems: "center" }}>
                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={handleMockPhotoAdd}
                      style={isMobileViewport ? { height: 40, padding: "0 12px", borderColor: "rgba(95,64,37,0.22)", background: "var(--brand-soft)", color: "var(--brand-text)", fontSize: 11.5, margin: 0, display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(95,64,37,0.22)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" } : { height: 40, padding: "0 16px", borderRadius: 8, margin: 0, display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(14,15,18,0.12)", background: "#fbfbfa", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      <IcoUpload /> Upload รูปภาพ
                    </button>
                  )}
                  {photos.map((url, pi) => (
                    <div key={pi} style={{ width: 40, height: 40, borderRadius: 8, position: "relative", overflow: "hidden", border: "1px solid rgba(14,15,18,0.08)" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(pi)}
                        style={{
                          position: "absolute",
                          top: 1,
                          right: 1,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <IcoX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
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
                  ดูสรุปก่อนส่ง
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
