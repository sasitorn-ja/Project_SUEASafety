"use client";

import dynamic from "next/dynamic";

const NextAppClient = dynamic(() => import("../NextAppClient"), {
  ssr: false,
});

export default function LegacyShell() {
  return <NextAppClient />;
}
