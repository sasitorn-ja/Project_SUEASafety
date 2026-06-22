"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState, useAppActions } from "@/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSafetyPoint } from "@/lib/point-rules";
import { ArrowLeft, Camera, Check, X } from "lucide-react";
import { uploadSafetyEffortMediaSource } from "@/features/safety-effort/lib/upload-media";

export default function KytPage() {
  const router = useRouter();
  const { kytData } = useAppState();
  const actions = useAppActions();

  const [mounted, setMounted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(kytData?.photo || null);
  const [isPhotoConfirmed, setIsPhotoConfirmed] = useState(kytData?.isPhotoConfirmed || false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(kytData?.isSubmitted || false);
  const [hasRetaken, setHasRetaken] = useState(kytData?.hasRetaken || false);
  const [currentTime, setCurrentTime] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const animStyle = (delay: number) => ({
    animationDelay: mounted ? `${delay}s` : "0s",
    opacity: mounted ? undefined : 0,
  });

  const handleLaunchCamera = async () => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
          setCameraStream(stream);
          setIsCameraActive(true);
          setPhoto(null);
          setIsPhotoConfirmed(false);
          setTimeout(() => {
            if (videoRef.current) videoRef.current.srcObject = stream;
          }, 80);
        } catch {
          alert("ไม่สามารถเปิดใช้งานกล้องบนโน้ตบุ๊กของคุณได้ กรุณาตรวจสอบสิทธิ์การใช้งานกล้อง");
        }
      } else {
        alert("เบราว์เซอร์นี้ไม่รองรับการถ่ายรูปด้วยกล้องวิดีโอ");
      }
    }
  };

  const handleCaptureWebcam = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      cameraStream?.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
      setPhoto(dataUrl);
      setIsPhotoConfirmed(false);
    }
  };

  const handleStopWebcam = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setIsCameraActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
      setIsPhotoConfirmed(false);
    }
  };

  const handleRetake = () => {
    handleStopWebcam();
    setPhoto(null);
    setIsPhotoConfirmed(false);
    if (isSubmitted) {
      setHasRetaken(true);
      setIsSubmitted(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => handleLaunchCamera(), 100);
  };

  const handleSubmit = () => {
    if (!photo || !isPhotoConfirmed || isSubmitted) return;
    setIsSubmitted(true);
    setTimeout(async () => {
      let persistedPhoto = photo;
      try {
        persistedPhoto = (await uploadSafetyEffortMediaSource(photo, { ownerType: "kyt-record", linkType: "evidence", fileName: `kyt-${Date.now()}.jpg` })).url;
      } catch { setIsSubmitted(false); window.alert("อัปโหลดรูป KYT ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"); return; }
      const saved = await actions.setKytData({ photo: persistedPhoto, isPhotoConfirmed: true, isSubmitted: true, hasRetaken });
      if (!saved) { setIsSubmitted(false); window.alert("บันทึก KYT ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"); return; }
      actions.completeSteps([1]);
      actions.awardSafetyEffortCompletion(`kyt-${new Date().toISOString().slice(0, 10)}`, "KYT ก่อนขับรถสำเร็จ");
      router.push("/were-ok");
    }, 1500);
  };

  return (
    <>
      <div className="w-full min-h-[calc(100vh-80px)] bg-background flex justify-center items-start">
        <div className="w-full max-w-[500px] lg:max-w-full mx-auto px-5 md:px-20 py-6 md:py-[60px] flex flex-col">
          <div className="w-full max-w-[600px] lg:max-w-full mx-auto flex flex-col flex-1">
            {/* Header */}
            <header className="flex items-center gap-3 mb-2 md:mb-4 anim-fade" style={animStyle(0)}>
              <Link href="/were-ok">
                <button className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex items-center justify-center text-foreground transition-colors active:bg-[var(--secondary)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                </button>
              </Link>
              <div className="flex flex-col">
                <span className="text-[11px] md:text-[13px] text-muted-foreground font-bold tracking-wide">STEP 01</span>
                <h1 className="text-lg md:text-[26px] font-extrabold text-foreground">KYT ก่อนขับรถ</h1>
              </div>
            </header>

            {/* Progress bar */}
            <div className="flex gap-1 mb-4 md:mb-8 pl-1 anim-fade" style={animStyle(0.04)}>
              <div className="h-1 md:h-1.5 rounded bg-[var(--brand-accent)] w-6 md:w-9" />
              <div className="h-1 md:h-1.5 rounded bg-[var(--border)] w-3 md:w-4 ml-0.5" />
              <div className="h-1 md:h-1.5 rounded bg-[var(--border)] w-3 md:w-4 ml-0.5" />
              <div className="h-1 md:h-1.5 rounded bg-[var(--border)] w-3 md:w-4 ml-0.5" />
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-5 md:mb-8 pl-1 anim-fade" style={animStyle(0.06)}>
              <Badge className="bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)] hover:bg-[var(--brand-accent)] text-[11px] md:text-[13px] font-extrabold px-3 py-1 md:px-3.5 md:py-1.5 rounded-full shadow-[0_2px_6px_rgba(var(--brand-accent-rgb),0.1)]">
                KYT ZONE
              </Badge>
              <Badge variant="outline" className="text-[11px] md:text-[13px] font-extrabold px-3 py-1 md:px-3.5 md:py-1.5 rounded-full border-[var(--border)] bg-card">
                {currentTime || "09:41"}
              </Badge>
            </div>

            {/* Photo capture area */}
            <div className="flex flex-col gap-4 anim-fade" style={animStyle(0.08)}>
              <div className="relative w-full h-[280px] md:h-[380px] bg-[var(--secondary)] bg-[repeating-linear-gradient(45deg,var(--secondary),var(--secondary)_10px,var(--brand-soft)_10px,var(--brand-soft)_20px)] border-2 border-dashed border-[var(--c-c5c1b5)] rounded-[16px] md:rounded-[36px] overflow-hidden flex flex-col items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="absolute top-5 left-5 w-8 h-8 md:w-10 md:h-10 bg-[var(--brand-accent)] rounded-lg shadow-[0_2px_6px_rgba(var(--brand-accent-rgb),0.25)]" />

                {isCameraActive ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover -scale-x-100" />
                ) : photo ? (
                  <img src={photo} alt="KYT Safety talk" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[15px] md:text-lg font-bold text-muted-foreground/60 font-mono tracking-wide">
                    // kyt talk · safety zone
                  </span>
                )}

                {!photo && (
                  <button
                    onClick={isCameraActive ? handleCaptureWebcam : handleLaunchCamera}
                    className={cn(
                      "absolute bottom-5 right-5 w-[54px] h-[54px] md:w-16 md:h-16 rounded-full border-none flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-transform active:scale-95 z-20",
                      isCameraActive ? "bg-[#D9383A] text-white" : "bg-[#121214] text-white"
                    )}
                  >
                    {isCameraActive ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    )}
                  </button>
                )}

                {photo && !isPhotoConfirmed && (
                  <div className="absolute inset-0 bg-[rgba(18,18,20,0.88)] backdrop-blur-sm flex flex-col items-center justify-center gap-3.5 p-4 text-white text-center animate-[fadeIn_0.2s_ease-out]">
                    <div className="text-base md:text-lg font-extrabold text-[var(--brand-accent)]">ต้องการใช้รูปภาพนี้ใช่หรือไม่?</div>
                    <p className="text-xs md:text-sm text-[var(--border)] leading-relaxed max-w-[280px]">
                      กรุณายืนยันภาพถ่ายร่วมพูดคุยความปลอดภัย KYT Zone เพื่อรับคะแนนเช็กอิน
                    </p>
                    <div className="flex gap-2.5 w-full max-w-[240px]">
                      <button
                        onClick={() => setIsPhotoConfirmed(true)}
                        className="flex-[1.2] bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)] border-none rounded-xl py-2.5 text-[13.5px] md:text-sm font-extrabold transition-transform active:scale-[0.97]"
                      >
                        ยืนยันใช้รูปนี้
                      </button>
                      <button
                        onClick={handleRetake}
                        className="flex-[0.8] bg-[#D9383A] text-white border-none rounded-xl py-2.5 text-[13.5px] md:text-sm font-extrabold transition-transform active:scale-[0.97]"
                      >
                        ถ่ายใหม่
                      </button>
                    </div>
                  </div>
                )}

                {photo && isPhotoConfirmed && (
                  <button
                    onClick={handleRetake}
                    className="absolute top-4 right-4 bg-[rgba(217,56,58,0.95)] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-sm hover:bg-destructive z-20 border-none transition-colors"
                  >
                    🔄 ถ่ายรูปใหม่
                  </button>
                )}
              </div>

              {/* Submit */}
              <div className="flex flex-col items-center gap-1.5 mt-2 md:mt-2">
                <button
                  onClick={handleSubmit}
                  disabled={(!photo || !isPhotoConfirmed) && !isSubmitted}
                  className={cn(
                    "w-full rounded-[16px] md:rounded-3xl py-4 md:py-5 h-auto font-extrabold text-[15px] md:text-base flex items-center justify-center gap-2 transition-all select-none",
                    isSubmitted
                      ? "bg-[#3D9A6A] text-white cursor-default shadow-[0_4px_14px_rgba(61,154,106,0.2)]"
                      : "bg-[#121214] hover:bg-[#252528] text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] active:scale-[0.99]"
                  )}
                >
                  {isSubmitted ? (
                    hasRetaken ? (
                      <>
                        <span>ส่งรูปภาพใหม่สำเร็จแล้ว</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>ส่งแล้ว · +{getSafetyPoint("safetyEffortCompleted")} แต้ม</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </>
                    )
                  ) : (
                    hasRetaken ? (
                      <>
                        <span>ส่งรูปภาพใหม่</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>ส่ง · รับ +{getSafetyPoint("safetyEffortCompleted")} แต้ม</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </>
                    )
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
