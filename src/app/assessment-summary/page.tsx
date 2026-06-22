"use client";

import dynamic from "next/dynamic";

const Screen = dynamic(() => import("@/features/safety-effort/screens/AssessmentSummary"), { ssr: false });

export default function Page() {
  return <Screen />;
}
