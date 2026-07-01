export const SAFETY_POINT_RULES = {
  safetyAwarenessCompleted: 1,
  safetyPostApproved: 3,
  commentCreated: 1,
  reactionCreated: 1,
  safetyEffortCompleted: 10,
} as const;

export type SafetyPointAction = keyof typeof SAFETY_POINT_RULES;

export function getSafetyPoint(action: SafetyPointAction) {
  return SAFETY_POINT_RULES[action];
}

export const SAFETY_POINT_RULE_LABELS: Record<SafetyPointAction, string> = {
  safetyAwarenessCompleted: "ทำ Safety Awareness",
  safetyPostApproved: "สร้าง Post ใหม่ใน Safety Culture",
  commentCreated: "Comment ให้ Post ใน Safety Culture",
  reactionCreated: "กด Like ให้ Post ใน Safety Culture",
  safetyEffortCompleted: "ทำ Safety Effort (Linewalk / Safety Contact)",
};
