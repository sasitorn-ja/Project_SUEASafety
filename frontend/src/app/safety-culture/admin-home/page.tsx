"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Copy,
  CopyPlus,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Monitor,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiFetch, apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

type HomeHeroSlide = {
  id: string;
  imageSrc: string;
  eyebrow: string;
  title: string;
  description: string;
  linkUrl?: string;
  enabled?: boolean;
};

const DEFAULT_HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: "home-hero-news",
    imageSrc: "/images/heroes/Home01.png",
    eyebrow: "ข่าวสารระบบ",
    title: "Safety Caring",
    description: "ศูนย์กลางสำหรับการสื่อสาร ติดตาม และยกระดับความปลอดภัยในการทำงานของทีม",
    linkUrl: "",
    enabled: true,
  },
  {
    id: "home-hero-launch",
    imageSrc: "/images/heroes/home-launch-announcement.png",
    eyebrow: "ประกาศเปิดตัว",
    title: "ประกาศเปิดตัว",
    description: "เนื้อหาเปิดตัวใน 7 พฤษภาคม 2569",
    linkUrl: "",
    enabled: true,
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
      linkUrl: String(record.linkUrl || ""),
      enabled: record.enabled !== false,
    };
  });
  return slides.length > 0 ? slides : DEFAULT_HOME_HERO_SLIDES;
}

export default function AdminHomeHeroPage() {
  const [slides, setSlides] = useState<HomeHeroSlide[]>(DEFAULT_HOME_HERO_SLIDES);
  const [selectedSlideId, setSelectedSlideId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Add / Edit Banner Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [newEyebrow, setNewEyebrow] = useState("ข่าวสารระบบ");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageSrc, setNewImageSrc] = useState("/images/heroes/Home01.png");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Drag and drop ordering
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  async function loadSlides() {
    setLoading(true);
    setMessage("");
    setError("");
    const result = await apiFetch<{ setting: { setting_value?: unknown } | null }>("/api/safety-settings?key=home_hero_slides");
    if (result.ok) {
      const loaded = normalizeSlides(result.data?.setting?.setting_value);
      setSlides(loaded);
      if (loaded.length > 0 && !selectedSlideId) {
        setSelectedSlideId(loaded[0].id);
      }
    } else {
      setError("โหลดข้อมูล Home Hero ไม่สำเร็จ");
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadSlides();
  }, []);

  // Sync selectedSlideId if slides change
  useEffect(() => {
    if (slides.length > 0 && (!selectedSlideId || !slides.some(s => s.id === selectedSlideId))) {
      setSelectedSlideId(slides[0].id);
    }
  }, [slides, selectedSlideId]);

  const activeSlideIndex = useMemo(() => {
    const idx = slides.findIndex(s => s.id === selectedSlideId);
    return idx >= 0 ? idx : 0;
  }, [slides, selectedSlideId]);

  const selectedSlide = useMemo(() => slides[activeSlideIndex] || slides[0] || DEFAULT_HOME_HERO_SLIDES[0], [slides, activeSlideIndex]);

  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return slides;
    const q = searchQuery.toLowerCase();
    return slides.filter(s => s.title.toLowerCase().includes(q) || s.eyebrow.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [slides, searchQuery]);

  async function saveSlides(updatedSlides?: HomeHeroSlide[]) {
    const targetSlides = updatedSlides || slides;
    setSaving(true);
    setMessage("");
    setError("");
    const cleaned = targetSlides.map((slide, index) => ({
      ...slide,
      id: slide.id || `home-hero-${Date.now()}-${index}`,
      imageSrc: slide.imageSrc.trim() || DEFAULT_HOME_HERO_SLIDES[index % DEFAULT_HOME_HERO_SLIDES.length].imageSrc,
      eyebrow: slide.eyebrow.trim(),
      title: slide.title.trim() || "Safety Caring",
      description: slide.description.trim(),
      linkUrl: (slide.linkUrl || "").trim(),
      enabled: slide.enabled !== false,
    }));
    const result = await apiFetch("/api/safety-settings?key=home_hero_slides", apiJson("PUT", { value: { slides: cleaned } }));
    if (result.ok) {
      setSlides(cleaned);
      setMessage("บันทึก Banner หน้าแรกเรียบร้อยแล้ว");
    } else {
      setError("บันทึก Banner ไม่สำเร็จ");
    }
    setSaving(false);
  }

  const handleOpenAddModal = () => {
    setEditingSlideId(null);
    setNewEyebrow("ข่าวสารระบบ");
    setNewTitle("");
    setNewDescription("");
    setNewImageSrc("/images/heroes/Home01.png");
    setNewLinkUrl("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (slide: HomeHeroSlide) => {
    setEditingSlideId(slide.id);
    setSelectedSlideId(slide.id);
    setNewEyebrow(slide.eyebrow || "ข่าวสารระบบ");
    setNewTitle(slide.title || "");
    setNewDescription(slide.description || "");
    setNewImageSrc(slide.imageSrc || "/images/heroes/Home01.png");
    setNewLinkUrl(slide.linkUrl || "");
    setIsAddModalOpen(true);
  };

  const handleConfirmSaveBanner = () => {
    if (!newTitle.trim()) {
      window.alert("กรุณากรอก ชื่อ Banner");
      return;
    }

    if (editingSlideId) {
      // Edit existing banner
      const next = slides.map(s => s.id === editingSlideId ? {
        ...s,
        eyebrow: newEyebrow.trim() || "ข่าวสารระบบ",
        title: newTitle.trim(),
        description: newDescription.trim(),
        imageSrc: newImageSrc.trim() || "/images/heroes/Home01.png",
        linkUrl: newLinkUrl.trim(),
      } : s);
      setSlides(next);
    } else {
      // Add new banner
      const newSlide: HomeHeroSlide = {
        id: `home-hero-${Date.now()}`,
        imageSrc: newImageSrc.trim() || "/images/heroes/Home01.png",
        eyebrow: newEyebrow.trim() || "ข่าวสารระบบ",
        title: newTitle.trim(),
        description: newDescription.trim(),
        linkUrl: newLinkUrl.trim(),
        enabled: true,
      };
      const next = [...slides, newSlide];
      setSlides(next);
      setSelectedSlideId(newSlide.id);
    }
    setIsAddModalOpen(false);
  };

  const handleDuplicateBanner = () => {
    if (!selectedSlide) return;
    const dup: HomeHeroSlide = {
      ...selectedSlide,
      id: `home-hero-${Date.now()}`,
      title: `${selectedSlide.title} (สำเนา)`,
    };
    const next = [...slides, dup];
    setSlides(next);
    setSelectedSlideId(dup.id);
  };

  const handleDeleteBanner = (id: string) => {
    if (slides.length <= 1) {
      window.alert("ต้องมี Banner อย่างน้อย 1 รายการ");
      return;
    }
    const next = slides.filter(s => s.id !== id);
    setSlides(next);
    if (selectedSlideId === id) {
      setSelectedSlideId(next[0]?.id || "");
    }
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const next = [...slides];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setSlides(next);
  };

  const handleToggleEnabled = (id: string) => {
    setSlides(current => current.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  // Drag and Drop
  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const fromIndex = slides.findIndex(s => s.id === draggingId);
    const toIndex = slides.findIndex(s => s.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...slides];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setSlides(next);
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className="page-shell-wide min-h-screen bg-[#F0F5FA] pt-3 pb-12 font-sarabun">
      {/* Top Hero Header */}
      <SafetyCultureHero
        eyebrow="HOME SETTINGS"
        title={<>จัดการ Banner หน้าแรก</>}
        description="เพิ่ม แก้ไข จัดเรียงลำดับ และเปิด/ปิดการแสดงผล Banner บนหน้า Home ขององค์กร"
        variant="community"
        backgroundImage="/images/heroes/Safety-Culture-Admin-Awareness1.png"
        backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.85) 0%, rgba(210,235,255,.65) 42%, rgba(210,235,255,0) 78%)"
      />

      {/* Control Action Bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-black text-[#0B2F6B] tracking-tight">
            จัดการ Banner หน้าแรก
          </h1>
          <span className="flex items-center gap-1.5 rounded-full border border-[#0B82F0]/20 bg-[#E6F4FF] px-3 py-0.5 text-[12px] font-extrabold text-[#0B82F0]">
            <span className="h-2 w-2 rounded-full bg-[#0B82F0] animate-pulse"></span>
            {slides.length} รายการ
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDuplicateBanner}
            disabled={loading || saving}
            className="h-10 rounded-xl border-[#d1d5db] bg-white text-[13px] font-extrabold text-[#55739B] hover:bg-slate-50 shadow-xs"
          >
            <Copy className="mr-1.5 h-4 w-4" />
            ทำสำเนา
          </Button>
          <Button
            type="button"
            onClick={handleOpenAddModal}
            disabled={loading || saving}
            className="h-10 rounded-xl bg-gradient-to-r from-[#0B82F0] to-[#0663D2] px-4 text-[13px] font-extrabold text-white hover:opacity-95 shadow-md transition-all"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.8} />
            เพิ่ม Banner
          </Button>
          <Button
            type="button"
            onClick={() => void saveSlides()}
            disabled={loading || saving}
            className="h-10 rounded-xl bg-[#18B989] px-5 text-[13px] font-extrabold text-white hover:bg-[#15a378] shadow-md transition-all"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </div>
      </div>

      {message && <div className="mt-3 rounded-2xl border border-[#C8E9D2] bg-[#EEFFF3] px-4 py-3 text-[13px] font-extrabold text-[#19734A] shadow-xs">{message}</div>}
      {error && <div className="mt-3 rounded-2xl border border-[#FFD3D0] bg-[#FFF4F3] px-4 py-3 text-[13px] font-extrabold text-[#C7352B] shadow-xs">{error}</div>}

      {/* Main Content Layout */}
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Search Filter & Banner List */}
        <div className="flex flex-col gap-4">
          {/* Search Filter Toolbar */}
          <div className="flex items-center gap-2 rounded-[18px] border border-[#D9E5F3] bg-white p-2.5 shadow-[0_4px_16px_rgba(23,59,107,0.04)]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8292A8]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา Banner..."
                className="h-10 border-[#E1F0FF] bg-[#F4F9FF] pl-9.5 text-[13px] font-extrabold placeholder:text-[#94A3B8] focus:bg-white"
              />
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B82F0] text-white shadow-sm"
              title="ทั้งหมด"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9E5F3] bg-white text-[#55739B] hover:bg-slate-50"
              title="เฉพาะที่เปิดใช้งาน"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9E5F3] bg-white text-[#55739B] hover:bg-slate-50"
              title="เฉพาะที่ปิดใช้งาน"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          </div>

          {/* Banner Cards Stack */}
          <div className="flex flex-col gap-3">
            {filteredSlides.map((slide, index) => {
              const isSelected = slide.id === selectedSlideId;
              const isDragging = draggingId === slide.id;
              const isDropTarget = dragOverId === slide.id && draggingId !== slide.id;
              const isEnabled = slide.enabled !== false;

              return (
                <div
                  key={slide.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", slide.id);
                    handleDragStart(slide.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingId && draggingId !== slide.id) {
                      e.dataTransfer.dropEffect = "move";
                      setDragOverId(slide.id);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(slide.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  onClick={() => setSelectedSlideId(slide.id)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-[20px] border-[2px] bg-white p-3.5 transition-all cursor-pointer select-none sm:flex-row sm:items-center sm:justify-between",
                    isSelected
                      ? "border-[#0B82F0] shadow-[0_8px_24px_rgba(11,130,240,0.15)] ring-2 ring-[#0B82F0]/20"
                      : "border-[#D9E5F3] hover:border-[#0B82F0]/60 hover:shadow-md",
                    isDragging ? "opacity-50 scale-[0.99]" : "",
                    isDropTarget ? "border-dashed border-[#0B82F0] bg-[#F0F7FF]" : "",
                    !isEnabled ? "opacity-70 bg-slate-50/80" : ""
                  )}
                >
                  {/* Left Side: Drag handle, Index Badge, Image Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Drag Handle & Index Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex h-8 w-6 items-center justify-center text-[#94A3B8] cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-black text-white shadow-xs",
                        isSelected ? "bg-[#0B82F0]" : "bg-[#55739B]"
                      )}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="relative h-[68px] w-[108px] flex-shrink-0 overflow-hidden rounded-xl border border-[#D9E5F3] bg-slate-100 shadow-xs">
                      {slide.imageSrc ? (
                        <img src={slide.imageSrc} alt={slide.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#8292A8]">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Content Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[15px] font-black text-[#112F59]">{slide.title || "ไม่ได้ระบุหัวข้อ"}</h3>
                        {!isEnabled && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                            ปิดการแสดงผล
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] font-bold text-[#55739B]">{slide.description || slide.eyebrow || "ไม่มีรายละเอียด"}</p>
                    </div>
                  </div>

                  {/* Right Side: Action Controls & Toggle */}
                  <div className="flex items-center justify-end gap-2 border-t border-[#F1F5F9] pt-2.5 sm:border-t-0 sm:pt-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(slide.id)}
                      className={cn(
                        "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        isEnabled ? "bg-[#18B989]" : "bg-slate-300"
                      )}
                      title={isEnabled ? "ปิดการแสดงผล" : "เปิดการแสดงผล"}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                          isEnabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(slide)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9E5F3] bg-white text-[#0B82F0] hover:bg-[#E6F4FF] transition-colors"
                      title="แก้ไข Banner"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(slide.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#FED7D7] bg-[#FFF5F5] text-[#E53E3E] hover:bg-[#FEE2E2] transition-colors"
                      title="ลบ Banner"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Preview Card Only */}
        <div className="flex flex-col gap-4">
          {/* Live Preview Card */}
          <Card className="overflow-hidden rounded-[22px] border border-[#D9E5F3] bg-white p-4 shadow-[0_8px_24px_rgba(23,59,107,0.06)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-black text-[#112F59] flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[#0B82F0]" />
                ตัวอย่างพรีวิว Banner หน้า Home
              </h3>
              <span className="rounded-full bg-[#E6F4FF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B82F0]">
                Desktop View
              </span>
            </div>

            {/* Simulated Home Page Hero Container */}
            <div className="relative h-[160px] w-full overflow-hidden rounded-[20px] border border-[#D7EAFE] bg-slate-900 shadow-md">
              {selectedSlide?.imageSrc ? (
                <img src={selectedSlide.imageSrc} alt={selectedSlide.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-[#0794FF] via-[#0B2F6B] to-[#FFB020] text-white font-black text-sm">
                  ไม่มีรูปภาพตัวอย่าง
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,26,66,.75)0%,rgba(3,33,78,.45)40%,rgba(3,33,78,0)70%)]" />

              {/* Home Page Content Card Frame Overlay */}
              <div className="absolute inset-y-0 left-4 my-auto flex h-fit max-w-[280px] flex-col items-start gap-1 rounded-[16px] border border-white/75 bg-white/65 p-3 shadow-[0_8px_20px_rgba(11,130,240,.16)] backdrop-blur-[4px]">
                <span className="rounded-[6px] border border-[#0B82F0] bg-white/90 px-2 py-0.5 text-[9px] font-black text-[#0B82F0]">
                  {selectedSlide?.eyebrow || "ข่าวสารระบบ"}
                </span>
                <h4 className="line-clamp-1 text-[16px] font-black leading-tight text-[#0B2F6B]">
                  {selectedSlide?.title || "หัวข้อสไลด์"}
                </h4>
                <p className="line-clamp-2 text-[10px] font-bold leading-relaxed text-[#55739B]">
                  {selectedSlide?.description || "รายละเอียดสไลด์เพิ่มเติม..."}
                </p>
              </div>

              {/* Mascot representation on right side */}
              <div className="absolute right-2 bottom-0 h-[85%] w-[100px] pointer-events-none">
                <img src="/images/mascot-happy.png" alt="Mascot" className="h-full w-full object-contain object-bottom" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Modal: เพิ่ม/แก้ไข Banner ── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent showCloseButton={false} className="max-w-[460px] rounded-[24px] border border-[#D9E5F3] bg-white p-5 shadow-[0_20px_60px_rgba(11,47,107,0.22)] font-sarabun sm:max-w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <h2 className="text-[17px] font-black text-[#112F59]">
              {editingSlideId ? "แก้ไข Banner" : "เพิ่ม Banner ใหม่"}
            </h2>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8292A8] hover:bg-slate-100 transition-colors"
              title="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Live Preview Inside Modal */}
          <div className="mt-2.5 overflow-hidden rounded-[16px] border border-[#D7EAFE] bg-slate-900 shadow-md">
            <div className="relative h-[120px] w-full">
              {newImageSrc ? (
                <img src={newImageSrc} alt={newTitle} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-[#0794FF] via-[#0B2F6B] to-[#FFB020] text-white font-extrabold text-xs">
                  ไม่มีรูปภาพตัวอย่าง
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,26,66,.75)0%,rgba(3,33,78,.45)40%,rgba(3,33,78,0)70%)]" />
              
              {/* Card Frame Content Overlay */}
              <div className="absolute inset-y-0 left-3 my-auto flex h-fit max-w-[240px] flex-col items-start gap-0.5 rounded-[12px] border border-white/75 bg-white/70 p-2 shadow-xs backdrop-blur-[3px]">
                <span className="rounded-[4px] border border-[#0B82F0] bg-white/90 px-1.5 py-0.5 text-[8px] font-black text-[#0B82F0]">
                  {newEyebrow || "ข่าวสารระบบ"}
                </span>
                <h4 className="line-clamp-1 text-[13px] font-black leading-tight text-[#0B2F6B]">
                  {newTitle || "ตัวอย่างชื่อ Banner"}
                </h4>
                <p className="line-clamp-1 text-[9.5px] font-bold text-[#55739B]">
                  {newDescription || "รายละเอียดสั้นๆ สำหรับ Banner..."}
                </p>
              </div>

              {/* Mascot representation on right side */}
              <div className="absolute right-2 bottom-0 h-[85%] w-[75px] pointer-events-none">
                <img src="/images/mascot-happy.png" alt="Mascot" className="h-full w-full object-contain object-bottom" />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="mt-2.5 grid gap-2.5">
            {/* คำประกาศ & ชื่อ Banner ในบรรทัดเดียวกัน */}
            <div className="grid grid-cols-2 gap-2.5">
              <label className="grid gap-1 text-[12px] font-black text-[#112F59]">
                คำประกาศ
                <Input
                  value={newEyebrow}
                  onChange={(e) => setNewEyebrow(e.target.value)}
                  placeholder="ข่าวสารระบบ"
                  className="h-9 rounded-xl border-[#D9E5F3] bg-[#F8FCFF] px-3 text-[12.5px] font-extrabold text-[#112F59] placeholder:text-[#94A3B8]"
                />
              </label>

              <label className="grid gap-1 text-[12px] font-black text-[#112F59]">
                <span>
                  ชื่อ Banner <span className="text-red-500">*</span>
                </span>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น KYT"
                  className="h-9 rounded-xl border-[#D9E5F3] bg-[#F8FCFF] px-3 text-[12.5px] font-extrabold text-[#112F59] placeholder:text-[#94A3B8]"
                />
              </label>
            </div>

            {/* คำอธิบาย */}
            <label className="grid gap-1 text-[12px] font-black text-[#112F59]">
              <div className="flex justify-between">
                <span>คำอธิบาย</span>
                <span className="text-[10px] font-extrabold text-[#94A3B8]">{newDescription.length}/200</span>
              </div>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value.slice(0, 200))}
                placeholder="รายละเอียดสั้นๆ สำหรับ Banner"
                rows={2}
                className="rounded-xl border-[#D9E5F3] bg-[#F8FCFF] p-2.5 text-[12.5px] font-extrabold text-[#112F59] placeholder:text-[#94A3B8]"
              />
            </label>

            {/* URL รูปภาพ / แนบรูป */}
            <div className="grid gap-1 text-[12px] font-black text-[#112F59]">
              <span>
                URL รูปภาพ <span className="text-red-500">*</span>
              </span>
              <div className="flex items-center gap-2">
                <Input
                  value={newImageSrc}
                  onChange={(e) => setNewImageSrc(e.target.value)}
                  placeholder="/images/heroes/Home01.png"
                  className="h-9 flex-1 rounded-xl border-[#D9E5F3] bg-[#F8FCFF] px-3 text-[12px] font-mono font-bold text-[#112F59] placeholder:text-[#94A3B8]"
                />
                <label
                  className="flex h-9 w-9 cursor-pointer flex-shrink-0 items-center justify-center rounded-xl border border-[#D9E5F3] bg-[#F1F8FE] text-[#0B82F0] hover:bg-[#E4F2FE] transition-colors"
                  title="แนบรูปภาพจากเครื่อง"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await fileToDataUrl(file);
                        setNewImageSrc(dataUrl);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Action button */}
          <div className="mt-3.5 pt-2 border-t border-[#F1F5F9]">
            <Button
              type="button"
              onClick={handleConfirmSaveBanner}
              className="h-10 w-full rounded-xl bg-gradient-to-r from-[#0B82F0] to-[#0663D2] px-6 text-[13px] font-extrabold text-white hover:opacity-95 shadow-md"
            >
              <Check className="mr-1.5 h-4 w-4" strokeWidth={3} />
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
