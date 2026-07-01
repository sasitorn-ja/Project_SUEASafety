"use client";
import Image from "next/image";
import { type CSSProperties, ChangeEvent, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Link2,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { notifyProfileImageUpdated } from "@/lib/profile";
import { useAppTheme } from "@/providers/theme-provider";
import { useAppState } from "@/providers/app-providers";
import { getSessionDisplayName, getSessionEnglishName, getSessionProfileImage, useSessionUser } from "@/lib/session-user";
import { uploadMedia } from "@/features/safety-effort/lib/upload-media";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

// Derive connection/link status from the real SSO session instead of hardcoding it.
function getConnections(user: ReturnType<typeof useSessionUser>["user"]) {
  return [
    { label: "Microsoft", status: user ? "Linked" : "Not linked", icon: ShieldCheck },
    { label: "LINE", status: user?.lineProfileImageUrl ? "Linked" : "Not linked", icon: Link2 },
    { label: "Directory Claim", status: user?.email ? "Verified" : "Pending", icon: BadgeCheck },
  ];
}

export default function ProfilePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState("");
  const [imageError, setImageError] = useState("");
  const { user: sessionUser } = useSessionUser();
  const { personalRankings, teamStandings } = useAppState();
  const { mascot, themedColor } = useAppTheme();
  const displayName = sessionUser ? getSessionDisplayName(sessionUser) : "-";
  const displayNameEn = getSessionEnglishName(sessionUser) || "-";
  const displayPosition = sessionUser?.positionTh || sessionUser?.positionEn || "-";
  const displayDivision = sessionUser?.division || "-";
  const displayEmail = sessionUser?.email || "-";
  const displayUsername = sessionUser?.username || "-";
  const ssoProfileImage = sessionUser?.lineProfileImageUrl || "";
  const displayImage = profileImage || ssoProfileImage;
  const isUsingCustomProfileImage = Boolean(profileImage);
  const activeRankingTeam = personalRankings.find((person) => person.active)?.team;
  const profileTeam = teamStandings.find((team) => {
    const divisionMatched = Boolean(displayDivision && team.sourceDivisions?.some((division) => division === displayDivision));
    const rankingTeamMatched = Boolean(activeRankingTeam && team.name === activeRankingTeam);
    return divisionMatched || rankingTeamMatched;
  });
  const profileTeamColor = themedColor(profileTeam?.color ?? "var(--brand-accent)");
  const connections = getConnections(sessionUser);
  const profileFields = [
    { label: "ชื่อภาษาไทย", value: displayName, icon: UserRound },
    { label: "ชื่อภาษาอังกฤษ", value: displayNameEn, icon: UserRound },
    { label: "ตำแหน่ง", value: displayPosition, icon: BadgeCheck },
    { label: "หน่วยงาน", value: displayDivision, icon: Building2 },
    { label: "อีเมล", value: displayEmail, icon: Mail },
    { label: "ชื่อผู้ใช้งาน", value: displayUsername, icon: UserRound },
  ];

  useEffect(() => {
    setProfileImage(sessionUser?.profileImageUrl || "");
  }, [sessionUser]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
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

    try {
      const media = await uploadMedia(file, {
        module: "profile",
        ownerType: "USER_PROFILE",
        linkType: "profile_image",
      });
      const mediaId = media.id;
      const imageUrl = `/api/uploads/${mediaId}/download`;
      const updateResponse = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImageUrl: imageUrl }),
      });
      const updatePayload = await updateResponse.json().catch(() => null);
      if (!updateResponse.ok || !updatePayload?.ok) throw new Error(updatePayload?.error || "profile_update_failed");
      setProfileImage(imageUrl);
      setImageError("");
      notifyProfileImageUpdated();
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ");
    }
  };

  const removeImage = async () => {
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImageUrl: null }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "profile_update_failed");
      setProfileImage("");
      setImageError("");
      notifyProfileImageUpdated();
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "ลบรูปไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--topbar-h))] bg-[linear-gradient(180deg,var(--secondary)_0%,var(--background)_360px)] pb-10 pt-2 font-sans md:pt-4">
      <div className="page-shell-wide grid gap-4 md:gap-5">
        <section
          className="relative left-1/2 w-[calc(100vw-20px)] max-w-none -translate-x-1/2 overflow-hidden rounded-[18px] border border-[#B9E0FF] bg-[#EAF6FF] shadow-[0_18px_46px_rgba(53,168,255,0.24),inset_0_1px_0_rgba(255,255,255,0.8)] sm:rounded-[22px] lg:w-[calc(100vw-48px)]"
          style={{ backgroundImage: "url('/images/heroes/Home01.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(232,246,255,0.96)_0%,rgba(247,251,255,0.88)_52%,rgba(225,241,255,0.48)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.72))]" />

          <div className="relative grid gap-4 p-3.5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-5 sm:p-5 md:grid-cols-[190px_minmax(0,1fr)_auto] md:items-center md:p-6">
            {/* profile photo */}
            <div className="relative mx-auto w-full max-w-[190px] rounded-[22px] border border-white/80 bg-white/90 p-3 shadow-[0_18px_34px_rgba(11,130,240,0.18)] backdrop-blur-md sm:mx-0">
              <div
                className="team-color-running-ring group relative mx-auto h-28 w-28 rounded-full p-[5px] shadow-[0_14px_30px_rgba(11,130,240,0.20)] sm:h-32 sm:w-32 md:h-[136px] md:w-[136px]"
                style={{ "--team-ring-color": profileTeamColor } as CSSProperties}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-white bg-white">
                  {displayImage ? (
                    <img src={displayImage} alt="รูปโปรไฟล์" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[#EEF7FF]">
                      <UserRound className="h-14 w-14 text-[#0B82F0]/60 md:h-16 md:w-16" strokeWidth={1.7} />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 shadow-[0_7px_16px_rgba(16,185,129,0.32)]">
                    <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={3} />
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#B9E0FF] bg-[#F5FAFF] px-3 py-2 text-[11.5px] font-extrabold text-[#0B82F0] shadow-[0_8px_18px_rgba(11,130,240,.10)] transition hover:bg-white"
                  aria-label="เลือกรูปโปรไฟล์"
                >
                  <Camera className="h-3.5 w-3.5 shrink-0" />
                  <span>เปลี่ยนรูป</span>
                </button>
                {isUsingCustomProfileImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#F4C7C3] bg-[#FFF5F4] px-3 py-2 text-[11.5px] font-black text-[#C9362A] shadow-[0_8px_18px_rgba(201,54,42,.08)] transition hover:bg-[#FFEAE7]"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                    <span>ลบรูปภาพ</span>
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[10.5px] font-extrabold leading-snug text-[#55739B]">
                {isUsingCustomProfileImage ? "ใช้รูปที่ตั้งเอง" : ssoProfileImage ? "ใช้รูปจาก SSO" : "ยังไม่มีรูปโปรไฟล์"}
              </p>
            </div>

            {/* name info */}
            <div className="min-w-0 rounded-[22px] border border-white/70 bg-white/72 p-4 text-center shadow-[0_14px_30px_rgba(11,130,240,0.12)] backdrop-blur-md sm:text-left md:mr-[150px] md:p-5 xl:mr-[178px]">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-[7px] border border-[#0B82F0] bg-white/85 px-2.5 py-[3px] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0B82F0]">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                SSO Profile
              </div>
              <h1 className="mx-auto line-clamp-2 max-w-[min(100%,760px)] break-words text-[22px] font-black leading-[1.08] text-[#0B2F6B] sm:mx-0 sm:text-[26px] md:text-[30px] xl:text-[34px]">
                {displayName}
              </h1>
              <p className="mt-1 text-[12px] font-bold text-[#55739B] md:text-[13.5px]">
                {displayPosition} · {displayDivision}
              </p>
              <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <span className="rounded-full bg-[#E8F2FF] px-2.5 py-1 text-[11px] font-extrabold text-[#0B2F6B]">{displayEmail}</span>
                <span className="rounded-full bg-[#E8F2FF] px-2.5 py-1 text-[11px] font-extrabold text-[#0B2F6B]">@{displayUsername}</span>
              </div>
            </div>

            {/* mascot */}
            <div className="pointer-events-none absolute right-0 bottom-0 hidden md:block">
              <Image
                src={mascot("smile")}
                alt=""
                width={180}
                height={180}
                priority
                className="h-[130px] w-auto object-contain drop-shadow-[0_8px_12px_rgba(11,130,240,0.18)] [animation:sueaMascotFloat_1.8s_ease-in-out_infinite_alternate] xl:h-[152px]"
              />
            </div>

            <input ref={inputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
          {imageError && <p className="relative mt-4 rounded-xl border border-[#f2c6bd] bg-[#fff5f2] px-3 py-2 text-center text-[11px] font-extrabold text-[#b3271a] sm:text-left">{imageError}</p>}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {connections.map(({ label, status, icon: Icon }) => (
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
              <p className="mt-1 text-[11.5px] font-bold text-[var(--muted-foreground)]">
                ข้อมูลอ่านจาก session และระบบต้นทาง โดยแก้ไขรายละเอียดหลักจากระบบ SSO
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[10.5px] font-black text-[var(--brand-text)]">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
              Read only from SSO
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {profileFields.map(({ label, value, icon: Icon }) => (
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
