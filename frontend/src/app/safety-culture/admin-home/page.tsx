"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, RefreshCcw, Save } from "lucide-react";

import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiJson } from "@/lib/api-client";

type HomeHeroSlide = {
  id: string;
  imageSrc: string;
  eyebrow: string;
  title: string;
  description: string;
};

const DEFAULT_HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: "home-hero-news",
    imageSrc: "/images/heroes/Home01.png",
    eyebrow: "ข่าวสารระบบ",
    title: "Safety Caring",
    description: "ศูนย์กลางสำหรับการสื่อสาร ติดตาม และยกระดับความปลอดภัยในการทำงานของทีม",
  },
  {
    id: "home-hero-launch",
    imageSrc: "/images/heroes/home-launch-announcement.png",
    eyebrow: "ประกาศเปิดตัว",
    title: "ระบบจะเปิดตัววันที่ 7 กรกฎาคม 2569",
    description: "เตรียมพบกับ Safety Caring เวอร์ชันใหม่สำหรับข่าวสาร กิจกรรม และการมีส่วนร่วมด้านความปลอดภัย",
  },
];

function normalizeSlides(value: unknown): HomeHeroSlide[] {
  let parsedValue = value;
  if (typeof parsedValue === "string") {
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch {
      parsedValue = null;
    }
  }
  const raw = parsedValue && typeof parsedValue === "object" && "slides" in parsedValue
    ? (parsedValue as { slides?: unknown }).slides
    : parsedValue;
  if (!Array.isArray(raw)) return DEFAULT_HOME_HERO_SLIDES;
  const slides = raw.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const fallback = DEFAULT_HOME_HERO_SLIDES[index % DEFAULT_HOME_HERO_SLIDES.length];
    return {
      id: String(record.id || fallback.id || `home-hero-${index + 1}`),
      imageSrc: String(record.imageSrc || fallback.imageSrc),
      eyebrow: String(record.eyebrow || fallback.eyebrow),
      title: String(record.title || fallback.title),
      description: String(record.description || fallback.description),
    };
  });
  return slides.length > 0 ? slides : DEFAULT_HOME_HERO_SLIDES;
}

export default function AdminHomeHeroPage() {
  const [slides, setSlides] = useState<HomeHeroSlide[]>(DEFAULT_HOME_HERO_SLIDES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewSlide = useMemo(() => slides[0] || DEFAULT_HOME_HERO_SLIDES[0], [slides]);

  async function loadSlides() {
    setLoading(true);
    setMessage("");
    setError("");
    const result = await apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=home_hero_slides");
    if (result.ok) {
      setSlides(normalizeSlides(result.data?.setting?.setting_value));
    } else {
      setError("โหลดข้อมูล Home Hero ไม่สำเร็จ");
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadSlides();
  }, []);

  async function saveSlides() {
    setSaving(true);
    setMessage("");
    setError("");
    const cleaned = slides.map((slide, index) => ({
      ...slide,
      id: slide.id || `home-hero-${index + 1}`,
      imageSrc: slide.imageSrc.trim() || DEFAULT_HOME_HERO_SLIDES[index % DEFAULT_HOME_HERO_SLIDES.length].imageSrc,
      eyebrow: slide.eyebrow.trim(),
      title: slide.title.trim() || "Safety Caring",
      description: slide.description.trim(),
    }));
    const result = await apiFetch("/api/safety-settings?key=home_hero_slides", apiJson("PUT", { value: { slides: cleaned } }));
    if (result.ok) {
      setSlides(cleaned);
      setMessage("บันทึก Home Hero เรียบร้อยแล้ว");
    } else {
      setError("บันทึก Home Hero ไม่สำเร็จ");
    }
    setSaving(false);
  }

  return (
    <div className="page-shell-wide bg-background pt-2.5 pb-8 font-sarabun">
      <SafetyCultureHero
        eyebrow="HOME SETTINGS"
        title={<>Home Hero</>}
        description="เปลี่ยนคำประกาศและรูปเฉพาะ Hero หน้า Home โดยไม่กระทบ Hero หน้าอื่น"
        variant="community"
        backgroundImage="/images/heroes/Safety-Culture-Admin-Awareness1.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 42%, rgba(210,235,255,0) 78%)"
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-[18px] border border-border bg-white p-4 shadow-[0_10px_26px_var(--brand-shadow)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[18px] font-black text-[#0B2F6B]">คำประกาศและรูปบน Home</h2>
              <p className="mt-1 text-[12px] font-bold text-[#55739B]">แก้ได้เฉพาะสไลด์ Hero ด้านบนของหน้า Home</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => void loadSlides()} disabled={loading || saving} className="rounded-xl">
                <RefreshCcw className="mr-2 h-4 w-4" />โหลดใหม่
              </Button>
              <Button type="button" onClick={() => void saveSlides()} disabled={loading || saving} className="rounded-full bg-[#0B82F0] text-white hover:bg-[#0973d6]">
                <Save className="mr-2 h-4 w-4" />{saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>

          {message && <div className="mt-3 rounded-xl border border-[#C8E9D2] bg-[#EEFFF3] px-3 py-2 text-[12px] font-bold text-[#19734A]">{message}</div>}
          {error && <div className="mt-3 rounded-xl border border-[#FFD3D0] bg-[#FFF4F3] px-3 py-2 text-[12px] font-bold text-[#C7352B]">{error}</div>}

          <div className="mt-4 grid gap-4">
            {slides.map((slide, index) => (
              <div key={slide.id} className="rounded-[16px] border border-[#D7EAFE] bg-[#F8FCFF] p-4">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-black text-[#0B2F6B]">
                  <ImageIcon className="h-4 w-4 text-[#0B82F0]" />
                  สไลด์ {index + 1}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1.5 text-[12px] font-black text-[#55739B]">
                    คำประกาศ
                    <Input value={slide.eyebrow} onChange={(event) => setSlides((current) => current.map((item, i) => i === index ? { ...item, eyebrow: event.target.value } : item))} />
                  </label>
                  <label className="grid gap-1.5 text-[12px] font-black text-[#55739B]">
                    URL รูป
                    <Input value={slide.imageSrc} onChange={(event) => setSlides((current) => current.map((item, i) => i === index ? { ...item, imageSrc: event.target.value } : item))} placeholder="/images/heroes/Home01.png" />
                  </label>
                  <label className="grid gap-1.5 text-[12px] font-black text-[#55739B] md:col-span-2">
                    หัวข้อ
                    <Input value={slide.title} onChange={(event) => setSlides((current) => current.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} />
                  </label>
                  <label className="grid gap-1.5 text-[12px] font-black text-[#55739B] md:col-span-2">
                    รายละเอียด
                    <Textarea value={slide.description} onChange={(event) => setSlides((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} rows={3} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="self-start overflow-hidden rounded-[18px] border border-border bg-white shadow-[0_10px_26px_var(--brand-shadow)]">
          <div className="relative h-[220px] bg-[#eaf4ff]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSlide.imageSrc} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,26,66,.72),rgba(2,26,66,.18))]" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#FFD96A]">{previewSlide.eyebrow}</div>
              <div className="mt-1 text-[24px] font-black leading-tight">{previewSlide.title}</div>
              <div className="mt-2 text-[12px] font-bold leading-relaxed text-white/88">{previewSlide.description}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
