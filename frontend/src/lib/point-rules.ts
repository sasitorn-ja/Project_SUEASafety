export const SAFETY_POINT_RULES = {
  safetyAwarenessCompleted: 5,
  safetyPostApproved: 6,
  commentCreated: 1,
  reactionCreated: 1,
  safetyEffortCompleted: 10,
} as const;

export type SafetyPointAction = keyof typeof SAFETY_POINT_RULES;

export function getSafetyPoint(action: SafetyPointAction) {
  return SAFETY_POINT_RULES[action];
}

export const SAFETY_POINT_RULE_LABELS: Record<SafetyPointAction, string> = {
  safetyAwarenessCompleted: "ผ่าน Safety Awareness",
  safetyPostApproved: "สร้าง Safety Post ที่อนุมัติ",
  commentCreated: "Comment",
  reactionCreated: "Reaction",
  safetyEffortCompleted: "Safety Effort สำเร็จ",
};
