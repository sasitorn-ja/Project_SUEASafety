"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAppActions, useAppState } from "@/providers/app-providers";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SAFETY_CULTURE_CATEGORIES } from "@/lib/safety-culture";
import { getSafetyPoint } from "@/lib/point-rules";
import { cn } from "@/lib/utils";
import { getSessionDisplayName, getSessionInitials, getSessionProfileImage, useSessionUser } from "@/lib/session-user";

const CATEGORIES = SAFETY_CULTURE_CATEGORIES.filter(
  (category) => !["ทั้งหมด", "ทีมของฉัน"].includes(category)
);
const MAX_PHOTOS = 5;
const MAX_PHOTO_EDGE = 1600;
const PHOTO_OUTPUT_QUALITY = 0.78;

type DraftPhoto = {
  type: string;
  dataUrl: string;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = src;
  });
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file: File) {
  const sourceUrl = await fileToDataUrl(file);
  const image = await loadImage(sourceUrl);
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return sourceUrl;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", PHOTO_OUTPUT_QUALITY);
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

async function uploadDraftPhoto(photo: DraftPhoto, index: number) {
  const file = await dataUrlToFile(photo.dataUrl, `safety-post-${Date.now()}-${index}.jpg`);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("module", "safety-culture");
  formData.append("ownerType", "post");
  formData.append("linkType", "attachment");

  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "post_photo_upload_failed");
  return String(payload.data?.media?.id || payload.data?.attachment?.id || "");
}

export default function PostSocialPage() {
  const cameraInputId = useId();
  const uploadInputId = useId();
  const router = useRouter();
  const actions = useAppActions();
  const { safetyCultureEvent, isEventLive, feedEvents } = useAppState();
  const { user: sessionUser } = useSessionUser();
  const availableFeedEvents = feedEvents.filter((event) => event.published && event.status === "open");
  const [text, setText] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั่วไป");
  const [selectedFeedEventId, setSelectedFeedEventId] = useState("");
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedFeedEvent = availableFeedEvents.find((event) => event.id === selectedFeedEventId) ?? null;
  const basePostPoints = getSafetyPoint("safetyPostApproved");
  const selectedFeedEventBonusPoints = selectedFeedEvent?.enabledActions.includes("theme-post")
    ? selectedFeedEvent.bonusMode === "multiplier"
      ? Math.round(selectedFeedEvent.points * Math.max(1, selectedFeedEvent.multiplier))
      : selectedFeedEvent.points + Math.max(0, selectedFeedEvent.fixedPoints)
    : 0;
  const selectedFeedEventPoints = selectedFeedEvent
    ? basePostPoints + selectedFeedEventBonusPoints
    : basePostPoints;

  const animStyle = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  const appendFiles = async (files: File[], type: "capture" | "upload") => {
    if (!files.length) return;

    setIsProcessingPhotos(true);

    try {
      const remainingSlots = Math.max(0, MAX_PHOTOS - photos.length);
      const selectedFiles = files.slice(0, remainingSlots);
      const nextPhotos: DraftPhoto[] = [];

      for (const file of selectedFiles) {
        try {
          const dataUrl = await optimizeImage(file);
          nextPhotos.push({ type, dataUrl });
        } catch {
          toast.error("แนบรูปไม่สำเร็จ", {
            description: "มีบางรูปที่ไม่สามารถเพิ่มได้ กรุณาลองใหม่อีกครั้ง",
          });
        }
      }

      if (nextPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...nextPhotos].slice(0, MAX_PHOTOS));
      }
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await appendFiles([file], "capture");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    await appendFiles(files, "upload");
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("ยังโพสต์ไม่ได้", {
        description: "กรุณาเขียนรายละเอียดก่อนโพสต์",
      });
      return;
    }

    if (isProcessingPhotos) {
      toast.error("กำลังเตรียมรูปภาพ", {
        description: "กรุณารอสักครู่แล้วลองโพสต์อีกครั้ง",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    let uploadedPhotoIds: string[] = [];
    try {
      if (sessionUser?.id && photos.length > 0) {
        uploadedPhotoIds = await Promise.all(photos.map((photo, index) => uploadDraftPhoto(photo, index)));
      }
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ", {
        description: "กรุณาลองโพสต์อีกครั้ง หรือเอารูปที่มีปัญหาออกก่อน",
      });
      setIsSubmitting(false);
      return;
    }

    const timestamp = Date.now();
    const attachedPhotos = photos
      .filter((photo) => photo.dataUrl)
      .map((photo, index) => ({
        id: uploadedPhotoIds[index] || `${timestamp}-${index}`,
        dataUrl: photo.dataUrl,
        type: photo.type,
      }));

    try {
      await actions.addPost({
        id: timestamp,
        author: getSessionDisplayName(sessionUser),
        avatarBg: "var(--brand-accent)",
        avatarColor: "#1A1A1A",
        avatarText: getSessionInitials(sessionUser),
        isYou: true,
        createdAt: timestamp,
        subtext: "เมื่อสักครู่",
        category: activeCategory,
        body: text,
        photos: attachedPhotos,
        imageData: null,
        likes: 0,
        comments: [],
        points: basePostPoints,
        hasLiked: false,
        feedEventId: selectedFeedEvent?.id,
        feedEventTitle: selectedFeedEvent?.title,
      });
    } catch {
      toast.error("โพสต์ไม่สำเร็จ", {
        description: "ระบบยังบันทึกโพสต์ไม่ได้ กรุณาลองใหม่อีกครั้ง",
      });
      setIsSubmitting(false);
      return;
    }

    const nextBonusLabel =
      selectedFeedEvent
        ? selectedFeedEvent.bonusMode === "multiplier"
          ? `x${selectedFeedEvent.multiplier}`
          : `+${selectedFeedEvent.fixedPoints} แต้มเพิ่ม`
        : safetyCultureEvent.bonusMode === "multiplier"
          ? `x${safetyCultureEvent.multiplier}`
          : `+${safetyCultureEvent.fixedPoints} แต้มเพิ่ม`;

    toast.success("โพสต์สำเร็จ", {
      description: selectedFeedEvent
        ? `โพสต์เข้ากิจกรรม ${selectedFeedEvent.title} แล้ว ได้ทั้งหมด +${selectedFeedEventPoints} แต้ม (ฐาน ${basePostPoints} + กิจกรรม ${selectedFeedEventBonusPoints})`
        : isEventLive
          ? `แชร์เรื่องความปลอดภัยแล้ว ได้ฐาน +${basePostPoints} แต้ม และโบนัสอีเว้น ${nextBonusLabel}`
          : `แชร์เรื่องความปลอดภัยแล้ว ได้รับ +${basePostPoints} แต้ม`,
    });

    setTimeout(() => router.push("/safety-culture"), 800);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[600px] px-4 pb-8 pt-2">
        <header
          className="anim-fade flex items-center justify-between pb-3 pt-2"
          style={animStyle(0)}
        >
          <div className="flex items-center gap-3">
            <Link href="/safety-culture">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-[var(--border)] bg-[var(--brand-surface)] hover:border-foreground hover:bg-[var(--secondary)]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-extrabold text-foreground">
              แชร์เรื่องปลอดภัย
            </h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isProcessingPhotos || isSubmitting}
            className="rounded-full bg-[#1A1A1A] px-6 text-sm font-extrabold text-white transition-all hover:bg-[var(--brand-accent)] hover:text-[#1A1A1A] disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "กำลังโพสต์..." : isProcessingPhotos ? "กำลังเตรียมรูปภาพ..." : "โพสต์"}
          </Button>
        </header>

        <div className="anim-fade mb-5 lg:hidden" style={animStyle(0.03)}>
          <SafetyCultureHero
            eyebrow="SAFETY CARING POST"
            title={
              <>
                แชร์เรื่อง <span className="text-[var(--brand-accent)]">ปลอดภัย</span>
              </>
            }
            description="เล่าเหตุการณ์ดี ๆ หรือจุดเสี่ยงให้เพื่อนร่วมทีมเห็นได้เร็วขึ้น"
            variant="community"
            backgroundImage="/images/heroes/Home01.png"
            backgroundOverlay="linear-gradient(90deg, rgba(210,235,255,.82) 0%, rgba(210,235,255,.60) 36%, rgba(210,235,255,.10) 64%, rgba(210,235,255,0) 100%)"
            mascotSrc="/images/mascots/wangjai/34.png"
            mascotAction="clipboardPost"
          />
        </div>

        <div
          className="anim-fade mb-4 flex items-center gap-3 rounded-2xl border border-[#d9e5f3] bg-white/90 p-4 shadow-[0_10px_24px_rgba(23,59,107,0.06)]"
          style={animStyle(0.05)}
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-soft)] text-lg font-extrabold text-[var(--brand-accent)] ring-2 ring-[rgba(var(--brand-accent-rgb),0.22)]">
            {getSessionProfileImage(sessionUser) ? (
              <Image src={getSessionProfileImage(sessionUser)} alt="" width={44} height={44} className="h-full w-full object-cover" />
            ) : (
              getSessionInitials(sessionUser)
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-extrabold text-foreground">
              {getSessionDisplayName(sessionUser)}
            </span>
            <div className="flex gap-1.5">
              <span className="rounded-md border border-[var(--c-c5c1b5)] bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-[850] tracking-wide text-[#555149]">
                Safety Culture
              </span>
            </div>
          </div>
        </div>

        {availableFeedEvents.length > 0 ? (
          <div
            className="anim-fade mb-4 rounded-2xl border border-[#d9e5f3] bg-white/90 p-4 shadow-[0_10px_24px_rgba(23,59,107,0.06)]"
            style={animStyle(0.1)}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-[850] uppercase tracking-wide text-foreground">Card Event</div>
                  <div className="hidden">
                    เลือกกิจกรรมที่ต้องการนับคะแนนร่วมกับโพสต์นี้ได้ ถ้าไม่เลือกจะเป็นโพสต์ทั่วไป
                  </div>
                </div>
                {selectedFeedEvent ? (
                  <span className="rounded-full bg-[#ecfff7] px-2.5 py-1 text-[11px] font-extrabold text-[#13885d]">
                    +{selectedFeedEventPoints} pts
                  </span>
                ) : null}
              </div>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedFeedEventId("")}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-extrabold transition-all",
                    !selectedFeedEventId
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[var(--c-ddd9cd)] bg-white text-[#555149]"
                  )}
                >
                  โพสต์ทั่วไป
                </button>
                {availableFeedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedFeedEventId(event.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-extrabold transition-all",
                      selectedFeedEventId === event.id
                        ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-[#1A1A1A]"
                        : "border-[var(--c-ddd9cd)] bg-white text-[#555149]"
                    )}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
              {selectedFeedEvent ? (
                <div className="rounded-[14px] border border-[var(--c-e4cdac)] bg-[#fff7e8] px-3 py-2 text-[12px] font-bold leading-relaxed text-[#6d5a46]">
                  กิจกรรม {selectedFeedEvent.title} ได้ทั้งหมด {selectedFeedEventPoints} แต้มเมื่อโพสต์สำเร็จ
                  <span className="ml-1 text-[#8E8A81]">(ฐาน {basePostPoints} + กิจกรรม {selectedFeedEventBonusPoints})</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          className="anim-fade mb-5 flex min-h-[180px] flex-col gap-2.5 rounded-[22px] border border-[#d9e5f3] bg-white p-4 shadow-[0_12px_28px_rgba(23,59,107,0.07)] md:p-4"
          style={animStyle(0.12)}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[12px] font-extrabold uppercase tracking-wide text-[#6b655a]">Post Details</span>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="ร่วมแชร์วิธีทำงานที่ปลอดภัย สภาพหน้างานที่เป็นอันตราย หรือวิธีป้องกันแก้ไขอุบัติเหตุร่วมกัน..."
            className="min-h-[120px] flex-1 resize-none border-0 bg-transparent p-0 text-[15.5px] font-semibold leading-relaxed text-[#33312C] focus-visible:ring-0"
          />
          <div className="flex justify-end">
            <span className="text-[11.5px] font-bold text-muted-foreground">
              {text.length} / 500
            </span>
          </div>
        </div>

        <div className="anim-fade mb-5" style={animStyle(0.15)}>
          <h3 className="mb-2 text-[13.5px] font-[850] uppercase tracking-wide text-foreground">
            หมวดหมู่
          </h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-bold outline-none transition-all",
                  activeCategory === category
                    ? "border-[var(--brand-text)] bg-[var(--brand-text)] text-white shadow-[0_3px_8px_rgba(23,59,107,0.16)]"
                    : "border-[var(--border)] bg-white text-[var(--brand-text)] hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)]"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="anim-fade mb-5" style={animStyle(0.2)}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[13.5px] font-[850] uppercase tracking-wide text-foreground">
              รูปภาพ · {photos.length} / {MAX_PHOTOS}
            </h3>
            {isProcessingPhotos ? (
              <span className="text-[11px] font-bold text-[#8E8A81]">
                กำลังเตรียมรูปภาพ...
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-2xl border border-[#d9e5f3] bg-[var(--secondary)]"
              >
                <Image
                  src={photo.dataUrl}
                  alt={`Upload ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 160px"
                  unoptimized
                  className="object-cover"
                />
                <button
                  onClick={() =>
                    setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== idx))
                  }
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <label
                htmlFor={cameraInputId}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--border)] bg-white text-xs font-bold text-[var(--brand-text)] transition-colors",
                  isProcessingPhotos
                    ? "cursor-wait opacity-60"
                    : "cursor-pointer hover:border-[var(--brand-accent)] hover:bg-[var(--brand-hover-surface)]"
                )}
              >
                <Camera className="mb-0.5 h-5 w-5" />
                ถ่ายรูป
                <input
                  id={cameraInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleCameraChange}
                  disabled={isProcessingPhotos}
                />
              </label>
            )}

            {photos.length < MAX_PHOTOS && (
              <label
                htmlFor={uploadInputId}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--border)] bg-white text-xs font-bold text-[var(--brand-text)] transition-colors",
                  isProcessingPhotos
                    ? "cursor-wait opacity-60"
                    : "cursor-pointer hover:border-[var(--brand-accent)] hover:bg-[var(--brand-hover-surface)]"
                )}
              >
                <Plus className="mb-0.5 h-5 w-5" />
                เพิ่มรูป
                <input
                  id={uploadInputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isProcessingPhotos}
                />
              </label>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
