export const POINT_RULE_ORDER = [
  "safetyAwarenessCompleted",
  "safetyPostApproved",
  "commentCreated",
  "reactionCreated",
  "safetyEffortCompleted",
] as const;

export const POINT_RULE_HINTS: Record<string, string> = {
  safetyAwarenessCompleted: "ได้ Coin เมื่อผู้ใช้ทำ Safety Awareness สำเร็จ โดยจำกัดจำนวนสูงสุดต่อวัน",
  safetyPostApproved: "ได้ Coin เมื่อสร้างโพสต์ใหม่ใน Safety Culture โดยจำกัดจำนวนสูงสุดต่อวัน",
  commentCreated: "ได้ Coin เมื่อคอมเมนต์ใน Safety Culture และข้อความต้องยาวถึงเกณฑ์ที่กำหนด",
  reactionCreated: "ได้ Coin เมื่อกด Like และสามารถให้เจ้าของโพสต์ได้รับ Coin ด้วยตามกติกาเดียวกัน",
  safetyEffortCompleted: "ได้ Coin เมื่อทำ Linewalk หรือ Safety Contact สำเร็จ โดยจำกัดจำนวนสูงสุดต่อวัน",
};
