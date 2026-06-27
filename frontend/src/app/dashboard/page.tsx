"use client";

import dynamic from "next/dynamic";

const DashboardSafetyEffort = dynamic(
  () => import("@/features/safety-effort/screens/DashboardSafetyEffort"),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "var(--font-sans)" }}>
      <DashboardSafetyEffort />
    </div>
  );
}
