// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CHECKLISTS,
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_OPTIONS,
  deepCloneChecklists,
  getActiveChecklistCollection,
  restoreChecklistDefaults,
  saveChecklistDraft,
} from "@/features/safety-effort/config/checklists";
import { GripVertical, Eye, Trash2, Search, X, Download, Upload, Check, Settings, ChevronDown, ChevronUp, Pencil, MapPin } from "lucide-react";
import * as XLSX from "xlsx";
import mockExcelRecords from "@/features/safety-effort/config/mock_excel_records.json";
import mockPlantsData from "@/features/safety-effort/config/mock_plants.json";
import mockOfficesData from "@/features/safety-effort/config/mock_offices.json";
import mockSitesData from "@/features/safety-effort/config/mock_sites.json";

const getInitialOffices = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("suea-safety-offices-v1");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // fallback
      }
    }
  }
  
  const initial = [...mockOfficesData];
  const officeNames = ["สำนักงานซีแพคบางซ่อน", "สำนักงานใหญ่บางซื่อ", "สำนักงานระยอง", "สำนักงานเชียงใหม่", "สำนักงานหาดใหญ่", "สำนักงานขอนแก่น", "สำนักงานโคราช"];
  const depts = ["HR", "IT Support", "Accounting & Finance", "Procurement", "Sales & Marketing"];
  
  for (let i = 5; i <= 25; i++) {
    initial.push({
      id: i,
      companyCode: "130",
      companyName: i % 2 === 0 ? "CPAC Group" : "Tiger Safety Co.",
      divisionCode: String(90000200 + i),
      divisionName: i % 2 === 0 ? "CPAC Central" : "RMC North",
      deptCode: String(14320 + i),
      deptName: depts[i % depts.length],
      officeCode: `OFF-GEN-${i}`,
      officeName: officeNames[i % officeNames.length] + ` โซน ${i}`,
      floor: `ชั้น ${i % 10 + 1}`,
      status: i % 3 === 0 ? "INACTIVE" : "ACTIVE",
      lat: i % 5 === 0 ? 13.0 + (i * 0.02) : null,
      lng: i % 5 === 0 ? 100.0 + (i * 0.02) : null
    });
  }
  return initial;
};

const getInitialSites = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("suea-safety-sites-v1");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // fallback
      }
    }
  }
  
  const initial = [...mockSitesData];
  const siteNames = ["Site บางซื่อ", "Site รัชดา", "Site สุขุมวิท", "Site พญาไท", "Site พระราม 9", "Site ลาดพร้าว", "Site ลุมพินี"];
  const customers = ["Sansiri PLC", "AP Thailand", "Land & Houses", "Origin Property", "Asset Wise"];
  const contractors = ["Italian-Thai Development", "CH. Karnchang", "Sino-Thai Engineering", "Unique Engineering"];
  const stages = ["Piling Phase (งานตอกเสาเข็ม)", "Structural Phase (งานโครงสร้าง)", "Finishing Phase (งานตกแต่ง)", "Testing Phase", "Completed (เสร็จสิ้น)"];

  for (let i = 5; i <= 25; i++) {
    initial.push({
      id: i,
      projectCode: `STE-GEN-${i}`,
      projectName: siteNames[i % siteNames.length] + ` เฟส ${i}`,
      customer: customers[i % customers.length],
      contractor: contractors[i % contractors.length],
      stage: stages[i % stages.length],
      status: i % 5 === 0 ? "COMPLETED" : "ACTIVE",
      lat: i % 5 === 0 ? 13.0 + (i * 0.03) : null,
      lng: i % 5 === 0 ? 100.0 + (i * 0.03) : null
    });
  }
  return initial;
};

const getInitialPlants = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("suea-safety-plants-v1");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // fallback
      }
    }
  }
  
  const initial = [...mockPlantsData];
  const factoryNames = ["หนองแค", "แก่งคอย", "พระประแดง", "ท่าหลวง", "บางซื่อ", "สามเสน", "ดอนเมือง", "ปทุมธานี", "รังสิต", "นครปฐม"];
  const divisionNames = ["CPAC Metro", "RMC Metro", "RMC East", "RMC West", "SMART Structure"];
  const statuses = ["CPAC", "ACTIVE", "INACTIVE"];

  for (let i = 13; i <= 65; i++) {
    const plantName = `โรงงาน${factoryNames[i % factoryNames.length]} สาขา ${i}`;
    const divName = divisionNames[i % divisionNames.length];
    const status = statuses[i % statuses.length];
    
    initial.push({
      id: i,
      companyCode: "130",
      companyName: i % 3 === 0 ? "บริษัท ปูนซิเมนต์ไทย (ท่าหลวง) จำกัด" : "No name",
      divisionCode: String(90000000 + i * 7),
      divisionName: divName,
      deptCode: i % 2 === 0 ? String(14300 + i) : "",
      deptName: i % 2 === 0 ? `Metro ${i}` : "",
      secCode: i % 4 === 0 ? String(14400 + i) : "",
      secName: i % 4 === 0 ? `Prod.สาขา ${i}` : "",
      plantCode: String(1300 + i),
      plantName: plantName,
      status: status,
      lat: i % 5 === 0 ? 13.5 + (i * 0.01) : null,
      lng: i % 5 === 0 ? 100.5 + (i * 0.01) : null
    });
  }
  return initial;
};

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

function statusMeta(status) {
  if (status === "safe") return { label: "ปลอดภัย", color: "#1f7a55", bg: "#f0fdf4", border: "#bbf7d0" };
  if (status === "unsafe_condition") return { label: "สภาพไม่ปลอดภัย", color: "#c73a21", bg: "#fef2f2", border: "#fecaca" };
  if (status === "unsafe_action") return { label: "พฤติกรรมไม่ปลอดภัย", color: "#e67e22", bg: "#fff7ed", border: "#ffedd5" };
  return { label: "N/A", color: "var(--c-6f665e)", bg: "#fbfbfa", border: "rgba(31,26,23,0.10)" };
}

function cloneDraft(data) {
  return deepCloneChecklists(data);
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createQuestionId(type, title, existingIds) {
  const base = slugify(title) || `${type}-question`;
  let candidate = `${type}-${base}`;
  let index = 2;
  while (existingIds.has(candidate)) {
    candidate = `${type}-${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function getGuideTitle(question) {
  if (question.guideTitle === false) return null;
  return question.guideTitle || `แนวทางการตรวจ ${question.title.split(":")[0]}`;
}

function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const REPORT_STORAGE_KEYS = {
  submissions: "suea-safety-submissions-v1",
  pms: "suea-safety-user-pms",
  name: "suea-safety-user-name",
  email: "suea-safety-user-email",
};

const REPORT_DEFAULT_PROFILE = {
  pms: "24518",
  name: "ศศิธร จรุงจรรยาพงศ์",
  email: "SASITOJA@SCG.COM",
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

const REPORT_EXPORT_HEADERS = ["PMS", "Year", "เดือน", "Name", "E-mail", "กิจกรรม"];

function readStoredProfile() {
  if (typeof window === "undefined") {
    return { ...REPORT_DEFAULT_PROFILE };
  }

  return {
    pms: localStorage.getItem(REPORT_STORAGE_KEYS.pms) || REPORT_DEFAULT_PROFILE.pms,
    name: localStorage.getItem(REPORT_STORAGE_KEYS.name) || REPORT_DEFAULT_PROFILE.name,
    email: localStorage.getItem(REPORT_STORAGE_KEYS.email) || REPORT_DEFAULT_PROFILE.email,
  };
}

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

  return {
    id: String(raw.id || `${source}-${index}`),
    pms: String(raw.pms ?? raw.PMS ?? "").trim(),
    year,
    month,
    name: String(raw.name ?? raw.Name ?? "").trim(),
    email: String(raw.email ?? raw["E-mail"] ?? raw.Email ?? "").trim(),
    activityType: normalizeReportActivity(raw.activityType ?? raw["กิจกรรม"] ?? raw.Activity),
    source,
  };
}

function submissionToReportRecord(submission, index = 0) {
  const fallbackDate = submission?.date || submission?.timestamp || new Date().toISOString();
  const date = new Date(fallbackDate);
  const year = Number.isFinite(date.getTime()) ? date.getFullYear() : new Date().getFullYear();
  const month = Number.isFinite(date.getTime()) ? date.getMonth() + 1 : new Date().getMonth() + 1;

  return {
    id: submission?.id || `submission-${index}`,
    pms: String(submission?.pms || REPORT_DEFAULT_PROFILE.pms).trim(),
    year: toNumberOrFallback(submission?.year, year),
    month: toNumberOrFallback(submission?.month, month),
    name: String(submission?.name || REPORT_DEFAULT_PROFILE.name).trim(),
    email: String(submission?.email || REPORT_DEFAULT_PROFILE.email).trim(),
    activityType: normalizeReportActivity(
      submission?.activityType || (submission?.isSafetyContact ? "Safety_Contact" : "Safety_Observation/Line_Walk")
    ),
    source: "submission",
    submissionId: submission?.id || null,
  };
}

function monthLabel(month) {
  return REPORT_MONTH_OPTIONS.find((option) => option.value === String(month))?.label || String(month || "-");
}

function createEditableReportDraft(item) {
  return {
    id: item?.id || "",
    source: item?.source || "template",
    submissionId: item?.submissionId || null,
    pms: item?.pms || "",
    year: String(item?.year || ""),
    month: String(item?.month || ""),
    name: item?.name || "",
    email: item?.email || "",
    activityType: item?.activityType || "Safety_Observation/Line_Walk",
  };
}

function PreviewCard({ question }) {
  const guideTitle = getGuideTitle(question);

  return (
    <div
      style={{
        border: `1px solid ${T.line}`,
        borderRadius: 18,
        background: "var(--brand-surface)",
        padding: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.accentDeep, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Preview
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{question.title || "หัวข้อคำถาม"}</div>
        {guideTitle ? (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>{guideTitle}</div>
        ) : (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>ซ่อน guide title ในหน้าประเมิน</div>
        )}
      </div>

      {question.image && (
        <div style={{ width: "100%", maxHeight: 180, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.line}`, background: "#fff", display: "flex", justifyContent: "center" }}>
          <img src={question.image} alt="Question" style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }} />
        </div>
      )}

      <div style={{ display: "grid", gap: 4 }}>
        {question.guidelines.length && (question.guidelines.length > 1 || question.guidelines[0] !== "") ? (
          question.guidelines.map((line, index) => (
            <div
              key={`${question.id}-preview-${index}`}
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                minHeight: line.trim() === "" ? "1.2em" : "auto",
              }}
            >
              {line}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 14, color: T.sub }}>ยังไม่มีรายละเอียดสำหรับข้อนี้</div>
        )}
      </div>

      {question.format === "text_box" ? (
        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 8, display: "grid", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.sub }}>จำลองรูปแบบการตอบ: แบบ Text Box</div>
          <textarea
            disabled
            placeholder="กรอกคำตอบของคุณที่นี่..."
            style={{
              width: "100%",
              borderRadius: 10,
              border: `1px solid ${T.lineStrong}`,
              background: "#fdfdfb",
              minHeight: 60,
              padding: "10px 12px",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              color: T.sub,
            }}
          />
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 8, display: "grid", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.sub }}>จำลองรูปแบบการตอบ: แบบเดิม (มีตัวเลือก)</div>
          <div style={{ display: "grid", gap: 6 }}>
            {["ปลอดภัย", "สภาพไม่ปลอดภัย", "พฤติกรรมไม่ปลอดภัย"].map((lbl, idx) => (
              <div
                key={idx}
                style={{
                  border: `2px solid ${idx === 0 ? "#22c55e" : idx === 1 ? "#ef4444" : "#f97316"}`,
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: idx === 0 ? "#15803d" : idx === 1 ? "#b91c1c" : "#c2410c",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{lbl}</span>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.15)" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SafetyAdmin() {
  const [draft, setDraft] = useState(() => cloneDraft(getActiveChecklistCollection()));
  const [savedSnapshot, setSavedSnapshot] = useState(() => cloneDraft(getActiveChecklistCollection()));
  const [selectedType, setSelectedType] = useState("factory");
  const [selectedQuestionId, setSelectedQuestionId] = useState(() => getActiveChecklistCollection().factory[0]?.id || "");
  const [query, setQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [tempQuestion, setTempQuestion] = useState(null);
  const [showBackdateLimitModal, setShowBackdateLimitModal] = useState(false);
  const [adminTab, setAdminTab] = useState("questions");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [locTypeFilter, setLocTypeFilter] = useState("all");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportYearFilter, setReportYearFilter] = useState("all");
  const [reportMonthFilter, setReportMonthFilter] = useState("all");
  const [reportActivityFilter, setReportActivityFilter] = useState("all");
  const [uploadedReportRecords, setUploadedReportRecords] = useState([]);
  const [templateReportRecords, setTemplateReportRecords] = useState(() =>
    mockExcelRecords.map((record, index) => normalizeReportRecord(record, index, "template")).filter(Boolean)
  );
  const [editingReport, setEditingReport] = useState(null);
  const [showSenderSettings, setShowSenderSettings] = useState(false);
  const [senderProfile, setSenderProfile] = useState(() => readStoredProfile());
  const [selectedSub, setSelectedSub] = useState(null);

  const [plants, setPlants] = useState(() => getInitialPlants());
  const [offices, setOffices] = useState(() => getInitialOffices());
  const [sites, setSites] = useState(() => getInitialSites());

  const [plantSearchQuery, setPlantSearchQuery] = useState("");
  const [plantPage, setPlantPage] = useState(1);
  const [plantPageSize, setPlantPageSize] = useState(10);
  const [editingPlant, setEditingPlant] = useState(null);
  const [addingPlant, setAddingPlant] = useState(false);
  const [deletePlantId, setDeletePlantId] = useState(null);

  const [plantForm, setPlantForm] = useState({
    companyCode: "130",
    companyName: "",
    divisionCode: "",
    divisionName: "",
    deptCode: "",
    deptName: "",
    secCode: "",
    secName: "",
    plantCode: "",
    plantName: "",
    officeCode: "",
    officeName: "",
    floor: "",
    projectCode: "",
    projectName: "",
    customer: "",
    contractor: "",
    stage: "",
    status: "CPAC",
    lat: "",
    lng: ""
  });

  const savePlants = (newPlants) => {
    setPlants(newPlants);
    if (typeof window !== "undefined") {
      localStorage.setItem("suea-safety-plants-v1", JSON.stringify(newPlants));
    }
  };

  const saveOffices = (newOffices) => {
    setOffices(newOffices);
    if (typeof window !== "undefined") {
      localStorage.setItem("suea-safety-offices-v1", JSON.stringify(newOffices));
    }
  };

  const saveSites = (newSites) => {
    setSites(newSites);
    if (typeof window !== "undefined") {
      localStorage.setItem("suea-safety-sites-v1", JSON.stringify(newSites));
    }
  };

  const handleAddPlant = () => {
    setPlantForm({
      companyCode: "130",
      companyName: "",
      divisionCode: "",
      divisionName: "",
      deptCode: "",
      deptName: "",
      secCode: "",
      secName: "",
      plantCode: "",
      plantName: "",
      officeCode: "",
      officeName: "",
      floor: "",
      projectCode: "",
      projectName: "",
      customer: "",
      contractor: "",
      stage: "",
      status: selectedType === "factory" ? "CPAC" : "ACTIVE",
      lat: "",
      lng: ""
    });
    setAddingPlant(true);
  };

  const handleEditPlant = (item) => {
    setEditingPlant(item);
    if (selectedType === "factory") {
      setPlantForm({
        companyCode: item.companyCode || "",
        companyName: item.companyName || "",
        divisionCode: item.divisionCode || "",
        divisionName: item.divisionName || "",
        deptCode: item.deptCode || "",
        deptName: item.deptName || "",
        secCode: item.secCode || "",
        secName: item.secName || "",
        plantCode: item.plantCode || "",
        plantName: item.plantName || "",
        officeCode: "",
        officeName: "",
        floor: "",
        projectCode: "",
        projectName: "",
        customer: "",
        contractor: "",
        stage: "",
        status: item.status || "CPAC",
        lat: item.lat !== null ? String(item.lat) : "",
        lng: item.lng !== null ? String(item.lng) : ""
      });
    } else if (selectedType === "office") {
      setPlantForm({
        companyCode: item.companyCode || "",
        companyName: item.companyName || "",
        divisionCode: item.divisionCode || "",
        divisionName: item.divisionName || "",
        deptCode: item.deptCode || "",
        deptName: item.deptName || "",
        secCode: "",
        secName: "",
        plantCode: "",
        plantName: "",
        officeCode: item.officeCode || "",
        officeName: item.officeName || "",
        floor: item.floor || "",
        projectCode: "",
        projectName: "",
        customer: "",
        contractor: "",
        stage: "",
        status: item.status || "ACTIVE",
        lat: item.lat !== null ? String(item.lat) : "",
        lng: item.lng !== null ? String(item.lng) : ""
      });
    } else if (selectedType === "site") {
      setPlantForm({
        companyCode: "",
        companyName: "",
        divisionCode: "",
        divisionName: "",
        deptCode: "",
        deptName: "",
        secCode: "",
        secName: "",
        plantCode: "",
        plantName: "",
        officeCode: "",
        officeName: "",
        floor: "",
        projectCode: item.projectCode || "",
        projectName: item.projectName || "",
        customer: item.customer || "",
        contractor: item.contractor || "",
        stage: item.stage || "",
        status: item.status || "ACTIVE",
        lat: item.lat !== null ? String(item.lat) : "",
        lng: item.lng !== null ? String(item.lng) : ""
      });
    }
  };

  const submitAddPlant = () => {
    if (selectedType === "factory") {
      if (!plantForm.plantName || !plantForm.plantCode) {
        window.alert("กรุณากรอกข้อมูลรหัสและชื่อโรงงาน");
        return;
      }
      const maxId = plants.reduce((max, p) => Math.max(max, p.id || 0), 0);
      const newPlant = {
        id: maxId + 1,
        companyCode: plantForm.companyCode,
        companyName: plantForm.companyName || "No name",
        divisionCode: plantForm.divisionCode,
        divisionName: plantForm.divisionName,
        deptCode: plantForm.deptCode,
        deptName: plantForm.deptName,
        secCode: plantForm.secCode,
        secName: plantForm.secName,
        plantCode: plantForm.plantCode,
        plantName: plantForm.plantName,
        status: plantForm.status,
        lat: plantForm.lat ? parseFloat(plantForm.lat) : null,
        lng: plantForm.lng ? parseFloat(plantForm.lng) : null
      };

      savePlants([newPlant, ...plants]);
    } else if (selectedType === "office") {
      if (!plantForm.officeName || !plantForm.officeCode) {
        window.alert("กรุณากรอกข้อมูลรหัสและชื่อสำนักงาน");
        return;
      }
      const maxId = offices.reduce((max, p) => Math.max(max, p.id || 0), 0);
      const newOffice = {
        id: maxId + 1,
        companyCode: plantForm.companyCode,
        companyName: plantForm.companyName || "No name",
        divisionCode: plantForm.divisionCode,
        divisionName: plantForm.divisionName,
        deptCode: plantForm.deptCode,
        deptName: plantForm.deptName,
        officeCode: plantForm.officeCode,
        officeName: plantForm.officeName,
        floor: plantForm.floor || "",
        status: plantForm.status,
        lat: plantForm.lat ? parseFloat(plantForm.lat) : null,
        lng: plantForm.lng ? parseFloat(plantForm.lng) : null
      };

      saveOffices([newOffice, ...offices]);
    } else if (selectedType === "site") {
      if (!plantForm.projectName || !plantForm.projectCode) {
        window.alert("กรุณากรอกข้อมูลรหัสและชื่อโครงการ");
        return;
      }
      const maxId = sites.reduce((max, p) => Math.max(max, p.id || 0), 0);
      const newSite = {
        id: maxId + 1,
        projectCode: plantForm.projectCode,
        projectName: plantForm.projectName,
        customer: plantForm.customer || "",
        contractor: plantForm.contractor || "",
        stage: plantForm.stage || "",
        status: plantForm.status,
        lat: plantForm.lat ? parseFloat(plantForm.lat) : null,
        lng: plantForm.lng ? parseFloat(plantForm.lng) : null
      };

      saveSites([newSite, ...sites]);
    }
    setAddingPlant(false);
  };

  const submitEditPlant = () => {
    if (selectedType === "factory") {
      if (!plantForm.plantName || !plantForm.plantCode) {
        window.alert("กรุณากรอกข้อมูลรหัสและชื่อโรงงาน");
        return;
      }
      const updated = plants.map(p => {
        if (p.id === editingPlant.id) {
          return {
            ...p,
            companyCode: plantForm.companyCode,
            companyName: plantForm.companyName || "No name",
            divisionCode: plantForm.divisionCode,
            divisionName: plantForm.divisionName,
            deptCode: plantForm.deptCode,
            deptName: plantForm.deptName,
            secCode: plantForm.secCode,
            secName: plantForm.secName,
            plantCode: plantForm.plantCode,
            plantName: plantForm.plantName,
            status: plantForm.status,
            lat: plantForm.lat ? parseFloat(plantForm.lat) : null,
            lng: plantForm.lng ? parseFloat(plantForm.lng) : null
          };
        }
        return p;
      });

      savePlants(updated);
    } else if (selectedType === "office") {
      if (!plantForm.officeName || !plantForm.officeCode) {
        window.alert("กรุณากรอกข้อมูลรหัสและชื่อสำนักงาน");
        return;
      }
      const updated = offices.map(p => {
        if (p.id === editingPlant.id) {
          return {
            ...p,
            companyCode: plantForm.companyCode,
            companyName: plantForm.companyName || "No name",
            divisionCode: plantForm.divisionCode,
            divisionName: plantForm.divisionName,
            deptCode: plantForm.deptCode,
            deptName: plantForm.deptName,
            officeCode: plantForm.officeCode,
            officeName: plantForm.officeName,
            floor: plantForm.floor || "",
            status: plantForm.status,
            lat: plantForm.lat ? parseFloat(plantForm.lat) : null,
            lng: plantForm.lng ? parseFloat(plantForm.lng) : null
          };
        }
        return p;
      });

      saveOffices(updated);
    } else if (selectedType === "site") {
      if (!plantForm.projectName || !plantForm.projectCode) {
        window.alert("กรุณากรอกข้อมูลรหัสและชื่อโครงการ");
        return;
      }
      const updated = sites.map(p => {
        if (p.id === editingPlant.id) {
          return {
            ...p,
            projectCode: plantForm.projectCode,
            projectName: plantForm.projectName,
            customer: plantForm.customer || "",
            contractor: plantForm.contractor || "",
            stage: plantForm.stage || "",
            status: plantForm.status,
            lat: plantForm.lat ? parseFloat(plantForm.lat) : null,
            lng: plantForm.lng ? parseFloat(plantForm.lng) : null
          };
        }
        return p;
      });

      saveSites(updated);
    }
    setEditingPlant(null);
  };

  const handleDeletePlant = (id) => {
    setDeletePlantId(id);
  };

  const confirmDeletePlant = () => {
    if (selectedType === "factory") {
      const next = plants.filter(p => p.id !== deletePlantId);
      savePlants(next);
    } else if (selectedType === "office") {
      const next = offices.filter(p => p.id !== deletePlantId);
      saveOffices(next);
    } else if (selectedType === "site") {
      const next = sites.filter(p => p.id !== deletePlantId);
      saveSites(next);
    }
    setDeletePlantId(null);
  };

  const handleImportPlantsFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      
      if (selectedType === "factory") {
        const imported = rows.map((row, index) => {
          const maxId = plants.reduce((max, p) => Math.max(max, p.id || 0), 0);
          return {
            id: maxId + 1 + index,
            companyCode: String(row.companyCode || row["Company Code"] || "130"),
            companyName: String(row.companyName || row["Company Name"] || "No name"),
            divisionCode: String(row.divisionCode || row["Division Code"] || ""),
            divisionName: String(row.divisionName || row["Division Name"] || ""),
            deptCode: String(row.deptCode || row["Dept Code"] || ""),
            deptName: String(row.deptName || row["Dept Name"] || ""),
            secCode: String(row.secCode || row["Sec Code"] || ""),
            secName: String(row.secName || row["Sec Name"] || ""),
            plantCode: String(row.plantCode || row["Plant Code"] || row.Code || ""),
            plantName: String(row.plantName || row["Plant Name"] || row.Plant || ""),
            status: String(row.status || row.Status || "CPAC"),
            lat: row.lat || row.Latitude ? parseFloat(row.lat || row.Latitude) : null,
            lng: row.lng || row.Longitude ? parseFloat(row.lng || row.Longitude) : null
          };
        }).filter(p => p.plantName || p.plantCode);

        savePlants([...imported, ...plants]);
        window.alert(`นำเข้าข้อมูลโรงงานสำเร็จจำนวน ${imported.length} รายการ`);
      } else if (selectedType === "office") {
        const imported = rows.map((row, index) => {
          const maxId = offices.reduce((max, p) => Math.max(max, p.id || 0), 0);
          return {
            id: maxId + 1 + index,
            companyCode: String(row.companyCode || row["Company Code"] || "130"),
            companyName: String(row.companyName || row["Company Name"] || "No name"),
            divisionCode: String(row.divisionCode || row["Division Code"] || ""),
            divisionName: String(row.divisionName || row["Division Name"] || ""),
            deptCode: String(row.deptCode || row["Dept Code"] || ""),
            deptName: String(row.deptName || row["Dept Name"] || ""),
            officeCode: String(row.officeCode || row["Office Code"] || row.Code || ""),
            officeName: String(row.officeName || row["Office Name"] || row.Office || ""),
            floor: String(row.floor || row.Floor || ""),
            status: String(row.status || row.Status || "ACTIVE"),
            lat: row.lat || row.Latitude ? parseFloat(row.lat || row.Latitude) : null,
            lng: row.lng || row.Longitude ? parseFloat(row.lng || row.Longitude) : null
          };
        }).filter(p => p.officeName || p.officeCode);

        saveOffices([...imported, ...offices]);
        window.alert(`นำเข้าข้อมูลสำนักงานสำเร็จจำนวน ${imported.length} รายการ`);
      } else if (selectedType === "site") {
        const imported = rows.map((row, index) => {
          const maxId = sites.reduce((max, p) => Math.max(max, p.id || 0), 0);
          return {
            id: maxId + 1 + index,
            projectCode: String(row.projectCode || row["Project Code"] || row.Code || ""),
            projectName: String(row.projectName || row["Project Name"] || row.Project || row.Site || ""),
            customer: String(row.customer || row.Customer || ""),
            contractor: String(row.contractor || row.Contractor || ""),
            stage: String(row.stage || row.Stage || row.Phase || ""),
            status: String(row.status || row.Status || "ACTIVE"),
            lat: row.lat || row.Latitude ? parseFloat(row.lat || row.Latitude) : null,
            lng: row.lng || row.Longitude ? parseFloat(row.lng || row.Longitude) : null
          };
        }).filter(p => p.projectName || p.projectCode);

        saveSites([...imported, ...sites]);
        window.alert(`นำเข้าข้อมูลไซต์งานสำเร็จจำนวน ${imported.length} รายการ`);
      }
    } catch (error) {
      console.error("Failed to import data", error);
      window.alert("ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์อีกครั้ง");
    } finally {
      event.target.value = "";
    }
  };

  const [submissions, setSubmissions] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(REPORT_STORAGE_KEYS.submissions);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      } else {
        const mockData = [
          {
            id: "sub-mock-1",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            activityId: "line-walk",
            activityLabel: "Line Walk",
            locType: "factory",
            locationName: "โรงงานแก่งคอย",
            locationTag: "FAC-KK-01",
            date: new Date().toISOString().split("T")[0],
            isSafetyContact: false,
            answeredItems: [
              { id: "mixer", title: "Mixer", status: "safe", note: "ระบบล็อคฝาใช้งานได้ดี", photos: [] },
              { id: "skiphoist", title: "Skiphoist", status: "safe", note: "การ์ดกั้นมิดชิด", photos: [] },
              { id: "sand-drag", title: "เครื่องลากหิน-ทราย", status: "unsafe_condition", note: "ป้ายเตือนระวังอันตรายหลุดลอก", photos: [] },
              { id: "motor-pump", title: "MOTOR / ปั๊ม", status: "safe", note: "สายดินเชื่อมต่อเรียบร้อย", photos: [] }
            ]
          },
          {
            id: "sub-mock-2",
            timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            activityId: "safety-contact",
            activityLabel: "Safety Contact",
            locType: "office",
            locationName: "สำนักงานใหญ่บางซื่อ",
            locationTag: "OFF-BS-01",
            date: new Date().toISOString().split("T")[0],
            isSafetyContact: true,
            safetyContactText: "พูดคุยรณรงค์กับแผนกจัดซื้อเรื่องการเดินขึ้นลงบันไดโดยระมัดระวังไม่ใช้โทรศัพท์มือถือและให้จับราวบันไดทุกครั้ง พนักงานเข้าใจและยินดีปฏิบัติตามแนวทางเพื่อความปลอดภัย"
          },
          {
            id: "sub-mock-3",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            activityId: "line-walk",
            activityLabel: "Line Walk",
            locType: "site",
            locationName: "Site พญาไท",
            locationTag: "STE-PT-03",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split("T")[0],
            isSafetyContact: false,
            answeredItems: [
              { id: "site-readiness", title: "ความพร้อมของพื้นที่หน้างาน", status: "safe", note: "พื้นที่เรียบร้อยดี", photos: [] },
              { id: "site-safety", title: "ความปลอดภัยในหน้างาน", status: "unsafe_action", note: "พบคนงานไม่สวมหมวกนิรภัย 1 คน ได้ตักเตือนให้สวมใส่ทันที", photos: [] }
            ]
          }
        ];
        localStorage.setItem(REPORT_STORAGE_KEYS.submissions, JSON.stringify(mockData));
        return mockData;
      }
    }
    return [];
  });

  useEffect(() => {
    if ((adminTab === "submissions" || adminTab === "reports") && typeof window !== "undefined") {
      const stored = localStorage.getItem(REPORT_STORAGE_KEYS.submissions);
      if (stored) {
        try {
          setSubmissions(JSON.parse(stored));
        } catch (e) { }
      }
    }
  }, [adminTab]);

  const handleDeleteSubmission = (id) => {
    const next = submissions.filter(s => s.id !== id);
    setSubmissions(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(REPORT_STORAGE_KEYS.submissions, JSON.stringify(next));
    }
  };
  const [tempBackdateLimit, setTempBackdateLimit] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("safety_backdate_limit") || "5", 10);
    }
    return 5;
  });
  const [allowedMode, setAllowedMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("safety_allowed_mode") || "all";
    }
    return "all";
  });
  const [allowedWeekdays, setAllowedWeekdays] = useState(() => {
  });
  const [newAllowedDate, setNewAllowedDate] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [backdateMode, setBackdateMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("safety_backdate_mode") || "today";
    }
    return "today";
  });

  const handleToggleMode = (mode) => {
    if (mode === "backdate") {
      if (typeof window !== "undefined") {
        setTempBackdateLimit(parseInt(localStorage.getItem("safety_backdate_limit") || "5", 10));
        setAllowedMode(localStorage.getItem("safety_allowed_mode") || "all");
        try {
          setAllowedWeekdays(JSON.parse(localStorage.getItem("safety_allowed_weekdays")) || [0, 1, 2, 3, 4, 5, 6]);
          setAllowedDates(JSON.parse(localStorage.getItem("safety_allowed_dates")) || []);
        } catch (e) { }
      }
      setBackdateMode("backdate");
      setShowBackdateLimitModal(true);
    } else {
      setBackdateMode("today");
      if (typeof window !== "undefined") {
        localStorage.setItem("safety_backdate_mode", "today");
      }
    }
  };

  const handleCancelBackdateModal = () => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("safety_backdate_mode") || "today";
      setBackdateMode(savedMode);
    } else {
      setBackdateMode("today");
    }
    setShowBackdateLimitModal(false);
  };

  const handleSaveBackdateModal = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("safety_backdate_limit", String(tempBackdateLimit));
      localStorage.setItem("safety_allowed_mode", allowedMode);
      localStorage.setItem("safety_allowed_weekdays", JSON.stringify(allowedWeekdays));
      localStorage.setItem("safety_allowed_dates", JSON.stringify(allowedDates));
      localStorage.setItem("safety_backdate_mode", "backdate");
    }
    setBackdateMode("backdate");
    setShowBackdateLimitModal(false);
  };

  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const isMobile = width < 768;
  const [mobileActiveView, setMobileActiveView] = useState("list"); // "list" | "editor"

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const currentList = draft[selectedType];
    if (!currentList.some((item) => item.id === selectedQuestionId)) {
      setSelectedQuestionId(currentList[0]?.id || "");
    }
  }, [draft, selectedQuestionId, selectedType]);

  const currentList = draft[selectedType];
  const filteredList = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return currentList;
    return currentList.filter((item) => item.title.toLowerCase().includes(term) || item.guidelines.some((line) => line.toLowerCase().includes(term)));
  }, [currentList, query]);
  const submissionReportRecords = useMemo(
    () => submissions.map((submission, index) => submissionToReportRecord(submission, index)).filter(Boolean),
    [submissions]
  );
  const mergedReportRecords = useMemo(
    () => [...submissionReportRecords, ...uploadedReportRecords, ...templateReportRecords],
    [submissionReportRecords, templateReportRecords, uploadedReportRecords]
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
        item.pms.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term);
      const matchesYear = reportYearFilter === "all" || String(item.year) === reportYearFilter;
      const matchesMonth = reportMonthFilter === "all" || String(item.month) === reportMonthFilter;
      const matchesActivity = reportActivityFilter === "all" || item.activityType === reportActivityFilter;
      return matchesSearch && matchesYear && matchesMonth && matchesActivity;
    });
  }, [mergedReportRecords, reportSearchQuery, reportYearFilter, reportMonthFilter, reportActivityFilter]);

  const filteredPlants = useMemo(() => {
    const term = plantSearchQuery.trim().toLowerCase();
    if (selectedType === "factory") {
      if (!term) return plants;
      return plants.filter((p) => {
        return (
          String(p.id).includes(term) ||
          (p.companyCode && p.companyCode.toLowerCase().includes(term)) ||
          (p.companyName && p.companyName.toLowerCase().includes(term)) ||
          (p.divisionCode && p.divisionCode.toLowerCase().includes(term)) ||
          (p.divisionName && p.divisionName.toLowerCase().includes(term)) ||
          (p.deptCode && p.deptCode.toLowerCase().includes(term)) ||
          (p.deptName && p.deptName.toLowerCase().includes(term)) ||
          (p.secCode && p.secCode.toLowerCase().includes(term)) ||
          (p.secName && p.secName.toLowerCase().includes(term)) ||
          (p.plantCode && p.plantCode.toLowerCase().includes(term)) ||
          (p.plantName && p.plantName.toLowerCase().includes(term))
        );
      });
    } else if (selectedType === "office") {
      if (!term) return offices;
      return offices.filter((p) => {
        return (
          String(p.id).includes(term) ||
          (p.companyCode && p.companyCode.toLowerCase().includes(term)) ||
          (p.companyName && p.companyName.toLowerCase().includes(term)) ||
          (p.divisionCode && p.divisionCode.toLowerCase().includes(term)) ||
          (p.divisionName && p.divisionName.toLowerCase().includes(term)) ||
          (p.deptCode && p.deptCode.toLowerCase().includes(term)) ||
          (p.deptName && p.deptName.toLowerCase().includes(term)) ||
          (p.officeCode && p.officeCode.toLowerCase().includes(term)) ||
          (p.officeName && p.officeName.toLowerCase().includes(term)) ||
          (p.floor && p.floor.toLowerCase().includes(term))
        );
      });
    } else {
      if (!term) return sites;
      return sites.filter((p) => {
        return (
          String(p.id).includes(term) ||
          (p.projectCode && p.projectCode.toLowerCase().includes(term)) ||
          (p.projectName && p.projectName.toLowerCase().includes(term)) ||
          (p.customer && p.customer.toLowerCase().includes(term)) ||
          (p.contractor && p.contractor.toLowerCase().includes(term)) ||
          (p.stage && p.stage.toLowerCase().includes(term))
        );
      });
    }
  }, [plants, offices, sites, selectedType, plantSearchQuery]);

  const totalPlantPages = Math.ceil(filteredPlants.length / plantPageSize) || 1;

  const paginatedPlants = useMemo(() => {
    const startIndex = (plantPage - 1) * plantPageSize;
    return filteredPlants.slice(startIndex, startIndex + plantPageSize);
  }, [filteredPlants, plantPage, plantPageSize]);

  const selectedQuestion = currentList.find((item) => item.id === selectedQuestionId) || currentList[0] || null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedSnapshot);

  const updateCurrentList = (updater) => {
    setDraft((prev) => {
      const next = cloneDraft(prev);
      next[selectedType] = updater(next[selectedType]);
      return next;
    });
  };

  const updateQuestion = (questionId, updater) => {
    updateCurrentList((list) => list.map((item) => (item.id === questionId ? updater({ ...item, guidelines: [...item.guidelines] }) : item)));
  };

  const handleAddQuestion = () => {
    setTempQuestion({
      title: "หัวข้อใหม่",
      guideTitle: "",
      guidelines: ["เพิ่มรายละเอียดที่นี่"],
      format: "original",
      image: undefined,
    });
    setShowAddTypeModal(true);
  };

  const confirmAddQuestion = (qData) => {
    const existingIds = new Set(currentList.map((item) => item.id));
    const newQuestion = {
      ...qData,
      id: createQuestionId(selectedType, qData.title, existingIds),
    };

    updateCurrentList((list) => [...list, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    setShowAddTypeModal(false);
    setTempQuestion(null);
    if (isMobile) setMobileActiveView("editor");
  };

  const handleDuplicateQuestion = () => {
    if (!selectedQuestion) return;

    const existingIds = new Set(currentList.map((item) => item.id));
    const duplicate = {
      ...selectedQuestion,
      id: createQuestionId(selectedType, `${selectedQuestion.title} copy`, existingIds),
      title: `${selectedQuestion.title} copy`,
      guidelines: [...selectedQuestion.guidelines],
    };

    updateCurrentList((list) => {
      const index = list.findIndex((item) => item.id === selectedQuestion.id);
      const next = [...list];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
    setSelectedQuestionId(duplicate.id);
    if (isMobile) setMobileActiveView("editor");
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTargetId) return;

    updateCurrentList((list) => list.filter((item) => item.id !== deleteTargetId));
    if (selectedQuestionId === deleteTargetId) {
      const remaining = currentList.filter((item) => item.id !== deleteTargetId);
      setSelectedQuestionId(remaining[0]?.id || "");
    }
    setDeleteTargetId(null);
  };

  const handleMove = (direction) => {
    if (!selectedQuestion) return;
    const currentIndex = currentList.findIndex((item) => item.id === selectedQuestion.id);
    updateCurrentList((list) => moveItem(list, currentIndex, currentIndex + direction));
  };

  const handleSaveDraft = () => {
    saveChecklistDraft(draft);
    setSavedSnapshot(cloneDraft(draft));
    setLastSavedAt(new Date().toLocaleString("th-TH"));
  };

  const handleReset = () => {
    const restored = cloneDraft(savedSnapshot);
    setDraft(restored);
    setSelectedQuestionId(restored[selectedType][0]?.id || "");
  };

  const handleRestoreDefault = () => {
    restoreChecklistDefaults();
    const restored = cloneDraft(DEFAULT_CHECKLISTS);
    setDraft(restored);
    setSavedSnapshot(cloneDraft(DEFAULT_CHECKLISTS));
    setSelectedQuestionId(restored[selectedType][0]?.id || "");
    setLastSavedAt("");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(REPORT_STORAGE_KEYS.pms, senderProfile.pms);
    localStorage.setItem(REPORT_STORAGE_KEYS.name, senderProfile.name);
    localStorage.setItem(REPORT_STORAGE_KEYS.email, senderProfile.email);
  }, [senderProfile]);

  const handleSenderProfileChange = (field, value) => {
    setSenderProfile((prev) => ({ ...prev, [field]: value }));
  };

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
    } catch (error) {
      console.error("Failed to import report records", error);
      window.alert("ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์อีกครั้ง");
    } finally {
      event.target.value = "";
    }
  };

  const handleExportReports = () => {
    const rows = filteredReportRecords.map((item) => ({
      PMS: item.pms,
      Year: item.year,
      เดือน: item.month,
      Name: item.name,
      "E-mail": item.email,
      กิจกรรม: item.activityType,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: REPORT_EXPORT_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluation Report");
    XLSX.writeFile(workbook, `evaluation-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleOpenEditReport = (item) => {
    setEditingReport(createEditableReportDraft(item));
  };

  const handleSaveEditedReport = () => {
    if (!editingReport) return;

    const normalizedRecord = {
      pms: String(editingReport.pms || "").trim(),
      year: toNumberOrFallback(editingReport.year, new Date().getFullYear()),
      month: toNumberOrFallback(editingReport.month, 1),
      name: String(editingReport.name || "").trim(),
      email: String(editingReport.email || "").trim(),
      activityType: normalizeReportActivity(editingReport.activityType),
    };

    if (editingReport.source === "submission" && editingReport.submissionId) {
      const next = submissions.map((submission) =>
        submission.id === editingReport.submissionId
          ? { ...submission, ...normalizedRecord }
          : submission
      );
      setSubmissions(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(REPORT_STORAGE_KEYS.submissions, JSON.stringify(next));
      }
    } else if (editingReport.source === "upload") {
      setUploadedReportRecords((prev) =>
        prev.map((record) =>
          record.id === editingReport.id ? { ...record, ...normalizedRecord } : record
        )
      );
    } else {
      setTemplateReportRecords((prev) =>
        prev.map((record) =>
          record.id === editingReport.id ? { ...record, ...normalizedRecord } : record
        )
      );
    }

    setEditingReport(null);
  };

  const handleDeleteReportRecord = (item) => {
    if (typeof window !== "undefined" && !window.confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
      return;
    }

    if (item.source === "submission" && item.submissionId) {
      handleDeleteSubmission(item.submissionId);
    } else if (item.source === "upload") {
      setUploadedReportRecords((prev) => prev.filter((record) => record.id !== item.id));
    } else {
      setTemplateReportRecords((prev) => prev.filter((record) => record.id !== item.id));
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
      <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, padding: isMobile ? "12px 14px" : "16px 20px", minHeight: isMobile ? undefined : 0 }}>
        {/* Compact Header & Controls Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
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
          {/* Left: Title + Tabs */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 12 : 24
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.ink, lineHeight: 1.1 }}>Safety Admin</div>
              {lastSavedAt && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>เซฟล่าสุด: {lastSavedAt}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {LOCATION_TYPE_OPTIONS.map((option) => {
                const active = selectedType === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setSelectedType(option.key);
                      setSelectedQuestionId(draft[option.key][0]?.id || "");
                      if (isMobile) setMobileActiveView("list");
                    }}
                    style={{
                      border: active ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
                      background: active ? T.accentSoft : "#fff",
                      color: active ? T.accentDeep : T.ink,
                      borderRadius: 999,
                      height: 36,
                      padding: "0 14px",
                      fontFamily: "inherit",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{option.label}</span>
                    <span
                      style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 999,
                        background: active ? "#fff" : T.accentSoft,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 11,
                      }}
                    >
                      {draft[option.key].length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Status badge & Actions */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: 12
          }}>
            {/* Toggle switch for Today vs Backdate */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f3f0", padding: 4, borderRadius: 12, border: `1px solid ${T.line}` }}>
              <button
                type="button"
                onClick={() => handleToggleMode("today")}
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "none",
                  background: backdateMode === "today" ? T.accent : "transparent",
                  color: backdateMode === "today" ? "#fff" : T.sub,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ทำวันนี้
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode("backdate")}
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "none",
                  background: backdateMode === "backdate" ? T.accent : "transparent",
                  color: backdateMode === "backdate" ? "#fff" : T.sub,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ทำย้อนหลัง
              </button>
            </div>

            {/* Old action buttons removed as requested. Switch selection is now the unified entry point. */}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: isMobile ? "center" : "flex-start",
                gap: 6,
                borderRadius: 999,
                background: dirty ? "var(--c-fff2cf)" : "#edf8f2",
                color: dirty ? T.accentDeep : T.ok,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: dirty ? T.accent : T.ok }} />
              {dirty ? "มีแก้ไขที่ยังไม่บันทึก" : "บันทึกแล้ว"}
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: isMobile ? "space-between" : "flex-start" }}>
              <button type="button" onClick={handleReset} style={{ ...buttonGhostStyle, height: 32, borderRadius: 8, fontSize: isMobile ? 11.5 : 13, padding: isMobile ? "0 8px" : "0 12px" }}>Reset</button>
              <button type="button" onClick={handleRestoreDefault} style={{ ...buttonDangerStyle, height: 32, borderRadius: 8, fontSize: isMobile ? 11.5 : 13, padding: isMobile ? "0 8px" : "0 12px" }}>Restore Default</button>
              <button type="button" onClick={handleSaveDraft} style={{ ...buttonPrimaryStyle, height: 32, borderRadius: 8, fontSize: isMobile ? 11.5 : 13, padding: isMobile ? "0 10px" : "0 14px", boxShadow: "none" }}>Save Draft</button>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: "flex", borderBottom: `2px solid ${T.line}`, gap: 8, padding: "0 10px", flexShrink: 0, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setAdminTab("questions")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: adminTab === "questions" ? `3px solid ${T.accent}` : "3px solid transparent",
              color: adminTab === "questions" ? T.accentDeep : T.sub,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s"
            }}
          >
            ✏️ จัดการคำถามแบบประเมิน
          </button>
          <button
            type="button"
            onClick={() => setAdminTab("submissions")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: adminTab === "submissions" ? `3px solid ${T.accent}` : "3px solid transparent",
              color: adminTab === "submissions" ? T.accentDeep : T.sub,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s"
            }}
          >
            📋 ประวัติการส่งรายงาน Linewalk / Safety Contact
          </button>
          <button
            type="button"
            onClick={() => setAdminTab("reports")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: adminTab === "reports" ? `3px solid ${T.accent}` : "3px solid transparent",
              color: adminTab === "reports" ? T.accentDeep : T.sub,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s"
            }}
          >
            📊 รายงานแบบประเมิน
          </button>
          <button
            type="button"
            onClick={() => setAdminTab("plants")}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: adminTab === "plants" ? `3px solid ${T.accent}` : "3px solid transparent",
              color: adminTab === "plants" ? T.accentDeep : T.sub,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s"
            }}
          >
            ⚙️ จัดการข้อมูล
          </button>
        </div>

        {adminTab === "submissions" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              background: "rgba(255,255,255,0.78)",
              border: `1px solid ${T.line}`,
              borderRadius: 24,
              padding: isMobile ? 12 : 20,
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
                paddingBottom: 16,
                flexShrink: 0
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                {/* Search input */}
                <div style={{ position: "relative", width: isMobile ? "100%" : 240 }}>
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อสถานที่..."
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
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: isMobile ? "100%" : 160,
                    minHeight: 38,
                    borderRadius: 10,
                    fontSize: 13,
                    padding: "0 10px",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">กิจกรรมทั้งหมด</option>
                  <option value="line-walk">Line Walk</option>
                  <option value="safety-contact">Safety Contact</option>
                </select>

                {/* Filter Location Type */}
                <select
                  value={locTypeFilter}
                  onChange={(e) => setLocTypeFilter(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: isMobile ? "100%" : 160,
                    minHeight: 38,
                    borderRadius: 10,
                    fontSize: 13,
                    padding: "0 10px",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">ทุกประเภทสถานที่</option>
                  <option value="factory">โรงงาน</option>
                  <option value="office">สำนักงาน</option>
                  <option value="site">Site งาน</option>
                </select>
              </div>

              {submissions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("คุณต้องการล้างประวัติการส่งรายงานทั้งหมดใช่หรือไม่?")) {
                      setSubmissions([]);
                      localStorage.setItem("suea-safety-submissions-v1", JSON.stringify([]));
                    }
                  }}
                  style={{
                    ...buttonDangerStyle,
                    height: 38,
                    borderRadius: 10,
                    fontSize: 12.5,
                    padding: "0 14px"
                  }}
                >
                  ล้างข้อมูลทั้งหมด
                </button>
              )}
            </div>

            {/* List / Table Area */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {/* Filtered items */}
              {(() => {
                const filtered = submissions.filter(item => {
                  const matchesSearch = item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                       (item.safetyContactText && item.safetyContactText.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchesActivity = activityFilter === "all" || item.activityId === activityFilter;
                  const matchesLoc = locTypeFilter === "all" || item.locType === locTypeFilter;
                  return matchesSearch && matchesActivity && matchesLoc;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ border: `1px dashed ${T.lineStrong}`, borderRadius: 18, padding: 32, textAlign: "center", color: T.sub, fontSize: 14 }}>
                      ไม่พบประวัติการส่งรายงานตามเงื่อนไขที่เลือก
                    </div>
                  );
                }

                return (
                  <div style={{ display: "grid", gap: 10 }}>
                    {/* Header Row on Desktop */}
                    {!isMobile && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "130px 120px 180px 100px 1fr 100px",
                          gap: 12,
                          padding: "8px 16px",
                          fontWeight: 800,
                          fontSize: 12.5,
                          color: T.sub,
                          borderBottom: `2px solid ${T.line}`
                        }}
                      >
                        <div>วันที่ทำรายการ</div>
                        <div>กิจกรรม</div>
                        <div>สถานที่ตรวจ</div>
                        <div>ประเภทสถานที่</div>
                        <div>ผลประเมิน / รายละเอียด</div>
                        <div style={{ textAlign: "right" }}>การจัดการ</div>
                      </div>
                    )}

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
                            display: isMobile ? "flex" : "grid",
                            flexDirection: isMobile ? "column" : undefined,
                            gridTemplateColumns: isMobile ? undefined : "130px 120px 180px 100px 1fr 100px",
                            gap: isMobile ? 8 : 12,
                            alignItems: isMobile ? "flex-start" : "center",
                            background: "#fff",
                            border: `1px solid ${T.line}`,
                            borderRadius: 14,
                            padding: "12px 16px",
                            fontSize: 13.5,
                            transition: "all 0.15s ease"
                          }}
                        >
                          {isMobile ? (
                            <>
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm("คุณต้องการลบรายงานฉบับนี้ใช่หรือไม่?")) {
                                      handleDeleteSubmission(item.id);
                                    }
                                  }}
                                  style={{
                                    ...buttonDangerStyle,
                                    height: 30,
                                    borderRadius: 6,
                                    fontSize: 12,
                                    padding: "0 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                  }}
                                >
                                  <Trash2 size={12} />
                                  <span>ลบ</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span style={{ fontWeight: 700 }}>{displayDate}</span>
                                <div style={{ fontSize: 11, color: T.sub }}>{displayTime}</div>
                              </div>
                              <div>
                                <span style={{
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  color: isContact ? "#7c2d12" : "#14532d",
                                  background: isContact ? "#ffedd5" : "#dcfce7",
                                  padding: "3px 8px",
                                  borderRadius: 6
                                }}>
                                  {item.activityLabel}
                                </span>
                              </div>
                              <div>
                                <div style={{ fontWeight: 700 }}>{item.locationName}</div>
                                <div style={{ fontSize: 11, color: T.sub }}>{item.locationTag}</div>
                              </div>
                              <div>{LOCATION_TYPE_LABELS[item.locType] || item.locType}</div>
                              <div style={{ color: isContact ? T.ink : (summaryText.includes("ไม่ปลอดภัย: 0") ? T.ok : T.danger), fontWeight: isContact ? 500 : 700 }}>
                                {summaryText}
                              </div>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedSub(item)}
                                  style={{
                                    ...buttonGhostStyle,
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    padding: 0,
                                    display: "grid",
                                    placeItems: "center"
                                  }}
                                  title="ดูรายละเอียด"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm("คุณต้องการลบรายงานฉบับนี้ใช่หรือไม่?")) {
                                      handleDeleteSubmission(item.id);
                                    }
                                  }}
                                  style={{
                                    ...buttonDangerStyle,
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    padding: 0,
                                    display: "grid",
                                    placeItems: "center"
                                  }}
                                  title="ลบ"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : adminTab === "reports" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              background: "rgba(255,255,255,0.78)",
              border: `1px solid ${T.line}`,
              borderRadius: 24,
              padding: isMobile ? 12 : 20,
              boxShadow: T.shadow,
              minHeight: isMobile ? undefined : 0,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderBottom: `1px solid ${T.line}`,
                paddingBottom: 16,
                flexShrink: 0
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.accentDeep }}>รายงานแบบประเมิน</div>
                <div style={{ fontSize: 13, color: T.sub }}>
                  รวมข้อมูลจาก mock records, รายการที่บันทึกในระบบ, และไฟล์ Excel ที่อัปโหลดชั่วคราว
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
                    gap: 6
                  }}
                >
                  <Upload size={14} />
                  <span>อัปโหลดรายงาน (Excel)</span>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportReportFile} style={{ display: "none" }} />
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
                    gap: 6
                  }}
                >
                  <Download size={14} />
                  <span>ดาวน์โหลดรายงาน (Excel)</span>
                </button>
              </div>
            </div>

            <div style={{ border: `1px solid ${T.line}`, borderRadius: 18, background: "#fffdf8", overflow: "hidden", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowSenderSettings((prev) => !prev)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: T.ink
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800 }}>
                  <Settings size={16} />
                  <span>ตั้งค่าข้อมูลผู้ส่งรายงาน</span>
                </span>
                {showSenderSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showSenderSettings ? (
                <div style={{ borderTop: `1px solid ${T.line}`, padding: 16, display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>PMS</span>
                      <input
                        value={senderProfile.pms}
                        onChange={(event) => handleSenderProfileChange("pms", event.target.value)}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>ชื่อ - นามสกุล</span>
                      <input
                        value={senderProfile.name}
                        onChange={(event) => handleSenderProfileChange("name", event.target.value)}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>E-mail</span>
                      <input
                        value={senderProfile.email}
                        onChange={(event) => handleSenderProfileChange("email", event.target.value)}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                      />
                    </label>
                  </div>
                  <div style={{ fontSize: 12.5, color: T.sub }}>
                    ค่านี้จะถูกใช้เป็นข้อมูลผู้ส่งเมื่อมีการบันทึก Line Walk หรือ Safety Contact ครั้งถัดไป
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                flexShrink: 0
              }}
            >
              <div style={{ position: "relative", width: isMobile ? "100%" : 240 }}>
                <input
                  type="text"
                  placeholder="ค้นหา PMS / ชื่อ / E-mail"
                  value={reportSearchQuery}
                  onChange={(event) => setReportSearchQuery(event.target.value)}
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
              <select
                value={reportYearFilter}
                onChange={(event) => setReportYearFilter(event.target.value)}
                style={{ ...inputStyle, width: isMobile ? "100%" : 140, minHeight: 38, borderRadius: 10, fontSize: 13, padding: "0 10px", cursor: "pointer" }}
              >
                {reportYearOptions.map((year) => (
                  <option key={year} value={year}>{year === "all" ? "ทุกปี" : year}</option>
                ))}
              </select>
              <select
                value={reportMonthFilter}
                onChange={(event) => setReportMonthFilter(event.target.value)}
                style={{ ...inputStyle, width: isMobile ? "100%" : 160, minHeight: 38, borderRadius: 10, fontSize: 13, padding: "0 10px", cursor: "pointer" }}
              >
                {REPORT_MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              <select
                value={reportActivityFilter}
                onChange={(event) => setReportActivityFilter(event.target.value)}
                style={{ ...inputStyle, width: isMobile ? "100%" : 240, minHeight: 38, borderRadius: 10, fontSize: 13, padding: "0 10px", cursor: "pointer" }}
              >
                {REPORT_ACTIVITY_OPTIONS.map((activity) => (
                  <option key={activity.value} value={activity.value}>{activity.label}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {filteredReportRecords.length === 0 ? (
                <div style={{ border: `1px dashed ${T.lineStrong}`, borderRadius: 18, padding: 32, textAlign: "center", color: T.sub, fontSize: 14 }}>
                  ไม่พบข้อมูลรายงานแบบประเมินตามเงื่อนไขที่เลือก
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {!isMobile ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 90px 110px minmax(180px,1fr) minmax(220px,1fr) 180px 112px",
                        gap: 12,
                        padding: "8px 16px",
                        fontWeight: 800,
                        fontSize: 12.5,
                        color: T.sub,
                        borderBottom: `2px solid ${T.line}`
                      }}
                    >
                      <div>PMS</div>
                      <div>Year</div>
                      <div>เดือน</div>
                      <div>Name</div>
                      <div>E-mail</div>
                      <div>กิจกรรม</div>
                      <div style={{ textAlign: "center" }}>จัดการ</div>
                    </div>
                  ) : null}

                  {filteredReportRecords.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "120px 90px 110px minmax(180px,1fr) minmax(220px,1fr) 180px 112px",
                        gap: 12,
                        alignItems: "center",
                        background: "#fff",
                        border: `1px solid ${T.line}`,
                        borderRadius: 14,
                        padding: "12px 16px",
                        fontSize: 13.5
                      }}
                    >
                      {isMobile ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: `1px solid ${T.line}`, paddingBottom: 8 }}>
                            <div style={{ fontWeight: 900, color: T.accentDeep }}>{item.name || "-"}</div>
                            <div style={{ fontSize: 11.5, color: T.sub }}>{item.pms || "-"}</div>
                          </div>
                          <div style={{ display: "grid", gap: 4 }}>
                            <div><strong style={{ color: T.sub }}>ปี:</strong> {item.year}</div>
                            <div><strong style={{ color: T.sub }}>เดือน:</strong> {monthLabel(item.month)}</div>
                            <div><strong style={{ color: T.sub }}>E-mail:</strong> {item.email || "-"}</div>
                            <div><strong style={{ color: T.sub }}>กิจกรรม:</strong> {item.activityType}</div>
                            <div><strong style={{ color: T.sub }}>ที่มา:</strong> {item.source === "submission" ? "รายการที่บันทึก" : item.source === "upload" ? "ไฟล์อัปโหลด" : "mock records"}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
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
                                gap: 6
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
                                gap: 6
                              }}
                            >
                              <Trash2 size={12} />
                              <span>ลบ</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 800 }}>{item.pms || "-"}</div>
                          <div>{item.year}</div>
                          <div>{monthLabel(item.month)}</div>
                          <div style={{ fontWeight: 700 }}>{item.name || "-"}</div>
                          <div>{item.email || "-"}</div>
                          <div>
                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 800,
                                color: item.activityType === "Safety_Contact" ? "#7c2d12" : "#14532d",
                                background: item.activityType === "Safety_Contact" ? "#ffedd5" : "#dcfce7",
                                padding: "4px 8px",
                                borderRadius: 999
                              }}
                            >
                              {item.activityType}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditReport(item)}
                              style={{
                                ...buttonGhostStyle,
                                width: 44,
                                height: 34,
                                borderRadius: 8,
                                padding: 0,
                                display: "grid",
                                placeItems: "center"
                              }}
                              title="แก้ไข"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReportRecord(item)}
                              style={{
                                ...buttonDangerStyle,
                                width: 44,
                                height: 34,
                                borderRadius: 8,
                                padding: 0,
                                display: "grid",
                                placeItems: "center"
                              }}
                              title="ลบ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : adminTab === "plants" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              background: "rgba(255,255,255,0.78)",
              border: `1px solid ${T.line}`,
              borderRadius: 24,
              padding: isMobile ? 12 : 20,
              boxShadow: T.shadow,
              minHeight: isMobile ? undefined : 0,
              overflow: "hidden"
            }}
          >
            {/* Dynamic Gradient Banner */}
            <div
              style={{
                background: selectedType === "factory" 
                  ? "linear-gradient(90deg, #3f2bef 0%, #a22cf5 100%)"
                  : selectedType === "office"
                  ? "linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)"
                  : "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
                borderRadius: 18,
                padding: "16px 24px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "stretch" : "center",
                gap: 12,
                boxShadow: selectedType === "factory"
                  ? "0 8px 20px rgba(63, 43, 239, 0.15)"
                  : selectedType === "office"
                  ? "0 8px 20px rgba(14, 165, 233, 0.15)"
                  : "0 8px 20px rgba(245, 158, 11, 0.15)",
                color: "#ffffff"
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>
                    {selectedType === "factory" ? "🏭" : selectedType === "office" ? "🏢" : "🚧"}
                  </span>
                  <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                    {selectedType === "factory" ? "Plant Management System" : selectedType === "office" ? "Office Management System" : "Site Management System"}
                  </h1>
                </div>
                <p style={{ fontSize: 13, margin: 0, opacity: 0.85, fontWeight: 500 }}>
                  {selectedType === "factory" 
                    ? "Manage company plants, divisions, and organizational structure" 
                    : selectedType === "office"
                    ? "Manage company offices, floors, zones, and locations"
                    : "Manage construction sites, projects, contractors, and stages"}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, alignSelf: isMobile ? "flex-end" : "center" }}>
                <label
                  style={{
                    height: 38,
                    borderRadius: 10,
                    fontSize: 12.5,
                    padding: "0 16px",
                    background: "rgba(255, 255, 255, 0.18)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <Upload size={14} />
                  <span>Import</span>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportPlantsFile} style={{ display: "none" }} />
                </label>
                <button
                  type="button"
                  onClick={handleAddPlant}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    fontSize: 12.5,
                    padding: "0 16px",
                    background: "#ffffff",
                    border: "none",
                    color: selectedType === "factory" ? "#3f2bef" : selectedType === "office" ? "#0284c7" : "#b45309",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    transition: "all 0.2s"
                  }}
                >
                  <span>
                    {selectedType === "factory" ? "+ Add Plant" : selectedType === "office" ? "+ Add Office" : "+ Add Site"}
                  </span>
                </button>
              </div>
            </div>

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
              <div style={{ fontSize: 16, fontWeight: 800, color: T.accentDeep }}>
                {selectedType === "factory" ? "Plant Records" : selectedType === "office" ? "Office Records" : "Site Records"} ({filteredPlants.length})
              </div>
              <div style={{ position: "relative", width: isMobile ? "100%" : 300 }}>
                <input
                  type="text"
                  placeholder={selectedType === "factory" ? "Search plants, divisions..." : selectedType === "office" ? "Search offices, floors..." : "Search sites, contractors..."}
                  value={plantSearchQuery}
                  onChange={(e) => {
                    setPlantSearchQuery(e.target.value);
                    setPlantPage(1);
                  }}
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
            </div>

            {/* Dynamic Table Area */}
            <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
              {paginatedPlants.length === 0 ? (
                <div style={{ border: `1px dashed ${T.lineStrong}`, borderRadius: 18, padding: 32, textAlign: "center", color: T.sub, fontSize: 14 }}>
                  {selectedType === "factory" ? "ไม่พบข้อมูลโรงงานตามเงื่อนไขที่ค้นหา" : selectedType === "office" ? "ไม่พบข้อมูลสำนักงานตามเงื่อนไขที่ค้นหา" : "ไม่พบข้อมูลไซต์งานตามเงื่อนไขที่ค้นหา"}
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left", minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.line}`, color: T.sub, fontWeight: 800 }}>
                      <th style={{ padding: "10px 8px", width: 50, textAlign: "center" }}>ID</th>
                      {selectedType === "factory" ? (
                        <>
                          <th style={{ padding: "10px 8px" }}>Company</th>
                          <th style={{ padding: "10px 8px" }}>Division</th>
                          <th style={{ padding: "10px 8px" }}>Department</th>
                          <th style={{ padding: "10px 8px" }}>Section</th>
                          <th style={{ padding: "10px 8px" }}>Plant</th>
                        </>
                      ) : selectedType === "office" ? (
                        <>
                          <th style={{ padding: "10px 8px" }}>Company</th>
                          <th style={{ padding: "10px 8px" }}>Division</th>
                          <th style={{ padding: "10px 8px" }}>Department</th>
                          <th style={{ padding: "10px 8px" }}>Office Name</th>
                          <th style={{ padding: "10px 8px" }}>Floor/Zone</th>
                        </>
                      ) : (
                        <>
                          <th style={{ padding: "10px 8px" }}>Project/Site Name</th>
                          <th style={{ padding: "10px 8px" }}>Customer</th>
                          <th style={{ padding: "10px 8px" }}>Contractor</th>
                          <th style={{ padding: "10px 8px" }}>Stage/Phase</th>
                        </>
                      )}
                      <th style={{ padding: "10px 8px", width: 80 }}>Status</th>
                      <th style={{ padding: "10px 8px", width: 120 }}>Location</th>
                      <th style={{ padding: "10px 8px", width: 100, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPlants.map((plant) => (
                      <tr
                        key={plant.id}
                        style={{
                          borderBottom: `1px solid ${T.line}`,
                          background: "#ffffff",
                          transition: "background 0.2s"
                        }}
                      >
                        {/* ID */}
                        <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700, color: T.sub }}>
                          {plant.id}
                        </td>
                        {selectedType === "factory" ? (
                          <>
                            {/* Company */}
                            <td style={{ padding: "12px 8px" }}>
                              <div style={{ fontWeight: 800, color: T.ink }}>{plant.companyCode}</div>
                              <div style={{ fontSize: 11.5, color: T.sub }}>{plant.companyName}</div>
                            </td>
                            {/* Division */}
                            <td style={{ padding: "12px 8px" }}>
                              {plant.divisionName ? (
                                <>
                                  <div style={{ fontWeight: 800, color: "var(--brand-text)" }}>{plant.divisionName}</div>
                                  <div style={{ fontSize: 11.5, color: T.sub }}>Code: {plant.divisionCode}</div>
                                </>
                              ) : (
                                <span style={{ fontSize: 11.5, color: T.sub }}>Code: {plant.divisionCode || "[NULL]"}</span>
                              )}
                            </td>
                            {/* Department */}
                            <td style={{ padding: "12px 8px" }}>
                              {plant.deptName ? (
                                <>
                                  <div style={{ fontWeight: 800 }}>{plant.deptName}</div>
                                  <div style={{ fontSize: 11.5, color: T.sub }}>{plant.deptCode}</div>
                                </>
                              ) : (
                                <span style={{ color: T.sub, fontSize: 12 }}>{plant.deptCode || "[NULL]"}</span>
                              )}
                            </td>
                            {/* Section */}
                            <td style={{ padding: "12px 8px" }}>
                              {plant.secName ? (
                                <>
                                  <div style={{ fontWeight: 800 }}>{plant.secName}</div>
                                  <div style={{ fontSize: 11.5, color: T.sub }}>{plant.secCode}</div>
                                </>
                              ) : (
                                <span style={{ color: T.sub, fontSize: 12 }}>{plant.secCode || "[NULL]"}</span>
                              )}
                            </td>
                            {/* Plant */}
                            <td style={{ padding: "12px 8px" }}>
                              <div style={{ fontWeight: 800, color: T.ok }}>{plant.plantName}</div>
                              <div style={{ fontSize: 11.5, color: T.sub }}>Code: {plant.plantCode}</div>
                            </td>
                          </>
                        ) : selectedType === "office" ? (
                          <>
                            {/* Company */}
                            <td style={{ padding: "12px 8px" }}>
                              <div style={{ fontWeight: 800, color: T.ink }}>{plant.companyCode}</div>
                              <div style={{ fontSize: 11.5, color: T.sub }}>{plant.companyName}</div>
                            </td>
                            {/* Division */}
                            <td style={{ padding: "12px 8px" }}>
                              {plant.divisionName ? (
                                <>
                                  <div style={{ fontWeight: 800, color: "var(--brand-text)" }}>{plant.divisionName}</div>
                                  <div style={{ fontSize: 11.5, color: T.sub }}>Code: {plant.divisionCode}</div>
                                </>
                              ) : (
                                <span style={{ fontSize: 11.5, color: T.sub }}>Code: {plant.divisionCode || "[NULL]"}</span>
                              )}
                            </td>
                            {/* Department */}
                            <td style={{ padding: "12px 8px" }}>
                              {plant.deptName ? (
                                <>
                                  <div style={{ fontWeight: 800 }}>{plant.deptName}</div>
                                  <div style={{ fontSize: 11.5, color: T.sub }}>{plant.deptCode}</div>
                                </>
                              ) : (
                                <span style={{ color: T.sub, fontSize: 12 }}>{plant.deptCode || "[NULL]"}</span>
                              )}
                            </td>
                            {/* Office Name */}
                            <td style={{ padding: "12px 8px" }}>
                              <div style={{ fontWeight: 800, color: T.ok }}>{plant.officeName}</div>
                              <div style={{ fontSize: 11.5, color: T.sub }}>Code: {plant.officeCode}</div>
                            </td>
                            {/* Floor/Zone */}
                            <td style={{ padding: "12px 8px", fontWeight: 700 }}>
                              {plant.floor || "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Project/Site Name */}
                            <td style={{ padding: "12px 8px" }}>
                              <div style={{ fontWeight: 800, color: T.ok }}>{plant.projectName}</div>
                              <div style={{ fontSize: 11.5, color: T.sub }}>Code: {plant.projectCode}</div>
                            </td>
                            {/* Customer */}
                            <td style={{ padding: "12px 8px", fontWeight: 700 }}>
                              {plant.customer || "-"}
                            </td>
                            {/* Contractor */}
                            <td style={{ padding: "12px 8px", fontWeight: 700 }}>
                              {plant.contractor || "-"}
                            </td>
                            {/* Stage/Phase */}
                            <td style={{ padding: "12px 8px" }}>
                              <span
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  color: "#7c2d12",
                                  background: "#ffedd5",
                                  padding: "3px 8px",
                                  borderRadius: 6
                                }}
                              >
                                {plant.stage || "-"}
                              </span>
                            </td>
                          </>
                        )}
                        {/* Status */}
                        <td style={{ padding: "12px 8px" }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              color: T.ink,
                              background: "#f3f4f6",
                              border: `1px solid ${T.lineStrong}`,
                              padding: "2px 6px",
                              borderRadius: 4,
                              display: "inline-block"
                            }}
                          >
                            {plant.status}
                          </span>
                        </td>
                        {/* Location */}
                        <td style={{ padding: "12px 8px" }}>
                          {plant.lat !== null && plant.lng !== null ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.danger }}>
                              <MapPin size={13} style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: T.ink, lineHeight: 1.2 }}>
                                {plant.lat.toFixed(6)}<br />{plant.lng.toFixed(6)}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: T.sub }}>No location</span>
                          )}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: "12px 8px", textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleEditPlant(plant)}
                              style={{
                                ...buttonGhostStyle,
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                padding: 0,
                                display: "grid",
                                placeItems: "center"
                              }}
                              title="แก้ไข"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlant(plant.id)}
                              style={{
                                ...buttonDangerStyle,
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                padding: 0,
                                display: "grid",
                                placeItems: "center"
                              }}
                              title="ลบ"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredPlants.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: `1px solid ${T.line}`,
                  paddingTop: 12,
                  flexShrink: 0,
                  fontSize: 13,
                  color: T.sub
                }}
              >
                <div>
                  Showing {(plantPage - 1) * plantPageSize + 1} to {Math.min(plantPage * plantPageSize, filteredPlants.length)} of {filteredPlants.length} {selectedType === "factory" ? "plants" : selectedType === "office" ? "offices" : "sites"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Page numbers */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      disabled={plantPage === 1}
                      onClick={() => setPlantPage(plantPage - 1)}
                      style={{
                        ...buttonGhostStyle,
                        height: 28,
                        minWidth: 28,
                        borderRadius: 6,
                        padding: 0,
                        fontSize: 12,
                        opacity: plantPage === 1 ? 0.5 : 1,
                        cursor: plantPage === 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPlantPages }).map((_, index) => {
                      const pageNum = index + 1;
                      const active = plantPage === pageNum;
                      if (totalPlantPages > 6) {
                        if (pageNum !== 1 && pageNum !== totalPlantPages && Math.abs(plantPage - pageNum) > 1) {
                          if (pageNum === 2 && plantPage > 3) return <span key={pageNum} style={{ padding: "0 4px" }}>...</span>;
                          if (pageNum === totalPlantPages - 1 && plantPage < totalPlantPages - 2) return <span key={pageNum} style={{ padding: "0 4px" }}>...</span>;
                          return null;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPlantPage(pageNum)}
                          style={{
                            height: 28,
                            minWidth: 28,
                            borderRadius: 6,
                            border: active ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
                            background: active ? T.accentSoft : "#ffffff",
                            color: active ? T.accentDeep : T.ink,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            padding: 0
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={plantPage === totalPlantPages}
                      onClick={() => setPlantPage(plantPage + 1)}
                      style={{
                        ...buttonGhostStyle,
                        height: 28,
                        minWidth: 28,
                        borderRadius: 6,
                        padding: 0,
                        fontSize: 12,
                        opacity: plantPage === totalPlantPages ? 0.5 : 1,
                        cursor: plantPage === totalPlantPages ? "not-allowed" : "pointer"
                      }}
                    >
                      &gt;
                    </button>
                  </div>

                  {/* Page size selector */}
                  <select
                    value={plantPageSize}
                    onChange={(e) => {
                      setPlantPageSize(parseInt(e.target.value));
                      setPlantPage(1);
                    }}
                    style={{
                      ...inputStyle,
                      width: 110,
                      minHeight: 28,
                      height: 28,
                      borderRadius: 6,
                      fontSize: 12,
                      padding: "0 6px",
                      cursor: "pointer"
                    }}
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              flex: isMobile ? "none" : 1,
              display: isMobile ? "flex" : "grid",
              gridTemplateColumns: isMobile ? undefined : "minmax(300px, 360px) minmax(0, 1fr)",
              flexDirection: isMobile ? "column" : undefined,
              gap: 16,
              minHeight: isMobile ? undefined : 0,
            }}
          >
          {/* Left Column: Question list */}
          {(!isMobile || mobileActiveView === "list") && (
            <aside
            style={{
              background: "rgba(255,255,255,0.78)",
              border: `1px solid ${T.line}`,
              borderRadius: 24,
              padding: 16,
              boxShadow: T.shadow,
              display: "flex",
              flexDirection: "column",
              height: isMobile ? "auto" : "100%",
              minHeight: isMobile ? undefined : 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.accentDeep }}>รายการข้อประเมิน</div>
                  <div style={{ fontSize: 12.5, color: T.sub }}>{LOCATION_TYPE_LABELS[selectedType]}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleDuplicateQuestion}
                    disabled={!selectedQuestion}
                    style={{
                      ...buttonGhostStyle,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      opacity: !selectedQuestion ? 0.5 : 1,
                      cursor: !selectedQuestion ? "not-allowed" : "pointer",
                    }}
                  >
                    Duplicate
                  </button>
                  <button type="button" onClick={handleAddQuestion} style={{ ...buttonPrimaryStyle, height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12.5, boxShadow: "none" }}>
                    + เพิ่มข้อ
                  </button>
                </div>
              </div>

              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อข้อหรือรายละเอียด" style={{ ...inputStyle, minHeight: 38, borderRadius: 10, fontSize: 13 }} />
            </div>

            <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", gap: 8, overflowY: isMobile ? "visible" : "auto", marginTop: 12, paddingRight: 4 }}>
              {filteredList.map((item, index) => {
                const active = item.id === selectedQuestionId;
                const isDragging = draggedId === item.id;
                const isOver = dragOverId === item.id;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      setDraggedId(item.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDragEnter={() => {
                      if (draggedId && draggedId !== item.id) {
                        setDragOverId(item.id);
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverId((prev) => (prev === item.id ? null : prev));
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedId || draggedId === item.id) return;

                      updateCurrentList((list) => {
                        const fromIndex = list.findIndex((x) => x.id === draggedId);
                        const toIndex = list.findIndex((x) => x.id === item.id);
                        if (fromIndex === -1 || toIndex === -1) return list;

                        const next = [...list];
                        const [draggedItem] = next.splice(fromIndex, 1);
                        next.splice(toIndex, 0, draggedItem);
                        return next;
                      });
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    onClick={() => {
                      setSelectedQuestionId(item.id);
                      if (isMobile) setMobileActiveView("editor");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedQuestionId(item.id);
                        if (isMobile) setMobileActiveView("editor");
                      }
                    }}
                    style={{
                      textAlign: "left",
                      border: isOver
                        ? `2px dashed ${T.accent}`
                        : active
                          ? `1px solid ${T.accent}`
                          : `1px solid ${T.line}`,
                      background: active ? "var(--c-fff5de)" : "#fff",
                      borderRadius: 14,
                      padding: 10,
                      display: "grid",
                      gap: 4,
                      cursor: isDragging ? "grabbing" : "grab",
                      fontFamily: "inherit",
                      opacity: isDragging ? 0.4 : 1,
                      transition: "all 0.15s ease",
                      transform: isOver ? "scale(0.98)" : "none",
                      outline: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          background: active ? T.accent : T.accentSoft,
                          color: active ? "#fff" : T.accentDeep,
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </span>
                      <GripVertical size={14} style={{ color: T.sub, opacity: 0.6, cursor: "grab" }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.4, color: T.ink }}>{item.title}</div>
                  </div>
                );
              })}

              {!filteredList.length ? (
                <div style={{ border: `1px dashed ${T.lineStrong}`, borderRadius: 18, padding: 18, color: T.sub, fontSize: 13 }}>
                  ไม่พบข้อที่ตรงกับคำค้น
                </div>
              ) : null}
            </div>
          </aside>
          )}

          {/* Right Column: Question & Guidelines Editor */}
          {(!isMobile || mobileActiveView === "editor") && (
            <section
            style={{
              display: "flex",
              flexDirection: "column",
              height: isMobile ? "auto" : "100%",
              minHeight: isMobile ? undefined : 0,
              gap: 16,
            }}
          >
            {selectedQuestion ? (
              <>
                {/* Question Details Editor Card */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    border: `1px solid ${T.line}`,
                    borderRadius: 24,
                    padding: 16,
                    boxShadow: T.shadow,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    gap: 12,
                    borderBottom: `1px solid ${T.line}`,
                    paddingBottom: 10
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {isMobile && (
                        <button
                          type="button"
                          onClick={() => setMobileActiveView("list")}
                          style={{
                            ...buttonGhostStyle,
                            height: 32,
                            borderRadius: 8,
                            fontSize: 12,
                            padding: "0 10px",
                            borderColor: T.accentDeep,
                            color: T.accentDeep,
                            marginRight: 6,
                          }}
                        >
                          ← กลับรายการ
                        </button>
                      )}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.accentDeep, textTransform: "uppercase" }}>Question Editor</span>
                        <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: T.ink }}>{selectedQuestion.title}</h2>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                      <button type="button" onClick={() => setDeleteTargetId(selectedQuestion.id)} style={{ ...buttonDangerStyle, height: 30, borderRadius: 8, fontSize: 11.5, padding: "0 10px" }}>ลบข้อ</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Question Title</span>
                      <input
                        value={selectedQuestion.title}
                        onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, title: event.target.value }))}
                        style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                      />
                    </label>

                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Guide Title</span>
                      <input
                        value={selectedQuestion.guideTitle === false ? "" : selectedQuestion.guideTitle || ""}
                        onChange={(event) => updateQuestion(selectedQuestion.id, (item) => ({ ...item, guideTitle: event.target.value }))}
                        style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                        placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
                      />
                    </label>

                    <label style={{ ...fieldStyle, justifyItems: "end" }}>
                      <span style={fieldLabelStyle}>Show Guide Title</span>
                      <button
                        type="button"
                        onClick={() => updateQuestion(selectedQuestion.id, (item) => ({ ...item, guideTitle: item.guideTitle === false ? "" : false }))}
                        style={{
                          ...buttonGhostStyle,
                          height: 36,
                          minWidth: 100,
                          borderRadius: 8,
                          fontSize: 12,
                          background: selectedQuestion.guideTitle === false ? "var(--c-fff0ea)" : "#fff",
                          borderColor: selectedQuestion.guideTitle === false ? "rgba(199,58,33,0.25)" : T.lineStrong,
                          color: selectedQuestion.guideTitle === false ? T.danger : T.ink,
                          padding: "0 12px",
                        }}
                      >
                        {selectedQuestion.guideTitle === false ? "ซ่อนอยู่" : "เปิดอยู่"}
                      </button>
                    </label>
                  </div>


                </div>

                {/* Guidelines Editor & Live Preview Card */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    border: `1px solid ${T.line}`,
                    borderRadius: 24,
                    padding: 16,
                    boxShadow: T.shadow,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flex: isMobile ? "none" : 1,
                    minHeight: isMobile ? undefined : 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.accentDeep }}>รายละเอียด & Preview</div>
                      <div style={{ fontSize: 12, color: T.sub }}>ใส่รายละเอียดข้อประเมินแยกกันทีละบรรทัด (กด Enter เพื่อขึ้นบรรทัดใหม่)</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", background: T.soft, borderRadius: 8, padding: 3, border: `1px solid ${T.line}` }}>
                        <button
                          type="button"
                          onClick={() => setShowPreview(false)}
                          style={{
                            height: 26,
                            padding: "0 12px",
                            borderRadius: 6,
                            border: "none",
                            background: !showPreview ? "#fff" : "transparent",
                            color: !showPreview ? T.accentDeep : T.sub,
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: "pointer",
                            boxShadow: !showPreview ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                          }}
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          style={{
                            height: 26,
                            padding: "0 12px",
                            borderRadius: 6,
                            border: "none",
                            background: showPreview ? "#fff" : "transparent",
                            color: showPreview ? T.accentDeep : T.sub,
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: "pointer",
                            boxShadow: showPreview ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                          }}
                        >
                          Preview จริง
                        </button>
                      </div>
                    </div>
                  </div>

                  {showPreview ? (
                    <div style={{ overflowY: isMobile ? "visible" : "auto", flex: isMobile ? "none" : 1, paddingRight: 4 }}>
                      <PreviewCard question={selectedQuestion} />
                    </div>
                  ) : (
                    <textarea
                      value={selectedQuestion.guidelines.join("\n")}
                      onChange={(event) =>
                        updateQuestion(selectedQuestion.id, (item) => ({
                          ...item,
                          guidelines: event.target.value.split("\n"),
                        }))
                      }
                      placeholder="ใส่รายละเอียดการตรวจแต่ละข้อแยกตามบรรทัด"
                      style={{
                        ...inputStyle,
                        flex: 1,
                        minHeight: 180,
                        resize: "vertical",
                        padding: "12px 14px",
                        fontSize: 13,
                        lineHeight: 1.6,
                        borderRadius: 14,
                        border: `1px solid ${T.lineStrong}`,
                        fontFamily: "inherit",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  border: `1px dashed ${T.lineStrong}`,
                  borderRadius: 24,
                  padding: 28,
                  background: "var(--brand-surface)",
                  color: T.sub,
                }}
              >
                ยังไม่มีข้อประเมินในหมวดนี้
              </div>
            )}
          </section>
          )}
        </div>
      )}
    </div>

      {deleteTargetId ? (
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
              width: "min(100%, 460px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }}>ยืนยันการลบข้อประเมิน</div>
            <div style={{ fontSize: 14.5, color: T.sub, lineHeight: 1.7 }}>
              ข้อนี้จะถูกลบออกจากหมวด {LOCATION_TYPE_LABELS[selectedType]} ใน draft ปัจจุบัน หากยังไม่ได้กด Save Draft สามารถกด Reset เพื่อย้อนกลับได้
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setDeleteTargetId(null)} style={buttonGhostStyle}>ยกเลิก</button>
              <button type="button" onClick={handleDeleteConfirmed} style={buttonDangerStyle}>ลบข้อ</button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddTypeModal && tempQuestion ? (
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
              width: "min(100%, 820px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, textAlign: "center", borderBottom: `1px solid ${T.line}`, paddingBottom: 10 }}>
              เพิ่มข้อประเมินใหม่
            </div>

            {/* Format Selector */}
            <div style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>เลือกรูปแบบข้อคำถามที่ต้องการเพิ่ม</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setTempQuestion(prev => ({ ...prev, format: "original" }))}
                  style={{
                    ...buttonGhostStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    borderRadius: 12,
                    gap: 8,
                    border: `2px solid ${tempQuestion.format === "original" ? T.accent : T.lineStrong}`,
                    background: tempQuestion.format === "original" ? "var(--brand-soft)" : "#fff",
                    color: tempQuestion.format === "original" ? T.accentDeep : T.ink,
                  }}
                >
                  <span style={{ fontSize: 18 }}>✔️</span>
                  <span style={{ fontWeight: 800, fontSize: 13.5 }}>แบบตัวเลือก (เดิม)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTempQuestion(prev => ({ ...prev, format: "text_box" }))}
                  style={{
                    ...buttonGhostStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    borderRadius: 12,
                    gap: 8,
                    border: `2px solid ${tempQuestion.format === "text_box" ? T.accent : T.lineStrong}`,
                    background: tempQuestion.format === "text_box" ? "var(--brand-soft)" : "#fff",
                    color: tempQuestion.format === "text_box" ? T.accentDeep : T.ink,
                  }}
                >
                  <span style={{ fontSize: 18 }}>📝</span>
                  <span style={{ fontWeight: 800, fontSize: 13.5 }}>แบบ Text Box</span>
                </button>
              </div>
            </div>

            {/* Editor & Preview Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 20, alignItems: "start" }}>
              
              {/* Left Column: Edit Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Question Title (ชื่อข้อ)</span>
                  <input
                    value={tempQuestion.title}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, title: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Guide Title (คำอธิบายเพิ่มเติม)</span>
                  <input
                    value={tempQuestion.guideTitle === false ? "" : tempQuestion.guideTitle || ""}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, guideTitle: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 36, borderRadius: 8, fontSize: 13, padding: "0 10px" }}
                    placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ"
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Guidelines (รายละเอียดแยกบรรทัด)</span>
                  <textarea
                    value={tempQuestion.guidelines.join("\n")}
                    onChange={(e) => setTempQuestion(prev => ({ ...prev, guidelines: e.target.value.split("\n") }))}
                    style={{
                      ...inputStyle,
                      minHeight: 90,
                      padding: "8px 10px",
                      fontSize: 13,
                      lineHeight: 1.5,
                      borderRadius: 8,
                      resize: "vertical",
                    }}
                    placeholder="ใส่รายละเอียดแต่ละบรรทัด..."
                  />
                </label>

                {/* Upload Image inside Modal */}
                <div style={fieldStyle}>
                  <span style={fieldLabelStyle}>รูปภาพประกอบคำถาม</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label
                      style={{
                        ...buttonGhostStyle,
                        height: 36,
                        borderRadius: 8,
                        fontSize: 12.5,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "0 12px",
                        background: "#fff",
                        border: `1px solid ${T.lineStrong}`,
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>อัปโหลดรูปภาพ</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTempQuestion(prev => ({ ...prev, image: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {tempQuestion.image && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", border: `1px solid ${T.line}` }}>
                          <img src={tempQuestion.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setTempQuestion(prev => ({ ...prev, image: undefined }))}
                          style={{
                            ...buttonDangerStyle,
                            height: 30,
                            borderRadius: 6,
                            padding: "0 8px",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          ลบรูป
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Preview Card */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={fieldLabelStyle}>ตัวอย่างการแสดงผลจริง (Live Preview)</span>
                <div style={{ border: `1px solid ${T.line}`, borderRadius: 18, background: "#fff", padding: 4 }}>
                  <PreviewCard question={tempQuestion} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddTypeModal(false);
                  setTempQuestion(null);
                }}
                style={buttonGhostStyle}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => confirmAddQuestion(tempQuestion)}
                style={{ ...buttonPrimaryStyle, background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)` }}
              >
                เพิ่มข้อประเมิน
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBackdateLimitModal ? (
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
              width: "min(100%, 460px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, textAlign: "center" }}>ตั้งค่าระบบทำย้อนหลัง</div>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, textAlign: "center" }}>
              กำหนดจำนวนวันที่อนุญาตให้ทำรายการย้อนหลังได้ และเลือกตั้งค่าเปิดระบบเฉพาะบางวันได้
            </div>

            {/* Part 1: Backdate Day Limit */}
            <div style={{ display: "grid", gap: 6 }}>
              <span style={fieldLabelStyle}>จำนวนวันย้อนหลัง (วัน)</span>
              <input
                type="number"
                min="0"
                max="90"
                value={tempBackdateLimit}
                onChange={(e) => setTempBackdateLimit(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 14, textAlign: "center" }}
              />
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${T.line}`, margin: "4px 0" }} />

            {/* Part 2: Custom Allowed Days/Dates */}
            <div style={{ display: "grid", gap: 10 }}>
              <span style={fieldLabelStyle}>กำหนดวันเปิดระบบ</span>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>
                <input
                  type="radio"
                  name="allowedMode"
                  value="all"
                  checked={allowedMode === "all"}
                  onChange={() => setAllowedMode("all")}
                />
                อนุญาตทุกวัน (ค่าเริ่มต้น)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>
                <input
                  type="radio"
                  name="allowedMode"
                  value="custom"
                  checked={allowedMode === "custom"}
                  onChange={() => setAllowedMode("custom")}
                />
                กำหนดวันเปิดระบบด้วยตนเอง
              </label>
            </div>

            {allowedMode === "custom" && (
              <div style={{ display: "grid", gap: 14, borderTop: `1px dashed ${T.lineStrong}`, paddingTop: 14 }}>
                {/* Weekday Selection */}
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>เลือกวันในสัปดาห์ที่เปิดระบบ</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      { key: 0, label: "อา" },
                      { key: 1, label: "จ" },
                      { key: 2, label: "อ" },
                      { key: 3, label: "พ" },
                      { key: 4, label: "พฤ" },
                      { key: 5, label: "ศ" },
                      { key: 6, label: "ส" },
                    ].map(day => {
                      const checked = allowedWeekdays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            setAllowedWeekdays(prev =>
                              prev.includes(day.key)
                                ? prev.filter(k => k !== day.key)
                                : [...prev, day.key]
                            );
                          }}
                          style={{
                            height: 32,
                            padding: "0 10px",
                            borderRadius: 8,
                            border: checked ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
                            background: checked ? T.accentSoft : "#fff",
                            color: checked ? T.accentDeep : T.ink,
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Date Picker */}
                <div style={{ display: "grid", gap: 6 }}>
                  <span style={fieldLabelStyle}>เพิ่มวันที่ที่เปิดระบบเพิ่มเติม</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="date"
                      value={newAllowedDate}
                      onChange={(e) => setNewAllowedDate(e.target.value)}
                      style={{ ...inputStyle, minHeight: 36, padding: "0 10px", borderRadius: 8, fontSize: 13, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAllowedDate && !allowedDates.includes(newAllowedDate)) {
                          setAllowedDates(prev => [...prev, newAllowedDate].sort());
                          setNewAllowedDate("");
                        }
                      }}
                      style={{ ...buttonPrimaryStyle, height: 36, borderRadius: 8, fontSize: 12.5, boxShadow: "none", padding: "0 14px" }}
                    >
                      เพิ่มวัน
                    </button>
                  </div>

                  {/* Render list of specific dates */}
                  {allowedDates.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, maxHeight: 100, overflowY: "auto", padding: 4, background: "#fdfdfb", borderRadius: 8, border: `1px solid ${T.line}` }}>
                      {allowedDates.map(dateStr => (
                        <span
                          key={dateStr}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "2px 8px",
                            background: "var(--brand-soft)",
                            border: `1px solid ${T.line}`,
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 800,
                          }}
                        >
                          {dateStr}
                          <button
                            type="button"
                            onClick={() => setAllowedDates(prev => prev.filter(d => d !== dateStr))}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: T.danger,
                              fontSize: 11,
                              fontWeight: 900,
                              cursor: "pointer",
                              padding: "0 2px",
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={handleCancelBackdateModal}
                style={{ ...buttonGhostStyle, height: 38, borderRadius: 10, fontSize: 13 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveBackdateModal}
                style={{ ...buttonPrimaryStyle, height: 38, borderRadius: 10, fontSize: 13, background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)`, boxShadow: "none" }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedSub ? (
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
                            <div style={{ fontSize: 12.5, marginTop: 4, color: T.foreground2, borderTop: `1px dashed ${T.line}`, paddingTop: 4 }}>
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

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                style={{ ...buttonPrimaryStyle, height: 38, borderRadius: 10, fontSize: 13, background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)`, boxShadow: "none" }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.accentDeep, textTransform: "uppercase" }}>REPORT EDITOR</div>
                <div style={{ fontSize: 20, fontWeight: 950, color: T.ink }}>แก้ไขข้อมูลรายงานแบบประเมิน</div>
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
                  placeItems: "center"
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>PMS</span>
                <input
                  value={editingReport.pms}
                  onChange={(event) => setEditingReport((prev) => ({ ...prev, pms: event.target.value }))}
                  style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
                />
              </label>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>Year</span>
                <input
                  type="number"
                  value={editingReport.year}
                  onChange={(event) => setEditingReport((prev) => ({ ...prev, year: event.target.value }))}
                  style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
                />
              </label>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>เดือน</span>
                <select
                  value={editingReport.month}
                  onChange={(event) => setEditingReport((prev) => ({ ...prev, month: event.target.value }))}
                  style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13, padding: "0 10px", cursor: "pointer" }}
                >
                  {REPORT_MONTH_OPTIONS.filter((month) => month.value !== "all").map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </label>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>กิจกรรม</span>
                <select
                  value={editingReport.activityType}
                  onChange={(event) => setEditingReport((prev) => ({ ...prev, activityType: event.target.value }))}
                  style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13, padding: "0 10px", cursor: "pointer" }}
                >
                  {REPORT_ACTIVITY_OPTIONS.filter((activity) => activity.value !== "all").map((activity) => (
                    <option key={activity.value} value={activity.value}>{activity.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>ชื่อ - นามสกุล</span>
              <input
                value={editingReport.name}
                onChange={(event) => setEditingReport((prev) => ({ ...prev, name: event.target.value }))}
                style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>E-mail</span>
              <input
                value={editingReport.email}
                onChange={(event) => setEditingReport((prev) => ({ ...prev, email: event.target.value }))}
                style={{ ...inputStyle, minHeight: 42, borderRadius: 10, fontSize: 13 }}
              />
            </label>

            <div style={{ fontSize: 12.5, color: T.sub }}>
              แหล่งข้อมูล: {editingReport.source === "submission" ? "รายการที่บันทึกในระบบ" : editingReport.source === "upload" ? "ไฟล์ Excel ที่อัปโหลด" : "mock records"} 
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
                style={{ ...buttonPrimaryStyle, height: 40, borderRadius: 10, fontSize: 13, background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)`, boxShadow: "none" }}
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add / Edit Plant Modal */}
      {(addingPlant || editingPlant) && (
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
              width: "min(100%, 680px)",
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
                <div style={{ fontSize: 11, fontWeight: 800, color: T.accentDeep, textTransform: "uppercase" }}>
                  {selectedType === "factory" 
                    ? (addingPlant ? "ADD NEW PLANT" : "EDIT PLANT RECORD")
                    : selectedType === "office"
                    ? (addingPlant ? "ADD NEW OFFICE" : "EDIT OFFICE RECORD")
                    : (addingPlant ? "ADD NEW SITE" : "EDIT SITE RECORD")}
                </div>
                <div style={{ fontSize: 20, fontWeight: 950, color: T.ink }}>
                  {selectedType === "factory" 
                    ? (addingPlant ? "เพิ่มข้อมูลโรงงานใหม่" : "แก้ไขข้อมูลโรงงาน")
                    : selectedType === "office"
                    ? (addingPlant ? "เพิ่มข้อมูลสำนักงานใหม่" : "แก้ไขข้อมูลสำนักงาน")
                    : (addingPlant ? "เพิ่มข้อมูลไซต์งานใหม่" : "แก้ไขข้อมูลไซต์งาน")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddingPlant(false);
                  setEditingPlant(null);
                }}
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

            {/* Form Fields */}
            <div style={{ display: "grid", gap: 14 }}>
              {selectedType === "factory" ? (
                <>
                  {/* Plant Info (Required) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>รหัสโรงงาน (Plant Code) *</span>
                      <input
                        value={plantForm.plantCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, plantCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 1311"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>ชื่อโรงงาน (Plant Name) *</span>
                      <input
                        value={plantForm.plantName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, plantName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น โรงงานเขาวง"
                      />
                    </label>
                  </div>

                  {/* Company Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>รหัสบริษัท (Company Code)</span>
                      <input
                        value={plantForm.companyCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, companyCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 130"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>ชื่อบริษัท (Company Name)</span>
                      <input
                        value={plantForm.companyName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, companyName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น บริษัท ปูนซิเมนต์ไทย จำกัด"
                      />
                    </label>
                  </div>

                  {/* Division Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>รหัสกอง (Division Code)</span>
                      <input
                        value={plantForm.divisionCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, divisionCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 90000140"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>ชื่อกอง (Division Name)</span>
                      <input
                        value={plantForm.divisionName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, divisionName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น CPAC Metro"
                      />
                    </label>
                  </div>

                  {/* Department Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>รหัสแผนก (Dept Code)</span>
                      <input
                        value={plantForm.deptCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, deptCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 00014302"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>ชื่อแผนก (Dept Name)</span>
                      <input
                        value={plantForm.deptName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, deptName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น Metro 3"
                      />
                    </label>
                  </div>

                  {/* Section Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>รหัสส่วน (Section Code)</span>
                      <input
                        value={plantForm.secCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, secCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 00014432"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>ชื่อส่วน (Section Name)</span>
                      <input
                        value={plantForm.secName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, secName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น Prod.สุวรรณภูมิ"
                      />
                    </label>
                  </div>
                </>
              ) : selectedType === "office" ? (
                <>
                  {/* Office Info (Required) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>รหัสสำนักงาน (Office Code) *</span>
                      <input
                        value={plantForm.officeCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, officeCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น OFF-GEN-01"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>ชื่อสำนักงาน (Office Name) *</span>
                      <input
                        value={plantForm.officeName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, officeName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น สำนักงานใหญ่บางซื่อ"
                      />
                    </label>
                  </div>

                  {/* Company Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>รหัสบริษัท (Company Code)</span>
                      <input
                        value={plantForm.companyCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, companyCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 130"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ชื่อบริษัท (Company Name)</span>
                      <input
                        value={plantForm.companyName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, companyName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น บริษัท ปูนซิเมนต์ไทย จำกัด"
                      />
                    </label>
                  </div>

                  {/* Division Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>รหัสกอง (Division Code)</span>
                      <input
                        value={plantForm.divisionCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, divisionCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 90000140"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ชื่อกอง (Division Name)</span>
                      <input
                        value={plantForm.divisionName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, divisionName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น CPAC Metro"
                      />
                    </label>
                  </div>

                  {/* Department Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>รหัสแผนก (Dept Code)</span>
                      <input
                        value={plantForm.deptCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, deptCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น 00014302"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ชื่อแผนก (Dept Name)</span>
                      <input
                        value={plantForm.deptName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, deptName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น Metro 3"
                      />
                    </label>
                  </div>

                  {/* Floor / Zone */}
                  <label style={fieldStyle}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ชั้น / โซน (Floor/Zone)</span>
                    <input
                      value={plantForm.floor}
                      onChange={(e) => setPlantForm(prev => ({ ...prev, floor: e.target.value }))}
                      style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                      placeholder="เช่น ชั้น 12 โซน A"
                    />
                  </label>
                </>
              ) : (
                <>
                  {/* Site Info (Required) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>รหัสไซต์งาน (Project Code) *</span>
                      <input
                        value={plantForm.projectCode}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, projectCode: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น STE-GEN-01"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ชื่อไซต์งาน (Project Name) *</span>
                      <input
                        value={plantForm.projectName}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, projectName: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น Site พญาไท เฟส 1"
                      />
                    </label>
                  </div>

                  {/* Customer & Contractor */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ลูกค้า (Customer)</span>
                      <input
                        value={plantForm.customer}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, customer: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น Sansiri PLC"
                      />
                    </label>
                    <label style={fieldStyle}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ผู้รับเหมา (Contractor)</span>
                      <input
                        value={plantForm.contractor}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, contractor: e.target.value }))}
                        style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                        placeholder="เช่น Italian-Thai Development"
                      />
                    </label>
                  </div>

                  {/* Stage / Phase */}
                  <label style={fieldStyle}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ขั้นตอนการทำงาน (Stage/Phase)</span>
                    <input
                      value={plantForm.stage}
                      onChange={(e) => setPlantForm(prev => ({ ...prev, stage: e.target.value }))}
                      style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                      placeholder="เช่น Structural Phase (งานโครงสร้าง)"
                    />
                  </label>
                </>
              )}

              {/* Status & Coordinates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <label style={fieldStyle}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>สถานะ (Status)</span>
                  <input
                    value={plantForm.status}
                    onChange={(e) => setPlantForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                    placeholder={selectedType === "factory" ? "เช่น CPAC หรือ ACTIVE" : "เช่น ACTIVE หรือ INACTIVE"}
                  />
                </label>
                <label style={fieldStyle}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ละติจูด (Latitude)</span>
                  <input
                    type="number"
                    step="any"
                    value={plantForm.lat}
                    onChange={(e) => setPlantForm(prev => ({ ...prev, lat: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                    placeholder="เช่น 13.5563"
                  />
                </label>
                <label style={fieldStyle}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>ลองจิจูด (Longitude)</span>
                  <input
                    type="number"
                    step="any"
                    value={plantForm.lng}
                    onChange={(e) => setPlantForm(prev => ({ ...prev, lng: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 40, borderRadius: 10, fontSize: 13 }}
                    placeholder="เช่น 100.7576"
                  />
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => {
                  setAddingPlant(false);
                  setEditingPlant(null);
                }}
                style={{ ...buttonGhostStyle, height: 40, borderRadius: 10, fontSize: 13 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={addingPlant ? submitAddPlant : submitEditPlant}
                style={{
                  ...buttonPrimaryStyle,
                  height: 40,
                  borderRadius: 10,
                  fontSize: 13,
                  background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)`,
                  boxShadow: "none"
                }}
              >
                {addingPlant 
                  ? (selectedType === "factory" ? "เพิ่มโรงงาน" : selectedType === "office" ? "เพิ่มสำนักงาน" : "เพิ่มไซต์งาน") 
                  : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plant Confirmation Modal */}
      {deletePlantId && (
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
              width: "min(100%, 420px)",
              background: "var(--brand-surface)",
              borderRadius: 24,
              border: `1px solid ${T.line}`,
              boxShadow: "0 24px 60px rgba(31,26,23,0.22)",
              padding: 24,
              display: "grid",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 950 }}>ยืนยันการลบข้อมูลโรงงาน</div>
            <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
              คุณแน่ใจว่าต้องการลบข้อมูลโรงงานนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeletePlantId(null)}
                style={{ ...buttonGhostStyle, height: 38, borderRadius: 10, fontSize: 12.5 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeletePlant}
                style={{ ...buttonDangerStyle, height: 38, borderRadius: 10, fontSize: 12.5 }}
              >
                ลบโรงงาน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
