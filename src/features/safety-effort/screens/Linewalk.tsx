// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "@/lib/router-compat";
import RestrictedDatePicker from "@/components/RestrictedDatePicker";
import {
  PRESET_COMPANIES,
  PRESET_DEPTS,
  PRESET_DIVISIONS,
  PRESET_FACTORIES,
  PRESET_OFFICES,
  PRESET_REGIONS,
  PRESET_SITES,
  createInitialItemStates,
  getChecklistForType,
} from "@/features/safety-effort/config/checklists";

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  background:  "#f1ecdf",
  foreground:  "#0e0f12",
  foreground2: "#33312c",
  foreground3: "#767269",
  surface2:    "#f5eedf",
  primary:     "#ffc400",
  primarySoft: "#fff4cf",
  danger:      "#d5301a",
  ok:          "#1f7a55",
  primaryDark: "#92400e",
  border:      "rgba(14,15,18,0.08)",
};

// ─── Preset data ────────────────────────────────────────────────────────────
const PRESET_DEPTS     = ["RMC Metro","RMC EAST","RMC WEST","RMC NORTH","RMC NORTHEAST","RMC SOUTH","QMIX"];
const PRESET_COMPANIES = ["SMART Structure","CPAC Group","SCG Cement","Tiger Safety Co."];
const PRESET_REGIONS   = ["Operation","Region 1","Region 2","Region 3","Headquarters"];
const PRESET_DIVISIONS = ["Production","Maintenance","QA/QC","Warehouse & Shipping"];
const PRESET_FACTORIES = ["หนองแค","แก่งคอย","พระประแดง","ท่าหลวง","บางซื่อ"];
const PRESET_OFFICES   = ["สำนักงานซีแพคบางซ่อน","สำนักงานใหญ่บางซื่อ","สำนักงานระยอง","สำนักงานเชียงใหม่"];
const PRESET_SITES     = ["Site บางซื่อ","Site รัชดา","Site สุขุมวิท","Site พญาไท"];

// ─── Checklist data ─────────────────────────────────────────────────────────
const FACTORY_CHECKLIST = [
  { id:"mixer", title:"Mixer", guidelines:["มีป้ายข้อปฏิบัติงาน ก่อนเข้าใน Mixer","มีป้ายบังคับสวมใส่อุปกรณ์ PPE บริเวณ Mixer","มีระบบล็อคฝา Mixer และตู้ Load break switch มีสภาพที่ดี","มี Emergency Switch ในจุดที่เหมาะสมใช้งานได้ พร้อมป้ายบ่งชี้","มี Limit switch ที่ฝา Mixer ครบทุกฝา และใช้งานได้","มีราวกันตกด้านหลัง Mixer ที่ปลอดภัย","มีการครอบจุดหมุนของ Mixer เช่น สายพาน, ยอยเกียร์, ท้าย Motor ให้มิดชิด"] },
  { id:"skiphoist", title:"Skiphoist", guideTitle:"แนวทางการตรวจ Skiphoist", guidelines:["มีการ์ด/ประตู กั้นห้อง Skip-hoist ให้มิดชิดทุกด้าน","มีกุญแจล็อคประตู Skip-hoist และมีการใช้งาน","มี Limit switch ประตู Skip-hoist ครบทุกบาน และใช้งานได้","มี Emergency Switch ในจุดที่เหมาะสมใช้งานได้ พร้อมป้ายบ่งชี้"] },
  { id:"sand-drag", title:"เครื่องลากหิน-ทราย", guideTitle:"แนวทางการตรวจ เครื่องลาก หิน ทราย", guidelines:["มีการชี้แบ่งแนวเขตอันตรายที่ปลายกองหิน-ทราย เห็นชัดเจน","มีป้ายเตือนระวังอันตรายจากกระเบลากหิน-ทราย","มีทาสี และบ่งชี้แสดงจุดหมุนของท้ายเครื่องลากเห็นชัดเจน","มี Emergency Switch ในจุดที่เหมาะสมใช้งานได้ พร้อมป้ายบ่งชี้","มีกระจกนิรภัย/การ์ดป้องกัน หน้าเก๋งเครื่องลาก อย่างมิดชิด"] },
  { id:"motor-pump", title:"MOTOR / ปั๊ม", guideTitle:"แนวทางการตรวจ Motor / ปั๊ม", guidelines:["มีการ์ดครอบจุดหมุน เช่น ยอย, ใบพัดท้าย Motor ที่มิดชิด","มีการต่อสายดิน ถูกต้องและปลอดภัย","สภาพสายไฟ และอุปกรณ์ไฟฟ้า ปลอดภัยไม่ชำรุด"] },
  { id:"tools", title:"เครื่องมือ/อุปกรณ์ : มีสติกเกอร์สีเขียวแสดงผ่านการรับรองปีล่าสุด", guidelines:["ตู้เชื่อมไฟฟ้า","เครื่องเจียร/ตัด","เครื่องเป่าลม (Blower)","High-pressure","แผงจ่ายไฟฟ้า","เครื่องตัดแก๊ส","พัดลมอุตสาหกรรม"] },
  { id:"mixer-truck", title:"รถโม่", guidelines:["กล้องติดครบ 2 ด้าน","สภาพความปลอดภัยตัวรถ เช่น ระบบเบรค/พวงมาลัย","ความพร้อมจบลส. เช่น การแต่งกายตามแบบฟอร์มของบริษัท"] },
  { id:"other", title:"Other : พฤติกรรมการทำงานที่มีความเสี่ยง/สิ่งแวดล้อม/อื่นๆ", guideTitle:false, guidelines:["พฤติกรรมการทำงานตามหลักกฎพิทักษ์ชีวิต","พบเหตุการณ์ที่อาจส่งผลต่อชุมชน","อื่นๆ"] },
  { id:"near-miss", title:"Near miss", guideTitle:false, guidelines:["เหตุการณ์เกือบเกิดอุบัติเหตุ หรือ Near Miss คือ เหตุการณ์ที่เกือบเกิดอุบัติเหตุแต่สามารถแก้ไขสถานการณ์ได้ทัน"] },
];

const OFFICE_CHECKLIST = [
  { id:"office-env", title:"ความปลอดภัยด้านโครงสร้างและสิ่งแวดล้อม", guideTitle:"แนวทางการตรวจ ความปลอดภัยด้านโครงสร้างและสิ่งแวดล้อม", guidelines:["พื้นทางเดินสะอาด ไม่มีสิ่งกีดขวาง หรือเศษวัสดุที่เป็นอันตราย","พื้นไม่เปียกชื้นหรือลื่น ไม่มีสายไฟพาดผ่านทางเดินที่อาจทำให้สะดุด","ประตู หน้าต่าง และกระจกอาคารอยู่ในสภาพสมบูรณ์และใช้งานได้ปลอดภัย","แสงสว่างในพื้นที่ทำงานและทางเดินเพียงพอและเหมาะสมกับการทำงาน"] },
  { id:"office-equip", title:"อุปกรณ์สำนักงาน", guideTitle:"แนวทางการตรวจ อุปกรณ์สำนักงาน", guidelines:["โต๊ะและเก้าอี้ทำงานอยู่ในสภาพดี ไม่ชำรุดเสียหาย และปรับระดับได้เหมาะสม","เครื่องใช้ไฟฟ้าในสำนักงาน (เช่น คอมพิวเตอร์ พรินเตอร์) อยู่ในสภาพดี ไม่มีสายไฟชำรุด","การจัดเก็บเอกสารและอุปกรณ์บนชั้นวางของมีความมั่นคง ไม่สูงเกินไปหรือเสี่ยงต่อการร่วงหล่น"] },
  { id:"office-fire", title:"ความปลอดภัยจากอัคคีภัย", guideTitle:"แนวทางการตรวจ ความปลอดภัยจากอัคคีภัย", guidelines:["ถังดับเพลิงมีสภาพพร้อมใช้งาน มีการตรวจสอบประจำปี และไม่มีสิ่งกีดขวาง","ทางหนีไฟและประตูทางออกฉุกเฉินไม่มีสิ่งกีดขวาง มีป้ายบอกทางสว่างและชัดเจน","ระบบตรวจจับควัน (Smoke Detector) และระบบสัญญาณเตือนภัยได้รับการดูแลรักษาให้อยู่ในสภาพดี"] },
  { id:"office-hygiene", title:"สุขอนามัยและความปลอดภัยส่วนบุคคล", guideTitle:"แนวทางการตรวจ สุขอนามัยและความปลอดภัยส่วนบุคคล", guidelines:["มีจุดบริการน้ำดื่มสะอาดและเพียงพอสำหรับพนักงาน","ห้องน้ำสะอาดและมีการทำความสะอาดอย่างสม่ำเสมอ มีสบู่ล้างมือและกระดาษชำระเพียงพอ","มีตู้ยาปฐมพยาบาลเบื้องต้นที่มีเวชภัณฑ์ครบถ้วนและไม่หมดอายุในจุดที่เข้าถึงได้ง่าย"] },
  { id:"office-prevent", title:"การป้องกันอุบัติเหตุ", guideTitle:"แนวทางการตรวจ การป้องกันอุบัติเหตุ", guidelines:["มีป้ายเตือนความปลอดภัยในจุดต่างระดับ หรือพื้นที่ที่กำลังมีการทำความสะอาด","เครื่องมือที่มีความคม เช่น เครื่องตัดกระดาษ กรรไกร ได้รับการจัดเก็บอย่างปลอดภัยหลังการใช้งาน","มีขั้นตอนและแนวทางการปฏิบัติเมื่อเกิดเหตุฉุกเฉินแจ้งให้พนักงานทราบชัดเจน"] },
  { id:"office-traffic", title:"การจัดการเส้นทางสัญจรและการจอดรถ", guideTitle:"แนวทางการตรวจ การจัดการเส้นทางสัญจรและการจอดรถ", guidelines:["มีการแบ่งเส้นทางเดินเท้าและเส้นทางเดินรถแยกกันอย่างชัดเจนบริเวณหน้าสำนักงาน","มีป้ายจราจรและสัญลักษณ์จำกัดความเร็วภายในพื้นที่จอดรถ","จัดพื้นที่จอดรถอย่างเป็นระเบียบ ไม่กีดขวางทางเข้าออกอาคารและทางหนีไฟ"] },
  { id:"office-walk", title:"ความปลอดภัยในการเดินเท้า", guideTitle:"แนวทางการตรวจ ความปลอดภัยในการเดินเท้า", guidelines:["รณรงค์ไม่ใช้โทรศัพท์มือถือขณะเดินในพื้นที่สำนักงาน หรือขณะขึ้น-ลงบันได","ทางเดินเท้าภายนอกอาคารเรียบสม่ำเสมอ ไม่มีน้ำขัง หลุมบ่อ หรือจุดสะดุดล้ม","มีราวจับบันไดที่มั่นคงแข็งแรง และพนักงานมีการใช้งานราวจับทุกครั้ง"] },
  { id:"office-speed", title:"การควบคุมความเร็วและพฤติกรรมการขับขี่", guideTitle:"แนวทางการตรวจ การควบคุมความเร็วและพฤติกรรมการขับขี่", guidelines:["มีการควบคุมความเร็วรถยนต์/รถจักรยานยนต์ภายในเขตสำนักงานไม่เกิน 20 กม./ชม.","พนักงานขับขี่รถยนต์คาดเข็มขัดนิรภัย และผู้ขับขี่รถจักรยานยนต์สวมหมวกกันน็อก 100%","จอดรถในพื้นที่ที่กำหนดเท่านั้น และไม่มีการขับรถย้อนศรหรือฝ่าฝืนกฎจราจร"] },
  { id:"office-other", title:"อื่น ๆ โปรดระบุรายละเอียด", guideTitle:false, guidelines:["ระบุประเด็นความปลอดภัยอื่นๆ ที่ตรวจพบเพิ่มเติมในสำนักงาน"] },
  { id:"office-near-miss", title:"Nearmiss", guideTitle:false, guidelines:["เหตุการณ์เกือบเกิดอุบัติเหตุ (Near Miss) คือเหตุการณ์ที่ไม่คาดคิดแต่ไม่ก่อให้เกิดความเสียหายหรือบาดเจ็บ","การรายงาน Near Miss ช่วยชี้จุดบกพร่องและแก้ไขเพื่อป้องกันไม่ให้เกิดอุบัติเหตุซ้ำขึ้นอีก"] },
];

const SITE_CHECKLIST = [
  { id:"site-readiness", title:"ความพร้อมของพื้นที่หน้างาน", guideTitle:"แนวทางการตรวจ ความพร้อมของพื้นที่หน้างาน", guidelines:["พื้นที่หน้างานมีการจัดเตรียมพร้อมสำหรับการรับคอนกรีต","มีการกั้นแนวเขตพื้นที่ปฏิบัติงานอย่างชัดเจน ป้องกันบุคคลภายนอกเข้า","พื้นที่ไม่มีสิ่งกีดขวางที่เป็นอันตรายต่อการปฏิบัติงานและการสัญจร","มีป้ายเตือนและสัญลักษณ์ความปลอดภัยติดตั้งในจุดที่เห็นได้ชัดเจน"] },
  { id:"site-truck-access", title:"ความสะดวกในการเข้าถึงของรถโม่", guideTitle:"แนวทางการตรวจ ความสะดวกในการเข้าถึงของรถโม่", guidelines:["เส้นทางเข้า-ออกของรถโม่มีความกว้างเพียงพอและไม่มีสิ่งกีดขวาง","พื้นผิวถนนหรือทางเข้าสามารถรับน้ำหนักรถโม่ได้อย่างปลอดภัย","มีพื้นที่หมุนกลับรถหรือออกจากไซต์ได้อย่างสะดวกและปลอดภัย","ไม่มีสายไฟฟ้าแรงสูงหรืออุปสรรคเหนือศีรษะที่อาจเป็นอันตรายต่อรถโม่"] },
  { id:"site-safety", title:"ความปลอดภัยในหน้างาน", guideTitle:"แนวทางการตรวจ ความปลอดภัยในหน้างาน", guidelines:["ผู้ปฏิบัติงานทุกคนสวมใส่ PPE ครบถ้วน ได้แก่ หมวกนิรภัย รองเท้านิรภัย เสื้อสะท้อนแสง","ผู้ทำงานบนที่สูงสวมใส่สายเข็มขัดนิรภัยแบบเต็มตัว (Full Body Harness) ทุกครั้ง","มีการกั้นแนวเขตอันตรายรอบพื้นที่เทคอนกรีตและบริเวณที่มีความเสี่ยง","ไม่มีบุคคลที่ไม่เกี่ยวข้องอยู่ในพื้นที่ปฏิบัติงานขณะเทคอนกรีต"] },
  { id:"site-team-readiness", title:"ความพร้อมของทีมงานรับคอนกรีต", guideTitle:"แนวทางการตรวจ ความพร้อมของทีมงานรับคอนกรีต", guidelines:["ทีมงานรับคอนกรีตมีจำนวนเพียงพอและมีประสบการณ์ในการปฏิบัติงาน","มีการสื่อสารและประสานงานระหว่างทีมงานกับพนักงานขับรถโม่อย่างชัดเจน","ทีมงานเข้าใจขั้นตอนการรับคอนกรีตและมีการ Briefing ก่อนเริ่มงาน","มีผู้ควบคุมงาน (Supervisor) คอยดูแลและกำกับการปฏิบัติงานตลอดเวลา"] },
  { id:"site-ssb-tools", title:"หัวข้อเฉพาะงานติดตั้งของ SSB อุปกรณ์และเครื่องมือ", guideTitle:"แนวทางการตรวจ หัวข้อเฉพาะงานติดตั้งของ SSB อุปกรณ์และเครื่องมือ", guidelines:["เครื่องมือและอุปกรณ์ติดตั้งอยู่ในสภาพสมบูรณ์ พร้อมใช้งาน และผ่านการตรวจสอบ","มีสติกเกอร์รับรองการตรวจสอบที่ยังไม่หมดอายุติดกับอุปกรณ์ทุกชิ้น","อุปกรณ์ยกหิ้ว เช่น รอก สลิง โซ่ อยู่ในสภาพดี ไม่ชำรุดเสียหายหรือสึกกร่อน","มีการจัดเก็บเครื่องมืออย่างเป็นระเบียบ ไม่วางกีดขวางทางเดินหรือทางหนีไฟ"] },
  { id:"site-ssb-readiness", title:"หัวข้อเฉพาะงานติดตั้งของ SSB ความพร้อมหน้างาน", guideTitle:"แนวทางการตรวจ หัวข้อเฉพาะงานติดตั้งของ SSB ความพร้อมหน้างาน", guidelines:["แบบแปลนและแผนผังการติดตั้งมีความชัดเจนและพนักงานเข้าใจขั้นตอนการทำงาน","มีการตรวจสอบความมั่นคงของโครงสร้างรับน้ำหนักก่อนเริ่มติดตั้ง","พื้นที่รอบจุดติดตั้งมีการกั้นแนวเขตอันตรายและป้ายเตือนครบถ้วน","มีแผนฉุกเฉินและขั้นตอนการอพยพที่ชัดเจนสำหรับพนักงานในหน้างาน"] },
  { id:"site-other", title:"อื่นๆ โปรดระบุรายละเอียด", guideTitle:false, guidelines:["ระบุประเด็นความปลอดภัยอื่นๆ ที่ตรวจพบเพิ่มเติมในไซต์งาน"] },
  { id:"site-near-miss", title:"Nearmiss", guideTitle:false, guidelines:["เหตุการณ์เกือบเกิดอุบัติเหตุ (Near Miss) คือเหตุการณ์ที่เกือบเกิดอุบัติเหตุแต่สามารถแก้ไขสถานการณ์ได้ทัน","การรายงาน Near Miss ช่วยชี้จุดบกพร่องและแก้ไขเพื่อป้องกันไม่ให้เกิดอุบัติเหตุซ้ำขึ้นอีก"] },
];

function normalizeChecklistType(type) {
  if (type === "สำนักงาน" || type === "บริษัท") return "สำนักงาน";
  if (type === "Site งาน" || type === "ก่อสร้าง") return "Site งาน";
  return "โรงงาน";
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const IcoBack    = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoShield  = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
const IcoCalendar= () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoSearch  = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoArrow   = ({c="#fff"}) => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IcoChevron = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoUpload  = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoX       = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ─── Step Pips ───────────────────────────────────────────────────────────────
function StepPips({ current = 3, total = 4 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isDone = step < current, isActive = step === current;
        return (
          <div key={step} style={{ display:"flex", alignItems:"center" }}>
            {i > 0 && <div style={{ width:12, height:2, background:(isDone||isActive)?"#ffc400":"rgba(255,255,255,0.15)", transition:"all 0.3s" }} />}
            <div style={{
              width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"9.5px", fontWeight:900, fontFamily:"'Prompt',sans-serif", transition:"all 0.3s",
              background:isDone?"#1f7a55":isActive?"#ffc400":"rgba(255,255,255,0.1)",
              color:isDone?"#fff":isActive?"#1a1613":"rgba(255,255,255,0.4)",
              boxShadow:isActive?"0 0 8px rgba(255,196,0,0.6)":"none",
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

// ─── Animated Reveal ─────────────────────────────────────────────────────────
function FadeSlide({ show, children, delay = 0 }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), delay + 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 380);
      return () => clearTimeout(t);
    }
  }, [show, delay]);
  if (!mounted) return null;
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }}>
      {children}
    </div>
  );
}

// ─── Searchable Input ────────────────────────────────────────────────────────
function SearchInput({ label, required, value, onChange, placeholder, options }) {
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => o.toLowerCase().includes(value.toLowerCase()));
  const active = open || !!value;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, position:"relative" }}>
      {label && (
        <label style={{ fontSize:"11.5px", fontWeight:700, color:T.foreground2, fontFamily:"'Prompt',sans-serif" }}>
          {required && <span style={{ color:T.danger, marginRight:2 }}>*</span>}
          {label}{required ? " *" : ""}
        </label>
      )}
      <div style={{
        height:42, borderRadius:10, border:`1px solid ${active?T.primary:"rgba(14,15,18,0.15)"}`,
        background:"#fbfbfa", padding:"0 12px", display:"flex", alignItems:"center", gap:8,
        transition:"all 0.2s", boxShadow:active?`0 0 0 3px ${T.primarySoft}`:"none"
      }}>
        <input
          type="text" value={value} placeholder={placeholder} required={required}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          style={{ border:"none", background:"transparent", width:"100%", height:"100%", padding:0, fontFamily:"inherit", fontSize:"13.5px", color:T.foreground, outline:"none" }}
        />
        <IcoSearch />
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
          background:"#fff", border:"1px solid rgba(14,15,18,0.12)", borderRadius:8,
          boxShadow:"0 10px 25px rgba(0,0,0,0.08)", maxHeight:160, overflowY:"auto", zIndex:50
        }}>
          {filtered.map(opt => (
            <button key={opt} type="button"
              onMouseDown={() => { onChange(opt); setOpen(false); }}
              style={{ width:"100%", padding:"8px 12px", border:"none", background:"transparent", textAlign:"left", fontSize:13, color:T.foreground2, cursor:"pointer", fontFamily:"inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = T.surface2}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&family=Sarabun:wght@300;400;500;600;700&display=swap');
  .lw, .lw * { box-sizing: border-box; }
  .lw {
    font-family: 'Sarabun','Prompt',sans-serif;
    background: linear-gradient(180deg, #efe6d4 0%, ${T.background} 200px, ${T.background} 100%);
    color: ${T.foreground};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }
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
    cursor:pointer; transition:all 0.2s; flex-shrink:0; color:#fff8e6;
  }
  .lw-back-btn:hover { background:rgba(255,255,255,0.18); border-color:#ffc400; transform:translateX(-2px); }

  .lw-level-btn {
    border:1px solid rgba(14,15,18,0.12); background:#fff; border-radius:10px;
    font-family:'Prompt',sans-serif; font-size:13px; font-weight:600;
    color:${T.foreground2}; cursor:pointer; transition:all 0.2s;
    display:flex; align-items:center; justify-content:center; height:42px;
  }
  .lw-level-btn:hover:not(.active) { border-color:rgba(14,15,18,0.25); }
  .lw-level-btn.active { background:#ffc400; color:#0e0f12; border-color:#ffc400; box-shadow:0 4px 12px rgba(255,196,0,0.25); }
  .lw-basic-grid > *:nth-child(n+2) { display:none !important; }

  .lw-tab-slider { display:grid; grid-template-columns:1fr 1fr; background:#ebe6da; border-radius:12px; padding:4px; box-shadow:inset 0 2px 5px rgba(0,0,0,0.05); }
  .lw-tab-btn {
    background:transparent; border:none; border-radius:9px; height:38px;
    font-family:'Prompt',sans-serif; font-size:13.5px; font-weight:700;
    color:${T.foreground3}; cursor:pointer; transition:all 0.25s;
    display:flex; align-items:center; justify-content:center; gap:8px;
  }
  .lw-tab-btn.active { background:#2b211a; color:#ffc400; box-shadow:0 4px 10px rgba(43,33,26,0.18); }

  .lw-loc-box {
    background:#fcf7eb; border:1px solid rgba(146,64,14,0.15);
    border-radius:12px; padding:16px 20px;
    display:flex; flex-wrap:wrap; gap:20px; align-items:center;
  }
  .lw-radio-label { display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13.5px; font-weight:700; color:${T.foreground2}; font-family:'Prompt',sans-serif; transition:color 0.18s; }
  .lw-radio-label.active { color:${T.primaryDark}; }
  .lw-radio-circle { width:18px; height:18px; border-radius:50%; border:2px solid rgba(14,15,18,0.25); display:flex; align-items:center; justify-content:center; transition:all 0.18s; }
  .lw-radio-label.active .lw-radio-circle { border-color:${T.primaryDark}; }
  .lw-radio-dot { width:10px; height:10px; border-radius:50%; background:${T.primaryDark}; transform:scale(0); transition:all 0.18s; }
  .lw-radio-label.active .lw-radio-dot { transform:scale(1); }

  .lw-accordion { border:1px solid rgba(14,15,18,0.08); border-radius:12px; background:#fff; overflow:hidden; margin-bottom:8px; box-shadow:0 4px 12px rgba(0,0,0,0.015); transition:all 0.2s; }
  .lw-accordion:hover { border-color:rgba(14,15,18,0.18); }
  .lw-accordion.active { border-color:#ffd93d; box-shadow:0 8px 24px rgba(146,64,14,0.06); }
  .lw-accordion-hdr { padding:14px 18px; background:#fbfbf9; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px; transition:background 0.15s; }
  .lw-accordion-hdr:hover { background:#f6f6f2; }
  .lw-accordion-arrow { color:${T.foreground3}; transition:transform 0.2s; display:flex; align-items:center; }
  .lw-accordion.active .lw-accordion-arrow { transform:rotate(180deg); }

  .lw-status-btn { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:20px; border:1px solid rgba(14,15,18,0.12); background:#fff; cursor:pointer; font-family:'Prompt',sans-serif; font-size:12px; font-weight:700; transition:all 0.2s; }
  .lw-status-btn.safe { color:${T.ok}; } .lw-status-btn.safe.active { background:#e6f7ed; border-color:${T.ok}; }
  .lw-status-btn.unsafe-cond { color:${T.danger}; } .lw-status-btn.unsafe-cond.active { background:#fee2e2; border-color:${T.danger}; }
  .lw-status-btn.unsafe-act { color:#d97706; } .lw-status-btn.unsafe-act.active { background:#fef3c7; border-color:#d97706; }

  .lw-note-box { width:100%; min-height:80px; border-radius:8px; border:1px solid rgba(14,15,18,0.15); background:#fbfbf9; padding:10px 12px; font-family:inherit; font-size:13px; color:${T.foreground}; resize:vertical; transition:all 0.2s; }
  .lw-note-box:focus { outline:none; border-color:${T.primary}; box-shadow:0 0 0 3px ${T.primarySoft}; background:#fff; }

  .lw-upload-trigger { height:64px; padding:0 16px; border-radius:8px; border:1.5px dashed rgba(14,15,18,0.18); background:#fcfcfb; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Prompt',sans-serif; font-size:12.5px; font-weight:700; color:${T.foreground3}; transition:all 0.2s; }
  .lw-upload-trigger:hover { background:#f7f7f3; border-color:${T.foreground2}; color:${T.foreground}; }

  .lw-cta { width:100%; border-radius:14px; border:none; font-family:'Prompt',sans-serif; font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer; transition:all 0.3s; background:linear-gradient(135deg,#2b211a 0%,#1a1613 100%); color:#fff; box-shadow:0 10px 25px rgba(26,22,19,0.25); padding:14px; }
  .lw-cta:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(26,22,19,0.32); }
  .lw-cta:active { transform:scale(0.985); }
  .lw-cta:disabled { cursor:not-allowed; opacity:0.6; transform:none; box-shadow:0 10px 25px rgba(26,22,19,0.16); }

  .lw-geo-pulse { width:6px; height:6px; border-radius:50%; background:${T.ok}; box-shadow:0 0 0 2px rgba(31,122,85,0.2); animation:lw-pulse 1.8s infinite; }
  @keyframes lw-pulse { 0%{box-shadow:0 0 0 0 rgba(31,122,85,0.4)} 70%{box-shadow:0 0 0 6px rgba(31,122,85,0)} 100%{box-shadow:0 0 0 0 rgba(31,122,85,0)} }

  .lw-progress-track { position:relative; height:4px; background:rgba(255,255,255,0.12); border-radius:99px; margin-top:10px; overflow:hidden; }
  .lw-progress-fill { height:100%; background:linear-gradient(90deg,#ffc400,#ffe066); border-radius:99px; transition:width 0.5s cubic-bezier(0.4,0,0.2,1); }
  @media (min-width: 768px) {
    .lw-card {
      padding: 12px 20px !important;
    }
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Linewalk() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 480);

  // ── Detect source ──────────────────────────────────────────────────────────
  // fromActivity = true  → came from Activity page (full flow)
  // fromActivity = false → came from Category directly (shortcut)
  const fromActivity = location.state?.fromActivity ?? false;
  const checkin      = location.state?.checkin  ?? null;
  const isQuestionScreen = location.state?.linewalkStarted ?? false;
  const activity     = location.state?.activity ?? {
    id: "line-walk",
    label: "Line Walk",
    desc: "เดินตรวจสายการผลิต / หน่วยงาน",
  };

  // ── Step 1 fields ──
  const [date, setDate]   = useState(location.state?.linewalkDate ?? "");
  const [dept, setDept]   = useState("");
  const [level, setLevel] = useState("");

  // ── Step 2: Tab ──
  const [activeTab, setActiveTab]           = useState(activity?.id === "safety-contact" ? "safety_contact" : "linewalk");
  const [safetyContactText, setSafetyContactText] = useState("");

  // ── Step 3: Location ──
  const [locType, setLocType] = useState(() => normalizeChecklistType(location.state?.checkin?.type));

  // ── Step 4: Metadata ──
  const [company, setCompany]   = useState("");
  const [region, setRegion]     = useState("");
  const [division, setDivision] = useState("");
  const [factory, setFactory]   = useState("");
  const [office, setOffice]     = useState("");
  const [siteName, setSiteName] = useState("");

  // ── Checklist ──
  const [checklist,     setChecklist]     = useState([]);
  const [itemStates,    setItemStates]    = useState({});
  const [activeSection, setActiveSection] = useState(-1);
  const [linewalkStarted, setLinewalkStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // ── Progressive disclosure ──
  const isSafetyContactFlow = activity?.id === "safety-contact" || activeTab === "safety_contact";
  const step1Complete = !!date;
  const showTab       = false;
  const showLocBox    = false;
  const showMeta      = false;

  const metaComplete = showMeta && (
    locType === "โรงงาน"   ? (!!company && !!region && !!division && !!factory) :
    locType === "สำนักงาน" ? !!office :
    locType === "Site งาน" ? !!siteName : false
  );
  const showChecklist = metaComplete;
  const showChecklistSection = step1Complete && !isSafetyContactFlow && isQuestionScreen;

  const progressPct = !step1Complete ? 20 : isSafetyContactFlow ? 100 : 72;

  useEffect(() => {
    setLocType(normalizeChecklistType(checkin?.type));
  }, [checkin?.type]);

  useEffect(() => {
    setCompany(""); setRegion(""); setDivision(""); setFactory("");
    setOffice(""); setSiteName("");
  }, [locType]);

  useEffect(() => {
    if (!locType) return;
    const cl = locType === "สำนักงาน" ? OFFICE_CHECKLIST : locType === "Site งาน" ? SITE_CHECKLIST : FACTORY_CHECKLIST;
    setChecklist(cl);
    setItemStates(cl.reduce((acc, c) => { acc[c.id] = { status:null, note:"", photos:[] }; return acc; }, {}));
    setActiveSection(-1);
  }, [locType]);

  useEffect(() => {
    if (!locType) return;
    const cl = getChecklistForType(locType);
    setChecklist(cl);
    setItemStates(createInitialItemStates(cl));
    setActiveSection(-1);
  }, [locType]);

  const totalItems      = checklist.length;
  const answeredCount   = Object.values(itemStates).filter(i => i.status !== null).length;
  const checklistComplete      = totalItems > 0 && answeredCount === totalItems;
  const safetyContactComplete  = safetyContactText.trim().length > 0;

  const linewalkComplete = isSafetyContactFlow
    ? step1Complete && safetyContactComplete
    : step1Complete && checklistComplete;
  const submitDisabled = !linewalkComplete;

  useEffect(() => {
    if (!step1Complete || isSafetyContactFlow || !locType) return;
    const cl = locType === "สำนักงาน" ? OFFICE_CHECKLIST : locType === "Site งาน" ? SITE_CHECKLIST : FACTORY_CHECKLIST;
    setChecklist(cl);
    setItemStates((prev) => cl.reduce((acc, c) => {
      acc[c.id] = prev[c.id] ?? { status: null, note: "", photos: [] };
      return acc;
    }, {}));
    setActiveSection(-1);
  }, [step1Complete, isSafetyContactFlow, locType]);

  useEffect(() => {
    if (!step1Complete || isSafetyContactFlow || !locType) return;
    const cl = getChecklistForType(locType);
    setChecklist(cl);
    setItemStates((prev) =>
      cl.reduce((acc, c) => {
        acc[c.id] = prev[c.id] ?? { status: null, note: "", photos: [] };
        return acc;
      }, {})
    );
    setActiveSection(-1);
  }, [step1Complete, isSafetyContactFlow, locType]);

  useEffect(() => {
    if (!step1Complete || isSafetyContactFlow) {
      setLinewalkStarted(false);
      setCurrentQuestionIndex(0);
    }
  }, [step1Complete, isSafetyContactFlow]);

  useEffect(() => {
    setLinewalkStarted(isQuestionScreen);
  }, [isQuestionScreen]);

  // ── Back button ────────────────────────────────────────────────────────────
  function handleBack() {
    if (isQuestionScreen) {
      navigate("/linewalk", {
        state: {
          ...location.state,
          linewalkStarted: false,
          linewalkDate: date,
        },
      });
      return;
    }
    if (window.history.length > 1) { navigate(-1); return; }
    navigate(fromActivity ? "/activity" : "/category");
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  // Safety Contact from Category shortcut → go back to Category
  // Everything else (Line Walk or Safety Contact via Activity) → go to CreatePost
  function handleSubmit() {
    if (submitDisabled) return;

    const linewalkData = {
      isSafetyContact: isSafetyContactFlow,
      date,
      activeTab: isSafetyContactFlow ? "safety_contact" : "linewalk",
      safetyContactText,
      locType,
      company,
      region,
      division,
      factory,
      office,
      siteName,
      itemStates,
    };

    // Safety Contact shortcut (came from Category, NOT via Activity)
    if (isSafetyContactFlow) {
      navigate("/category");
      return;
    }

    // All other cases → CreatePost
    navigate("/assessment-summary", {
      state: {
        checkin,
        activity,
        linewalkData,
      },
    });
  }

  function handleStatusChange(id, val) {
    setItemStates(p => ({ ...p, [id]: { ...p[id], status: p[id].status === val ? null : val } }));
  }
  function handleNoteChange(id, text) {
    setItemStates(p => ({ ...p, [id]: { ...p[id], note: text } }));
  }
  function handlePhotoUpload(id, e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setItemStates(p => ({ ...p, [id]: { ...p[id], photos: [...p[id].photos, reader.result] } }));
    reader.readAsDataURL(file);
  }
  function handleDeletePhoto(id, idx) {
    setItemStates(p => ({ ...p, [id]: { ...p[id], photos: p[id].photos.filter((_,i)=>i!==idx) } }));
  }

  function handleStartLinewalk() {
    if (!step1Complete) return;
    navigate("/linewalk", {
      state: {
        ...location.state,
        linewalkStarted: true,
        linewalkDate: date,
      },
    });
  }

  function handlePrevQuestion() {
    if (currentQuestionIndex === 0) {
      navigate("/linewalk", {
        state: {
          ...location.state,
          linewalkStarted: false,
          linewalkDate: date,
        },
      });
      return;
    }
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }

  function handleNextQuestion() {
    setCurrentQuestionIndex((prev) => Math.min(totalItems - 1, prev + 1));
  }

  const currentItem = checklist[currentQuestionIndex] ?? null;
  const currentState = currentItem ? itemStates[currentItem.id] || { status:null, note:"", photos:[] } : null;
  const isMobileQuestionScreen = isMobileViewport && isQuestionScreen && !isSafetyContactFlow;
  const mobileQuestionNavColumns = totalItems <= 8 ? totalItems : Math.min(5, totalItems);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="lw" style={isMobileQuestionScreen ? { height:"100%", overflow:"hidden" } : undefined}>
        <div style={{ width:"100%", maxWidth:isMobileViewport ? "100%" : 1180, margin:"0 auto", display:"flex", flexDirection:"column", gap:isMobileQuestionScreen ? 8 : (isMobileViewport ? 12 : 10), padding:isMobileQuestionScreen ? "0 0 8px" : (isMobileViewport ? "0 0 60px" : "12px 20px 20px"), minHeight:isMobileQuestionScreen ? "100%" : undefined, height:isMobileQuestionScreen ? "100%" : undefined, overflow:isMobileQuestionScreen ? "hidden" : undefined }}>

          {/* ── HEADER ── */}
          {!isMobileQuestionScreen && <div style={{
            background:"linear-gradient(105deg,rgba(58,28,5,0.98) 0%,rgba(84,47,12,0.95) 48%,rgba(39,24,10,0.96) 100%)",
            padding:isMobileQuestionScreen ? "10px 14px 12px" : "14px 20px 18px", color:"#fff8e6", position:"relative", overflow:"hidden",
            boxShadow:"0 8px 24px rgba(42,26,9,0.15)",
            borderRadius: isMobileViewport ? 0 : "16px",
            border: isMobileViewport ? "none" : "1px solid rgba(255,255,255,0.08)",
            marginBottom: isMobileViewport ? 0 : 6,
          }}>
            <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,196,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,196,0,0.03) 1px,transparent 1px)", backgroundSize:"22px 22px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", right:-40, top:-40, width:200, height:200, background:"radial-gradient(circle,rgba(255,196,0,0.10) 0%,transparent 70%)", pointerEvents:"none" }} />

            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:isMobileQuestionScreen ? 10 : 16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:isMobileQuestionScreen ? 8 : 12 }}>
                  <button className="lw-back-btn" onClick={handleBack}><IcoBack /></button>
                  {!isMobileQuestionScreen && <div style={{ width:1, height:28, background:"rgba(255,255,255,0.15)" }} />}
                  <div>
                    <div style={{ display:"flex", gap:6, marginBottom:isMobileQuestionScreen ? 1 : 3, flexWrap:"wrap" }}>
                      {/* Show step badge only if coming from full Activity flow */}
                      {fromActivity && (
                        <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"rgba(255,248,230,0.85)", fontSize:"9.5px", fontWeight:800, textTransform:"uppercase" }}>
                          Step {isQuestionScreen ? 4 : 3}
                        </span>
                      )}
                      <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:99, background:"rgba(255,196,0,0.18)", border:"1px solid rgba(255,196,0,0.25)", color:"#ffc400", fontSize:"9.5px", fontWeight:800, textTransform:"uppercase" }}>
                        {isQuestionScreen ? "Assessment" : "Line Walk"}
                      </span>
                    </div>
                    <h1 style={{ margin:0, fontSize:18, fontWeight:900, color:"#fff", fontFamily:"'Prompt',sans-serif", lineHeight:1.25 }}>
                      {isQuestionScreen ? "ทำแบบประเมินความปลอดภัย" : "ทำรายการตรวจความปลอดภัย"}
                    </h1>
                  </div>
                </div>
                {/* Step pips — only meaningful in full Activity flow */}
                {fromActivity && !isMobileQuestionScreen && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:9, color:"rgba(255,248,230,0.55)", fontWeight:800, fontFamily:"'Prompt',sans-serif", letterSpacing:"0.05em", display:"block" }}>SAFETY AUDIT</span>
                      <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
                        <StepPips current={isQuestionScreen ? 4 : 3} total={4} />
                        <span style={{ fontSize:11, color:"#ffc400", fontWeight:900, fontFamily:"'Prompt',sans-serif" }}>
                          {isQuestionScreen ? 4 : 3} / 4
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lw-progress-track" style={{ marginTop:isMobileQuestionScreen ? 8 : 12 }}>
                <div className="lw-progress-fill" style={{ width:`${progressPct}%` }} />
              </div>

              {false && !isMobileQuestionScreen && <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { label:"กรอกข้อมูล",  done: step1Complete },
                  { label:"เลือกประเภท", done: showLocBox && !!locType },
                  { label:"ระบุสถานที่",  done: metaComplete },
                  { label:"ตรวจสอบ",     done: false },
                ].map((s, i) => (
                  <span key={i} style={{
                    fontSize:"10px", fontWeight:700, fontFamily:"'Prompt',sans-serif",
                    padding:"2px 8px", borderRadius:99,
                    background: s.done ? "rgba(31,122,85,0.3)" : "rgba(255,255,255,0.08)",
                    color: s.done ? "#6ee7b7" : "rgba(255,248,230,0.5)",
                    border: s.done ? "1px solid rgba(110,231,183,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    transition:"all 0.4s",
                  }}>
                    {s.done ? "✓ " : ""}{s.label}
                  </span>
                ))}
              </div>}
            </div>

            <div style={{ position:"absolute", left:0, right:0, bottom:0, height:5, background:"repeating-linear-gradient(135deg,#ffc400 0 10px,#0e0f12 10px 20px)" }} />
          </div>}

          {/* ── STEP 1: Basic info ── */}
          {!isQuestionScreen && (
          <div className="lw-card" style={{ margin:isMobileViewport ? "0 16px" : "0 auto", width:isMobileViewport ? "auto" : "100%", maxWidth:isMobileViewport ? "none" : "540px", display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"#ffc400", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, fontFamily:"'Prompt',sans-serif", color:"#1a1613", flexShrink:0 }}>1</div>
              <span style={{ fontFamily:"'Prompt',sans-serif", fontWeight:800, fontSize:14, color:T.foreground }}>ข้อมูลพื้นฐาน</span>
            </div>

            <RestrictedDatePicker value={date} onChange={setDate} accent="#ffc400" />
            {false && <div className="lw-basic-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:"11.5px", fontWeight:700, color:T.foreground2, fontFamily:"'Prompt',sans-serif" }}>
                  <span style={{ color:T.danger }}>*</span> วันที่ดำเนินการ *
                </label>
                <div style={{
                  height:42, borderRadius:10,
                  border:`1px solid ${date?T.primary:"rgba(14,15,18,0.15)"}`,
                  background:"#fbfbfa", padding:"0 12px", display:"flex", alignItems:"center", gap:8,
                  transition:"all 0.2s", boxShadow:date?`0 0 0 3px ${T.primarySoft}`:"none"
                }}>
                  <IcoCalendar />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ border:"none", background:"transparent", width:"100%", height:"100%", padding:0, fontFamily:"inherit", fontSize:"13.5px", color:T.foreground, outline:"none" }} />
                </div>
              </div>
              <SearchInput label="สังกัดฝ่ายงาน" required value={dept} onChange={setDept} placeholder="เลือกสังกัด..." options={PRESET_DEPTS} />
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:"11.5px", fontWeight:700, color:T.foreground2, fontFamily:"'Prompt',sans-serif" }}>
                  <span style={{ color:T.danger }}>*</span> ระดับพนักงาน *
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                  {["จัดการ","บังคับบัญชา","ปฏิบัติการ"].map(lvl => (
                    <button key={lvl} type="button"
                      className={`lw-level-btn${level===lvl?" active":""}`}
                      onClick={() => setLevel(lvl)}
                    >{lvl}</button>
                  ))}
                </div>
              </div>
            </div>}

            {!step1Complete && (
              <p style={{ fontSize:12, color:T.foreground3, fontFamily:"'Prompt',sans-serif", fontStyle:"italic", margin:0 }}>
                กรุณากรอกข้อมูลให้ครบทุกช่อง เพื่อดำเนินการต่อ
              </p>
            )}
            {step1Complete && !isSafetyContactFlow && !isQuestionScreen && (
              <div style={{ display:"flex", justifyContent:"center" }}>
                <button type="button" onClick={handleStartLinewalk} className="lw-cta" style={{ maxWidth:320 }}>
                  <IcoShield />
                  เริ่มทำ Line Walk
                  <IcoArrow />
                </button>
              </div>
            )}
          </div>
          )}

          {/* ── STEP 2: Tab selector ── */}
          <FadeSlide show={false} delay={0}>
            <div className="lw-card" style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background: step1Complete?"#ffc400":"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, fontFamily:"'Prompt',sans-serif", color:"#1a1613", flexShrink:0, transition:"background 0.3s" }}>2</div>
                <span style={{ fontFamily:"'Prompt',sans-serif", fontWeight:800, fontSize:14, color:T.foreground }}>เลือกประเภทกิจกรรม</span>
              </div>
              <div className="lw-tab-slider">
                <button type="button" className={`lw-tab-btn${activeTab==="linewalk"?" active":""}`} onClick={() => setActiveTab("linewalk")}>
                  <IcoShield /> Line Walk
                </button>
                <button type="button" className={`lw-tab-btn${activeTab==="safety_contact"?" active":""}`} onClick={() => setActiveTab("safety_contact")}>
                  Safety Contact
                </button>
              </div>

              {activeTab === "safety_contact" && (
                <FadeSlide show={true}>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <label style={{ fontFamily:"'Prompt',sans-serif", fontSize:13, fontWeight:700, color:T.foreground }}>Safety Contact</label>
                    <textarea className="lw-note-box" style={{ minHeight:120 }}
                      placeholder="กรุณากรอกรายละเอียด Safety Contact..."
                      value={safetyContactText} onChange={e => setSafetyContactText(e.target.value)} />

                    {/* ── Label differs based on source ── */}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitDisabled}
                      style={{
                        alignSelf:"flex-start",
                        background: submitDisabled
                          ? "linear-gradient(135deg,#8f8578,#6f665b)"
                          : "linear-gradient(135deg,#2b211a,#1a1613)",
                        color:"#fff", border:"none", borderRadius:10,
                        padding:"10px 24px",
                        fontFamily:"'Prompt',sans-serif", fontSize:14, fontWeight:700,
                        cursor: submitDisabled ? "not-allowed" : "pointer",
                        opacity: submitDisabled ? 0.65 : 1,
                      }}
                    >
                      {/* fromActivity → go to CreatePost; otherwise → back to Category */}
                      {fromActivity ? "ดำเนินการต่อ →" : "บันทึก"}
                    </button>

                    {/* Helper hint */}
                    {!fromActivity && (
                      <p style={{ margin:0, fontSize:11.5, color:T.foreground3, fontFamily:"'Prompt',sans-serif" }}>
                        กดบันทึกเพื่อกลับสู่หน้าหมวดหมู่
                      </p>
                    )}
                  </div>
                </FadeSlide>
              )}
            </div>
          </FadeSlide>

          {/* ── STEP 3: Location type ── */}
          <FadeSlide show={false} delay={60}>
            <div className="lw-card" style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#ffc400", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, fontFamily:"'Prompt',sans-serif", color:"#1a1613", flexShrink:0 }}>3</div>
                <span style={{ fontFamily:"'Prompt',sans-serif", fontWeight:800, fontSize:14, color:T.foreground }}>สถานที่จะไป Line Walk</span>
              </div>
              <div className="lw-loc-box">
                <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                  {["โรงงาน","สำนักงาน","Site งาน"].map(loc => (
                    <label key={loc} className={`lw-radio-label${locType===loc?" active":""}`}>
                      <input type="radio" name="locType" style={{ display:"none" }} checked={locType===loc} onChange={() => setLocType(loc)} />
                      <div className="lw-radio-circle"><div className="lw-radio-dot" /></div>
                      {loc}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </FadeSlide>

          {/* ── STEP 4: Metadata ── */}
          <FadeSlide show={false} delay={80}>
            <div className="lw-card" style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#ffc400", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, fontFamily:"'Prompt',sans-serif", color:"#1a1613", flexShrink:0 }}>4</div>
                <span style={{ fontFamily:"'Prompt',sans-serif", fontWeight:800, fontSize:14, color:T.foreground }}>
                  {locType === "โรงงาน" ? "ข้อมูลโรงงาน" : locType === "สำนักงาน" ? "ข้อมูลสำนักงาน" : "ข้อมูล Site งาน"}
                </span>
              </div>
              {locType === "โรงงาน" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                  <SearchInput label="กิจการ" value={company} onChange={setCompany} placeholder="เลือกกิจการ" options={PRESET_COMPANIES} />
                  <SearchInput label="ภาค"    value={region}  onChange={setRegion}  placeholder="เลือกภาค"    options={PRESET_REGIONS} />
                  <SearchInput label="แผนก"   value={division} onChange={setDivision} placeholder="เลือกแผนก"  options={PRESET_DIVISIONS} />
                  <SearchInput label="โรงงาน" value={factory} onChange={setFactory} placeholder="เลือกโรงงาน" options={PRESET_FACTORIES} />
                </div>
              )}
              {locType === "สำนักงาน" && (
                <SearchInput label="สำนักงาน" value={office} onChange={setOffice} placeholder="เลือกสำนักงาน" options={PRESET_OFFICES} />
              )}
              {locType === "Site งาน" && (
                <SearchInput label="Site งาน" value={siteName} onChange={setSiteName} placeholder="เลือก Site งาน" options={PRESET_SITES} />
              )}
              {!metaComplete && (
                <p style={{ fontSize:12, color:T.foreground3, fontFamily:"'Prompt',sans-serif", fontStyle:"italic", margin:0 }}>
                  กรุณากรอกข้อมูลให้ครบเพื่อดูรายการตรวจสอบ
                </p>
              )}
            </div>
          </FadeSlide>

          {/* ── STEP 5: Checklist ── */}
          {isSafetyContactFlow && (
            <div className="lw-card" style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#ffc400", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, fontFamily:"'Prompt',sans-serif", color:"#1a1613", flexShrink:0 }}>2</div>
                <span style={{ fontFamily:"'Prompt',sans-serif", fontWeight:800, fontSize:14, color:T.foreground }}>Safety Contact</span>
              </div>
              <textarea
                className="lw-note-box"
                style={{ minHeight:120 }}
                placeholder="กรุณากรอกรายละเอียด Safety Contact..."
                value={safetyContactText}
                onChange={e => setSafetyContactText(e.target.value)}
              />
              <div>
                <button type="button" onClick={handleSubmit} className="lw-cta" disabled={submitDisabled}>
                  <IcoShield />
                  บันทึก Safety Contact
                  <IcoArrow />
                </button>
              </div>
            </div>
          )}

          {showChecklistSection && currentItem && currentState && (
              <div style={{ margin:isMobileQuestionScreen ? "0 8px" : (isMobileViewport ? "0 16px" : 0), display:"flex", flexDirection:"column", gap:isMobileQuestionScreen ? 8 : 16, flex:1, minHeight:0, overflow:"hidden", paddingBottom:isMobileQuestionScreen ? "72px" : 0 }}>
              {false && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, margin:"2px 2px 0", flexShrink:0 }}>
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    width:42,
                    height:42,
                    borderRadius:14,
                    border:"1px solid rgba(64,38,16,0.10)",
                    background:"linear-gradient(180deg,#fffaf0 0%, #f3e8d3 100%)",
                    color:"#4a2a12",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    boxShadow:"0 8px 18px rgba(64,38,16,0.08)",
                    cursor:"pointer",
                    flexShrink:0,
                  }}
                >
                  <IcoBack />
                </button>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:11, fontWeight:800, color:"#8a6a45", textTransform:"uppercase", letterSpacing:"0.04em", textAlign:"right" }}>
                    Line Walk
                  </div>
                  <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:isMobileQuestionScreen ? 13 : 15, fontWeight:900, color:"#2f1d12", textAlign:"right" }}>
                    ทำรายการตรวจความปลอดภัย
                  </div>
                </div>
              </div>}

              <div
                style={{
                  display:isMobileQuestionScreen ? "grid" : "flex",
                  gap:isMobileQuestionScreen ? 8 : 12,
                  gridTemplateColumns:isMobileQuestionScreen ? `repeat(${mobileQuestionNavColumns}, minmax(0, 1fr))` : undefined,
                  flexWrap:"nowrap",
                  justifyContent:"center",
                  alignItems:"center",
                  flexShrink:0,
                  overflowX:"visible",
                  width:"100%",
                  maxWidth:isMobileQuestionScreen ? (totalItems <= 8 ? 360 : 320) : undefined,
                  margin:isMobileQuestionScreen ? "0 auto 8px" : "2px 0 6px",
                  padding:isMobileQuestionScreen ? "10px 6px 12px" : "6px 4px 10px",
                  scrollbarWidth:"none",
                  msOverflowStyle:"none",
                }}
              >
                {checklist.map((item, idx) => {
                  const answered = (itemStates[item.id] || {}).status !== null;
                  const active = idx === currentQuestionIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{
                        width:isMobileQuestionScreen ? "100%" : 40,
                        maxWidth:isMobileQuestionScreen ? 42 : undefined,
                        justifySelf:isMobileQuestionScreen ? "center" : undefined,
                        height:isMobileQuestionScreen ? 36 : 40,
                        borderRadius:"50%",
                        border: active ? "1.5px solid #8b5a14" : "1px solid rgba(64,38,16,0.10)",
                        background: active
                          ? "linear-gradient(180deg,#f7c948 0%, #d89b00 100%)"
                          : answered
                            ? "#fbf1de"
                            : "linear-gradient(180deg,#fffdf9 0%, #fff8ee 100%)",
                        color: active ? "#2f1d12" : answered ? "#7a5a2f" : "#8d7a63",
                        fontFamily:"'Prompt',sans-serif",
                        fontWeight:800,
                        fontSize:isMobileQuestionScreen ? 12 : 14,
                        cursor:"pointer",
                        flex:"0 0 auto",
                        boxShadow: active
                          ? "0 8px 18px rgba(139,90,20,0.18)"
                          : "0 2px 8px rgba(64,38,16,0.05)",
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="lw-card" style={{ padding:isMobileQuestionScreen ? "12px 12px 10px" : "18px 18px 20px", display:"flex", flexDirection:"column", gap:isMobileQuestionScreen ? 8 : 16, flex:1, minHeight:0, overflow:"hidden", background:"linear-gradient(180deg,#fffdfa 0%, #fff8ee 100%)", border:"1px solid rgba(82,52,24,0.08)", boxShadow:"0 16px 32px rgba(64,38,16,0.08)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:isMobileQuestionScreen ? 8 : 12, flexShrink:0 }}>
                    <div style={{ width:isMobileQuestionScreen ? 34 : 42, height:isMobileQuestionScreen ? 34 : 42, borderRadius:"50%", background:"linear-gradient(180deg,#f7c948 0%, #d89b00 100%)", color:"#2f1d12", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Prompt',sans-serif", fontWeight:900, fontSize:isMobileQuestionScreen ? 15 : 18 }}>
                    {currentQuestionIndex + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:isMobileQuestionScreen ? 11 : 13, fontWeight:800, color:"#8a6a45" }}>
                      ข้อ {currentQuestionIndex + 1} จาก {totalItems}
                    </div>
                    <h3 style={{ margin:"2px 0 0", fontFamily:"'Prompt',sans-serif", fontSize:isMobileQuestionScreen ? 15 : 20, fontWeight:900, color:"#2f1d12", lineHeight:isMobileQuestionScreen ? 1.18 : 1.35 }}>
                      {currentItem.title}
                    </h3>
                  </div>
                </div>

                {currentItem.guideTitle !== false && (
                  <p style={{ margin:0, fontFamily:"'Prompt',sans-serif", fontSize:isMobileQuestionScreen ? 10.5 : 12.5, fontWeight:700, color:"#8a6a45", flexShrink:0 }}>
                    {currentItem.guideTitle || `แนวทางการตรวจ ${currentItem.title.split(":")[0]}`}
                  </p>
                )}

                <ul style={{ margin:"0 0 2px", paddingLeft:isMobileQuestionScreen ? 15 : 18, fontSize:isMobileQuestionScreen ? "10.5px" : "12.5px", color:T.foreground2, lineHeight:isMobileQuestionScreen ? 1.32 : 1.7 }}>
                  {currentItem.guidelines.map((g, gi) => <li key={gi} style={{ marginBottom:2 }}>{g}</li>)}
                </ul>

                  <div style={{ display:"grid", gap:isMobileQuestionScreen ? 7 : 12, marginTop:0 }}>
                  {[
                    { key:"safe", label:"ปลอดภัย", sub:"ข้อความนี้ถูกต้อง", border:"#34c97b", bg:"#eefaf3", color:"#18794e", icon:"✓" },
                    { key:"unsafe_condition", label:"สภาพไม่ปลอดภัย", sub:"พบสภาพแวดล้อมที่ต้องแก้ไข", border:"#ff6b6b", bg:"#fff1f1", color:"#d5301a", icon:"!" },
                    { key:"unsafe_action", label:"พฤติกรรมไม่ปลอดภัย", sub:"พบพฤติกรรมเสี่ยงระหว่างทำงาน", border:"#ffb020", bg:"#fff8e6", color:"#b76a00", icon:"×" },
                  ].map((choice) => {
                    const selected = currentState.status === choice.key;
                    const themedChoice = choice.key === "safe"
                      ? { ...choice, border:"#d5a21a", bg:"#fff6db", color:"#8b5a14", icon:"✓" }
                      : choice.key === "unsafe_condition"
                        ? { ...choice, border:"#db7b4f", bg:"#fff1e8", color:"#8f3b16", icon:"!" }
                        : { ...choice, border:"#5f4025", bg:"#f6ece1", color:"#5f4025", icon:"×" };
                    return (
                      <button
                        key={choice.key}
                        type="button"
                        onClick={() => handleStatusChange(currentItem.id, choice.key)}
                        style={{
                          width:"100%",
                          borderRadius:isMobileQuestionScreen ? 16 : 18,
                          border:`3px solid ${themedChoice.border}`,
                          background:selected ? themedChoice.bg : "#fff",
                          padding:isMobileQuestionScreen ? "10px 12px" : "16px 18px",
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"space-between",
                          gap:isMobileQuestionScreen ? 8 : 12,
                          cursor:"pointer",
                          textAlign:"left",
                        }}
                      >
                          <div style={{ display:"flex", alignItems:"center", gap:isMobileQuestionScreen ? 8 : 14, minWidth:0 }}>
                            <div style={{ width:isMobileQuestionScreen ? 28 : 34, height:isMobileQuestionScreen ? 28 : 34, borderRadius:10, background:selected ? themedChoice.border : "rgba(14,15,18,0.06)", color:selected ? "#fff" : themedChoice.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:isMobileQuestionScreen ? 16 : 22, flexShrink:0 }}>
                            {themedChoice.icon}
                          </div>
                          <div style={{ minWidth:0 }}>
                              <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:isMobileQuestionScreen ? 14 : 17, fontWeight:900, color:themedChoice.color }}>
                              {choice.label}
                            </div>
                              <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:isMobileQuestionScreen ? 10 : 12, fontWeight:600, color:T.foreground3 }}>
                              {choice.sub}
                            </div>
                          </div>
                        </div>
                        <div style={{ width:isMobileQuestionScreen ? 22 : 28, height:isMobileQuestionScreen ? 22 : 28, borderRadius:"50%", border:`3px solid ${selected ? themedChoice.border : "rgba(14,15,18,0.16)"}`, background:selected ? themedChoice.border : "#fff", flexShrink:0 }} />
                      </button>
                    );
                  })}
                </div>

                {isMobileQuestionScreen && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                    <label className="lw-upload-trigger" style={{ height:40, padding:"0 12px", borderColor:"rgba(95,64,37,0.22)", background:"#fff8ee", color:"#5f4025", fontSize:11.5 }}>
                      <IcoUpload /> Upload รูปภาพ
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => handlePhotoUpload(currentItem.id, e)} />
                    </label>
                    {currentState.photos.map((url, pi) => (
                      <div key={pi} style={{ width:40, height:40, borderRadius:8, position:"relative", overflow:"hidden", border:"1px solid rgba(14,15,18,0.08)" }}>
                        <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(currentItem.id, pi)}
                          style={{
                            position:"absolute",
                            top:2,
                            right:2,
                            width:16,
                            height:16,
                            borderRadius:"50%",
                            background:"rgba(0,0,0,0.6)",
                            color:"#fff",
                            border:"none",
                            display:"flex",
                            alignItems:"center",
                            justifyContent:"center",
                            cursor:"pointer",
                          }}
                        >
                          <IcoX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!isMobileQuestionScreen && <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <span style={{ fontSize:11, color:T.foreground3, fontWeight:700, fontFamily:"'Prompt',sans-serif" }}>หมายเหตุ / รายละเอียดเพิ่มเติม</span>
                  <textarea
                    className="lw-note-box"
                    value={currentState.note}
                    placeholder="กรอกรายละเอียดเพิ่มเติม..."
                    onChange={e => handleNoteChange(currentItem.id, e.target.value)}
                  />
                </div>}

                {!isMobileQuestionScreen && <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:"11.5px", fontWeight:800, color:T.foreground3, textTransform:"uppercase" }}>แนบรูปภาพ</div>}
                {!isMobileQuestionScreen && <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                  <label className="lw-upload-trigger">
                    <IcoUpload /> Upload รูปภาพ
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => handlePhotoUpload(currentItem.id, e)} />
                  </label>
                  {currentState.photos.map((url, pi) => (
                    <div key={pi} style={{ width:64, height:64, borderRadius:8, position:"relative", overflow:"hidden", border:"1px solid rgba(14,15,18,0.08)" }}>
                      <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(currentItem.id, pi)}
                        style={{
                          position:"absolute",
                          top:2,
                          right:2,
                          width:16,
                          height:16,
                          borderRadius:"50%",
                          background:"rgba(0,0,0,0.6)",
                          color:"#fff",
                          border:"none",
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"center",
                          cursor:"pointer",
                        }}
                      >
                        <IcoX />
                      </button>
                    </div>
                  ))}
                </div>}

                <div style={{ display:"flex", gap:isMobileQuestionScreen ? 8 : 12, justifyContent:"space-between", marginTop:isMobileQuestionScreen ? 2 : 8, flexShrink:0, position:isMobileQuestionScreen ? "fixed" : "static", left:isMobileQuestionScreen ? 0 : undefined, right:isMobileQuestionScreen ? 0 : undefined, bottom:isMobileQuestionScreen ? 0 : undefined, zIndex:isMobileQuestionScreen ? 45 : undefined, background:isMobileQuestionScreen ? "linear-gradient(180deg, rgba(241,236,223,0) 0%, rgba(241,236,223,0.96) 18%, rgba(241,236,223,1) 40%)" : undefined, padding:isMobileQuestionScreen ? "8px 12px calc(8px + env(safe-area-inset-bottom))" : undefined, boxShadow:isMobileQuestionScreen ? "0 -10px 24px rgba(34,25,11,0.10)" : undefined }}>
                  <button
                    type="button"
                    onClick={handlePrevQuestion}
                    style={{
                      minWidth:isMobileQuestionScreen ? 88 : 110,
                      height:isMobileQuestionScreen ? 44 : 54,
                      borderRadius:isMobileQuestionScreen ? 14 : 16,
                      border:"1px solid rgba(14,15,18,0.12)",
                      background:"#fff",
                      color:T.foreground2,
                      fontFamily:"'Prompt',sans-serif",
                      fontSize:isMobileQuestionScreen ? 14 : 16,
                      fontWeight:800,
                      cursor:"pointer",
                    }}
                  >
                    ← ย้อน
                  </button>

                  {currentQuestionIndex < totalItems - 1 ? (
                      <button type="button" onClick={handleNextQuestion} className="lw-cta" style={{ flex:1, minHeight:isMobileQuestionScreen ? 44 : undefined, padding:isMobileQuestionScreen ? "10px" : undefined }}>
                      ถัดไป →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="lw-cta"
                      style={{ flex:1, minHeight:isMobileQuestionScreen ? 44 : undefined, padding:isMobileQuestionScreen ? "10px" : undefined }}
                      disabled={submitDisabled}
                      aria-disabled={submitDisabled}
                    >
                      <IcoShield />
                      ส่งข้อมูลการตรวจ Line Walk
                      <IcoArrow />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <FadeSlide show={false} delay={100}>
            <div style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:10 }}>
              <div className="lw-card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, padding:"12px 20px" }}>
                <div style={{ background:"rgba(14,15,18,0.04)", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, color:T.foreground3, display:"flex", alignItems:"center", gap:6, fontFamily:"monospace" }}>
                  <div className="lw-geo-pulse" />
                  ตำแหน่งปัจจุบัน — GPS Active
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:T.foreground3, fontFamily:"'Prompt',sans-serif" }}>
                  ความแม่นยำ: <span style={{ color:T.ok }}>94.2%</span>
                </span>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 2px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:"#ffc400", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, fontFamily:"'Prompt',sans-serif", color:"#1a1613", flexShrink:0 }}>5</div>
                  <h3 style={{ margin:0, fontSize:15, fontWeight:900, color:T.foreground, fontFamily:"'Prompt',sans-serif" }}>
                    หัวข้อตรวจสอบ ({totalItems} หัวข้อ)
                  </h3>
                </div>
                <span style={{ fontSize:"11.5px", fontWeight:700, color:T.foreground3, fontFamily:"'Prompt',sans-serif" }}>
                  ประเมินแล้ว {answeredCount} / {totalItems}
                </span>
              </div>

              {checklist.map((item, idx) => {
                const isOpen = activeSection === idx;
                const state  = itemStates[item.id] || { status:null, note:"", photos:[] };
                const statusLabel =
                  state.status === "safe"             ? "✔️ ปลอดภัย" :
                  state.status === "unsafe_condition" ? "⚠️ สภาพไม่ปลอดภัย" :
                  state.status === "unsafe_action"    ? "🚫 พฤติกรรมไม่ปลอดภัย" : "";

                return (
                  <div key={item.id} className={`lw-accordion${isOpen?" active":""}`}>
                    <div className="lw-accordion-hdr" onClick={() => setActiveSection(isOpen ? -1 : idx)}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                        <span style={{ fontSize:13, color:T.primaryDark, fontWeight:800, fontFamily:"'Prompt',sans-serif", flexShrink:0 }}>{idx+1}.</span>
                        <span style={{ fontFamily:"'Prompt',sans-serif", fontSize:"13.5px", fontWeight:700, color:T.foreground, lineHeight:1.4 }}>{item.title}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                        {statusLabel && (
                          <span style={{
                            fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, fontFamily:"'Prompt',sans-serif",
                            background: state.status==="safe"?"#e6f7ed":state.status==="unsafe_condition"?"#fee2e2":"#fef3c7",
                            color: state.status==="safe"?T.ok:state.status==="unsafe_condition"?T.danger:"#d97706",
                          }}>{statusLabel}</span>
                        )}
                        <div className="lw-accordion-arrow"><IcoChevron /></div>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop:"1px solid rgba(14,15,18,0.06)", padding:18, background:"#fff" }}>
                        {item.guideTitle !== false && (
                          <p style={{ fontFamily:"'Prompt',sans-serif", fontSize:12, fontWeight:800, color:T.foreground3, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 8px" }}>
                            {item.guideTitle || `แนวทางการตรวจ ${item.title.split(":")[0]}`}
                          </p>
                        )}
                        <ul style={{ margin:"0 0 16px", paddingLeft:18, fontSize:"12.5px", color:T.foreground2, lineHeight:1.7 }}>
                          {item.guidelines.map((g,gi) => <li key={gi} style={{ marginBottom:2 }}>{g}</li>)}
                        </ul>

                        <p style={{ fontFamily:"'Prompt',sans-serif", fontSize:"12.5px", fontWeight:800, color:T.foreground, margin:"0 0 8px" }}>สถานะความปลอดภัย</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16 }}>
                          {[
                            { key:"safe",             label:"ปลอดภัย",                    cls:"safe" },
                            { key:"unsafe_condition", label:"สภาพที่ไม่ปลอดภัย",           cls:"unsafe-cond" },
                            { key:"unsafe_action",    label:"พฤติกรรมการทำงานไม่ปลอดภัย", cls:"unsafe-act" },
                          ].map(s => (
                            <button key={s.key} type="button"
                              className={`lw-status-btn ${s.cls}${state.status===s.key?" active":""}`}
                              onClick={() => handleStatusChange(item.id, s.key)}
                            >
                              <div style={{ width:14, height:14, borderRadius:"50%", border:"1.5px solid currentColor", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <div style={{ width:6, height:6, borderRadius:"50%", background:"currentColor", transform:state.status===s.key?"scale(1)":"scale(0)", transition:"transform 0.15s" }} />
                              </div>
                              {s.label}
                            </button>
                          ))}
                        </div>

                        <div style={{ display:"flex", flexDirection:"column", gap:6, margin:"14px 0" }}>
                          <span style={{ fontSize:11, color:T.foreground3, fontWeight:700, fontFamily:"'Prompt',sans-serif" }}>หมายเหตุ / รายละเอียด / คำแนะนำ</span>
                          <textarea className="lw-note-box" value={state.note}
                            placeholder="กรุณากรอกรายละเอียดเพิ่มเติม..."
                            onChange={e => handleNoteChange(item.id, e.target.value)} />
                        </div>

                        <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:"11.5px", fontWeight:800, color:T.foreground3, textTransform:"uppercase", margin:"14px 0 6px" }}>แนบรูปภาพ</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                          <label className="lw-upload-trigger">
                            <IcoUpload /> Upload รูปภาพ
                            <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => handlePhotoUpload(item.id, e)} />
                          </label>
                           {state.photos.map((url, pi) => (
                            <div key={pi} style={{ width:64, height:64, borderRadius:8, position:"relative", overflow:"hidden", border:"1px solid rgba(14,15,18,0.08)" }}>
                              <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(item.id, pi)}
                                style={{
                                  position:"absolute",
                                  top:2,
                                  right:2,
                                  width:16,
                                  height:16,
                                  borderRadius:"50%",
                                  background:"rgba(0,0,0,0.6)",
                                  color:"#fff",
                                  border:"none",
                                  display:"flex",
                                  alignItems:"center",
                                  justifyContent:"center",
                                  cursor:"pointer",
                                }}
                              >
                                <IcoX />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit */}
              <div style={{ padding:"12px 0 0" }}>
                <button type="button" onClick={handleSubmit} className="lw-cta" disabled={submitDisabled} aria-disabled={submitDisabled} title={submitDisabled ? "กรอกข้อมูลให้ครบทุกขั้นก่อนจึงจะส่งได้" : undefined}>
                  <IcoShield />
                  ส่งข้อมูลการตรวจ Line Walk
                  <IcoArrow />
                </button>
              </div>
            </div>
          </FadeSlide>

        </div>
      </div>
    </>
  );
}
// @ts-nocheck

