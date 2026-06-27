"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h2 className="text-2xl font-extrabold text-foreground mb-2">เกิดข้อผิดพลาด</h2>
      <p className="text-sm text-muted-foreground font-semibold mb-6 max-w-md">
        ขออภัย ระบบพบปัญหาขณะโหลดหน้านี้ กรุณาลองใหม่อีกครั้ง
      </p>
      <Button onClick={reset} className="bg-[#121214] hover:bg-[#252528] text-white font-extrabold rounded-xl px-6">
        ลองใหม่
      </Button>
    </div>
  );
}
