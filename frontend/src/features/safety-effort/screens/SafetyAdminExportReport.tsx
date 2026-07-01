// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Upload,
  Pencil,
  Trash2
} from "lucide-react";
import * as XLSX from "xlsx";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import { AppDialogBody, AppDialogContent, AppDialogDescription, AppDialogSectionFooter, AppDialogSectionHeader, AppDialogTitle } from "@/components/ui/app-dialog";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";

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
    const generatedRefNum = String((index * 17) % 900 + 100).padStart(3, "0");
    refId = `FC${generatedRefNum}`;
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
  const [exportingReports, setExportingReports] = useState(false);

  // Prefer real DB submissions (safety_activities). The richer report fields
  // (pms/year/month/name/email/activityType + answers) are carried in the
  // activity `notes` JSON written at submission time, so nothing is lost.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/safety-effort/submissions?pageSize=100", { credentials: "include", cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const payload = await res.json().catch(() => null);
        const items = payload?.data?.items;
        if (Array.isArray(items) && !cancelled) {
          setSubmissions(items);
        }
      } catch {
        if (!cancelled) {
          setSubmissions([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [uploadedReportRecords, setUploadedReportRecords] = useState([]);

  const [editingReport, setEditingReport] = useState(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState(null);

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

  const handleExportReports = async () => {
    const rows = filteredReportRecords.map((item) => ({
      Status: item.status,
      "Linewalk ID": item.linewalkId,
      "Ref ID": item.refId,
      "Create Date": item.createDate,
      Username: item.username,
      "Full Name": item.fullName,
      Email: item.email,
    }));

    if (!rows.length) {
      window.alert("ไม่มีข้อมูลสำหรับส่งออกตามเงื่อนไขที่เลือก");
      return;
    }

    setExportingReports(true);
    const fileName = `evaluation-report-${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobType: "SAFETY_EFFORT_REPORT_EXPORT",
          fileName,
          filters: {
            search: reportSearchQuery,
            year: reportYearFilter,
            month: reportMonthFilter,
            activity: reportActivityFilter,
          },
          rows,
        }),
      });
      const payload = await response.json().catch(() => null);
      const exportId = payload?.data?.export?.id;
      if (!response.ok || !payload?.ok || !exportId) {
        throw new Error(payload?.error || "export_failed");
      }

      const downloadResponse = await fetch(`/api/exports/${exportId}/download`, {
        credentials: "include",
      });
      if (!downloadResponse.ok) throw new Error("download_failed");
      const blob = await downloadResponse.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report job", error);
      window.alert("ส่งออกรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setExportingReports(false);
    }
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
    } else if (editingReport.source === "upload" || editingReport.source === "demo") {
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

  const handleDeleteReportRecord = (item) => {
    setDeleteReportTarget(item);
  };

  const confirmDeleteReportRecord = async () => {
    if (!deleteReportTarget) return;

    if (deleteReportTarget.source === "submission" && deleteReportTarget.submissionId) {
      await handleDeleteSubmission(deleteReportTarget.submissionId);
    } else if (deleteReportTarget.source === "upload" || deleteReportTarget.source === "demo") {
      setUploadedReportRecords((prev) => prev.filter((record) => record.id !== deleteReportTarget.id));
    }
    setDeleteReportTarget(null);
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
        {/* Hero */}
        <div style={{ flexShrink: 0 }}>
          <SafetyCultureHero
            eyebrow="SAFETY EFFORT ADMIN"
            title={<>ส่งออกรายงาน</>}
            description="ดาวน์โหลด ค้นหา แก้ไข และนำเข้าไฟล์รายงานประเมินความปลอดภัย"
            variant="community"
            backgroundImage="/images/heroes/Safety-Culture-Admin-Awareness1.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 32%, rgba(210,235,255,.10) 56%, rgba(210,235,255,0) 74%)"
          />
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
                  height: 36,
                  borderRadius: 10,
                  fontSize: 12.5,
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  background: "#fff",
                  border: `1px solid ${T.lineStrong}`,
                  fontWeight: 800,
                  color: T.ink,
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
              <Button
                type="button"
                variant="brand"
                size="lg"
                onClick={handleExportReports}
                disabled={exportingReports}
              >
                <Download size={14} />
                <span>{exportingReports ? "กำลังสร้างไฟล์..." : "ดาวน์โหลดรายงาน (CSV)"}</span>
              </Button>
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
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-xs"
                                onClick={() => handleOpenEditReport(item)}
                                title="แก้ไข"
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon-xs"
                                onClick={() => handleDeleteReportRecord(item)}
                                title="ลบ"
                              >
                                <Trash2 size={13} />
                              </Button>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={() => handleOpenEditReport(item)}
                      >
                        <Pencil size={12} />
                        <span>แก้ไข</span>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="default"
                        onClick={() => handleDeleteReportRecord(item)}
                      >
                        <Trash2 size={12} />
                        <span>ลบ</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing Modal */}
      <Dialog open={!!editingReport} onOpenChange={(open) => !open && setEditingReport(null)}>
        <AppDialogContent size="md" className="z-[1000] max-w-[560px]">
          {editingReport ? (
          <>
            <AppDialogSectionHeader className="border-[#d7e6f6] bg-[linear-gradient(135deg,#ffffff_0%,#f4f9ff_56%,#eaf4ff_100%)]">
              <AppDialogTitle className="text-[#0b3572]">
                แก้ไขข้อมูลรายงานแบบประเมิน
              </AppDialogTitle>
              <AppDialogDescription>
                ปรับข้อมูลรายงาน แล้วบันทึกกลับเข้า dashboard
              </AppDialogDescription>
            </AppDialogSectionHeader>

            <AppDialogBody className="gap-4">
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
            </AppDialogBody>

            <AppDialogSectionFooter>
              <Button
                type="button"
                variant="brand"
                size="lg"
                onClick={handleSaveEditedReport}
                style={{ background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)` }}
              >
                บันทึกการแก้ไข
              </Button>
            </AppDialogSectionFooter>
          </>
          ) : null}
        </AppDialogContent>
      </Dialog>

      <Dialog open={!!deleteReportTarget} onOpenChange={(open) => !open && setDeleteReportTarget(null)}>
        <AppDialogContent size="sm" className="z-[1000] max-w-[460px]">
          <AppDialogSectionHeader className="border-[#d7e6f6] bg-[linear-gradient(135deg,#ffffff_0%,#f4f9ff_56%,#eaf4ff_100%)]">
            <AppDialogTitle className="text-[#0b3572]">
              ยืนยันการลบรายงาน
            </AppDialogTitle>
            <AppDialogDescription>
              ต้องการลบรายการนี้ใช่หรือไม่? รายการที่ลบแล้วจะไม่แสดงในหน้า dashboard และประวัติส่งออกรายงาน
            </AppDialogDescription>
          </AppDialogSectionHeader>
          <AppDialogBody className="gap-3">
            <div style={{ display: "grid", gap: 6, borderRadius: 14, border: "1px solid #d7e6f6", background: "#f8fbff", padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>รายการที่จะลบ</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: T.ink }}>
                {deleteReportTarget?.linewalkId || deleteReportTarget?.refId || "-"}
              </div>
              <div style={{ fontSize: 12.5, color: T.sub }}>
                {[deleteReportTarget?.fullName, deleteReportTarget?.email].filter(Boolean).join(" · ") || "-"}
              </div>
            </div>
          </AppDialogBody>
          <AppDialogSectionFooter>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={confirmDeleteReportRecord}
            >
              ลบรายการ
            </Button>
          </AppDialogSectionFooter>
        </AppDialogContent>
      </Dialog>
    </div>
  );
}
