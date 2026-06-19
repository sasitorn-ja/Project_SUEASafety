"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BrowserRouter } from "@/lib/router-compat";

// Dynamically load Safety Effort Dashboard to prevent SSR issues
const DashboardSafetyEffort = dynamic(
  () => import("@/features/safety-effort/screens/Dashboard Safety Effort"),
  { ssr: false }
);

function DashboardContent() {
  return (
    <div className="w-full min-h-screen" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Main Content Pane */}
      <div className="w-full">
        <DashboardSafetyEffort />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BrowserRouter>
      <DashboardContent />
    </BrowserRouter>
  );
}
