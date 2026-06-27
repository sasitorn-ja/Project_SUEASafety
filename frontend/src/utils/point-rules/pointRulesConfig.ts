export const POINT_RULE_ORDER = [
  "safetyAwarenessCompleted",
  "safetyPostApproved",
  "commentCreated",
  "reactionCreated",
  "safetyEffortCompleted",
] as const;

export const POINT_RULE_HINTS: Record<string, string> = {
  safetyAwarenessCompleted: "ได้คะแนนเมื่อผู้ใช้ผ่าน Safety Awareness ประจำวัน",
  safetyPostApproved: "ได้คะแนนเมื่อโพสต์ Safety Post ถูกอนุมัติให้เผยแพร่",
  commentCreated: "ได้คะแนนเมื่อมีการคอมเมนต์ใน Safety Culture",
  reactionCreated: "ได้คะแนนเมื่อมีการกด Reaction",
  safetyEffortCompleted: "ได้คะแนนเมื่อทำรายการ Safety Effort สำเร็จ",
};
