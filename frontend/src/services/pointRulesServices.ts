import { apiFetch, apiJson, type ApiResult } from "@/lib/api-client";
import type { PointRule, PointRulesResponse, SavePointRulePayload } from "@/types/pointRulesType";

export async function getPointRules(): Promise<ApiResult<PointRulesResponse>> {
  return apiFetch<PointRulesResponse>("/api/safety-culture/points/rules");
}

export async function savePointRule(payload: SavePointRulePayload): Promise<ApiResult<{ rule: PointRule }>> {
  return apiFetch<{ rule: PointRule }>(
    "/api/safety-culture/points/rules",
    apiJson("POST", payload),
  );
}
