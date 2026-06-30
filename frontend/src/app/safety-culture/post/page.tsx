"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  Plus, 
  X,
  Folder,
  Calendar,
  Shield,
  Footprints,
  Wrench,
  Lightbulb,
  Heart,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { useAppActions, useAppState } from "@/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { AppDialogBody, AppDialogContent, AppDialogDescription, AppDialogTitle } from "@/components/ui/app-dialog";
import { uploadMedia } from "@/features/safety-effort/lib/upload-media";
import { SAFETY_CULTURE_CATEGORIES } from "@/lib/safety-culture";
import { getSafetyPoint } from "@/lib/point-rules";
import { cn } from "@/lib/utils";
import { getSessionDisplayName, getSessionInitials, getSessionProfileImage, useSessionUser } from "@/lib/session-user";
import { useAppTheme } from "@/providers/theme-provider";

const CATEGORIES = SAFETY_CULTURE_CATEGORIES.filter(
  (category) => !["ทั้งหมด", "ทีมของฉัน"].includes(category)
);
const MAX_PHOTOS = 5;
const MAX_PHOTO_EDGE = 1600;
const PHOTO_OUTPUT_QUALITY = 0.78;
const POINT_UNIT = "Coin";

type DraftPhoto = {
  type: string;
  dataUrl: string;
};

type PostSuccessPopup = {
  title: string;
  description: string;
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
  const media = await uploadMedia(file, {
    module: "safety-culture",
    ownerType: "post",
    linkType: "attachment",
  });
  return String(media.id || "");
}

const getEventCardInfo = (eventTitle: string) => {
  const titleLower = eventTitle.toLowerCase();
  if (titleLower.includes("kyt")) {
    return {
      title: "KYT",
      sub: "Mission Week",
      icon: (className: string) => (
        <div className={cn("p-2.5 rounded-xl bg-[#e6ffed] text-[#28a745] transition-colors", className)}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    };
  }
  if (titleLower.includes("ppe")) {
    return {
      title: "PPE Focus",
      sub: "แชร์การใช้งานที่ถูกต้อง",
      icon: (className: string) => (
        <div className={cn("p-2.5 rounded-xl bg-[#fff7e6] text-[#fa8c16] transition-colors", className)}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
      )
    };
  }
  if (titleLower.includes("line")) {
    return {
      title: "Line Walk",
      sub: "แชร์จุดตรวจ",
      icon: (className: string) => (
        <div className={cn("p-2.5 rounded-xl bg-[#e6f7ff] text-[#1890ff] transition-colors", className)}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16v-2a2 2 0 1 1 4 0v2M12 14v-2a2 2 0 1 1 4 0v2M16 8v-2a2 2 0 1 1 4 0v2"/>
          </svg>
        </div>
      )
    };
  }
  return {
    title: eventTitle,
    sub: "กิจกรรมพิเศษ",
    icon: (className: string) => (
      <div className={cn("p-2.5 rounded-xl bg-[#f5f5f5] text-[#555] transition-colors", className)}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
    )
  };
};

export default function PostSocialPage() {
  const cameraInputId = useId();
  const uploadInputId = useId();
  const router = useRouter();
  const actions = useAppActions();
  const { safetyCultureEvent, isEventLive, feedEvents } = useAppState();
  const { user: sessionUser } = useSessionUser();
  const { themedImage } = useAppTheme();
  const availableFeedEvents = feedEvents.filter((event) => event.published && event.status === "open");
  const [text, setText] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั่วไป");
  const [selectedFeedEventId, setSelectedFeedEventId] = useState("");
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postSuccessPopup, setPostSuccessPopup] = useState<PostSuccessPopup | null>(null);
  
  // Drag to scroll handlers for desktop mouse users
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    setIsMouseDown(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const container = e.currentTarget;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity
    container.scrollLeft = scrollLeft - walk;
  };

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

  const closePostSuccessPopup = () => {
    setPostSuccessPopup(null);
    router.push("/safety-culture");
  };

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
          : `+${selectedFeedEvent.fixedPoints} ${POINT_UNIT} เพิ่ม`
        : safetyCultureEvent.bonusMode === "multiplier"
          ? `x${safetyCultureEvent.multiplier}`
          : `+${safetyCultureEvent.fixedPoints} ${POINT_UNIT} เพิ่ม`;
    const successDescription = selectedFeedEvent
      ? `โพสต์เข้ากิจกรรม ${selectedFeedEvent.title} แล้ว ฐาน ${basePostPoints} ${POINT_UNIT} และโบนัส ${selectedFeedEventBonusPoints > 0 ? `+${selectedFeedEventBonusPoints} ${POINT_UNIT}` : `+0 ${POINT_UNIT}`} เพิ่ม`
      : isEventLive
        ? `แชร์เรื่องความปลอดภัยแล้ว ได้ฐาน +${basePostPoints} ${POINT_UNIT} และโบนัสอีเว้น ${nextBonusLabel}`
        : `แชร์เรื่องความปลอดภัยแล้ว ได้รับ +${basePostPoints} ${POINT_UNIT}`;

    setIsSubmitting(false);
    setPostSuccessPopup({
      title: "โพสต์สำเร็จ",
      description: successDescription,
    });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[650px] px-4 pb-8 pt-2">
        {/* HTML stylesheet to completely hide scrollbars cross-browser */}
        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `}} />

        {/* Top Header */}
        <header
          className="anim-fade flex items-center justify-between pb-4 pt-3 px-1"
          style={animStyle(0)}
        >
          <div className="flex items-center gap-3.5">
            <Link href="/safety-culture">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#188fff] shadow-[0_4px_12px_rgba(24,143,255,0.15)] hover:scale-105 transition-transform cursor-pointer border border-[#e2edf9]">
                <ArrowLeft className="h-5.5 w-5.5 stroke-[2.5]" />
              </div>
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-[#112f59] leading-tight">
                แชร์เรื่องปลอดภัย
              </h1>
              <p className="text-[11.5px] font-bold text-[#8292a8]">
                แบ่งปันประสบการณ์ดี ๆ เพื่อสร้างวัฒนธรรมความปลอดภัยไปด้วยกัน
              </p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isProcessingPhotos || isSubmitting}
            className="rounded-full bg-gradient-to-r from-[#188fff] to-[#0663d2] px-5 py-2.5 text-sm font-extrabold text-white transition-all hover:opacity-90 hover:scale-[1.02] shadow-[0_4px_12px_rgba(6,99,210,0.25)] flex items-center gap-1.5 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? (
              "กำลังโพสต์..."
            ) : (
              <>
                <svg className="h-4 w-4 fill-current rotate-45 mr-0.5" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span>โพสต์</span>
              </>
            )}
          </Button>
        </header>

        {/* Mascot / Profile Banner */}
        <div 
          className="anim-fade relative overflow-hidden rounded-[24px] border border-[#d9e5f3] bg-gradient-to-r from-[#f0f7ff] to-[#e1f0ff] p-5 shadow-[0_12px_30px_rgba(23,59,107,0.08)] flex justify-between items-center gap-4 mb-5"
          style={animStyle(0.03)}
        >
          {/* Left info & quote */}
          <div className="flex-1 z-10 space-y-4">
            {/* User details */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-soft)] text-xl font-extrabold text-[var(--brand-accent)] ring-2 ring-[rgba(var(--brand-accent-rgb),0.22)]">
                  {getSessionProfileImage(sessionUser) ? (
                    <Image src={getSessionProfileImage(sessionUser)} alt="" width={56} height={56} className="h-full w-full object-cover" />
                  ) : (
                    getSessionInitials(sessionUser)
                  )}
                </div>
                {/* Pencil Edit Icon overlay */}
                <div className="absolute -bottom-1 -right-1 bg-[#188fff] border-2 border-white rounded-full p-1 shadow-md">
                  <svg className="h-3 w-3 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81(9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[16px] font-extrabold text-[#112f59]">
                  {getSessionDisplayName(sessionUser)}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#188fff] bg-[#e6f4ff] border border-[#bae0ff] rounded-full px-2.5 py-0.5 w-fit">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#188fff] animate-pulse"></span>
                  <span>Safety Culture</span>
                </div>
              </div>
            </div>

            {/* Quote bubble container */}
            <div className="relative border border-[#bae0ff] bg-white/70 backdrop-blur-sm rounded-[18px] p-3 text-[13px] font-bold text-[#1a539c] leading-relaxed max-w-[280px]">
              <span className="text-[20px] font-serif text-[#188fff] absolute -top-1 left-2">“</span>
              <p className="pl-4 pr-4 flex items-center flex-wrap gap-1">
                <span>ทุกการแชร์ คือพลังเล็ก ๆ ที่ช่วยให้ทุกคนปลอดภัยมากขึ้น</span>
                <Heart className="inline-block h-3.5 w-3.5 fill-[#188fff] text-[#188fff] animate-pulse" />
              </p>
              <span className="text-[20px] font-serif text-[#188fff] absolute bottom-1 right-2">”</span>
            </div>
          </div>

          {/* Right Mascot */}
          <div className="relative w-[180px] h-[150px] shrink-0 z-10 flex items-end justify-center">
            <Image 
              src="/images/mascots/scenes/thumbsup-cool.png" 
              alt="Mascot" 
              width={160} 
              height={160} 
              className="object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Background decorative industrial overlay pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-[50%] opacity-15 pointer-events-none mix-blend-overlay">
            <Image src="/images/heroes/Home01.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* select event tab cards */}
        <div className="anim-fade mb-5" style={animStyle(0.06)}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-extrabold text-[#112f59]">
              เลือกประเภทกิจกรรม (Card Event)
            </h3>
          </div>

          {/* Horizontal scrollable row list with Hidden scrollbars */}
          <div 
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={cn(
              "flex flex-row overflow-x-auto gap-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar",
              isMouseDown 
                ? "cursor-grabbing select-none scroll-auto" 
                : "cursor-grab snap-x snap-mandatory scroll-smooth"
            )}
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {/* General Post Card */}
            <button
              type="button"
              onClick={() => setSelectedFeedEventId("")}
              className={cn(
                "relative flex items-center p-3.5 rounded-[20px] border text-left transition-all h-[92px] w-[260px] shrink-0 snap-start gap-3.5 group select-none pointer-events-auto",
                !selectedFeedEventId
                  ? "border-[#0663d2] bg-gradient-to-br from-[#188fff] to-[#0663d2] text-white shadow-[0_8px_20px_rgba(24,143,255,0.25)]"
                  : "border-[#d9e5f3] bg-white text-[#555149] hover:border-[#188fff] hover:bg-slate-50"
              )}
            >
              {!selectedFeedEventId && (
                <div className="absolute top-3 right-3 bg-white text-[#0663d2] rounded-full p-0.5 shadow-sm">
                  <svg className="h-3 w-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}

              <div className={cn(
                "w-15 h-15 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                !selectedFeedEventId ? "bg-white/20 text-white" : "bg-[#e6f4ff] text-[#188fff]"
              )}>
                <svg className="h-7 w-7 fill-current rotate-45 mr-0.5" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className={cn("text-[14.5px] font-extrabold leading-tight", !selectedFeedEventId ? "text-white" : "text-[#112f59]")}>
                  โพสต์ทั่วไป
                </span>
                <span className={cn("text-[11.5px] font-bold", !selectedFeedEventId ? "text-white/80" : "text-[#8292a8]")}>
                  ได้รับ {basePostPoints} Coin
                </span>
              </div>
            </button>

            {/* Predefined Dynamic Event Cards */}
            {availableFeedEvents.slice(0, 3).map((event) => {
              const cardInfo = getEventCardInfo(event.title);
              const isSelected = selectedFeedEventId === event.id;
              const bonusPoints = event.enabledActions.includes("theme-post")
                ? event.bonusMode === "multiplier"
                  ? Math.round(event.points * Math.max(1, event.multiplier))
                  : event.points + Math.max(0, event.fixedPoints)
                : 0;
              const totalPoints = basePostPoints + bonusPoints;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedFeedEventId(event.id)}
                  className={cn(
                    "relative flex items-center p-3.5 rounded-[20px] border text-left transition-all h-[92px] w-[260px] shrink-0 snap-start gap-3.5 group select-none pointer-events-auto",
                    isSelected
                      ? "border-[#0663d2] bg-gradient-to-br from-[#188fff] to-[#0663d2] text-white shadow-[0_8px_20px_rgba(24,143,255,0.25)]"
                      : "border-[#d9e5f3] bg-white text-[#555149] hover:border-[#188fff] hover:bg-slate-50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-white text-[#0663d2] rounded-full p-0.5 shadow-sm">
                      <svg className="h-3 w-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}

                  <div className="shrink-0 overflow-hidden rounded-xl w-15 h-15 relative">
                    {event.imageSrc ? (
                      <img
                        src={themedImage(event.imageSrc)}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      cardInfo.icon(isSelected ? "bg-white/20 text-white w-full h-full flex items-center justify-center [&_svg]:h-7 [&_svg]:w-7" : "w-full h-full flex items-center justify-center [&_svg]:h-7 [&_svg]:w-7")
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className={cn("text-[14.5px] font-extrabold line-clamp-1 leading-tight", isSelected ? "text-white" : "text-[#112f59]")}>
                      {cardInfo.title}
                    </span>
                    <span className={cn("text-[11.5px] font-bold line-clamp-1", isSelected ? "text-white/80" : "text-[#8292a8]")}>
                      ได้รับ {totalPoints} Coin
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Fallback mock cards to complete grid if database has no dynamic events */}
            {availableFeedEvents.length < 1 && (
              <>
                <div className="relative flex items-center p-3.5 rounded-[20px] border border-[#d9e5f3] bg-white/60 text-[#555149] opacity-75 h-[92px] w-[260px] shrink-0 snap-start gap-3.5 select-none">
                  <div className="shrink-0 overflow-hidden rounded-xl">
                    <div className="p-2.5 rounded-xl bg-[#e6ffed] text-[#28a745] w-15 h-15 flex items-center justify-center [&_svg]:h-7 [&_svg]:w-7">
                      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14.5px] font-extrabold text-[#112f59]">KYT</span>
                    <span className="text-[11.5px] font-bold text-[#8292a8]">ได้รับ 41 Coin</span>
                  </div>
                </div>
                <div className="relative flex items-center p-3.5 rounded-[20px] border border-[#d9e5f3] bg-white/60 text-[#555149] opacity-75 h-[92px] w-[260px] shrink-0 snap-start gap-3.5 select-none">
                  <div className="shrink-0 overflow-hidden rounded-xl">
                    <div className="p-2.5 rounded-xl bg-[#fff7e6] text-[#fa8c16] w-15 h-15 flex items-center justify-center [&_svg]:h-7 [&_svg]:w-7">
                      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14.5px] font-extrabold text-[#112f59]">PPE Focus</span>
                    <span className="text-[11.5px] font-bold text-[#8292a8]">ได้รับ 20 Coin</span>
                  </div>
                </div>
                <div className="relative flex items-center p-3.5 rounded-[20px] border border-[#d9e5f3] bg-white/60 text-[#555149] opacity-75 h-[92px] w-[260px] shrink-0 snap-start gap-3.5 select-none">
                  <div className="shrink-0 overflow-hidden rounded-xl">
                    <div className="p-2.5 rounded-xl bg-[#e6f7ff] text-[#1890ff] w-15 h-15 flex items-center justify-center [&_svg]:h-7 [&_svg]:w-7">
                      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 16v-2a2 2 0 1 1 4 0v2M12 14v-2a2 2 0 1 1 4 0v2M16 8v-2a2 2 0 1 1 4 0v2"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14.5px] font-extrabold text-[#112f59]">Line Walk</span>
                    <span className="text-[11.5px] font-bold text-[#8292a8]">ได้รับ 15 Coin</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Event Coin Explanation Banner */}
          <div className="mt-3.5 border border-[#ffe58f] bg-[#fffbe6] px-4.5 py-3 rounded-[20px] shadow-sm flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-[#d48806] leading-relaxed">
              {selectedFeedEvent ? (
                selectedFeedEvent.bonusMode === "multiplier" ? (
                  `กิจกรรม ${selectedFeedEvent.title} ได้ทั้งหมด ${selectedFeedEventPoints} Coin เมื่อโพสต์สำเร็จ (ฐาน ${basePostPoints} x ตัวคูณกิจกรรม ${selectedFeedEvent.multiplier})`
                ) : (
                  `กิจกรรม ${selectedFeedEvent.title} ได้ทั้งหมด ${selectedFeedEventPoints} Coin เมื่อโพสต์สำเร็จ (ฐาน ${basePostPoints} + กิจกรรม ${selectedFeedEventBonusPoints})`
                )
              ) : (
                `โพสต์ทั่วไป ได้ทั้งหมด ${basePostPoints} Coin เมื่อโพสต์สำเร็จ (ฐาน ${basePostPoints})`
              )}
            </span>
          </div>
        </div>

        {/* Shared Textarea Details */}
        <div 
          className="anim-fade mb-5 rounded-[22px] border border-[#d9e5f3] bg-white p-4 shadow-[0_12px_28px_rgba(23,59,107,0.06)]" 
          style={animStyle(0.12)}
        >
          <div className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold text-[#112f59]">
            <svg className="h-5 w-5 text-[#188fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>รายละเอียดเรื่องที่แชร์</span>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="ร่วมแชร์วิธีทำงานที่ปลอดภัย สภาพหน้างานที่เป็นอันตราย หรือวิธีป้องกันแก้ไขอุบัติเหตุร่วมกัน..."
            className="min-h-[140px] w-full resize-none border-0 bg-transparent p-0 text-[15px] font-semibold leading-relaxed text-[#33312C] focus-visible:ring-0 placeholder:text-[#a0aec0] placeholder:font-medium outline-none"
          />

          <div className="flex items-center justify-end border-t border-[#f0f6fc] pt-3.5 mt-2">
            <span className="text-[12.5px] font-extrabold text-[#8292a8]">
              {text.length} / 500
            </span>
          </div>
        </div>

        {/* Category Capsules */}
        <div className="anim-fade mb-5" style={animStyle(0.15)}>
          <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#112f59] mb-3">
            <svg className="h-5 w-5 text-[#188fff] fill-current" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <span>หมวดหมู่</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              let IconComponent = Folder;
              if (category.includes("KYT")) IconComponent = Calendar;
              else if (category.includes("PPE")) IconComponent = Shield;
              else if (category.includes("Line Walk") || category.includes("LineWalk")) IconComponent = Footprints;
              else if (category.includes("5S") || category.includes("5s")) IconComponent = Wrench;
              else if (category.includes("เคล็ดลับ")) IconComponent = Lightbulb;

              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full border px-4.5 py-2 text-[13px] font-extrabold outline-none transition-all flex items-center gap-1.5 shadow-sm",
                    isActive
                      ? "border-[#188fff] bg-gradient-to-r from-[#188fff] to-[#0663d2] text-white shadow-[0_4px_10px_rgba(24,143,255,0.2)]"
                      : "border-[#d9e5f3] bg-white text-[#173b68] hover:border-[#188fff] hover:bg-slate-50"
                  )}
                >
                  <IconComponent className="h-4.5 w-4.5" />
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload attachments grid (0/5) */}
        <div className="anim-fade mb-5" style={animStyle(0.18)}>
          <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#112f59] mb-3">
            <svg className="h-5 w-5 text-[#188fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>เพิ่มรูปภาพ ({photos.length} / {MAX_PHOTOS})</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border border-[#e2edf9] rounded-[22px] bg-[#fbfdff] p-4.5">
            {/* Action buttons & draft items */}
            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-wrap gap-3">
                <label
                  htmlFor={cameraInputId}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-[#d9e5f3] bg-white px-4 py-2.5 text-xs font-extrabold text-[#173b68] shadow-sm transition-all hover:border-[#188fff] hover:bg-slate-50 cursor-pointer",
                    isProcessingPhotos ? "opacity-60 cursor-wait" : ""
                  )}
                >
                  <Camera className="h-4.5 w-4.5 text-[#188fff]" />
                  <span>ถ่ายรูป</span>
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

                <label
                  htmlFor={uploadInputId}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-[#d9e5f3] bg-white px-4 py-2.5 text-xs font-extrabold text-[#173b68] shadow-sm transition-all hover:border-[#188fff] hover:bg-slate-50 cursor-pointer",
                    isProcessingPhotos ? "opacity-60 cursor-wait" : ""
                  )}
                >
                  <svg className="h-4.5 w-4.5 text-[#188fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>เลือกจากแกลเลอรี</span>
                  <input
                    id={uploadInputId}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={isProcessingPhotos}
                  />
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2.5 pt-2">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-[14px] border border-[#d9e5f3] bg-slate-100 group shadow-sm"
                    >
                      <Image
                        src={photo.dataUrl}
                        alt={`Upload ${idx + 1}`}
                        fill
                        sizes="(max-width: 768px) 20vw, 80px"
                        unoptimized
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== idx))
                        }
                        className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Polaroid photos graphic decoration */}
            <div className="hidden sm:flex items-center gap-3 w-[150px] shrink-0 border-l border-[#e2edf9] pl-4">
              <div className="relative w-full h-[80px] flex items-center justify-center">
                <div className="absolute rotate-6 translate-x-3 w-[55px] h-[55px] border-2 border-white shadow-md bg-white rounded-lg overflow-hidden">
                  <div className="w-full h-[70%] bg-blue-100 relative">
                    <ImageIcon className="h-5 w-5 text-blue-400 absolute inset-0 m-auto" />
                  </div>
                </div>
                <div className="-rotate-12 -translate-x-3 w-[55px] h-[55px] border-2 border-white shadow-md bg-[#188fff] rounded-lg overflow-hidden flex flex-col justify-between p-1">
                  <div className="w-full h-[70%] bg-white/20 rounded flex items-center justify-center text-white">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Success Dialog Popup */}
      <Dialog open={!!postSuccessPopup} onOpenChange={(open) => !open && closePostSuccessPopup()}>
        <AppDialogContent
          size="sm"
          className="w-[calc(100vw-24px)] max-w-[420px] border-[#cfead9] bg-[linear-gradient(180deg,#f7fff8_0%,#effaf1_100%)] shadow-[0_28px_64px_rgba(16,91,51,0.18)]"
        >
          <AppDialogBody className="grid-cols-[auto_1fr] items-start gap-3 px-4 py-4 sm:px-5 sm:py-4.5">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-[#a9e2ba] bg-white text-[#2c9a57] shadow-[0_4px_10px_rgba(44,154,87,0.12)]">
              <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2.6} />
            </div>
            <div className="space-y-1 text-left">
              <AppDialogTitle className="text-[26px] leading-none text-[#1e9b55] sm:text-[28px]">
                {postSuccessPopup?.title}
              </AppDialogTitle>
              <AppDialogDescription className="mt-0 text-[14px] leading-[1.45] font-extrabold text-[#36a862] sm:text-[15px]">
                {postSuccessPopup?.description}
              </AppDialogDescription>
            </div>
          </AppDialogBody>
        </AppDialogContent>
      </Dialog>
    </>
  );
}
