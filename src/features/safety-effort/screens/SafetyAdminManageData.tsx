// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import {
  ArrowLeft,
  Search,
  X,
  Upload,
  Pencil,
  Trash2,
  Building,
  Building2,
  Users,
  Layers,
  Factory,
  MapPin,
  Settings
} from "lucide-react";
import * as XLSX from "xlsx";
import { Combobox } from "@/components/ui/combobox";
import mockPlantsData from "@/features/safety-effort/config/mock_plants.json";
import mockOfficesData from "@/features/safety-effort/config/mock_offices.json";
import mockSitesData from "@/features/safety-effort/config/mock_sites.json";

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

const inputStylePremium = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  minHeight: 38,
  height: 38,
  padding: "0 12px",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s ease-in-out",
};

const selectStyle = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  minHeight: 38,
  height: 38,
  padding: "0 12px",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  transition: "border-color 0.15s ease-in-out",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundPosition: "right 10px center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "18px",
  paddingRight: "30px",
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

const getInitialOffices = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("suea-safety-offices-v1");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
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
      } catch (e) {}
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
      } catch (e) {}
    }
  }
  
  const initial = mockPlantsData.map((p, idx) => {
    const approvers = ["swongg", "", "", "sumrouya", "chaivutr"];
    return { ...p, approvedBy: approvers[idx % approvers.length] };
  });
  const factoryNames = ["หนองแค", "แก่งคอย", "พระประแดง", "ท่าหลวง", "บางซื่อ", "สามเสน", "ดอนเมือง", "ปทุมธานี", "รังสิต", "นครปฐม"];
  const divisionNames = ["CPAC Metro", "RMC Metro", "RMC East", "RMC West", "SMART Structure"];
  const statuses = ["CPAC", "ACTIVE", "INACTIVE"];
  const approverList = ["swongg", "chaivutr", "sumrouya", ""];

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
      lng: i % 5 === 0 ? 100.5 + (i * 0.01) : null,
      approvedBy: approverList[i % approverList.length]
    });
  }
  return initial;
};

export default function SafetyAdminManageData() {
  const navigate = useNavigate();
  const [width, setWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;

  const [selectedType, setSelectedType] = useState("factory"); // factory, office, site
  const [plantSearchQuery, setPlantSearchQuery] = useState("");
  const [plantPage, setPlantPage] = useState(1);
  const [plantPageSize, setPlantPageSize] = useState(10);

  const [plants, setPlants] = useState(() => getInitialPlants());
  const [offices, setOffices] = useState(() => getInitialOffices());
  const [sites, setSites] = useState(() => getInitialSites());

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
    lng: "",
    approvedBy: ""
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
      lng: "",
      approvedBy: ""
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
        lng: item.lng !== null ? String(item.lng) : "",
        approvedBy: item.approvedBy || ""
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
        lng: plantForm.lng ? parseFloat(plantForm.lng) : null,
        approvedBy: plantForm.approvedBy || ""
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
            lng: plantForm.lng ? parseFloat(plantForm.lng) : null,
            approvedBy: plantForm.approvedBy || ""
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

  const getUniqueOptions = (fieldCode) => {
    const set = new Set();
    plants.forEach(p => {
      const code = p[fieldCode];
      if (code) {
        set.add(code);
      }
    });
    return [
      { value: "", label: "[NULL]" },
      ...Array.from(set).map(val => ({ value: String(val), label: String(val) }))
    ];
  };

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

  // Adjust pagination page if filtered items count changes
  useEffect(() => {
    setPlantPage(1);
  }, [selectedType, plantSearchQuery]);

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
              <h1 style={{ fontSize: 18, fontWeight: 900, color: T.ink, margin: 0 }}>จัดการข้อมูล (Manage Data)</h1>
              <p style={{ fontSize: 12.5, color: T.sub, margin: "2px 0 0" }}>
                จัดการและนำเข้าข้อมูลโรงงาน สำนักงาน และไซต์งานที่เกี่ยวข้องในระบบ
              </p>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            gap: 16,
            minHeight: isMobile ? undefined : 0,
            overflow: "hidden",
            flexDirection: isMobile ? "column" : "row"
          }}
        >
          {/* Sidebar */}
          <div
            style={{
              width: isMobile ? "100%" : 260,
              background: T.card,
              border: `1px solid ${T.line}`,
              borderRadius: 24,
              padding: 16,
              boxShadow: T.shadow,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: T.accentDeep, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              หมวดหมู่ข้อมูล
            </div>
            {[
              { key: "factory", label: "โรงงาน (Plants)", icon: Building2 },
              { key: "office", label: "สำนักงาน (Offices)", icon: Building },
              { key: "site", label: "ไซต์งาน (Sites)", icon: Layers },
            ].map(type => {
              const Icon = type.icon;
              const active = selectedType === type.key;
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setSelectedType(type.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: active ? T.accentSoft : "transparent",
                    color: active ? T.accentDeep : T.ink,
                    fontWeight: active ? 800 : 600,
                    fontSize: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s"
                  }}
                >
                  <Icon size={16} style={{ color: active ? T.accent : T.sub }} />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main List Area */}
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
            {/* Header / Actions */}
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
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.accentDeep }}>
                  {selectedType === "factory" ? "จัดการข้อมูลโรงงาน" : selectedType === "office" ? "จัดการข้อมูลสำนักงาน" : "จัดการข้อมูลไซต์งาน"}
                </div>
                <div style={{ fontSize: 12.5, color: T.sub }}>
                  เพิ่ม แก้ไข ลบ หรือนำเข้าข้อมูลผ่านไฟล์ Excel
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
                  <span>นำเข้า Excel</span>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportPlantsFile} style={{ display: "none" }} />
                </label>
                <button
                  type="button"
                  onClick={handleAddPlant}
                  style={{
                    ...buttonPrimaryStyle,
                    height: 38,
                    borderRadius: 10,
                    fontSize: 12.5,
                    padding: "0 14px",
                    boxShadow: "none"
                  }}
                >
                  {selectedType === "factory" ? "+ Add Plant" : selectedType === "office" ? "+ เพิ่มสำนักงาน" : "+ เพิ่มไซต์งาน"}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                flexShrink: 0
              }}
            >
              <div style={{ position: "relative", width: isMobile ? "100%" : 300 }}>
                <input
                  type="text"
                  placeholder="ค้นหาข้อมูล..."
                  value={plantSearchQuery}
                  onChange={(event) => setPlantSearchQuery(event.target.value)}
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

            {/* List / Table */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {filteredPlants.length === 0 ? (
                <div style={{ border: `1px dashed ${T.lineStrong}`, borderRadius: 18, padding: 32, textAlign: "center", color: T.sub, fontSize: 14 }}>
                  ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                </div>
              ) : selectedType === "factory" ? (
                /* Plants Table */
                !isMobile ? (
                  <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", textAlign: "left", fontSize: "13.5px" }}>
                      <thead>
                        <tr style={{ background: "color-mix(in srgb, var(--brand-accent) 8%, transparent)", borderBottom: `2px solid ${T.line}` }}>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>ID</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Company</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Division</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Dept / Section</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Plant Code</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Plant Name</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Status</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Approved By</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, textAlign: "center", width: 90 }}>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPlants.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: idx < paginatedPlants.length - 1 ? `1px solid ${T.line}` : "none" }}>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.id}</td>
                            <td style={{ padding: "8px 16px" }}>{item.companyCode} <span style={{ color: T.sub, fontSize: 11 }}>({item.companyName})</span></td>
                            <td style={{ padding: "8px 16px" }}>{item.divisionCode} <span style={{ color: T.sub, fontSize: 11 }}>({item.divisionName})</span></td>
                            <td style={{ padding: "8px 16px" }}>
                              {item.deptCode ? `${item.deptCode} (${item.deptName})` : "-"}
                              {item.secCode && <div style={{ fontSize: 11, color: T.sub }}>{item.secCode} ({item.secName})</div>}
                            </td>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.plantCode}</td>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.plantName}</td>
                            <td style={{ padding: "8px 16px" }}>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: item.status === "ACTIVE" || item.status === "CPAC" ? "#14532d" : "#7c2d12",
                                background: item.status === "ACTIVE" || item.status === "CPAC" ? "#dcfce7" : "#ffedd5",
                                padding: "2px 6px",
                                borderRadius: 6
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: "8px 16px" }}>{item.approvedBy ? `${item.approvedBy}@scg.com` : "-"}</td>
                            <td style={{ padding: "8px 16px" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                                <button type="button" onClick={() => handleEditPlant(item)} style={{ ...buttonGhostStyle, width: 28, height: 28, borderRadius: 6, padding: 0, display: "grid", placeItems: "center" }} title="แก้ไข"><Pencil size={12} /></button>
                                <button type="button" onClick={() => handleDeletePlant(item.id)} style={{ ...buttonDangerStyle, width: 28, height: 28, borderRadius: 6, padding: 0, display: "grid", placeItems: "center" }} title="ลบ"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Plants Card View */
                  <div style={{ display: "grid", gap: 10 }}>
                    {paginatedPlants.map(item => (
                      <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: 12, fontSize: 13 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: 6 }}>
                          <span style={{ fontWeight: 800 }}>{item.plantName} <span style={{ color: T.sub, fontSize: 11 }}>({item.plantCode})</span></span>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: item.status === "ACTIVE" || item.status === "CPAC" ? "#14532d" : "#7c2d12",
                            background: item.status === "ACTIVE" || item.status === "CPAC" ? "#dcfce7" : "#ffedd5",
                            padding: "2px 6px",
                            borderRadius: 4
                          }}>{item.status}</span>
                        </div>
                        <div><strong style={{ color: T.sub }}>Company:</strong> {item.companyCode} ({item.companyName})</div>
                        <div><strong style={{ color: T.sub }}>Division:</strong> {item.divisionName}</div>
                        {(item.deptCode || item.secCode) && (
                          <div>
                            <strong style={{ color: T.sub }}>Dept/Sec:</strong> {item.deptName} {item.secName ? `/ ${item.secName}` : ""}
                          </div>
                        )}
                        <div><strong style={{ color: T.sub }}>Approved By:</strong> {item.approvedBy ? `${item.approvedBy}@scg.com` : "-"}</div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.line}` }}>
                          <button type="button" onClick={() => handleEditPlant(item)} style={{ ...buttonGhostStyle, height: 28, borderRadius: 6, fontSize: 12, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}><Pencil size={11} /> แก้ไข</button>
                          <button type="button" onClick={() => handleDeletePlant(item.id)} style={{ ...buttonDangerStyle, height: 28, borderRadius: 6, fontSize: 12, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={11} /> ลบ</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : selectedType === "office" ? (
                /* Offices Table */
                !isMobile ? (
                  <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", textAlign: "left", fontSize: "13.5px" }}>
                      <thead>
                        <tr style={{ background: "color-mix(in srgb, var(--brand-accent) 8%, transparent)", borderBottom: `2px solid ${T.line}` }}>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>ID</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Company</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Division</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Dept</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Office Code</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Office Name</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Floor</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Status</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, textAlign: "center", width: 90 }}>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPlants.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: idx < paginatedPlants.length - 1 ? `1px solid ${T.line}` : "none" }}>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.id}</td>
                            <td style={{ padding: "8px 16px" }}>{item.companyCode} <span style={{ color: T.sub, fontSize: 11 }}>({item.companyName})</span></td>
                            <td style={{ padding: "8px 16px" }}>{item.divisionCode} <span style={{ color: T.sub, fontSize: 11 }}>({item.divisionName})</span></td>
                            <td style={{ padding: "8px 16px" }}>{item.deptCode} <span style={{ color: T.sub, fontSize: 11 }}>({item.deptName})</span></td>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.officeCode}</td>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.officeName}</td>
                            <td style={{ padding: "8px 16px" }}>{item.floor}</td>
                            <td style={{ padding: "8px 16px" }}>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: item.status === "ACTIVE" ? "#14532d" : "#7c2d12",
                                background: item.status === "ACTIVE" ? "#dcfce7" : "#ffedd5",
                                padding: "2px 6px",
                                borderRadius: 6
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: "8px 16px" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                                <button type="button" onClick={() => handleEditPlant(item)} style={{ ...buttonGhostStyle, width: 28, height: 28, borderRadius: 6, padding: 0, display: "grid", placeItems: "center" }} title="แก้ไข"><Pencil size={12} /></button>
                                <button type="button" onClick={() => handleDeletePlant(item.id)} style={{ ...buttonDangerStyle, width: 28, height: 28, borderRadius: 6, padding: 0, display: "grid", placeItems: "center" }} title="ลบ"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Offices Card View */
                  <div style={{ display: "grid", gap: 10 }}>
                    {paginatedPlants.map(item => (
                      <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: 12, fontSize: 13 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: 6 }}>
                          <span style={{ fontWeight: 800 }}>{item.officeName} <span style={{ color: T.sub, fontSize: 11 }}>({item.officeCode})</span></span>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: item.status === "ACTIVE" ? "#14532d" : "#7c2d12",
                            background: item.status === "ACTIVE" ? "#dcfce7" : "#ffedd5",
                            padding: "2px 6px",
                            borderRadius: 4
                          }}>{item.status}</span>
                        </div>
                        <div><strong style={{ color: T.sub }}>Company:</strong> {item.companyCode} ({item.companyName})</div>
                        <div><strong style={{ color: T.sub }}>Dept:</strong> {item.deptCode} ({item.deptName})</div>
                        <div><strong style={{ color: T.sub }}>Floor:</strong> {item.floor || "-"}</div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.line}` }}>
                          <button type="button" onClick={() => handleEditPlant(item)} style={{ ...buttonGhostStyle, height: 28, borderRadius: 6, fontSize: 12, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}><Pencil size={11} /> แก้ไข</button>
                          <button type="button" onClick={() => handleDeletePlant(item.id)} style={{ ...buttonDangerStyle, height: 28, borderRadius: 6, fontSize: 12, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={11} /> ลบ</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Sites Table */
                !isMobile ? (
                  <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", textAlign: "left", fontSize: "13.5px" }}>
                      <thead>
                        <tr style={{ background: "color-mix(in srgb, var(--brand-accent) 8%, transparent)", borderBottom: `2px solid ${T.line}` }}>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>ID</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Project Code</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Project Name</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Customer</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Contractor</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Stage</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub }}>Status</th>
                          <th style={{ padding: "10px 16px", fontWeight: 800, color: T.sub, textAlign: "center", width: 90 }}>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPlants.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: idx < paginatedPlants.length - 1 ? `1px solid ${T.line}` : "none" }}>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.id}</td>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.projectCode}</td>
                            <td style={{ padding: "8px 16px", fontWeight: 700 }}>{item.projectName}</td>
                            <td style={{ padding: "8px 16px" }}>{item.customer || "-"}</td>
                            <td style={{ padding: "8px 16px" }}>{item.contractor || "-"}</td>
                            <td style={{ padding: "8px 16px" }}>{item.stage || "-"}</td>
                            <td style={{ padding: "8px 16px" }}>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: item.status === "ACTIVE" ? "#14532d" : "#7c2d12",
                                background: item.status === "ACTIVE" ? "#dcfce7" : "#ffedd5",
                                padding: "2px 6px",
                                borderRadius: 6
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: "8px 16px" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                                <button type="button" onClick={() => handleEditPlant(item)} style={{ ...buttonGhostStyle, width: 28, height: 28, borderRadius: 6, padding: 0, display: "grid", placeItems: "center" }} title="แก้ไข"><Pencil size={12} /></button>
                                <button type="button" onClick={() => handleDeletePlant(item.id)} style={{ ...buttonDangerStyle, width: 28, height: 28, borderRadius: 6, padding: 0, display: "grid", placeItems: "center" }} title="ลบ"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Sites Card View */
                  <div style={{ display: "grid", gap: 10 }}>
                    {paginatedPlants.map(item => (
                      <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, padding: 12, fontSize: 13 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: 6 }}>
                          <span style={{ fontWeight: 800 }}>{item.projectName} <span style={{ color: T.sub, fontSize: 11 }}>({item.projectCode})</span></span>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: item.status === "ACTIVE" ? "#14532d" : "#7c2d12",
                            background: item.status === "ACTIVE" ? "#dcfce7" : "#ffedd5",
                            padding: "2px 6px",
                            borderRadius: 4
                          }}>{item.status}</span>
                        </div>
                        <div><strong style={{ color: T.sub }}>Customer:</strong> {item.customer || "-"}</div>
                        <div><strong style={{ color: T.sub }}>Contractor:</strong> {item.contractor || "-"}</div>
                        <div><strong style={{ color: T.sub }}>Stage:</strong> {item.stage || "-"}</div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.line}` }}>
                          <button type="button" onClick={() => handleEditPlant(item)} style={{ ...buttonGhostStyle, height: 28, borderRadius: 6, fontSize: 12, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}><Pencil size={11} /> แก้ไข</button>
                          <button type="button" onClick={() => handleDeletePlant(item.id)} style={{ ...buttonDangerStyle, height: 28, borderRadius: 6, fontSize: 12, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={11} /> ลบ</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Pagination Controls */}
            {totalPlantPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderTop: `1px solid ${T.line}`,
                  paddingTop: 12,
                  flexShrink: 0
                }}
              >
                <div style={{ fontSize: 13, color: T.sub }}>
                  Showing {(plantPage - 1) * plantPageSize + 1} to {Math.min(plantPage * plantPageSize, filteredPlants.length)} of {filteredPlants.length} entries
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      disabled={plantPage === 1}
                      onClick={() => setPlantPage(prev => Math.max(prev - 1, 1))}
                      style={{ ...buttonGhostStyle, height: 32, borderRadius: 8, fontSize: 12.5, padding: "0 10px" }}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPlantPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isCurrent = pageNum === plantPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPlantPage(pageNum)}
                          style={isCurrent 
                            ? {
                                height: 32,
                                minWidth: 32,
                                borderRadius: 8,
                                border: "none",
                                background: T.accent,
                                color: "#fff",
                                fontWeight: 800,
                                fontSize: 12.5,
                                cursor: "pointer"
                              }
                            : { ...buttonGhostStyle, height: 32, minWidth: 32, borderRadius: 8, fontSize: 12.5, padding: 0 }
                          }
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={plantPage === totalPlantPages}
                      onClick={() => setPlantPage(prev => Math.min(prev + 1, totalPlantPages))}
                      style={{ ...buttonGhostStyle, height: 32, borderRadius: 8, fontSize: 12.5, padding: "0 10px" }}
                    >
                      Next
                    </button>
                  </div>

                  <Combobox
                    value={String(plantPageSize)}
                    onValueChange={(v) => { setPlantPageSize(parseInt(v)); setPlantPage(1); }}
                    aria-label="จำนวนต่อหน้า"
                    searchable={false}
                    style={{ width: 120 }}
                    options={[
                      { value: "5", label: "5 / page" },
                      { value: "10", label: "10 / page" },
                      { value: "20", label: "20 / page" },
                      { value: "50", label: "50 / page" },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
              width: selectedType === "factory" ? "min(100%, 920px)" : "min(100%, 680px)",
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.line}`, paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {selectedType === "factory" ? (
                  <Building2 size={20} style={{ color: "#2563eb" }} />
                ) : selectedType === "office" ? (
                  <Building size={20} style={{ color: "#2563eb" }} />
                ) : (
                  <Layers size={20} style={{ color: "#2563eb" }} />
                )}
                <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>
                  {selectedType === "factory" 
                    ? (addingPlant ? "Add Plant Record" : "Edit Plant Record")
                    : selectedType === "office"
                    ? (addingPlant ? "Add Office Record" : "Edit Office Record")
                    : (addingPlant ? "Add Site Record" : "Edit Site Record")}
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px 18px" }}>
                  {/* Row 1: Company, Division, Status */}
                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <Building size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#2563eb" }} /> Company
                    </span>
                    <select
                      value={plantForm.companyCode || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = plants.find(p => p.companyCode === val);
                        setPlantForm(prev => ({
                          ...prev,
                          companyCode: val,
                          companyName: found ? found.companyName : (val === "" ? "[NULL]" : "No name")
                        }));
                      }}
                      style={selectStyle}
                    >
                      {getUniqueOptions("companyCode").map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>

                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <Users size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#10b981" }} /> Division
                    </span>
                    <select
                      value={plantForm.divisionCode || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = plants.find(p => p.divisionCode === val);
                        setPlantForm(prev => ({
                          ...prev,
                          divisionCode: val,
                          divisionName: found ? found.divisionName : (val === "" ? "[NULL]" : "")
                        }));
                      }}
                      style={selectStyle}
                    >
                      {getUniqueOptions("divisionCode").map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>

                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <Settings size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#6b7280" }} /> Status
                    </span>
                    <select
                      value={plantForm.status || ""}
                      onChange={(e) => setPlantForm(prev => ({ ...prev, status: e.target.value }))}
                      style={selectStyle}
                    >
                      <option value="CPAC">CPAC</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </label>

                  {/* Row 2: Department, Section, Approved By */}
                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <Layers size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#8b5cf6" }} /> Department
                    </span>
                    <select
                      value={plantForm.deptCode || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = plants.find(p => p.deptCode === val);
                        setPlantForm(prev => ({
                          ...prev,
                          deptCode: val,
                          deptName: found ? found.deptName : (val === "" ? "[NULL]" : "")
                        }));
                      }}
                      style={selectStyle}
                    >
                      {getUniqueOptions("deptCode").map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>

                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <Layers size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#8b5cf6" }} /> Section
                    </span>
                    <select
                      value={plantForm.secCode || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = plants.find(p => p.secCode === val);
                        setPlantForm(prev => ({
                          ...prev,
                          secCode: val,
                          secName: found ? found.secName : (val === "" ? "[NULL]" : "")
                        }));
                      }}
                      style={selectStyle}
                    >
                      {getUniqueOptions("secCode").map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>

                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <Users size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#6b7280" }} /> Approved By
                    </span>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        value={plantForm.approvedBy || ""}
                        onChange={(e) => setPlantForm(prev => ({ ...prev, approvedBy: e.target.value }))}
                        style={{ ...inputStylePremium, paddingRight: 85 }}
                        placeholder="Enter approver"
                      />
                      <span style={{ position: "absolute", right: 14, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}>
                        @scg.com
                      </span>
                    </div>
                  </label>

                  {/* Row 3: Plant Code, Plant Name (spans 2) */}
                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <Factory size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#ea580c" }} /> Plant Code
                    </span>
                    <input
                      value={plantForm.plantCode || ""}
                      onChange={(e) => setPlantForm(prev => ({ ...prev, plantCode: e.target.value }))}
                      style={inputStylePremium}
                      placeholder="เช่น 1311"
                    />
                  </label>

                  <label style={{ ...fieldStyle, gridColumn: "span 2" }}>
                    <span style={fieldLabelStyle}>
                      <Building2 size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#ea580c" }} /> Plant Name
                    </span>
                    <input
                      value={plantForm.plantName || ""}
                      onChange={(e) => setPlantForm(prev => ({ ...prev, plantName: e.target.value }))}
                      style={inputStylePremium}
                      placeholder="เช่น โรงงานเขาวง"
                    />
                  </label>

                  {/* Row 4: Latitude, Longitude */}
                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <MapPin size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#ef4444" }} /> Latitude
                    </span>
                    <input
                      value={plantForm.lat === "" || plantForm.lat === null ? "[NULL]" : plantForm.lat}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlantForm(prev => ({ ...prev, lat: val === "[NULL]" ? "" : val }));
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "[NULL]") {
                          setPlantForm(prev => ({ ...prev, lat: "" }));
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") {
                          setPlantForm(prev => ({ ...prev, lat: "" }));
                        }
                      }}
                      style={inputStylePremium}
                      placeholder="เช่น 13.5563"
                    />
                  </label>

                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>
                      <MapPin size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4, color: "#ef4444" }} /> Longitude
                    </span>
                    <input
                      value={plantForm.lng === "" || plantForm.lng === null ? "[NULL]" : plantForm.lng}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlantForm(prev => ({ ...prev, lng: val === "[NULL]" ? "" : val }));
                      }}
                      onFocus={(e) => {
                        if (e.target.value === "[NULL]") {
                          setPlantForm(prev => ({ ...prev, lng: "" }));
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") {
                          setPlantForm(prev => ({ ...prev, lng: "" }));
                        }
                      }}
                      style={inputStylePremium}
                      placeholder="เช่น 100.7576"
                    />
                  </label>
                </div>
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
              {selectedType !== "factory" && (
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
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => {
                  setAddingPlant(false);
                  setEditingPlant(null);
                }}
                style={selectedType === "factory" 
                  ? {
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      color: "#374151",
                      height: 38,
                      padding: "0 18px",
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }
                  : { ...buttonGhostStyle, height: 40, borderRadius: 10, fontSize: 13 }
                }
              >
                {selectedType === "factory" ? "Cancel" : "ยกเลิก"}
              </button>
              <button
                type="button"
                onClick={addingPlant ? submitAddPlant : submitEditPlant}
                style={selectedType === "factory"
                  ? {
                      background: "#2563eb",
                      border: "none",
                      color: "#ffffff",
                      height: 38,
                      padding: "0 18px",
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }
                  : {
                      ...buttonPrimaryStyle,
                      height: 40,
                      borderRadius: 10,
                      fontSize: 13,
                      background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDeep} 100%)`,
                      boxShadow: "none"
                    }
                }
              >
                {selectedType === "factory" 
                  ? (addingPlant ? "Add" : "Update")
                  : (addingPlant 
                      ? (selectedType === "office" ? "เพิ่มสำนักงาน" : "เพิ่มไซต์งาน") 
                      : "บันทึกการแก้ไข")}
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
