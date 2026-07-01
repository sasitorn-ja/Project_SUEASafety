export type PointRule = {
  id: string | null;
  code: string;
  label: string;
  sourceType: string;
  points: number;
  status: string;
  source: string;
  dailyLimit: number | null;
  minCommentLength: number | null;
  awardPostOwner: boolean;
};

export type PointRulesResponse = {
  rules: PointRule[];
};

export type SavePointRulePayload = {
  id: string | null;
  code: string;
  points: number;
  status: string;
  dailyLimit?: number | null;
  minCommentLength?: number | null;
  awardPostOwner?: boolean;
};
