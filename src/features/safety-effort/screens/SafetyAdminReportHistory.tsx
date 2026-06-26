// @ts-nocheck
import { useEffect, useState } from "react";
import { Eye, Search, X, ClipboardList, Download } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import * as XLSX from "xlsx";

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

const LOCATION_TYPE_LABELS = {
  factory: "โรงงาน",
  office: "สำนักงาน",
  site: "Site งาน",
};

function statusMeta(status) {
  if (status === "safe") return { label: "ปลอดภัย (Safe)", color: "#1f7a55", bg: "#f0fdf4", border: "#bbf7d0" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย (Unsafe Condition)", color: "#c73a21", bg: "#fef2f2", border: "#fecaca" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย (Unsafe Act)", color: "#e67e22", bg: "#fff7ed", border: "#ffedd5" };
  return { label: "N/A", color: "var(--c-6f665e)", bg: "#fbfbfa", border: "rgba(31,26,23,0.10)" };
}

const MOCKUP_SUBMISSIONS = [
  {
    id: "mock-1",
    timestamp: "2026-06-26T10:30:00.000Z",
    activityId: "line-walk",
    activityLabel: "Line Walk",
    locType: "factory",
    locationName: "โรงบดปูนซีเมนต์คาร์บอนต่ำ",
    locationTag: "บดที่ 2",
    date: "2026-06-26",
    isSafetyContact: false,
    safetyContactText: "",
    answeredItems: [
      { id: "q1", title: "การใส่แว่นตานิรภัยและหมวกเซฟตี้", status: "safe" },
      { id: "q2", title: "ทางหนีไฟไม่มีสิ่งกีดขวาง", status: "safe" },
      { id: "q3", title: "ปลั๊กไฟและสายไฟอยู่ในสภาพสมบูรณ์", status: "unsafe_condition", note: "พบปลั๊กพ่วงสายชำรุด 1 จุด" },
      { id: "q4", title: "การติดป้ายเตือนอันตราย", status: "safe" }
    ],
    actorName: "นายมานพ ปลอดภัย",
    actorEmail: "manop.p@cpac.co.th",
    actorCode: "0012345",
  },
  {
    id: "mock-2",
    timestamp: "2026-06-25T14:15:00.000Z",
    activityId: "safety-contact",
    activityLabel: "Safety Contact",
    locType: "office",
    locationName: "อาคาร 1 สำนักงานใหญ่",
    locationTag: "ชั้น 3 ฝ่ายพัฒนาซอฟต์แวร์",
    date: "2026-06-25",
    isSafetyContact: true,
    safetyContactText: "พูดคุยรณรงค์กับทีมงานเกี่ยวกับความเป็นระเบียบเรียบร้อยและการจัดเก็บสายไฟใต้โต๊ะทำงานเพื่อป้องกันความร้อนสะสมและการสะดุดล้ม ได้รับความร่วมมือเป็นอย่างดี",
    answeredItems: [],
    actorName: "นางสาวศิริลักษณ์ วิริยะ",
    actorEmail: "sirilak.w@cpac.co.th",
    actorCode: "0025678",
  },
  {
    id: "mock-3",
    timestamp: "2026-06-24T09:00:00.000Z",
    activityId: "line-walk",
    activityLabel: "Line Walk",
    locType: "site",
    locationName: "โครงการก่อสร้างทางด่วนข้ามแยก",
    locationTag: "ตอม่อที่ 12-14",
    date: "2026-06-24",
    isSafetyContact: false,
    safetyContactText: "",
    answeredItems: [
      { id: "q1", title: "นั่งร้านมีความแข็งแรงและปลอดภัย", status: "safe" },
      { id: "q2", title: "คนงานทุกคนผูกสายเข็มขัดนิรภัยขณะทำงานบนที่สูง", status: "safe" },
      { id: "q3", title: "มีแนวกั้นกันตกและป้ายเตือนการทำงานด้านล่าง", status: "safe" }
    ],
    actorName: "นายวิศรุต การช่าง",
    actorEmail: "witsarut.k@cpac.co.th",
    actorCode: "0039876",
  }
];

export default function SafetyAdminReportHistory() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const isMobile = width < 768;

  const [submissions, setSubmissions] = useState(MOCKUP_SUBMISSIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [locTypeFilter, setLocTypeFilter] = useState("all");
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Map a DB safety_activity row into the submission shape this screen renders.
  const activityToSubmission = (row) => {
    let meta = {};
    try {
      meta = row.notes ? JSON.parse(row.notes) : {};
    } catch {
      meta = {};
    }
    const isSafetyContact = String(row.activity_type || "").toUpperCase() === "SAFETY_CONTACT";
    return {
      id: `act-${row.id}`,
      timestamp: row.completed_at || row.started_at || row.created_at || new Date().toISOString(),
      activityId: isSafetyContact ? "safety-contact" : "line-walk",
      activityLabel: row.title || (isSafetyContact ? "Safety Contact" : "Line Walk"),
      locType: meta.locType || "factory",
      locationName: meta.locationName || "-",
      locationTag: meta.locationTag || "-",
      date: meta.date || String(row.completed_at || row.created_at || "").split("T")[0],
      isSafetyContact,
      safetyContactText: meta.safetyContactText || "",
      answeredItems: Array.isArray(meta.answers) ? meta.answers : [],
      actorName: row.name || meta.name || "-",
      actorEmail: row.email || meta.email || "",
      actorCode: row.pms || meta.pms || "",
    };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/safety-effort/submissions?pageSize=200", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const payload = await res.json().catch(() => null);
          const items = payload?.data?.items;
          if (Array.isArray(items) && !cancelled) {
            // API returns name/email/pms; this screen renders actorName/actorEmail/actorCode.
            const apiItems = items.map((it) => ({
              ...it,
              actorName: it.actorName || it.name || "",
              actorEmail: it.actorEmail || it.email || "",
              actorCode: it.actorCode || it.pms || "",
            }));
            setSubmissions([...apiItems, ...MOCKUP_SUBMISSIONS]);
          }
        }
      } catch { if (!cancelled) setSubmissions(MOCKUP_SUBMISSIONS); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      window.alert("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    const rows = filtered.map((item) => {
      const dateObj = new Date(item.timestamp);
      const displayDate = item.date;
      const displayTime = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
      const isContact = item.isSafetyContact;

      let summaryText = "";
      if (isContact) {
        summaryText = item.safetyContactText;
      } else {
        const counts = item.answeredItems.reduce((acc, current) => {
          if (current.status === "safe") acc.safe += 1;
          else if (current.status === "unsafe_condition") acc.unsafeCond += 1;
          else if (current.status === "unsafe_action") acc.unsafeAct += 1;
          return acc;
        }, { safe: 0, unsafeCond: 0, unsafeAct: 0 });
        
        summaryText = `ปลอดภัย: ${counts.safe} | ไม่ปลอดภัย: ${counts.unsafeCond + counts.unsafeAct}`;
      }

      return {
        "วันที่ทำรายการ": displayDate,
        "เวลา": displayTime,
        "กิจกรรม": item.activityLabel,
        "หมวดหมู่สถานที่": LOCATION_TYPE_LABELS[item.locType] || item.locType,
        "สถานที่ตรวจ": item.locationName,
        "รหัสสถานที่/Zone": item.locationTag,
        "รหัสผู้ตรวจ": item.actorCode || "",
        "ผู้ทำกิจกรรม": item.actorName || "",
        "อีเมล": item.actorEmail || "",
        "ผลประเมิน/รายละเอียด": summaryText
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report History");
    XLSX.writeFile(workbook, `safety-report-history-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filtered = submissions.filter(item => {
    const matchesSearch = item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.safetyContactText && item.safetyContactText.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (item.actorName && item.actorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (item.actorEmail && item.actorEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (item.actorCode && item.actorCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesActivity = activityFilter === "all" || item.activityId === activityFilter;
    const matchesLoc = locTypeFilter === "all" || item.locType === locTypeFilter;
    return matchesSearch && matchesActivity && matchesLoc;
  });

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
        
        {/* Hero */}
        <div style={{ flexShrink: 0 }}>
          <SafetyCultureHero
            eyebrow="SAFETY EFFORT ADMIN"
            title={<>ประวัติการส่งรายงาน</>}
            description="ตรวจสอบรายละเอียดการบันทึกรายงาน Linewalk / Safety Contact ค้นหา และลบข้อมูลการทำรายการในระบบ"
            variant="community"
            backgroundImage="/images/heroes/safety-report-history-hero.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
          />
        </div>

        {/* Content Container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: T.card,
            border: `1px solid ${T.line}`,
            borderRadius: 24,
            padding: isMobile ? 12 : 16,
            boxShadow: T.shadow,
            minHeight: isMobile ? undefined : 0,
            overflow: "hidden"
          }}
        >
          {/* Filter controls row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderBottom: `1px solid ${T.line}`,
              paddingBottom: 12,
              flexShrink: 0
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
              {/* Search input */}
              <div style={{ position: "relative", width: isMobile ? "100%" : 240 }}>
                <input
                  type="text"
                  placeholder="ค้นหาสถานที่ / ผู้ทำ / อีเมล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    ...inputStyle,
                    minHeight: 38,
                    borderRadius: 10,
                    fontSize: 13,
                    paddingLeft: 34
                  }}
                />
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.sub }} />
              </div>

              {/* Filter Activity */}
              <Combobox
                value={activityFilter}
                onValueChange={setActivityFilter}
                aria-label="กรองกิจกรรม"
                searchPlaceholder="ค้นหากิจกรรม"
                style={{ width: isMobile ? "100%" : 160 }}
                options={[
                  { value: "all", label: "กิจกรรมทั้งหมด" },
                  { value: "line-walk", label: "Line Walk" },
                  { value: "safety-contact", label: "Safety Contact" },
                ]}
              />

              {/* Filter Location Type */}
              <Combobox
                value={locTypeFilter}
                onValueChange={setLocTypeFilter}
                aria-label="กรองประเภทสถานที่"
                searchPlaceholder="ค้นหาประเภท"
                style={{ width: isMobile ? "100%" : 160 }}
                options={[
                  { value: "all", label: "ทุกประเภทสถานที่" },
                  { value: "factory", label: "โรงงาน" },
                  { value: "office", label: "สำนักงาน" },
                  { value: "site", label: "Site งาน" },
                ]}
              />
            </div>

            {submissions.length > 0 && (
              <button
                type="button"
                onClick={handleExportExcel}
                style={{
                  ...buttonPrimaryStyle,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                  height: 38,
                  borderRadius: 10,
                  fontSize: 12.5,
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>
            )}
          </div>

          {/* List / Table Area */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ border: `1px dashed ${T.lineStrong}`, borderRadius: 18, padding: 32, textAlign: "center", color: T.sub, fontSize: 14 }}>
                ไม่พบประวัติการส่งรายงานตามเงื่อนไขที่เลือก
              </div>
            ) : !isMobile ? (
              <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", textAlign: "left", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ background: "color-mix(in srgb, var(--brand-accent) 8%, transparent)", borderBottom: `2px solid ${T.line}` }}>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 140 }}>วันที่ทำรายการ</th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 130 }}>กิจกรรม</th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 220 }}>สถานที่ตรวจ</th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 220 }}>ผู้ทำกิจกรรม</th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 120 }}>ประเภทสถานที่</th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>ผลประเมิน / รายละเอียด</th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 100, textAlign: "center" }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, idx) => {
                      const dateObj = new Date(item.timestamp);
                      const displayDate = item.date;
                      const displayTime = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
                      const isContact = item.isSafetyContact;

                      let summaryText = "";
                      if (isContact) {
                        summaryText = item.safetyContactText.length > 70 
                          ? item.safetyContactText.substring(0, 70) + "..." 
                          : item.safetyContactText;
                      } else {
                        const counts = item.answeredItems.reduce((acc, current) => {
                          if (current.status === "safe") acc.safe += 1;
                          else if (current.status === "unsafe_condition") acc.unsafeCond += 1;
                          else if (current.status === "unsafe_action") acc.unsafeAct += 1;
                          return acc;
                        }, { safe: 0, unsafeCond: 0, unsafeAct: 0 });
                        
                        summaryText = `ปลอดภัย: ${counts.safe} | ไม่ปลอดภัย: ${counts.unsafeCond + counts.unsafeAct}`;
                      }

                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: idx < filtered.length - 1 ? `1px solid ${T.line}` : "none",
                            transition: "background 0.15s"
                          }}
                          className="hover:bg-black/[0.015] transition-colors"
                        >
                          <td style={{ padding: "8px 16px" }}>
                            <span style={{ fontWeight: 700 }}>{displayDate}</span>
                            <div style={{ fontSize: 11, color: T.sub }}>{displayTime}</div>
                          </td>
                          <td style={{ padding: "8px 16px" }}>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: isContact ? "#7c2d12" : "#14532d",
                              background: isContact ? "#ffedd5" : "#dcfce7",
                              padding: "3px 8px",
                              borderRadius: 999
                            }}>
                              {item.activityLabel}
                            </span>
                          </td>
                          <td style={{ padding: "8px 16px" }}>
                            <div style={{ fontWeight: 700 }}>{item.locationName}</div>
                            <div style={{ fontSize: 11, color: T.sub }}>{item.locationTag}</div>
                          </td>
                          <td style={{ padding: "8px 16px" }}>
                            <div style={{ fontWeight: 700 }}>{item.actorName || "-"}</div>
                            <div style={{ fontSize: 11, color: T.sub }}>
                              {[item.actorCode, item.actorEmail].filter(Boolean).join(" · ") || "-"}
                            </div>
                          </td>
                          <td style={{ padding: "8px 16px" }}>
                            {LOCATION_TYPE_LABELS[item.locType] || item.locType}
                          </td>
                          <td style={{ padding: "8px 16px" }}>
                            <div style={{
                              color: isContact ? T.ink : (summaryText.includes("ไม่ปลอดภัย: 0") ? T.ok : T.danger),
                              fontWeight: isContact ? 500 : 700
                            }}>
                              {summaryText}
                            </div>
                          </td>
                          <td style={{ padding: "8px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setSelectedSub(item)}
                                style={{
                                  ...buttonGhostStyle,
                                  width: 30,
                                  height: 30,
                                  borderRadius: 6,
                                  padding: 0,
                                  display: "grid",
                                  placeItems: "center"
                                }}
                                title="ดูรายละเอียด"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filtered.map(item => {
                  const dateObj = new Date(item.timestamp);
                  const displayDate = item.date;
                  const displayTime = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
                  const isContact = item.isSafetyContact;

                  let summaryText = "";
                  if (isContact) {
                    summaryText = item.safetyContactText.length > 50 
                      ? item.safetyContactText.substring(0, 50) + "..." 
                      : item.safetyContactText;
                  } else {
                    const counts = item.answeredItems.reduce((acc, current) => {
                      if (current.status === "safe") acc.safe += 1;
                      else if (current.status === "unsafe_condition") acc.unsafeCond += 1;
                      else if (current.status === "unsafe_action") acc.unsafeAct += 1;
                      return acc;
                    }, { safe: 0, unsafeCond: 0, unsafeAct: 0 });
                    
                    summaryText = `ปลอดภัย: ${counts.safe} | ไม่ปลอดภัย: ${counts.unsafeCond + counts.unsafeAct}`;
                  }

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        background: "#fff",
                        border: `1px solid ${T.line}`,
                        borderRadius: 14,
                        padding: "12px 16px",
                        fontSize: 13.5
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderBottom: `1px solid ${T.line}`, paddingBottom: 6 }}>
                        <span style={{ fontWeight: 800, color: T.accentDeep }}>{displayDate} <span style={{ fontSize: 11, color: T.sub }}>{displayTime}</span></span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: isContact ? "#7c2d12" : "#14532d",
                          background: isContact ? "#ffedd5" : "#dcfce7",
                          padding: "2px 8px",
                          borderRadius: 6
                        }}>
                          {item.activityLabel}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div><strong style={{ color: T.sub }}>สถานที่:</strong> {item.locationName} <span style={{ fontSize: 11, color: T.sub }}>({item.locationTag})</span></div>
                        <div><strong style={{ color: T.sub }}>ผู้ทำ:</strong> {item.actorName || "-"} <span style={{ fontSize: 11, color: T.sub }}>({[item.actorCode, item.actorEmail].filter(Boolean).join(" · ") || "-"})</span></div>
                        <div><strong style={{ color: T.sub }}>ประเภท:</strong> {LOCATION_TYPE_LABELS[item.locType] || item.locType}</div>
                        <div style={{ marginTop: 4, background: "#fcfcfb", padding: "6px 10px", borderRadius: 8, width: "100%", border: `1px solid ${T.line}` }}>
                          <strong style={{ color: T.sub, display: "block", fontSize: 11 }}>{isContact ? "ข้อความสื่อสาร:" : "ผลการตรวจ:"}</strong>
                          <span style={{ fontSize: 13, color: T.ink }}>{summaryText}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.line}` }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSub(item)}
                          style={{
                            ...buttonGhostStyle,
                            height: 30,
                            borderRadius: 6,
                            fontSize: 12,
                            padding: "0 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <Eye size={12} />
                          <span>ดูรายละเอียด</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Submission Detail Modal */}
      <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
        <DialogContent showCloseButton={false} className="safety-admin-form-popup z-[1000] p-0 sm:max-w-[640px]">
          {selectedSub ? (
          <div
            style={{
              width: "min(100%, 640px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.line}`, paddingBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.accentDeep, textTransform: "uppercase" }}>SUBMISSION DETAIL</div>
                <div style={{ fontSize: 20, fontWeight: 950, color: T.ink }}>รายละเอียดรายงานความปลอดภัย</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                style={{
                  ...buttonGhostStyle,
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  padding: 0,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Metadata Card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--brand-soft)", padding: 14, borderRadius: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 800 }}>กิจกรรม</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{selectedSub.activityLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 800 }}>วันที่ตรวจ</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{selectedSub.date}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 800 }}>สถานที่ / รหัส</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{selectedSub.locationName} ({selectedSub.locationTag})</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 800 }}>ผู้ทำกิจกรรม</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{selectedSub.actorName || "-"}</div>
                <div style={{ fontSize: 12, color: T.sub }}>
                  {[selectedSub.actorCode, selectedSub.actorEmail].filter(Boolean).join(" · ") || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 800 }}>เวลาบันทึกระบบ</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date(selectedSub.timestamp).toLocaleString("th-TH")}</div>
              </div>
            </div>

            {/* Content Details */}
            <div style={{ display: "grid", gap: 10 }}>
              {selectedSub.isSafetyContact ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>ข้อความการสนทนา Safety Contact</span>
                  <div
                    style={{
                      background: "#fff",
                      border: `1px solid ${T.line}`,
                      borderRadius: 14,
                      padding: 16,
                      fontSize: 14,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      color: T.ink
                    }}
                  >
                    {selectedSub.safetyContactText || "ไม่มีการบันทึกข้อความ"}
                  </div>

                  {selectedSub.metadata?.photos && selectedSub.metadata.photos.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      <span style={fieldLabelStyle}>รูปภาพแนบ ({selectedSub.metadata.photos.length})</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {selectedSub.metadata.photos.map((photoUrl, pIdx) => (
                          <a
                            key={pIdx}
                            href={photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "1px solid rgba(0,0,0,0.08)",
                              display: "inline-block",
                            }}
                          >
                            <img
                              src={photoUrl}
                              alt={`Evidence ${pIdx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  <span style={fieldLabelStyle}>ผลการประเมินรายข้อ</span>
                  <div style={{ display: "grid", gap: 8 }}>
                    {selectedSub.answeredItems.map((item, idx) => {
                      const isTextBox = item.status === "text";
                      const meta = isTextBox
                        ? { label: "ตอบแล้ว", color: T.ink, bg: "#fdfdfb", border: T.lineStrong }
                        : statusMeta(item.status);

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: meta.bg,
                            border: `1px solid ${meta.border}`,
                            borderRadius: 12,
                            padding: "10px 14px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 800, fontSize: 13.5 }}>ข้อ {idx + 1}: {item.title}</span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: meta.color }}>
                              {meta.label}
                            </span>
                          </div>
                          {item.note && (
                            <div style={{ fontSize: 12.5, marginTop: 4, color: T.sub, borderTop: `1px dashed ${T.line}`, paddingTop: 4 }}>
                              <strong style={{ color: T.sub }}>{isTextBox ? "คำตอบ: " : "หมายเหตุ: "}</strong>{item.note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
