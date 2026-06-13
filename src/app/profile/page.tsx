"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Link2,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";

const PROFILE_IMAGE_KEY = "suea-safety-profile-image";
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

const MOCK_PROFILE = {
  namePrefixTh: "นางสาว",
  firstNameTh: "ศศิธร",
  lastNameTh: "จรุงจรรยาพงศ์",
  namePrefixEn: "Ms.",
  firstNameEn: "Sasitorn",
  lastNameEn: "Jarungjanyaphong",
  positionTh: "Developer",
  username: "SASITOJA",
  email: "SASITOJA@SCG.COM",
  divisionTh: "RMC Excellence",
  company: "CPAC",
  workLocation: "สำนักงานใหญ่",
};

const PROFILE_FIELDS = [
  { label: "ชื่อภาษาไทย", value: `${MOCK_PROFILE.namePrefixTh} ${MOCK_PROFILE.firstNameTh} ${MOCK_PROFILE.lastNameTh}`, icon: UserRound },
  { label: "ชื่อภาษาอังกฤษ", value: `${MOCK_PROFILE.namePrefixEn} ${MOCK_PROFILE.firstNameEn} ${MOCK_PROFILE.lastNameEn}`, icon: UserRound },
  { label: "ตำแหน่ง", value: MOCK_PROFILE.positionTh, icon: BadgeCheck },
  { label: "หน่วยงาน", value: MOCK_PROFILE.divisionTh, icon: Building2 },
  { label: "บริษัท", value: MOCK_PROFILE.company, icon: ShieldCheck },
  { label: "สถานที่ทำงาน", value: MOCK_PROFILE.workLocation, icon: MapPin },
  { label: "อีเมล", value: MOCK_PROFILE.email, icon: Mail },
  { label: "ชื่อผู้ใช้งาน", value: MOCK_PROFILE.username, icon: UserRound },
];

const CONNECTIONS = [
  { label: "Microsoft", status: "Linked", icon: ShieldCheck },
  { label: "LINE", status: "Linked", icon: Link2 },
  { label: "Directory Claim", status: "Verified", icon: BadgeCheck },
];

export default function ProfilePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    try {
      setProfileImage(window.localStorage.getItem(PROFILE_IMAGE_KEY) || "");
    } catch {
      // The profile still works when browser storage is unavailable.
    }
  }, []);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("รูปภาพต้องมีขนาดไม่เกิน 3 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfileImage(result);
      setImageError("");
      try {
        window.localStorage.setItem(PROFILE_IMAGE_KEY, result);
      } catch {
        setImageError("แสดงรูปได้ชั่วคราว แต่ browser ไม่สามารถบันทึกรูปนี้ไว้ได้");
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage("");
    setImageError("");
    try {
      window.localStorage.removeItem(PROFILE_IMAGE_KEY);
    } catch {
      // Keep the UI responsive even if storage is unavailable.
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--topbar-h))] bg-[linear-gradient(180deg,var(--secondary)_0%,var(--background)_360px)] px-3.5 pb-10 pt-2 font-sans md:px-7 md:pt-4">
      <div className="mx-auto grid w-full max-w-[1180px] gap-4 md:gap-5">
        <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,var(--brand-hero-start),var(--brand-hero-end))] p-5 text-white shadow-[0_18px_44px_var(--brand-shadow)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[var(--brand-accent)] opacity-15 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <div className="relative mx-auto md:mx-0">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-[5px] border-white/80 bg-white/12 shadow-[0_16px_34px_rgba(0,0,0,0.24)] md:h-40 md:w-40"
                aria-label="เลือกรูปโปรไฟล์"
              >
                {profileImage ? (
                  <img src={profileImage} alt="รูปโปรไฟล์" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-16 w-16 text-white/75 md:h-20 md:w-20" strokeWidth={1.7} />
                )}
                <span className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-center gap-1.5 bg-black/55 text-[11px] font-extrabold opacity-100 backdrop-blur-sm md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                  <Camera className="h-4 w-4" />
                  เปลี่ยนรูป
                </span>
              </button>
              <span className="absolute bottom-2 right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[var(--brand-nav)] bg-emerald-500">
                <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={3} />
              </span>
            </div>

            <div className="min-w-0 text-center md:text-left">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-hero-label)]">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                SSO Profile Preview
              </div>
              <h1 className="text-[25px] font-black leading-tight md:text-[36px]">
                {MOCK_PROFILE.namePrefixTh} {MOCK_PROFILE.firstNameTh} {MOCK_PROFILE.lastNameTh}
              </h1>
              <p className="mt-1.5 text-[13px] font-bold text-white/72 md:text-[15px]">
                {MOCK_PROFILE.positionTh} · {MOCK_PROFILE.divisionTh}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-white/85">{MOCK_PROFILE.email}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-white/85">@{MOCK_PROFILE.username}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:max-w-[190px] md:justify-end">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-4 text-[12px] font-black text-[var(--brand-accent-contrast)] shadow-lg transition-transform hover:scale-[1.02]"
              >
                <Upload className="h-4 w-4" strokeWidth={2.5} />
                {profileImage ? "เปลี่ยนรูป" : "เพิ่มรูปโปรไฟล์"}
              </button>
              {profileImage && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-[12px] font-black text-white hover:bg-white/15"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                  ลบรูป
                </button>
              )}
              <input ref={inputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
          </div>
          {imageError && <p className="relative mt-4 rounded-xl bg-red-500/20 px-3 py-2 text-center text-[11px] font-extrabold text-red-50 md:text-left">{imageError}</p>}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {CONNECTIONS.map(({ label, status, icon: Icon }) => (
            <article key={label} className="rounded-[18px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_10px_26px_var(--brand-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.8} />
                  {status}
                </span>
              </div>
              <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{label}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[22px] border border-[var(--border)] bg-[var(--brand-surface)] p-4 shadow-[0_14px_36px_var(--brand-shadow)] md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">Personal information</p>
              <h2 className="mt-1 text-[20px] font-black text-foreground">ข้อมูลจากระบบ SSO</h2>
              <p className="mt-1 text-[11.5px] font-bold text-[var(--muted-foreground)]">ตัวอย่างข้อมูลสำหรับเตรียมเชื่อมต่อ ข้อมูลส่วนนี้จะแก้ไขจากระบบต้นทาง</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[10.5px] font-black text-[var(--brand-text)]">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
              Read only from SSO
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PROFILE_FIELDS.map(({ label, value, icon: Icon }) => (
              <article key={label} className="flex min-w-0 items-center gap-3 rounded-[16px] border border-[var(--border)] bg-background/70 p-3.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.35} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{label}</p>
                  <p className="mt-0.5 truncate text-[13.5px] font-black text-foreground md:text-[14.5px]">{value}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
