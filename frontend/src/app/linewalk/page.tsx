"use client";

import dynamic from "next/dynamic";

const Screen = dynamic(() => import("@/features/safety-effort/screens/Linewalk"), { ssr: false });

export default function Page() {
  return <Screen />;
}
