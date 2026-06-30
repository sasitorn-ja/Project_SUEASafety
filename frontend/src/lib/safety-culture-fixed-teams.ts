export const FIXED_SAFETY_CULTURE_TEAMS = [
  { code: "RMC_METRO", name: "RMC Metro", color: "#A6A6A6", order: 1 },
  { code: "RMC_EAST", name: "RMC East", color: "#0B4FB3", order: 2 },
  { code: "RMC_WEST", name: "RMC West", color: "#FFDC5C", order: 3 },
  { code: "RMC_SOUTH", name: "RMC South", color: "#20B8D2", order: 4 },
  { code: "RMC_NORTH", name: "RMC North", color: "#FF3338", order: 5 },
  { code: "RMC_NORTHEAST", name: "RMC Northeast", color: "#8B5CF6", order: 6 },
  { code: "SSB", name: "SSB", color: "#FF6F21", order: 7 },
  { code: "OTHER", name: "Other", color: "#7ED957", order: 8 },
] as const;

export type FixedSafetyCultureTeamCode = (typeof FIXED_SAFETY_CULTURE_TEAMS)[number]["code"];

const TEAM_BY_CODE = new Map(FIXED_SAFETY_CULTURE_TEAMS.map((team) => [team.code, team]));

export function normalizeDivisionName(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function fixedTeamCodeForDivision(value: string | null | undefined): FixedSafetyCultureTeamCode {
  const division = normalizeDivisionName(value);
  if (!division) return "OTHER";
  if (division.includes("SMART STRUCTURE") || /(^|\W)SSB($|\W)/.test(division)) return "SSB";
  if (division.includes("NORTHEAST") || division.includes("NORTH EAST")) return "RMC_NORTHEAST";
  if (division.includes("METRO")) return "RMC_METRO";
  if (division.includes("EAST")) return "RMC_EAST";
  if (division.includes("WEST")) return "RMC_WEST";
  if (division.includes("SOUTH")) return "RMC_SOUTH";
  if (division.includes("NORTH")) return "RMC_NORTH";
  return "OTHER";
}

export function fixedTeamByCode(value: unknown) {
  return TEAM_BY_CODE.get(String(value || "") as FixedSafetyCultureTeamCode) || TEAM_BY_CODE.get("OTHER")!;
}
