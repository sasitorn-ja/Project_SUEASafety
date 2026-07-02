// Safety Awareness — question bank, types, and bulk-paste parser.
// The daily blocking popup ("Safety Awareness") draws 3 random ENABLED questions
// from this bank. Admins manage the bank from "Settings Safety Awareness".

export type SafetyAwarenessQuestion = {
  id: string;
  category: string;
  /** The true/false statement shown to the user. */
  text: string;
  /** true = ถูก, false = ผิด */
  answer: boolean;
  /** Optional explanation shown in the answer reveal (เฉลย). */
  note?: string;
  /** Disabled questions are never drawn for the popup. */
  enabled: boolean;
};

const DEFAULT_CATEGORY = "ทั่วไป";

/** Strip leading bullets / numbering like "* ", "- ", "12. ", "12) ". */
function stripLeadMarker(line: string): string {
  return line.replace(/^\s*(?:[*•\-]\s+|\d+\s*[.)]\s+)/, "").trim();
}

/** Pull a clean category label out of a "หมวด..." header line. */
function parseCategoryHeader(line: string): string {
  // Take text after the first ":" if present, else the whole line.
  let label = line.includes(":") ? line.slice(line.indexOf(":") + 1) : line;
  // Remove trailing "(ข้อ 1-10)" style hints.
  label = label.replace(/\(\s*ข้อ[^)]*\)\s*$/i, "");
  label = label.trim();
  return label || line.trim();
}

const QUESTION_RE =
  /^(.*?)\s*[(（]\s*(ถูก|ผิด)\s*(?:[-–:]\s*([^)）]*?))?\s*[)）]\s*$/;

let parseCounter = 0;

/**
 * Parse free-text into questions. Supports the same layout the team already uses:
 *   - Lines starting with "หมวด" set the current category.
 *   - Other lines ending in "(ถูก)" / "(ผิด)" / "(ผิด - คำอธิบาย)" become questions.
 * Lines that don't match either pattern are ignored.
 */
export function parseAwarenessBulk(
  raw: string,
  idPrefix = "sa-import",
): SafetyAwarenessQuestion[] {
  const out: SafetyAwarenessQuestion[] = [];
  let currentCategory = DEFAULT_CATEGORY;

  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (/^หมวด/.test(trimmed)) {
      currentCategory = parseCategoryHeader(trimmed);
      continue;
    }

    const line = stripLeadMarker(trimmed);
    const match = line.match(QUESTION_RE);
    if (!match) continue;

    const text = match[1].trim();
    if (!text) continue;
    const answer = match[2] === "ถูก";
    const note = (match[3] || "").trim();

    parseCounter += 1;
    out.push({
      id: `${idPrefix}-${Date.now().toString(36)}-${parseCounter}`,
      category: currentCategory,
      text,
      answer,
      note: note || undefined,
      enabled: true,
    });
  }

  return out;
}

/** Ensure stored/imported questions have valid, unique shape. */
export function normalizeAwarenessQuestions(
  questions: SafetyAwarenessQuestion[],
): SafetyAwarenessQuestion[] {
  const seen = new Set<string>();
  return questions
    .filter((q) => q && typeof q.text === "string" && q.text.trim())
    .map((q, index) => {
      let id = (q.id || "").toString().trim() || `sa-${index + 1}`;
      while (seen.has(id)) id = `${id}-${index}`;
      seen.add(id);
      return {
        id,
        category: (q.category || DEFAULT_CATEGORY).toString().trim() || DEFAULT_CATEGORY,
        text: q.text.trim(),
        answer: Boolean(q.answer),
        note: q.note ? q.note.toString().trim() || undefined : undefined,
        enabled: q.enabled !== false,
      };
    });
}

// ── Seed bank (pre-loaded in the system) ──────────────────────────────────
// Stored as plain text so it is easy to read/extend and is parsed on load.
const SEED_TEXT = `
หมวดที่ 1: การเตรียมความพร้อมและ KYT
จบส. ต้องทำ Safety talk หรือ KYT ทุกครั้งก่อนเริ่มงาน เช้า กลางวัน และเย็นหากมีงานต่อเนื่อง (ถูก)
การทดสอบความพร้อมร่างกายก่อนเริ่มงานประกอบด้วย การทรงตัว ความไวตอบสนอง และการโฟกัสสายตา (ถูก)
หากรู้สึกว่าสายตาโฟกัสไม่ชัดเจนในตอนเช้า จบส. ยังสามารถออกรถไปก่อนได้แล้วค่อยพักตอนเที่ยง (ผิด)
การทำ KYT คือการพูดคุยจุดเสี่ยงของงานที่จะไปส่งในเที่ยวนั้นๆ (ถูก)
จบส. ต้องตรวจวัดแอลกอฮอล์ทุกวันก่อนปฏิบัติงาน (ถูก)
หากหัวหน้าโรงงานไม่ว่าง จบส. ไม่จำเป็นต้องทำ KYT (ผิด)
การทดสอบการทรงตัวทำได้โดยการยืนขาเดียว (ถูก)
การตรวจสอบ SDA App ต้องทำตามหัวข้อที่กำหนดทุกวัน (ถูก)
จบส. ไม่ต้องแจ้งจุดเสี่ยงหน้างานให้หัวหน้าทราบ เพราะเป็นหน้าที่ของศูนย์จ่าย (ผิด)
แบบฟอร์ม F-18-467 ใช้สำหรับตรวจวัดความพร้อมของ จบส. (ถูก)
หมวดที่ 2: คุณสมบัติและการแต่งกาย
จบส. ใหม่ต้องมีอายุระหว่าง 22 – 60 ปี (ถูก)
จบส. ต้องมีใบขับขี่ประเภท ท.2 ขึ้นไปและไม่หมดอายุ (ถูก)
พนักงานที่เป็นโรคเบาหวานที่ต้องฉีดอินซูลิน สามารถขับรถโม่ได้ปกติ (ผิด)
จบส. ต้องผ่านการอบรม Safety Driving Course ทบทวนอย่างน้อยปีละ 1 ครั้ง (ถูก)
การสวมหมวกเซฟตี้ (Helmet) จำเป็นเฉพาะตอนเทคอนกรีตเท่านั้น (ผิด - ต้องสวมทุกครั้งที่ออกนอกรถ)
รองเท้าเซฟตี้ต้องใส่ทุกครั้งเมื่อออกนอกตัวรถ (ถูก)
การใส่เสื้อพนักงาน จบส. ถือเป็นส่วนหนึ่งของมาตรฐานความปลอดภัย (ถูก)
หากมีประวัติอาชญากรรมร้ายแรง จะไม่ผ่านคุณสมบัติการเป็น จบส. ใหม่ (ถูก)
จบส. ที่ถูก Blacklist โดย CPAC/Q-Mix สามารถกลับมาสมัครใหม่ได้ทันที (ผิด)
อุปกรณ์ป้องกันส่วนบุคคล (PPE) ชนิดอื่นเพิ่มเติม ให้อยู่ในการตัดสินใจของ จป. หรือหัวหน้างาน (ถูก)
หมวดที่ 3: การตรวจสภาพรถ (SDA - 13 จุดแดง)
หากพบข้อบกพร่องใน "รายการจุดแดง" 13 จุด ต้องหยุดวิ่งรถและส่งซ่อมทันที (ถูก)
ลมเบรกเท้าเมื่อเหยียบปล่อย แรงดันลมต้องตกไม่เกิน 2 บาร์ (ถูก)
ดอกยางรถโม่ต้องมีความลึกไม่น้อยกว่า 1.6 มิลลิเมตร (ถูก)
กระจกมองข้างด้านซ้ายต้องมี 3 บาน และด้านขวา 1 บาน (ถูก)
การตรวจสอบเข็มขัดนิรภัย ทำได้โดยการดึงกระตุกแล้วต้องล็อก (ถูก)
หากไฟราวบนเก๋งขาด 1 ดวง ถือว่าผ่านรายการจุดแดง (ผิด - ระบบไฟสัญญาณต้องติดครบ)
การ์ดข้างกันรถจักรยานยนต์หายไป 1 ข้าง สามารถวิ่งงานต่อได้ 1 วัน (ผิด)
ระบบ GPS และกล้องติดหน้ารถต้องอยู่ในสภาพพร้อมใช้งานเสมอ (ถูก)
ต้องมีอุปกรณ์เสริมช่วยโทรศัพท์ (Hand-free) ในขณะขับขี่ (ถูก)
หากพบข้อบกพร่องใน "รายการทั่วไป" (ไม่ใช่จุดแดง) ต้องแก้ไขภายใน 30 วัน (ถูก)
การเช็คน้ำมันหล่อลื่นต้องอยู่ในระดับมาตรฐานและไม่รั่วซึม (ถูก)
กรวยจราจรสะท้อนแสงต้องมีติดรถอย่างน้อย 3 ชิ้น (ถูก)
หมอนหนุนล้อต้องมีติดรถอย่างน้อย 2 ชิ้น (ถูก)
สติกเกอร์สะท้อนแสงสีเหลือง-ดำรอบรถโม่ หากหลุดลอกไม่ต้องแจ้งซ่อมก็ได้ (ผิด)
การปิดเหล็กกั้นกันตกที่ชานพักบันไดรถโม่ ต้องทำทุกครั้ง (ถูก)
หมวดที่ 4: กฎจราจรและการควบคุมความเร็ว
ความเร็วในพื้นที่ทั่วไป กำหนดไม่เกิน 60 กม./ชม. (ถูก)
ความเร็วในเขตชุมชน หน้าโรงเรียน หรือตลาด กำหนดไม่เกิน 30 กม./ชม. (ถูก)
เมื่อเลี้ยวเข้าทางร่วม ทางแยก หรือโค้งหักศอก ต้องใช้ความเร็วไม่เกิน 20 กม./ชม. (ถูก)
จบส. สามารถขับรถถอยหลังบนถนนได้หากไม่มีรถตามมา (ผิด - ห้ามถอยหลังบนถนนทุกกรณี)
การให้สัญญาณไฟเลี้ยว ต้องเปิดก่อนถึงระยะอย่างน้อย 60 เมตร (ถูก)
การขับรถจี้ท้ายช่วยให้ลดจุดบอดด้านหน้าได้ (ผิด)
จุดบอดด้านหลังรถโม่ คือระยะที่มองไม่เห็นอย่างน้อย 10 เมตร (ถูก)
มุมที่น่ากลัวที่สุดและคนขับเห็นได้น้อยที่สุดคือ ด้านซ้ายของรถโม่ (ถูก)
หากรถโม่มีความสูง 4 เมตร ต้องระวังซุ้มประตูวัดที่มีความสูงต่ำกว่า 4 เมตร (ถูก)
การขับรถ "ชิดซ้ายสุด" เมื่อจะเลี้ยวซ้าย ช่วยลดโอกาสรถจักรยานยนต์แทรก (ถูก)
เมื่อรถมีปัญหาต้องจอดไหล่ทาง ให้วางกรวยอันที่ 3 ห่างจากท้ายรถ 50 เมตร (ถูก)
จบส. สามารถใช้โทรศัพท์มือถือแบบแนบหูได้หากขับด้วยความเร็วต่ำ (ผิด)
ห้ามบุคคลที่ไม่เกี่ยวข้องนั่งไปกับรถโม่โดยเด็ดขาด (ถูก)
ห้ามขับรถโม่เข้าไปในจุดที่มีหมอกหรือควันหนาทึบ (ถูก)
การขับรถเชิงป้องกันตามหลัก Smith System มี 5 ข้อ (ถูก)
หมวดที่ 5: การประเมินหน้างานและการเทคอนกรีต
เมื่อถึงหน้างาน จบส. ต้องลงจากรถเพื่อสำรวจพื้นที่ก่อนทุกครั้ง (ถูก)
การสำรวจความอ่อนนุ่มของดิน ให้ใช้เหล็ก 9 มม. ยาว 1 เมตร แทงลงดิน (ถูก)
หากแทงเหล็กลงดินแล้วยุบเกิน 30 ซม. แสดงว่าดินรับน้ำหนักรถโม่ไม่ได้ (ถูก)
การจอดรถใกล้ขอบหลุมลึก 1 เมตร ต้องเว้นระยะห่างจากขอบหลุมอย่างน้อย 2 เมตร (ถูก - สูตรคือ ความลึก+1)
หากหลุมลึก 3 เมตร ต้องจอดห่างจากขอบหลุม 4 เมตร (ถูก)
หน้างานที่เป็นดินแฉะหรือดินถมใหม่ จบส. สามารถถอยเข้าเทได้ทันทีตามคำสั่งลูกค้า (ผิด)
การเจรจากับลูกค้าเมื่อหน้างานเสี่ยง ต้องใช้ท่วงทีที่สุภาพและอธิบายเหตุผลความปลอดภัย (ถูก)
จบส. ต้องอยู่ประจำรถโม่ตลอดเวลาที่ปฏิบัติงานเทคอนกรีต (ถูก)
ห้ามนั่งบนบังโคลนรถโม่ในขณะปฏิบัติงาน (ถูก)
งานเข็มเจาะ จบส. ต้องมั่นใจว่าไม่มีคนทำงานอยู่ท้ายรถขณะถอย (ถูก)
งานอาคารสูงที่ใช้เครนยกบัคเก็ต จบส. ต้องจอดรถห่างจากรัศมีการยกอย่างน้อย 3 เมตร (ถูก)
การจอดรถเทในพื้นที่ลาดชัน ต้องดับเครื่องและดึงเบรกมือเท่านั้นไม่ต้องหนุนล้อ (ผิด - ต้องหนุนล้อด้วย)
พื้นที่ลาดชันที่รถเสี่ยงจะไหล "ไปข้างหน้า" ให้วางหมอนหนุนล้อที่ "ด้านหน้า" ของล้อ (ถูก)
พื้นที่ลาดชันที่รถเสี่ยงจะไหล "ไปข้างหลัง" ให้วางหมอนหนุนล้อที่ "ด้านหลัง" ของล้อ (ถูก)
การจอดรถริมถนนเพื่อเทคอนกรีต ต้องวางกรวยตัวแรกห่างจากท้ายรถ 50 เมตร (ถูก)
ห้ามใช้รถโม่เป็นรถลากจูงรถคันอื่นโดยพลการ (ถูก)
ห้ามยกหัวเก๋งรถโม่เองภายในโรงงาน (ถูก)
หากหน้างานไม่ปลอดภัย จบส. มีสิทธิ์ปฏิเสธการเทและแจ้งหัวหน้างานทันที (ถูก)
การล้างโม่ต้องทำในจุดที่หน้างานกำหนดเท่านั้น (ถูก)
การต่อรางเท PVC ต้องตรวจสอบให้มั่นใจว่าล็อกแน่นหนา (ถูก)
หมวดที่ 6: การจัดการความเหนื่อยล้าและสุขภาพ
การวูบหลับในเพียง 3-5 วินาที รถจะวิ่งโดยปราศจากการควบคุมกว่า 100 เมตร (ถูก)
ยาลดน้ำมูกและยาแก้แพ้ส่วนใหญ่ทำให้เกิดอาการง่วงซึม ห้ามขับรถหลังทานยา (ถูก)
ยาคลายกล้ามเนื้ออาจทำให้มองภาพเบลอและตัดสินใจช้าลง (ถูก)
จบส. ควรพักผ่อนให้เพียงพออย่างน้อย 7 – 9 ชั่วโมง (ถูก)
ห้ามปฏิบัติงานขับรถต่อเนื่องเกิน 4 ชั่วโมง (ถูก)
ใน 1 วัน ห้ามปฏิบัติงานขับรถรวมสะสมเกิน 10 ชั่วโมง (ถูก)
หากหาวบ่อยตลอดเส้นทาง เป็นสัญญาณเตือนว่าควรหยุดพักทันที (ถูก)
การดื่มเครื่องดื่มชูกำลังสามารถทดแทนการนอนหลับได้ (ผิด)
โรคลมชักที่ควบคุมอาการไม่ได้ เป็นโรคที่ห้ามปฏิบัติงานขับรถ (ถูก)
หาก จบส. รู้ตัวว่าไม่พร้อม ควรกล้าบอกหัวหน้างานเพื่อหยุดพัก (ถูก)
หมวดที่ 7: กฎพิทักษ์ชีวิต (LSR) และบทลงโทษ
กฎพิทักษ์ชีวิต (Life Saving Rules) ของบริษัทมีทั้งหมด 10 ข้อ (ถูก)
การฝ่าฝืนกฎดื่มแล้วขับ (ตรวจพบแอลกอฮอล์ขณะขับ) มีโทษสูงสุดคือห้ามทำงานตลอดชีพ (ถูก)
การไม่คาดเข็มขัดนิรภัยขณะขับขี่ ถือเป็นการผิดกฎพิทักษ์ชีวิต (ถูก)
ห้ามจอดรถบนไหล่ทางโดยไม่มีเหตุจำเป็นและไม่มีอุปกรณ์แจ้งเตือน (ถูก)
หากถอดหรือปลดอุปกรณ์ความปลอดภัยของรถโดยไม่ได้รับอนุญาต ถือว่าผิดกฎ LSR (ถูก)
การตรวจพบการทุจริตหรือเล่นการพนันในขณะปฏิบัติงาน มีบทลงโทษถึงขั้นเลิกจ้าง (ถูก)
หากเกิดอุบัติเหตุรุนแรงระดับ L3 (เสียชีวิต) บริษัทคู่ธุรกิจจะถูกปรับ 20,000 บาท (ถูก)
การบันทึกภาพกล้องวีดีโอในรถ หากจงใจปิดบังหรือทำให้ใช้งานไม่ได้ มีโทษปรับรายครั้ง (ถูก)
บทลงโทษจะนับสะสมตามปีปฏิทิน (1 ม.ค. - 31 ธ.ค.) (ถูก)
การใช้ความเร็วเกิน 60 กม./ชม. (Alert จาก LCC) สะสมเกิน 10 ครั้ง/เดือน มีโทษพักงาน 7 วัน (ถูก)
หมวดที่ 8: มาตรฐานการบริการและสถานการณ์ฉุกเฉิน
จบส. ควรกล่าวคำว่า "สวัสดีครับ" และ "ขอบคุณ" กับลูกค้าทุกครั้ง (ถูก)
จบส. สามารถเติมน้ำลงในคอนกรีตได้เองหากเห็นว่าคอนกรีตแห้งเกินไป (ผิด - ห้ามเติมน้ำโดยพลการ)
ก่อนเทคอนกรีต จบส. ควรแนะนำลูกค้าว่าไม่ควรเติมน้ำและควรเทให้หมดภายใน 2 ชม. (ถูก)
หากเกิดรถเสียกลางทาง ต้องรีบแจ้งหัวหน้าโรงงานและเคลื่อนย้ายรถให้พ้นการกีดขวางภายใน 1.30 ชม. (ถูก)
ห้ามลากจูงรถโม่ที่เสียด้วยตัวเอง ต้องใช้รถยกที่ได้มาตรฐานเท่านั้น (ถูก)
กรณีเกิดอุบัติเหตุ ห้ามหลบหนี และต้องแจ้งหัวหน้างานทันที (ถูก)
เพลาปั่นโม่ที่ไม่มีการ์ดครอบ เป็นจุดอันตรายที่อาจดึงเสื้อผ้าพนักงานจนเสียชีวิตได้ (ถูก)
การแต่งกายรุ่มร่ามหรือใส่ผ้าขาวม้าขณะเช็ครถ มีความเสี่ยงถูกเพลาปั่นดึงเข้าไป (ถูก)
ห้ามบุคคลภายนอกเข้าในพื้นที่โรงงานโดยเฉพาะจุดโหลดคอนกรีต (ถูก)
ความปลอดภัยของพนักงานขับรถคือหัวใจสำคัญของการบริการจัดส่ง (ถูก)
หมวดที่ 9: กฎพิทักษ์ชีวิต (LSR)
การทำงานบนที่สูงตั้งแต่ 1.8 เมตรขึ้นไป ในบริเวณที่ไม่มีการป้องกัน ต้องใช้อุปกรณ์ป้องกันการตกเสมอ (ถูก)
จบส. สามารถปลดอุปกรณ์ความปลอดภัยออกได้ชั่วคราวโดยไม่ต้องขออนุญาต หากเห็นว่าทำงานไม่สะดวก (ผิด - ต้องได้รับอนุญาตก่อนเสมอ)
การสวมหมวกนิรภัย (Helmet) จำเป็นเฉพาะคนขับรถจักรยานยนต์ ส่วนคนซ้อนท้ายไม่ต้องสวมก็ได้ (ผิด - ต้องสวมทั้งคนขับและคนซ้อน)
กฎพิทักษ์ชีวิตห้ามจอดรถบรรทุกขนส่งบนไหล่ทางโดยเด็ดขาด (ถูก)
การดื่มแอลกอฮอล์หรือเสพสารเสพติด รวมถึงยาที่ออกฤทธิ์ต่อระบบประสาท ห้ามปฏิบัติงานขับรถโดยเด็ดขาด (ถูก)
หากตรวจพบว่า จบส. ฝ่าฝืนกฎ Driving Safety (เช่น ไม่รัดเข็มขัด) ครั้งแรก จะถูกลงโทษห้ามมาทำงาน 3 วัน (ถูก)
การฝ่าฝืนกฎพิทักษ์ชีวิตรายบุคคล จะนับจำนวนครั้งสะสมรวมกันในรอบปีปฏิทิน (1 ม.ค. - 31 ธ.ค.) (ถูก)
หาก จบส. ฝ่าฝืนกฎพิทักษ์ชีวิตด้าน Working Safety (งานบนที่สูง/อับอากาศ) ครั้งที่ 2 จะมีบทลงโทษห้ามทำงานกับบริษัทตลอดไป (ถูก)
หมวดที่ 10: แนวปฏิบัติการขับขี่ปลอดภัย (Safe Driving Practice)
พนักงานที่ใช้รถยนต์ของบริษัท ต้องผ่านการอบรมหลักสูตรขับขี่ปลอดภัย (SDC) และทบทวนทุกๆ 2 ปี (ถูก)
จบส. สามารถขับรถเดินทางคนเดียวได้ โดยมีระยะทางของ Trip ไม่เกิน 400 กิโลเมตร (ถูก)
หากมีความจำเป็นต้องเดินทางไกลเกิน 400 กิโลเมตร และต้องใช้รถยนต์ ต้องมีผู้ร่วมเดินทางที่ช่วยขับรถยนต์ได้ (ถูก)
ห้ามออกเดินทางในเวลากลางคืน โดยให้จุดหมายปลายทางต้องไม่เกินเวลา 21.00 น. (ถูก)
ในการขับขี่ทางไกล จบส. ต้องหยุดพักรถทุกๆ 2 ชั่วโมง หรือทุก 200 กิโลเมตร โดยพักอย่างน้อย 15 นาที (ถูก)
หากกล้องติดรถไม่มี SD Card หรือไม่บันทึกภาพ เมื่อเกิดอุบัติเหตุจะถือเป็นความรับผิดชอบของคนขับรถ/ผู้ใช้รถ (ถูก)
หาก จบส. ฝ่าฝืนกฎจราจร (เช่น ฝ่าไฟแดง, ขับรถย้อนศร) ซ้ำตั้งแต่ 2 ครั้งขึ้นไปในรอบปี จะต้องได้รับ Coaching โดยผู้บังคับบัญชาระดับ Director ขึ้นไป (ถูก)
จบส. สามารถเข้าร่วมประชุม (Conference Call) ผ่านระบบ Bluetooth ขณะขับรถได้เพื่อไม่ให้เสียงาน (ผิด - ประกาศระบุห้ามประชุมในระหว่างการขับขี่)
เมื่อต้องขับรถไปต่างจังหวัดที่มีระยะทางเกิน 400 กิโลเมตร แนวปฏิบัติแนะนำให้พิจารณาใช้เครื่องบินและเช่ารถในพื้นที่แทนการขับไปเอง (ถูก)
การใช้โทรศัพท์ขณะขับขี่ สามารถทำได้หากใช้อุปกรณ์เสริม (Small Talk / Bluetooth) (ถูก)
การฝ่าฝืนกฎพิทักษ์ชีวิตเรื่องการดื่มแอลกอฮอล์ในขณะขับขี่ หรือเกิดอุบัติเหตุรุนแรงจากการดื่ม มีโทษสูงสุดคือห้ามทำงานกับบริษัทตลอดไป (ถูก)
การจอดรถรอเข้าเทหน้างานบนไหล่ทางโดยไม่มีผู้ให้สัญญาณ (Flagman) ถือเป็นการฝ่าฝืนกฎพิทักษ์ชีวิตข้อ 10 (ถูก)
`;

export function createDefaultAwarenessQuestions(): SafetyAwarenessQuestion[] {
  const parsed = parseAwarenessBulk(SEED_TEXT, "sa-seed").map((q, index) => ({
    ...q,
    id: `sa-seed-${String(index + 1).padStart(3, "0")}`,
  }));
  return normalizeAwarenessQuestions(parsed);
}

/** Today's Bangkok date key (YYYY-MM-DD) used to gate "first time each day". */
export function todayKey(now = new Date()): string {
  const bangkok = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = bangkok.getUTCFullYear();
  const m = String(bangkok.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bangkok.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type AwarenessRequirementRules = {
  enabled: boolean;
  weekdays?: number[];
  holidayDates?: Iterable<string>;
  effectiveStartDate?: string;
  endDate?: string;
};

function normalizeAwarenessWeekdays(weekdays?: number[]) {
  if (!Array.isArray(weekdays) || weekdays.length === 0) return [];
  return Array.from(new Set(weekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)));
}

export function bangkokWeekday(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00+07:00`).getDay();
}

export function isAwarenessTimeWindowActive(
  now: Date,
  activeStartTime?: string,
  activeEndTime?: string,
): boolean {
  if (!activeStartTime || !activeEndTime) return true;

  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bangkok = new Date(utc + 7 * 60 * 60 * 1000);
  const currentMin = bangkok.getHours() * 60 + bangkok.getMinutes();
  const [startH, startM] = activeStartTime.split(":").map(Number);
  const [endH, endM] = activeEndTime.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  if ([startMin, endMin].some((value) => Number.isNaN(value))) return true;
  return currentMin >= startMin && currentMin <= endMin;
}

export function isAwarenessDateRequired(
  dateKey: string,
  rules: AwarenessRequirementRules,
): boolean {
  if (!rules.enabled) return false;
  if (rules.effectiveStartDate && dateKey < rules.effectiveStartDate) return false;
  if (rules.endDate && dateKey > rules.endDate) return false;

  const weekdays = normalizeAwarenessWeekdays(rules.weekdays);
  if (weekdays.length > 0 && !weekdays.includes(bangkokWeekday(dateKey))) return false;

  const holidayDates = new Set(Array.from(rules.holidayDates || []));
  if (holidayDates.has(dateKey)) return false;

  return true;
}

export function isAwarenessRequiredNow(
  now: Date,
  rules: AwarenessRequirementRules & {
    activeStartTime?: string;
    activeEndTime?: string;
  },
): boolean {
  const dateKey = todayKey(now);
  return isAwarenessDateRequired(dateKey, rules)
    && isAwarenessTimeWindowActive(now, rules.activeStartTime, rules.activeEndTime);
}

/** Fisher–Yates pick of n items. */
export function pickRandom<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}
