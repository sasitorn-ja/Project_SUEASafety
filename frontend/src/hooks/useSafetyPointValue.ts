"use client";

import { useEffect, useState } from "react";

import { getSafetyPoint, type SafetyPointAction } from "@/lib/point-rules";
import { getPointRules } from "@/services/pointRulesServices";

export function useSafetyPointValue(action: SafetyPointAction) {
  const [points, setPoints] = useState<number>(() => getSafetyPoint(action));

  useEffect(() => {
    let cancelled = false;

    getPointRules()
      .then((result) => {
        if (cancelled || !result.ok) return;
        const rule = result.data?.rules?.find((item) => item.code === action);
        const nextPoints = Number(rule?.points);
        if (Number.isFinite(nextPoints)) setPoints(Math.max(0, nextPoints));
      })
      .catch(() => {
        // Keep the code default when the settings endpoint is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [action]);

  return points;
}
