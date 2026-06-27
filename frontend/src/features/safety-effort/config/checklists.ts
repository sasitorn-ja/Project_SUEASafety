import type { EvidenceMedia } from "@/features/safety-effort/lib/evidence-media";

export type ChecklistLocationType = "factory" | "office" | "site";

export type ChecklistQuestion = {
  id: string;
  title: string;
  guideTitle?: string | false;
  guidelines: string[];
  format?: "original" | "text_box";
  image?: string;
  imageMediaId?: string;
  active?: boolean;
};

export type ChecklistCollection = Record<ChecklistLocationType, ChecklistQuestion[]>;

export const LOCATION_TYPE_LABELS: Record<ChecklistLocationType, string> = {
  factory: "โรงงาน",
  office: "สำนักงาน",
  site: "Site งาน",
};

export const LOCATION_TYPE_OPTIONS = [
  { key: "factory" as const, label: LOCATION_TYPE_LABELS.factory },
  { key: "office" as const, label: LOCATION_TYPE_LABELS.office },
  { key: "site" as const, label: LOCATION_TYPE_LABELS.site },
];

export const DEFAULT_CHECKLISTS: ChecklistCollection = {
  factory: [
    { id: "mixer", title: "Mixer", guidelines: ["มีป้ายข้อปฏิบัติงาน ก่อนเข้าใน Mixer", "มีป้ายบังคับสวมใส่อุปกรณ์ PPE บริเวณ Mixer", "มีระบบล็อคฝา Mixer และตู้ Load break switch มีสภาพที่ดี", "มี Emergency Switch ในจุดที่เหมาะสมใช้งานได้ พร้อมป้ายบ่งชี้", "มี Limit switch ที่ฝา Mixer ครบทุกฝา และใช้งานได้", "มีราวกันตกด้านหลัง Mixer ที่ปลอดภัย", "มีการครอบจุดหมุนของ Mixer เช่น สายพาน, ยอยเกียร์, ท้าย Motor ให้มิดชิด"] },
    { id: "skiphoist", title: "Skiphoist", guideTitle: "แนวทางการตรวจ Skiphoist", guidelines: ["มีการ์ด/ประตู กั้นห้อง Skip-hoist ให้มิดชิดทุกด้าน", "มีกุญแจล็อคประตู Skip-hoist และมีการใช้งาน", "มี Limit switch ประตู Skip-hoist ครบทุกบาน และใช้งานได้", "มี Emergency Switch ในจุดที่เหมาะสมใช้งานได้ พร้อมป้ายบ่งชี้"] },
    { id: "sand-drag", title: "เครื่องลากหิน-ทราย", guideTitle: "แนวทางการตรวจ เครื่องลาก หิน ทราย", guidelines: ["มีการชี้แบ่งแนวเขตอันตรายที่ปลายกองหิน-ทราย เห็นชัดเจน", "มีป้ายเตือนระวังอันตรายจากกระเบลากหิน-ทราย", "มีทาสี และบ่งชี้แสดงจุดหมุนของท้ายเครื่องลากเห็นชัดเจน", "มี Emergency Switch ในจุดที่เหมาะสมใช้งานได้ พร้อมป้ายบ่งชี้", "มีกระจกนิรภัย/การ์ดป้องกัน หน้าเก๋งเครื่องลาก อย่างมิดชิด"] },
    { id: "motor-pump", title: "MOTOR / ปั๊ม", guideTitle: "แนวทางการตรวจ Motor / ปั๊ม", guidelines: ["มีการ์ดครอบจุดหมุน เช่น ยอย, ใบพัดท้าย Motor ที่มิดชิด", "มีการต่อสายดิน ถูกต้องและปลอดภัย", "สภาพสายไฟ และอุปกรณ์ไฟฟ้า ปลอดภัยไม่ชำรุด"] },
    { id: "tools", title: "เครื่องมือ/อุปกรณ์ : มีสติกเกอร์สีเขียวแสดงผ่านการรับรองปีล่าสุด", guidelines: ["ตู้เชื่อมไฟฟ้า", "เครื่องเจียร/ตัด", "เครื่องเป่าลม (Blower)", "High-pressure", "แผงจ่ายไฟฟ้า", "เครื่องตัดแก๊ส", "พัดลมอุตสาหกรรม"] },
    { id: "mixer-truck", title: "รถโม่", guidelines: ["กล้องติดครบ 2 ด้าน", "สภาพความปลอดภัยตัวรถ เช่น ระบบเบรค/พวงมาลัย", "ความพร้อมจบลส. เช่น การแต่งกายตามแบบฟอร์มของบริษัท"] },
    { id: "other", title: "Other : พฤติกรรมการทำงานที่มีความเสี่ยง/สิ่งแวดล้อม/อื่นๆ", guideTitle: false, guidelines: ["พฤติกรรมการทำงานตามหลักกฎพิทักษ์ชีวิต", "พบเหตุการณ์ที่อาจส่งผลต่อชุมชน", "อื่นๆ"] },
    { id: "near-miss", title: "Near miss", guideTitle: false, guidelines: ["เหตุการณ์เกือบเกิดอุบัติเหตุ หรือ Near Miss คือ เหตุการณ์ที่เกือบเกิดอุบัติเหตุแต่สามารถแก้ไขสถานการณ์ได้ทัน"] },
  ],
  office: [
    { id: "office-env", title: "ความปลอดภัยด้านโครงสร้างและสิ่งแวดล้อม", guideTitle: "แนวทางการตรวจ ความปลอดภัยด้านโครงสร้างและสิ่งแวดล้อม", guidelines: ["พื้นทางเดินสะอาด ไม่มีสิ่งกีดขวาง หรือเศษวัสดุที่เป็นอันตราย", "พื้นไม่เปียกชื้นหรือลื่น ไม่มีสายไฟพาดผ่านทางเดินที่อาจทำให้สะดุด", "ประตู หน้าต่าง และกระจกอาคารอยู่ในสภาพสมบูรณ์และใช้งานได้ปลอดภัย", "แสงสว่างในพื้นที่ทำงานและทางเดินเพียงพอและเหมาะสมกับการทำงาน"] },
    { id: "office-equip", title: "อุปกรณ์สำนักงาน", guideTitle: "แนวทางการตรวจ อุปกรณ์สำนักงาน", guidelines: ["โต๊ะและเก้าอี้ทำงานอยู่ในสภาพดี ไม่ชำรุดเสียหาย และปรับระดับได้เหมาะสม", "เครื่องใช้ไฟฟ้าในสำนักงาน (เช่น คอมพิวเตอร์ พรินเตอร์) อยู่ในสภาพดี ไม่มีสายไฟชำรุด", "การจัดเก็บเอกสารและอุปกรณ์บนชั้นวางของมีความมั่นคง ไม่สูงเกินไปหรือเสี่ยงต่อการร่วงหล่น"] },
    { id: "office-fire", title: "ความปลอดภัยจากอัคคีภัย", guideTitle: "แนวทางการตรวจ ความปลอดภัยจากอัคคีภัย", guidelines: ["ถังดับเพลิงมีสภาพพร้อมใช้งาน มีการตรวจสอบประจำปี และไม่มีสิ่งกีดขวาง", "ทางหนีไฟและประตูทางออกฉุกเฉินไม่มีสิ่งกีดขวาง มีป้ายบอกทางสว่างและชัดเจน", "ระบบตรวจจับควัน (Smoke Detector) และระบบสัญญาณเตือนภัยได้รับการดูแลรักษาให้อยู่ในสภาพดี"] },
    { id: "office-hygiene", title: "สุขอนามัยและความปลอดภัยส่วนบุคคล", guideTitle: "แนวทางการตรวจ สุขอนามัยและความปลอดภัยส่วนบุคคล", guidelines: ["มีจุดบริการน้ำดื่มสะอาดและเพียงพอสำหรับพนักงาน", "ห้องน้ำสะอาดและมีการทำความสะอาดอย่างสม่ำเสมอ มีสบู่ล้างมือและกระดาษชำระเพียงพอ", "มีตู้ยาปฐมพยาบาลเบื้องต้นที่มีเวชภัณฑ์ครบถ้วนและไม่หมดอายุในจุดที่เข้าถึงได้ง่าย"] },
    { id: "office-prevent", title: "การป้องกันอุบัติเหตุ", guideTitle: "แนวทางการตรวจ การป้องกันอุบัติเหตุ", guidelines: ["มีป้ายเตือนความปลอดภัยในจุดต่างระดับ หรือพื้นที่ที่กำลังมีการทำความสะอาด", "เครื่องมือที่มีความคม เช่น เครื่องตัดกระดาษ กรรไกร ได้รับการจัดเก็บอย่างปลอดภัยหลังการใช้งาน", "มีขั้นตอนและแนวทางการปฏิบัติเมื่อเกิดเหตุฉุกเฉินแจ้งให้พนักงานทราบชัดเจน"] },
    { id: "office-traffic", title: "การจัดการเส้นทางสัญจรและการจอดรถ", guideTitle: "แนวทางการตรวจ การจัดการเส้นทางสัญจรและการจอดรถ", guidelines: ["มีการแบ่งเส้นทางเดินเท้าและเส้นทางเดินรถแยกกันอย่างชัดเจนบริเวณหน้าสำนักงาน", "มีป้ายจราจรและสัญลักษณ์จำกัดความเร็วภายในพื้นที่จอดรถ", "จัดพื้นที่จอดรถอย่างเป็นระเบียบ ไม่กีดขวางทางเข้าออกอาคารและทางหนีไฟ"] },
    { id: "office-walk", title: "ความปลอดภัยในการเดินเท้า", guideTitle: "แนวทางการตรวจ ความปลอดภัยในการเดินเท้า", guidelines: ["รณรงค์ไม่ใช้โทรศัพท์มือถือขณะเดินในพื้นที่สำนักงาน หรือขณะขึ้น-ลงบันได", "ทางเดินเท้าภายนอกอาคารเรียบสม่ำเสมอ ไม่มีน้ำขัง หลุมบ่อ หรือจุดสะดุดล้ม", "มีราวจับบันไดที่มั่นคงแข็งแรง และพนักงานมีการใช้งานราวจับทุกครั้ง"] },
    { id: "office-speed", title: "การควบคุมความเร็วและพฤติกรรมการขับขี่", guideTitle: "แนวทางการตรวจ การควบคุมความเร็วและพฤติกรรมการขับขี่", guidelines: ["มีการควบคุมความเร็วรถยนต์/รถจักรยานยนต์ภายในเขตสำนักงานไม่เกิน 20 กม./ชม.", "พนักงานขับขี่รถยนต์คาดเข็มขัดนิรภัย และผู้ขับขี่รถจักรยานยนต์สวมหมวกกันน็อก 100%", "จอดรถในพื้นที่ที่กำหนดเท่านั้น และไม่มีการขับรถย้อนศรหรือฝ่าฝืนกฎจราจร"] },
    { id: "office-other", title: "อื่น ๆ โปรดระบุรายละเอียด", guideTitle: false, guidelines: ["ระบุประเด็นความปลอดภัยอื่นๆ ที่ตรวจพบเพิ่มเติมในสำนักงาน"] },
    { id: "office-near-miss", title: "Nearmiss", guideTitle: false, guidelines: ["เหตุการณ์เกือบเกิดอุบัติเหตุ (Near Miss) คือเหตุการณ์ที่ไม่คาดคิดแต่ไม่ก่อให้เกิดความเสียหายหรือบาดเจ็บ", "การรายงาน Near Miss ช่วยชี้จุดบกพร่องและแก้ไขเพื่อป้องกันไม่ให้เกิดอุบัติเหตุซ้ำขึ้นอีก"] },
  ],
  site: [
    { id: "site-readiness", title: "ความพร้อมของพื้นที่หน้างาน", guideTitle: "แนวทางการตรวจ ความพร้อมของพื้นที่หน้างาน", guidelines: ["พื้นที่หน้างานมีการจัดเตรียมพร้อมสำหรับการรับคอนกรีต", "มีการกั้นแนวเขตพื้นที่ปฏิบัติงานอย่างชัดเจน ป้องกันบุคคลภายนอกเข้า", "พื้นที่ไม่มีสิ่งกีดขวางที่เป็นอันตรายต่อการปฏิบัติงานและการสัญจร", "มีป้ายเตือนและสัญลักษณ์ความปลอดภัยติดตั้งในจุดที่เห็นได้ชัดเจน"] },
    { id: "site-truck-access", title: "ความสะดวกในการเข้าถึงของรถโม่", guideTitle: "แนวทางการตรวจ ความสะดวกในการเข้าถึงของรถโม่", guidelines: ["เส้นทางเข้า-ออกของรถโม่มีความกว้างเพียงพอและไม่มีสิ่งกีดขวาง", "พื้นผิวถนนหรือทางเข้าสามารถรับน้ำหนักรถโม่ได้อย่างปลอดภัย", "มีพื้นที่หมุนกลับรถหรือออกจากไซต์ได้อย่างสะดวกและปลอดภัย", "ไม่มีสายไฟฟ้าแรงสูงหรืออุปสรรคเหนือศีรษะที่อาจเป็นอันตรายต่อรถโม่"] },
    { id: "site-safety", title: "ความปลอดภัยในหน้างาน", guideTitle: "แนวทางการตรวจ ความปลอดภัยในหน้างาน", guidelines: ["ผู้ปฏิบัติงานทุกคนสวมใส่ PPE ครบถ้วน ได้แก่ หมวกนิรภัย รองเท้านิรภัย เสื้อสะท้อนแสง", "ผู้ทำงานบนที่สูงสวมใส่สายเข็มขัดนิรภัยแบบเต็มตัว (Full Body Harness) ทุกครั้ง", "มีการกั้นแนวเขตอันตรายรอบพื้นที่เทคอนกรีตและบริเวณที่มีความเสี่ยง", "ไม่มีบุคคลที่ไม่เกี่ยวข้องอยู่ในพื้นที่ปฏิบัติงานขณะเทคอนกรีต"] },
    { id: "site-team-readiness", title: "ความพร้อมของทีมงานรับคอนกรีต", guideTitle: "แนวทางการตรวจ ความพร้อมของทีมงานรับคอนกรีต", guidelines: ["ทีมงานรับคอนกรีตมีจำนวนเพียงพอและมีประสบการณ์ในการปฏิบัติงาน", "มีการสื่อสารและประสานงานระหว่างทีมงานกับพนักงานขับรถโม่อย่างชัดเจน", "ทีมงานเข้าใจขั้นตอนการรับคอนกรีตและมีการ Briefing ก่อนเริ่มงาน", "มีผู้ควบคุมงาน (Supervisor) คอยดูแลและกำกับการปฏิบัติงานตลอดเวลา"] },
    { id: "site-ssb-tools", title: "หัวข้อเฉพาะงานติดตั้งของ SSB อุปกรณ์และเครื่องมือ", guideTitle: "แนวทางการตรวจ หัวข้อเฉพาะงานติดตั้งของ SSB อุปกรณ์และเครื่องมือ", guidelines: ["เครื่องมือและอุปกรณ์ติดตั้งอยู่ในสภาพสมบูรณ์ พร้อมใช้งาน และผ่านการตรวจสอบ", "มีสติกเกอร์รับรองการตรวจสอบที่ยังไม่หมดอายุติดกับอุปกรณ์ทุกชิ้น", "อุปกรณ์ยกหิ้ว เช่น รอก สลิง โซ่ อยู่ในสภาพดี ไม่ชำรุดเสียหายหรือสึกกร่อน", "มีการจัดเก็บเครื่องมืออย่างเป็นระเบียบ ไม่วางกีดขวางทางเดินหรือทางหนีไฟ"] },
    { id: "site-ssb-readiness", title: "หัวข้อเฉพาะงานติดตั้งของ SSB ความพร้อมหน้างาน", guideTitle: "แนวทางการตรวจ หัวข้อเฉพาะงานติดตั้งของ SSB ความพร้อมหน้างาน", guidelines: ["แบบแปลนและแผนผังการติดตั้งมีความชัดเจนและพนักงานเข้าใจขั้นตอนการทำงาน", "มีการตรวจสอบความมั่นคงของโครงสร้างรับน้ำหนักก่อนเริ่มติดตั้ง", "พื้นที่รอบจุดติดตั้งมีการกั้นแนวเขตอันตรายและป้ายเตือนครบถ้วน", "มีแผนฉุกเฉินและขั้นตอนการอพยพที่ชัดเจนสำหรับพนักงานในหน้างาน"] },
    { id: "site-other", title: "อื่นๆ โปรดระบุรายละเอียด", guideTitle: false, guidelines: ["ระบุประเด็นความปลอดภัยอื่นๆ ที่ตรวจพบเพิ่มเติมในไซต์งาน"] },
    { id: "site-near-miss", title: "Nearmiss", guideTitle: false, guidelines: ["เหตุการณ์เกือบเกิดอุบัติเหตุ (Near Miss) คือเหตุการณ์ที่เกือบเกิดอุบัติเหตุแต่สามารถแก้ไขสถานการณ์ได้ทัน", "การรายงาน Near Miss ช่วยชี้จุดบกพร่องและแก้ไขเพื่อป้องกันไม่ให้เกิดอุบัติเหตุซ้ำขึ้นอีก"] },
  ],
};

export function deepCloneChecklists(checklists: ChecklistCollection = DEFAULT_CHECKLISTS): ChecklistCollection {
  return JSON.parse(JSON.stringify(checklists));
}

export function getChecklistLocationType(type?: string | null): ChecklistLocationType {
  if (type === "สำนักงาน" || type === "บริษัท") return "office";
  if (type === "Site งาน" || type === "ก่อสร้าง") return "site";
  return "factory";
}

function sanitizeQuestion(raw: any, fallbackIndex: number): ChecklistQuestion {
  return {
    id: String(raw?.id || `question-${fallbackIndex + 1}`),
    title: String(raw?.title || `หัวข้อ ${fallbackIndex + 1}`),
    guideTitle: raw?.guideTitle === false ? false : raw?.guideTitle ? String(raw.guideTitle) : undefined,
    guidelines: Array.isArray(raw?.guidelines)
      ? raw.guidelines.map((item: any) => String(item || "")).filter(Boolean)
      : [],
    format: raw?.format === "text_box" ? "text_box" : "original",
    image: raw?.image ? String(raw.image) : undefined,
    imageMediaId: raw?.imageMediaId ? String(raw.imageMediaId) : undefined,
    active: raw?.active === false ? false : true,
  };
}

function sanitizeChecklistCollection(raw: any): ChecklistCollection | null {
  if (!raw || typeof raw !== "object") return null;

  const next = {} as ChecklistCollection;
  for (const type of ["factory", "office", "site"] as ChecklistLocationType[]) {
    if (!Array.isArray(raw[type])) return null;
    next[type] = raw[type].map((question: any, index: number) => sanitizeQuestion(question, index));
  }

  return next;
}

function hasChecklistItems(checklists: ChecklistCollection | null) {
  return Boolean(checklists && Object.values(checklists).some((items) => items.length > 0));
}

export function loadChecklistDraft(): ChecklistCollection | null {
  return activeChecklistDraft ? deepCloneChecklists(activeChecklistDraft) : null;
}

export async function saveChecklistDraft(checklists: ChecklistCollection) {
  activeChecklistDraft = sanitizeChecklistCollection(checklists) || deepCloneChecklists(DEFAULT_CHECKLISTS);
  if (typeof window !== "undefined") {
    const response = await fetch("/api/safety-effort/checklists", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklists: activeChecklistDraft }),
    });
    if (!response.ok) throw new Error("checklists_save_failed");
  }
  return activeChecklistDraft;
}

export async function restoreChecklistDefaults() {
  activeChecklistDraft = deepCloneChecklists(DEFAULT_CHECKLISTS);
  return saveChecklistDraft(activeChecklistDraft);
}

let activeChecklistDraft: ChecklistCollection | null = null;

export async function hydrateChecklistDraft() {
  if (typeof window === "undefined") return getActiveChecklistCollection();
  const response = await fetch("/api/safety-effort/checklists", { credentials: "include", cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) return getActiveChecklistCollection();
  const stored = sanitizeChecklistCollection(payload.data?.checklists);
  if (hasChecklistItems(stored)) activeChecklistDraft = stored;
  return getActiveChecklistCollection();
}

export function getActiveChecklistCollection() {
  return loadChecklistDraft() || deepCloneChecklists(DEFAULT_CHECKLISTS);
}

export function getChecklistForType(type?: string | null) {
  const collection = getActiveChecklistCollection();
  const list = collection[getChecklistLocationType(type)];
  return list.filter((item) => item.active !== false);
}

export function createInitialItemStates(checklist: ChecklistQuestion[]) {
  return checklist.reduce((acc, item) => {
    acc[item.id] = { status: null, note: "", photos: [] as EvidenceMedia[] };
    return acc;
  }, {} as Record<string, { status: string | null; note: string; photos: EvidenceMedia[] }>);
}
