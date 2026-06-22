// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/app-navigation";
import {
  ArrowLeft,
  Search,
  X,
  Download,
  Upload,
  Pencil,
  Trash2
} from "lucide-react";
import * as XLSX from "xlsx";
import { Combobox } from "@/components/ui/combobox";

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

const REPORT_DEFAULT_PROFILE = {
  pms: "",
  name: "",
  email: "",
};

const REPORT_MONTH_OPTIONS = [
  { value: "all", label: "ทุกเดือน" },
  { value: "1", label: "มกราคม" },
  { value: "2", label: "กุมภาพันธ์" },
  { value: "3", label: "มีนาคม" },
  { value: "4", label: "เมษายน" },
  { value: "5", label: "พฤษภาคม" },
  { value: "6", label: "มิถุนายน" },
  { value: "7", label: "กรกฎาคม" },
  { value: "8", label: "สิงหาคม" },
  { value: "9", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

const REPORT_ACTIVITY_OPTIONS = [
  { value: "all", label: "ทุกกิจกรรม" },
  { value: "Safety_Observation/Line_Walk", label: "Safety Observation / Line Walk" },
  { value: "Safety_Contact", label: "Safety Contact" },
];

const REPORT_EXPORT_HEADERS = ["Status", "Linewalk ID", "Ref ID", "Create Date", "Username", "Full Name", "Email"];

function toNumberOrFallback(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeReportActivity(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "Safety_Observation/Line_Walk";
  if (text.includes("contact")) return "Safety_Contact";
  return "Safety_Observation/Line_Walk";
}

function normalizeReportRecord(raw, index = 0, source = "template") {
  if (!raw || typeof raw !== "object") return null;

  const year = toNumberOrFallback(raw.year ?? raw.Year, new Date().getFullYear());
  const month = toNumberOrFallback(raw.month ?? raw.Month ?? raw["เดือน"], 1);

  const rawActivity = raw.activityType ?? raw["กิจกรรม"] ?? raw.Activity;
  const status = normalizeReportActivity(rawActivity) === "Safety_Contact" ? "SafetyContact" : "LineWalk";

  const linewalkId = String(raw.linewalkId ?? raw["Linewalk ID"] ?? raw.pms ?? raw.PMS ?? "").trim();
  const email = String(raw.email ?? raw["E-mail"] ?? raw.Email ?? "").trim();
  const username = String(raw.username ?? raw.Username ?? (email ? email.split("@")[0] : "")).trim();
  const fullName = String(raw.fullName ?? raw["Full Name"] ?? raw.name ?? raw.Name ?? "").trim();

  let refId = String(raw.refId ?? raw["Ref ID"] ?? "").trim();
  if (!refId && status === "LineWalk") {
    const mockRefNum = String((index * 17) % 900 + 100).padStart(3, "0");
    refId = `FC${mockRefNum}`;
  }

  let createDate = String(raw.createDate ?? raw["Create Date"] ?? "").trim();
  if (!createDate) {
    const day = (index % 2 === 0) ? 4 : 13;
    createDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  }

  return {
    id: String(raw.id || `${source}-${index}`),
    status,
    linewalkId,
    pms: linewalkId,
    refId,
    createDate,
    username,
    fullName,
    name: fullName,
    email,
    year,
    month,
    activityType: normalizeReportActivity(rawActivity),
    source,
  };
}

function submissionToReportRecord(submission, index = 0) {
  const fallbackDate = submission?.date || submission?.timestamp || new Date().toISOString();
  const date = new Date(fallbackDate);
  const year = Number.isFinite(date.getTime()) ? date.getFullYear() : new Date().getFullYear();
  const month = Number.isFinite(date.getTime()) ? date.getMonth() + 1 : new Date().getMonth() + 1;

  let createDate = "";
  if (Number.isFinite(date.getTime())) {
    createDate = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  } else {
    createDate = "04/06/2026";
  }

  const isContact = submission?.isSafetyContact || submission?.activityId === "safety-contact";
  const status = isContact ? "SafetyContact" : "LineWalk";

  const linewalkId = String(submission?.pms || REPORT_DEFAULT_PROFILE.pms).trim();
  const email = String(submission?.email || REPORT_DEFAULT_PROFILE.email).trim();
  const username = String(email ? email.split("@")[0] : "").trim();
  const fullName = String(submission?.name || REPORT_DEFAULT_PROFILE.name).trim();
  const refId = isContact ? "" : String(submission?.locationTag || "").trim();

  return {
    id: submission?.id || `submission-${index}`,
    status,
    linewalkId,
    pms: linewalkId,
    refId,
    createDate,
    username,
    fullName,
    name: fullName,
    email,
    year,
    month,
    activityType: isContact ? "Safety_Contact" : "Safety_Observation/Line_Walk",
    source: "submission",
    submissionId: submission?.id || null,
  };
}

function createEditableReportDraft(item) {
  return {
    id: item?.id || "",
    source: item?.source || "template",
    submissionId: item?.submissionId || null,
    linewalkId: item?.linewalkId || "",
    pms: item?.linewalkId || "",
    year: String(item?.year || ""),
    month: String(item?.month || ""),
    fullName: item?.fullName || "",
    name: item?.fullName || "",
    email: item?.email || "",
    activityType: item?.activityType || "Safety_Observation/Line_Walk",
    refId: item?.refId || "",
    createDate: item?.createDate || "",
  };
}

export default function SafetyAdminExportReport() {
  const navigate = useNavigate();
  const [width, setWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;

  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportYearFilter, setReportYearFilter] = useState("all");
  const [reportMonthFilter, setReportMonthFilter] = useState("all");
  const [reportActivityFilter, setReportActivityFilter] = useState("all");

  const [submissions, setSubmissions] = useState([]);

  // Prefer real DB submissions (safety_activities). The richer report fields
  // (pms/year/month/name/email/activityType + answers) are carried in the
  // activity `notes` JSON written at submission time, so nothing is lost.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/safety-effort/submissions?pageSize=500", { credentials: "include", cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json().catch(() => null);
        const items = payload?.data?.items;
        if (Array.isArray(items) && !cancelled) setSubmissions(items);
      } catch { if (!cancelled) setSubmissions([]); }
    })();
    return () => { cancelled = true; };
  }, []);

  const [uploadedReportRecords, setUploadedReportRecords] = useState([]);
  
  const [editingReport, setEditingReport] = useState(null);

  const submissionReportRecords = useMemo(
    () => submissions.map((submission, index) => submissionToReportRecord(submission, index)).filter(Boolean),
    [submissions]
  );

  const mergedReportRecords = useMemo(
    () => [...submissionReportRecords, ...uploadedReportRecords],
    [submissionReportRecords, uploadedReportRecords]
  );

  const reportYearOptions = useMemo(() => {
    const years = Array.from(new Set(mergedReportRecords.map((item) => item.year))).sort((a, b) => b - a);
    return ["all", ...years.map(String)];
  }, [mergedReportRecords]);

  const filteredReportRecords = useMemo(() => {
    const term = reportSearchQuery.trim().toLowerCase();
    return mergedReportRecords.filter((item) => {
      const matchesSearch =
        !term ||
        item.linewalkId.toLowerCase().includes(term) ||
        item.fullName.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.username.toLowerCase().includes(term);
      const matchesYear = reportYearFilter === "all" || String(item.year) === reportYearFilter;
      const matchesMonth = reportMonthFilter === "all" || String(item.month) === reportMonthFilter;
      const matchesActivity = reportActivityFilter === "all" || item.activityType === reportActivityFilter;
      return matchesSearch && matchesYear && matchesMonth && matchesActivity;
    });
  }, [mergedReportRecords, reportSearchQuery, reportYearFilter, reportMonthFilter, reportActivityFilter]);

  const handleImportReportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      const imported = rows
        .map((row, index) => normalizeReportRecord(row, index, "upload"))
        .filter((row) => row && (row.pms || row.name || row.email));

      setUploadedReportRecords(imported);
      window.alert(`นำเข้าข้อมูลรายงานสำเร็จจำนวน ${imported.length} รายการ`);
    } catch (error) {
      console.error("Failed to import report records", error);
      window.alert("ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์อีกครั้ง");
    } finally {
      event.target.value = "";
    }
  };

  const handleExportReports = () => {
    const rows = filteredReportRecords.map((item) => ({
      Status: item.status,
      "Linewalk ID": item.linewalkId,
      "Ref ID": item.refId,
      "Create Date": item.createDate,
      Username: item.username,
      "Full Name": item.fullName,
      Email: item.email,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: REPORT_EXPORT_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluation Report");
    XLSX.writeFile(workbook, `evaluation-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleOpenEditReport = (item) => {
    setEditingReport(createEditableReportDraft(item));
  };

  const handleSaveEditedReport = async () => {
    if (!editingReport) return;

    const normalizedRecord = {
      linewalkId: String(editingReport.linewalkId || "").trim(),
      pms: String(editingReport.linewalkId || "").trim(),
      year: toNumberOrFallback(editingReport.year, new Date().getFullYear()),
      month: toNumberOrFallback(editingReport.month, 1),
      fullName: String(editingReport.fullName || "").trim(),
      name: String(editingReport.fullName || "").trim(),
      email: String(editingReport.email || "").trim(),
      activityType: normalizeReportActivity(editingReport.activityType),
      status: normalizeReportActivity(editingReport.activityType) === "Safety_Contact" ? "SafetyContact" : "LineWalk",
      refId: String(editingReport.refId || "").trim(),
      createDate: String(editingReport.createDate || "").trim(),
    };

    if (editingReport.source === "submission" && editingReport.submissionId) {
      const response = await fetch(`/api/safety-effort/submissions/${editingReport.submissionId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pms: normalizedRecord.pms,
          name: normalizedRecord.name,
          email: normalizedRecord.email,
          activityType: normalizedRecord.activityType === "Safety_Contact" ? "SAFETY_CONTACT" : "LINE_WALK",
          date: normalizedRecord.createDate || null,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        window.alert("บันทึกการแก้ไขไม่สำเร็จ");
        return;
      }
      const next = submissions.map((submission) =>
        String(submission.id) === String(editingReport.submissionId)
          ? { ...submission, ...normalizedRecord }
          : submission
      );
      setSubmissions(next);
    } else if (editingReport.source === "upload") {
      setUploadedReportRecords((prev) =>
        prev.map((record) =>
          record.id === editingReport.id ? { ...record, ...normalizedRecord } : record
        )
      );
    }

    setEditingReport(null);
  };

  const handleDeleteSubmission = async (submissionId) => {
    const response = await fetch(`/api/safety-effort/submissions/${submissionId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !payload.data?.deleted) {
      window.alert("ลบรายการไม่สำเร็จ");
      return;
    }
    setSubmissions((current) => current.filter((submission) => String(submission.id) !== String(submissionId)));
  };

  const handleDeleteReportRecord = async (item) => {
    if (typeof window !== "undefined" && !window.confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
      return;
    }

    if (item.source === "submission" && item.submissionId) {
      await handleDeleteSubmission(item.submissionId);
    } else if (item.source === "upload") {
      setUploadedReportRecords((prev) => prev.filter((record) => record.id !== item.id));
    }
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
      <div
        style={{
          flex: isMobile ? "none" : 1,
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 12 : 16,
          padding: isMobile ? "12px 14px" : "16px 20px",
          minHeight: isMobile ? undefined : 0,
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate("/safety-admin")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                color: T.sub,
                padding: 4,
                borderRadius: "50%",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: T.ink, margin: 0 }}>ส่งออกรายงาน (Export Report)</h1>
              <p style={{ fontSize: 12.5, color: T.sub, margin: "2px 0 0" }}>
                ดาวน์โหลด ค้นหา แก้ไข และนำเข้าไฟล์รายงานประเมินความปลอดภัย
              </p>
            </div>
          </div>
        </div>

        {/* Content Box */}
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
            overflow: "hidden",
          }}
        >
          {/* Action Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderBottom: `1px solid ${T.line}`,
              paddingBottom: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: T.accentDeep }}>จัดการส่งออกข้อมูลรายงาน</div>
              <div style={{ fontSize: 12.5, color: T.sub }}>
                จัดการและดาวน์โหลดไฟล์รายงานแบบประเมินสำหรับ Linewalk ID
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <label
                style={{
                  ...buttonGhostStyle,
                  height: 38,
                  borderRadius: 10,
                  fontSize: 12.5,
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Upload size={14} />
                <span>อัปโหลดรายงาน (Excel)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportReportFile}
                  style={{ display: "none" }}
                />
              </label>
              <button
                type="button"
                onClick={handleExportReports}
                style={{
                  ...buttonPrimaryStyle,
                  height: 38,
                  borderRadius: 10,
                  fontSize: 12.5,
                  padding: "0 14px",
                  boxShadow: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Download size={14} />
                <span>ดาวน์โหลดรายงาน (Excel)</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ position: "relative", width: isMobile ? "100%" : 240 }}>
              <input
                type="text"
                placeholder="ค้นหา Linewalk ID / ชื่อ / E-mail..."
                value={reportSearchQuery}
                onChange={(event) => setReportSearchQuery(event.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: 38,
                  borderRadius: 10,
                  fontSize: 13,
                  paddingLeft: 34,
                }}
              />
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: T.sub,
                }}
              />
            </div>
            <Combobox
              value={reportYearFilter}
              onValueChange={setReportYearFilter}
              aria-label="กรองปี"
              searchPlaceholder="ค้นหาปี"
              style={{ width: isMobile ? "100%" : 140 }}
              options={reportYearOptions.map((year) => ({
                value: year,
                label: year === "all" ? "ทุกปี" : year,
              }))}
            />
            <Combobox
              value={reportMonthFilter}
              onValueChange={setReportMonthFilter}
              aria-label="กรองเดือน"
              searchPlaceholder="ค้นหาเดือน"
              style={{ width: isMobile ? "100%" : 160 }}
              options={REPORT_MONTH_OPTIONS.map((month) => ({
                value: month.value,
                label: month.label,
              }))}
            />
            <Combobox
              value={reportActivityFilter}
              onValueChange={setReportActivityFilter}
              aria-label="กรองกิจกรรม"
              searchPlaceholder="ค้นหากิจกรรม"
              style={{ width: isMobile ? "100%" : 240 }}
              options={REPORT_ACTIVITY_OPTIONS.map((activity) => ({
                value: activity.value,
                label: activity.label,
              }))}
            />
          </div>

          {/* Table / Cards View */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {filteredReportRecords.length === 0 ? (
              <div
                style={{
                  border: `1px dashed ${T.lineStrong}`,
                  borderRadius: 18,
                  padding: 32,
                  textAlign: "center",
                  color: T.sub,
                  fontSize: 14,
                }}
              >
                ไม่พบข้อมูลรายงานตามเงื่อนไขที่เลือก
              </div>
            ) : !isMobile ? (
              <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 12 }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    textAlign: "left",
                    fontSize: "13.5px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "color-mix(in srgb, var(--brand-accent) 8%, transparent)",
                        borderBottom: `2px solid ${T.line}`,
                      }}
                    >
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 140 }}>
                        Status
                      </th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 120 }}>
                        Linewalk ID
                      </th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 120 }}>
                        Ref ID
                      </th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 140 }}>
                        Create Date
                      </th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 150 }}>
                        Username
                      </th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, width: 200 }}>
                        Full Name
                      </th>
                      <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>
                        Email
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontWeight: 800,
                          color: T.sub,
                          width: 100,
                          textAlign: "center",
                        }}
                      >
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportRecords.map((item, idx) => {
                      const isContact = item.status === "SafetyContact";
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom:
                              idx < filteredReportRecords.length - 1
                                ? `1px solid ${T.line}`
                                : "none",
                            transition: "background 0.15s",
                          }}
                        >
                          <td style={{ padding: "8px 16px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: isContact ? "#7c2d12" : "#14532d",
                                background: isContact ? "#ffedd5" : "#dcfce7",
                                padding: "3px 8px",
                                borderRadius: 999,
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: "8px 16px", fontWeight: 700 }}>
                            {item.linewalkId || "-"}
                          </td>
                          <td style={{ padding: "8px 16px" }}>{item.refId || "-"}</td>
                          <td style={{ padding: "8px 16px" }}>{item.createDate || "-"}</td>
                          <td style={{ padding: "8px 16px" }}>{item.username || "-"}</td>
                          <td style={{ padding: "8px 16px", fontWeight: 700 }}>
                            {item.fullName || "-"}
                          </td>
                          <td style={{ padding: "8px 16px" }}>{item.email || "-"}</td>
                          <td style={{ padding: "8px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditReport(item)}
                                style={{
                                  ...buttonGhostStyle,
                                  width: 30,
                                  height: 30,
                                  borderRadius: 6,
                                  padding: 0,
                                  display: "grid",
                                  placeItems: "center",
                                }}
                                title="แก้ไข"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReportRecord(item)}
                                style={{
                                  ...buttonDangerStyle,
                                  width: 30,
                                  height: 30,
                                  borderRadius: 6,
                                  padding: 0,
                                  display: "grid",
                                  placeItems: "center",
                                }}
                                title="ลบ"
                              >
                                <Trash2 size={13} />
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
                {filteredReportRecords.map((item) => (
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
                      fontSize: 13.5,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        borderBottom: `1px solid ${T.line}`,
                        paddingBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 900, color: T.accentDeep }}>
                        {item.fullName || "-"}
                      </div>
                      <div style={{ fontSize: 11.5, color: T.sub }}>
                        {item.linewalkId || "-"}
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div>
                        <strong style={{ color: T.sub }}>สถานะ:</strong> {item.status}
                      </div>
                      {item.refId && (
                        <div>
                          <strong style={{ color: T.sub }}>Ref ID:</strong> {item.refId}
                        </div>
                      )}
                      <div>
                        <strong style={{ color: T.sub }}>Create Date:</strong> {item.createDate}
                      </div>
                      <div>
                        <strong style={{ color: T.sub }}>Username:</strong> {item.username}
                      </div>
                      <div>
                        <strong style={{ color: T.sub }}>E-mail:</strong> {item.email || "-"}
                      </div>
                      <div>
                        <strong style={{ color: T.sub }}>ที่มา:</strong>{" "}
                        {item.source === "submission"
                          ? "รายการที่บันทึก"
                          : item.source === "upload"
                          ? "ไฟล์อัปโหลด"
                          : "ข้อมูลภายนอก"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: 4,
                        paddingTop: 8,
                        borderTop: `1px solid ${T.line}`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenEditReport(item)}
                        style={{
                          ...buttonGhostStyle,
                          height: 32,
                          borderRadius: 8,
                          fontSize: 12,
                          padding: "0 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Pencil size={12} />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReportRecord(item)}
                        style={{
                          ...buttonDangerStyle,
                          height: 32,
                          borderRadius: 8,
                          fontSize: 12,
                          padding: "0 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Trash2 size={12} />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing Modal */}
      {editingReport ? (
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
              width: "min(100%, 560px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: T.accentDeep,
                    textTransform: "uppercase",
                  }}
                >
                  REPORT EDITOR
                </div>
                <div style={{ fontSize: 20, fontWeight: 950, color: T.ink }}>
                  แก้ไขข้อมูลรายงานแบบประเมิน
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                style={{
                  ...buttonGhostStyle,
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  padding: 0,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>Linewalk ID</span>
                <input
                  value={editingReport.linewalkId}
                  onChange={(event) =>
                    setEditingReport((prev) => ({
                      ...prev,
                      linewalkId: event.target.value,
                      pms: event.target.value,
                    }))
                  }
                  style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
                />
              </label>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>Year</span>
                <input
                  type="number"
                  value={editingReport.year}
                  onChange={(event) =>
                    setEditingReport((prev) => ({ ...prev, year: event.target.value }))
                  }
                  style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
                />
              </label>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>เดือน</span>
                <Combobox
                  value={editingReport.month}
                  onValueChange={(v) => setEditingReport((prev) => ({ ...prev, month: v }))}
                  aria-label="เดือน"
                  searchPlaceholder="ค้นหาเดือน"
                  style={{ width: "100%" }}
                  options={REPORT_MONTH_OPTIONS.filter((month) => month.value !== "all").map(
                    (month) => ({ value: month.value, label: month.label })
                  )}
                />
              </label>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>กิจกรรม</span>
                <Combobox
                  value={editingReport.activityType}
                  onValueChange={(v) =>
                    setEditingReport((prev) => ({ ...prev, activityType: v }))
                  }
                  aria-label="กิจกรรม"
                  searchPlaceholder="ค้นหากิจกรรม"
                  style={{ width: "100%" }}
                  options={REPORT_ACTIVITY_OPTIONS.filter(
                    (activity) => activity.value !== "all"
                  ).map((activity) => ({ value: activity.value, label: activity.label }))}
                />
              </label>
            </div>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Full Name (ชื่อ - นามสกุล)</span>
              <input
                value={editingReport.fullName}
                onChange={(event) =>
                  setEditingReport((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                    name: event.target.value,
                  }))
                }
                style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>E-mail</span>
              <input
                value={editingReport.email}
                onChange={(event) =>
                  setEditingReport((prev) => ({ ...prev, email: event.target.value }))
                }
                style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
              />
            </label>

            <div style={{ fontSize: 12.5, color: T.sub }}>
              แหล่งข้อมูล:{" "}
              {editingReport.source === "submission"
                ? "รายการที่บันทึกในระบบ"
                : editingReport.source === "upload"
                ? "ไฟล์ Excel ที่อัปโหลด"
                : "ข้อมูลภายนอก"}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                style={{ ...buttonGhostStyle, height: 40, borderRadius: 10, fontSize: 13 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEditedReport}
                style={{
                  ...buttonPrimaryStyle,
                  height: 40,
                  borderRadius: 10,
                  fontSize: 13,
                  background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)`,
                  boxShadow: "none",
                }}
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
