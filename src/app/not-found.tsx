import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h2 className="text-5xl font-black text-[var(--brand-accent)] mb-2">404</h2>
      <p className="text-xl font-extrabold text-foreground mb-2">ไม่พบหน้านี้</p>
      <p className="text-sm text-muted-foreground font-semibold mb-6 max-w-md">
        หน้าที่คุณกำลังค้นหาอาจถูกย้ายหรือลบไปแล้ว
      </p>
      <Link href="/were-ok">
        <Button className="bg-[#121214] hover:bg-[#252528] text-white font-extrabold rounded-xl px-6">
          กลับหน้าหลัก
        </Button>
      </Link>
    </div>
  );
}
