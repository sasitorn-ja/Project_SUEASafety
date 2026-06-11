"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState, useAppActions } from "@/providers/app-providers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, Camera, Check, AlertCircle, X } from "lucide-react";

export default function FitToDrivePage() {
  const router = useRouter();
  const { healthData } = useAppState();
  const actions = useAppActions();

  const [mounted, setMounted] = useState(false);
  const [systolic, setSystolic] = useState(healthData?.systolic?.toString() || "");
  const [diastolic, setDiastolic] = useState(healthData?.diastolic?.toString() || "");
  const [pulse, setPulse] = useState(healthData?.pulse?.toString() || "");
  const [alcohol, setAlcohol] = useState(healthData?.alcohol !== undefined && healthData?.alcohol !== null ? healthData.alcohol.toString() : "");

  const [bpPhoto, setBpPhoto] = useState<string | null>(healthData?.bpPhoto || null);
  const [alcPhoto, setAlcPhoto] = useState<string | null>(healthData?.alcPhoto || null);
  const [isBpCameraActive, setIsBpCameraActive] = useState(false);
  const [isAlcCameraActive, setIsAlcCameraActive] = useState(false);
  const [bpCameraStream, setBpCameraStream] = useState<MediaStream | null>(null);
  const [alcCameraStream, setAlcCameraStream] = useState<MediaStream | null>(null);

  const bpFileRef = useRef<HTMLInputElement>(null);
  const bpVideoRef = useRef<HTMLVideoElement>(null);
  const alcFileRef = useRef<HTMLInputElement>(null);
  const alcVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      bpCameraStream?.getTracks().forEach((t) => t.stop());
      alcCameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [bpCameraStream, alcCameraStream]);

  const animStyle = (delay: number) => ({
    animationDelay: mounted ? `${delay}s` : "0s",
    opacity: mounted ? undefined : 0,
  });

  const sysVal = systolic !== "" ? parseInt(systolic, 10) : null;
  const diaVal = diastolic !== "" ? parseInt(diastolic, 10) : null;
  const pulseVal = pulse !== "" ? parseInt(pulse, 10) : null;
  const alcVal = alcohol !== "" ? parseFloat(alcohol) : null;

  const getBPStatus = () => {
    if (sysVal === null || diaVal === null || isNaN(sysVal) || isNaN(diaVal)) return { text: "PENDING", class: "pending" };
    if (sysVal < 120 && diaVal < 80) return { text: "✓ NORMAL", class: "normal" };
    if (sysVal <= 139 && diaVal <= 89) return { text: "⚠️ PRE-HIGH", class: "warning" };
    return { text: "🚨 HIGH RISK", class: "danger" };
  };

  const bpStatus = getBPStatus();

  const getAlcStatus = () => {
    if (alcVal === null || isNaN(alcVal)) return { text: "PENDING", class: "pending" };
    if (alcVal === 0) return { text: "PASS", class: "normal" };
    return { text: "🚨 FAIL", class: "danger" };
  };

  const alcStatus = getAlcStatus();

  const isFormValid =
    sysVal !== null && !isNaN(sysVal) && sysVal > 0 &&
    diaVal !== null && !isNaN(diaVal) && diaVal > 0 &&
    pulseVal !== null && !isNaN(pulseVal) && pulseVal > 0 &&
    alcVal !== null && !isNaN(alcVal) && alcVal >= 0;

  const bpMarkerLeft = sysVal !== null && !isNaN(sysVal)
    ? ((Math.max(90, Math.min(180, sysVal)) - 90) / 90) * 100
    : 0;

  const launchCamera = async (
    isMobileInput: React.RefObject<HTMLInputElement | null>,
    videoRef: React.RefObject<HTMLVideoElement | null>,
    setStream: (s: MediaStream | null) => void,
    setActive: (a: boolean) => void,
    setPhoto: (p: string | null) => void
  ) => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      isMobileInput.current?.click();
    } else if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        setStream(stream);
        setActive(true);
        setPhoto(null);
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        }, 80);
      } catch {
        alert("ไม่สามารถเปิดใช้งานกล้องได้");
      }
    }
  };

  const captureWebcam = (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    stream: MediaStream | null,
    setStream: (s: MediaStream | null) => void,
    setActive: (a: boolean) => void,
    setPhoto: (p: string | null) => void
  ) => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current;
      const c = canvasRef.current;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      c.width = v.videoWidth || 640;
      c.height = v.videoHeight || 480;
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0, c.width, c.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const url = c.toDataURL("image/jpeg");
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      setActive(false);
      setPhoto(url);
    }
  };

  const handleBpFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBpPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAlcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAlcPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!isFormValid) return;
    actions.setHealthData({
      systolic: sysVal,
      diastolic: diaVal,
      pulse: pulseVal,
      alcohol: alcVal,
      bpStatus: bpStatus.text,
      alcStatus: alcStatus.text,
      bpPhoto,
      alcPhoto,
    });
    actions.completeSteps([2, 3]);
    router.push("/were-ok");
  };

  return (
    <>
      <div className="w-full min-h-[calc(100vh-80px)] bg-background flex justify-center items-start">
        <div className="w-full max-w-[1360px] mx-auto px-5 md:px-20 py-6 md:py-[50px] flex flex-col">
          {/* Header */}
          <header className="flex items-center gap-3 mb-2 md:mb-4 anim-fade" style={animStyle(0)}>
            <Link href="/were-ok">
              <button className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white border-none shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex items-center justify-center text-foreground transition-colors active:bg-[var(--secondary)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
            </Link>
            <div className="flex flex-col">
              <span className="text-[11px] md:text-[13px] text-muted-foreground font-bold tracking-wide">STEP 02 - 03</span>
              <h1 className="text-lg md:text-[26px] font-extrabold text-foreground">ตรวจความพร้อมตัวเอง</h1>
            </div>
          </header>

          {/* Steps bar */}
          <div className="flex gap-1 mb-5 md:mb-8 pl-1 anim-fade" style={animStyle(0.04)}>
            <div className="h-1 md:h-1.5 rounded bg-foreground w-6 md:w-9" />
            <div className="h-1 md:h-1.5 rounded bg-[var(--brand-accent)] w-6 md:w-9 ml-0.5" />
            <div className="h-1 md:h-1.5 rounded bg-[var(--border)] w-3 md:w-4 ml-0.5" />
          </div>

          {/* Cards grid */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-[50px] lg:gap-y-8 items-start">
            {/* BP Card */}
            <Card className="bg-card border-[var(--border)] rounded-3xl md:rounded-[16px] p-4 md:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] anim-fade" style={animStyle(0.08)}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <h2 className="text-sm md:text-[17px] font-extrabold text-foreground">ความดันโลหิต</h2>
                  <span
                    className={cn(
                      "text-[11px] md:text-[13px] font-extrabold px-2.5 py-1 md:px-3.5 md:py-1 rounded-full tracking-wide",
                      bpStatus.class === "normal" && "bg-[#E6FAF1] text-[#3D9A6A]",
                      bpStatus.class === "warning" && "bg-[var(--brand-soft)] text-[var(--brand-accent)]",
                      bpStatus.class === "danger" && "bg-[#FDF2F2] text-[#D9383A]",
                      bpStatus.class === "pending" && "bg-[var(--secondary)] text-muted-foreground"
                    )}
                  >
                    {bpStatus.text}
                  </span>
                </div>

                {/* Input grid */}
                <div className="grid grid-cols-3 gap-3 md:gap-3 mb-5">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground">ตัวบน (SYS)</Label>
                    <Input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="120"
                      min={50}
                      max={250}
                      className="rounded-xl border-[1.5px] border-[var(--border)] bg-white font-bold text-foreground focus:border-[var(--brand-accent)] focus:shadow-[0_0_0_3px_rgba(var(--brand-accent-rgb),0.15)] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground">ตัวล่าง (DIA)</Label>
                    <Input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="80"
                      min={30}
                      max={150}
                      className="rounded-xl border-[1.5px] border-[var(--border)] bg-white font-bold text-foreground focus:border-[var(--brand-accent)] focus:shadow-[0_0_0_3px_rgba(var(--brand-accent-rgb),0.15)] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground">ชีพจร (BPM)</Label>
                    <Input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      placeholder="72"
                      min={30}
                      max={200}
                      className="rounded-xl border-[1.5px] border-[var(--border)] bg-white font-bold text-foreground focus:border-[var(--brand-accent)] focus:shadow-[0_0_0_3px_rgba(var(--brand-accent-rgb),0.15)] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                {/* BP Values display */}
                <div className="flex items-baseline justify-between pb-4 mb-4 border-b border-[var(--secondary)]">
                  <div className="flex-1 border-r border-[var(--secondary)] pr-3">
                    <div className="text-[32px] md:text-[56px] font-extrabold leading-none text-foreground">{sysVal ?? "—"}</div>
                    <div className="text-[9px] md:text-[11px] text-muted-foreground font-bold mt-1">SYSTOLIC mmHg</div>
                  </div>
                  <div className="flex-1 border-r border-[var(--secondary)] px-3">
                    <div className="text-[32px] md:text-[56px] font-extrabold leading-none text-foreground">{diaVal ?? "—"}</div>
                    <div className="text-[9px] md:text-[11px] text-muted-foreground font-bold mt-1">DIASTOLIC mmHg</div>
                  </div>
                  <div className="flex-1 pl-3">
                    <div className="text-[32px] md:text-[56px] font-extrabold leading-none text-foreground">{pulseVal ?? "—"}</div>
                    <div className="text-[9px] md:text-[11px] text-muted-foreground font-bold mt-1">PULSE RATE</div>
                  </div>
                </div>

                {/* Gauge */}
                <div className="relative pb-5">
                  <div className="h-2 md:h-3 rounded-full w-full bg-[linear-gradient(90deg,#3D9A6A_0%,#3D9A6A_55%,var(--brand-accent)_55%,var(--brand-accent)_78%,#D9383A_78%,#D9383A_100%)] relative">
                    {sysVal !== null && !isNaN(sysVal) && (
                      <div
                        className="absolute top-[-2px] md:top-[-3px] w-1 md:w-1.5 h-3 md:h-[18px] bg-black rounded transition-[left_0.25s_ease-out]"
                        style={{ left: `${bpMarkerLeft}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] md:text-[13px] text-muted-foreground font-semibold mt-1.5 px-0.5">
                    <span>90</span>
                    <span>120</span>
                    <span>140</span>
                    <span>180</span>
                  </div>
                </div>

                {/* BP Camera */}
                <div className="mt-4 pt-4 border-t border-[var(--secondary)]">
                  <span className="text-[11px] font-extrabold text-foreground uppercase tracking-wide mb-2 block">
                    📸 ถ่ายภาพเครื่องวัดความดันโลหิต
                  </span>
                  <div
                    onClick={() => {
                      if (!isBpCameraActive && !bpPhoto) {
                        launchCamera(bpFileRef, bpVideoRef, setBpCameraStream, setIsBpCameraActive, setBpPhoto);
                      }
                    }}
                    className="relative w-full h-40 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--brand-surface)] overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)]"
                  >
                    {isBpCameraActive ? (
                      <video ref={bpVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : bpPhoto ? (
                      <img src={bpPhoto} alt="BP" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground font-bold text-xs md:text-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span>แตะเพื่อถ่ายรูปผลวัดความดัน</span>
                      </div>
                    )}
                    {isBpCameraActive && (
                      <>
                        <div
                          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white border-[3px] border-foreground flex items-center justify-center cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.15)] z-10 transition-transform active:scale-[0.92]"
                          onClick={(e) => {
                            e.stopPropagation();
                            captureWebcam(bpVideoRef, bpCameraStream, setBpCameraStream, setIsBpCameraActive, setBpPhoto);
                          }}
                        >
                          <div className="w-7 h-7 rounded-full bg-[#D9383A]" />
                        </div>
                        <button
                          className="absolute top-2.5 right-2.5 bg-[rgba(26,26,26,0.8)] text-white border-none rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold flex items-center gap-1 shadow-[0_2px_6px_rgba(0,0,0,0.1)] z-10 transition-colors hover:bg-[rgba(26,26,26,0.95)]"
                          onClick={(e) => { e.stopPropagation(); handleStopCamera(bpCameraStream, setBpCameraStream, setIsBpCameraActive); }}
                        >
                          ❌ ยกเลิก
                        </button>
                      </>
                    )}
                    {bpPhoto && !isBpCameraActive && (
                      <button
                        className="absolute top-2.5 right-2.5 bg-[rgba(26,26,26,0.8)] text-white border-none rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold flex items-center gap-1 shadow-[0_2px_6px_rgba(0,0,0,0.1)] z-10 transition-colors hover:bg-[rgba(26,26,26,0.95)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBpPhoto(null);
                          setTimeout(() => launchCamera(bpFileRef, bpVideoRef, setBpCameraStream, setIsBpCameraActive, setBpPhoto), 80);
                        }}
                      >
                        🔄 ถ่ายใหม่
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alcohol Card */}
            <Card className="bg-card border-[var(--border)] rounded-3xl md:rounded-[16px] p-4 md:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] anim-fade" style={animStyle(0.14)}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <h2 className="text-sm md:text-[17px] font-extrabold text-foreground">แอลกอฮอล์ในลมหายใจ</h2>
                  <span
                    className={cn(
                      "text-[11px] md:text-[13px] font-extrabold px-2.5 py-1 md:px-3.5 md:py-1 rounded-full tracking-wide",
                      alcStatus.class === "normal" && "bg-[#E6FAF1] text-[#3D9A6A]",
                      alcStatus.class === "danger" && "bg-[#FDF2F2] text-[#D9383A]",
                      alcStatus.class === "pending" && "bg-[var(--secondary)] text-muted-foreground"
                    )}
                  >
                    {alcStatus.text}
                  </span>
                </div>

                {/* Alc input */}
                <div className="flex flex-col gap-1.5 mb-5">
                  <Label className="text-[11px] font-bold text-foreground">ปริมาณแอลกอฮอล์จากการเป่า (mg%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={alcohol}
                    onChange={(e) => setAlcohol(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    max={10}
                    className="rounded-xl border-[1.5px] border-[var(--border)] bg-white font-bold text-foreground focus:border-[var(--brand-accent)] focus:shadow-[0_0_0_3px_rgba(var(--brand-accent-rgb),0.15)] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="flex items-center gap-4 md:gap-6 mb-5">
                  <div className="w-[84px] h-[84px] md:w-[120px] md:h-[120px] flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--c-eceae0)"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={alcVal !== null && !isNaN(alcVal) && alcVal > 0 ? "#D9383A" : alcVal !== null && !isNaN(alcVal) && alcVal === 0 ? "#3D9A6A" : "var(--c-eceae0)"}
                        strokeWidth="2.5"
                        strokeDasharray="100, 100"
                        style={{ transition: "stroke 0.2s" }}
                      />
                      <text x="18" y="19.5" fontSize="6.5" fontWeight="800" textAnchor="middle" fill="#1A1A1A">
                        {alcVal !== null && !isNaN(alcVal) ? alcVal.toFixed(2) : "—.——"}
                      </text>
                      <text x="18" y="25" fontSize="3" fontWeight="600" textAnchor="middle" fill="#8E8A81">mg%</text>
                    </svg>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="text-[13.5px] md:text-base font-extrabold text-foreground leading-snug">
                      {alcVal === null
                        ? "กรุณากรอกข้อมูลปริมาณแอลกอฮอล์"
                        : alcVal === 0
                        ? "ไม่มีแอลกอฮอล์ตรวจพบ · ปลอดภัยสำหรับการขับขี่"
                        : "ตรวจพบปริมาณแอลกอฮอล์ในกระแสลมหายใจ!"}
                    </div>
                  </div>
                </div>

                {/* Warning banner */}
                <div
                  className="rounded-xl p-3 flex gap-2 items-start text-[11.5px] md:text-[13.5px] font-semibold leading-relaxed transition-all"
                  style={{
                    backgroundColor: alcVal !== null && !isNaN(alcVal) && alcVal > 0 ? "#FDF2F2" : "var(--brand-soft)",
                    border: `1px solid ${alcVal !== null && !isNaN(alcVal) && alcVal > 0 ? "rgba(217, 56, 58, 0.15)" : "var(--border)"}`,
                    color: alcVal !== null && !isNaN(alcVal) && alcVal > 0 ? "#D9383A" : "var(--brand-text)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span>
                    {alcVal !== null && !isNaN(alcVal) && alcVal > 0
                      ? "ตรวจพบแอลกอฮอล์! ห้ามปฏิบัติหน้าที่เด็ดขาดและให้รายงานผู้จัดการทันที"
                      : "เกณฑ์เข้างานต้องเป็น 0 mg% เท่านั้น สำหรับ จบส."}
                  </span>
                </div>

                {/* Alc Camera */}
                <div className="mt-4 pt-4 border-t border-[var(--secondary)]">
                  <span className="text-[11px] font-extrabold text-foreground uppercase tracking-wide mb-2 block">
                    📸 ถ่ายภาพเครื่องเป่าแอลกอฮอล์
                  </span>
                  <div
                    onClick={() => {
                      if (!isAlcCameraActive && !alcPhoto) {
                        launchCamera(alcFileRef, alcVideoRef, setAlcCameraStream, setIsAlcCameraActive, setAlcPhoto);
                      }
                    }}
                    className="relative w-full h-40 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--brand-surface)] overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)]"
                  >
                    {isAlcCameraActive ? (
                      <video ref={alcVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : alcPhoto ? (
                      <img src={alcPhoto} alt="Alc" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground font-bold text-xs md:text-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span>แตะเพื่อถ่ายรูปผลเป่าแอลกอฮอล์</span>
                      </div>
                    )}
                    {isAlcCameraActive && (
                      <>
                        <div
                          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white border-[3px] border-foreground flex items-center justify-center cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.15)] z-10 transition-transform active:scale-[0.92]"
                          onClick={(e) => {
                            e.stopPropagation();
                            captureWebcam(alcVideoRef, alcCameraStream, setAlcCameraStream, setIsAlcCameraActive, setAlcPhoto);
                          }}
                        >
                          <div className="w-7 h-7 rounded-full bg-[#D9383A]" />
                        </div>
                        <button
                          className="absolute top-2.5 right-2.5 bg-[rgba(26,26,26,0.8)] text-white border-none rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold flex items-center gap-1 shadow-[0_2px_6px_rgba(0,0,0,0.1)] z-10 transition-colors hover:bg-[rgba(26,26,26,0.95)]"
                          onClick={(e) => { e.stopPropagation(); handleStopCamera(alcCameraStream, setAlcCameraStream, setIsAlcCameraActive); }}
                        >
                          ❌ ยกเลิก
                        </button>
                      </>
                    )}
                    {alcPhoto && !isAlcCameraActive && (
                      <button
                        className="absolute top-2.5 right-2.5 bg-[rgba(26,26,26,0.8)] text-white border-none rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold flex items-center gap-1 shadow-[0_2px_6px_rgba(0,0,0,0.1)] z-10 transition-colors hover:bg-[rgba(26,26,26,0.95)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlcPhoto(null);
                          setTimeout(() => launchCamera(alcFileRef, alcVideoRef, setAlcCameraStream, setIsAlcCameraActive, setAlcPhoto), 80);
                        }}
                      >
                        🔄 ถ่ายใหม่
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next button */}
            <div className="mt-6 lg:mt-8 lg:col-start-2 lg:justify-self-end anim-fade" style={animStyle(0.2)}>
              <button
                onClick={handleNext}
                disabled={!isFormValid}
                className={cn(
                  "w-full lg:w-auto lg:min-w-[240px] bg-[#121214] text-white font-extrabold text-[15px] md:text-base rounded-[16px] md:rounded-3xl py-4 md:py-5 px-8 shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center gap-1.5 transition-all select-none",
                  isFormValid
                    ? "hover:bg-[#252528] active:scale-[0.99]"
                    : "bg-[var(--border)] text-muted-foreground cursor-not-allowed shadow-none"
                )}
              >
                <span>ถัดไป · ตรวจรถ</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <input type="file" ref={bpFileRef} accept="image/*" capture="environment" className="hidden" onChange={handleBpFile} />
      <input type="file" ref={alcFileRef} accept="image/*" capture="environment" className="hidden" onChange={handleAlcFile} />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}

function handleStopCamera(
  stream: MediaStream | null,
  setStream: (s: MediaStream | null) => void,
  setActive: (a: boolean) => void
) {
  stream?.getTracks().forEach((t) => t.stop());
  setStream(null);
  setActive(false);
}
