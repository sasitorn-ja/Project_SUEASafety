"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Gift,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { type MascotAction, useAppTheme } from "@/providers/theme-provider";
import { useAppState } from "@/providers/app-providers";

type PromptId = "today" | "rewards" | "kyt" | "rank";
type DragPosition = { right: number; bottom: number };
type DragState = {
  pointerId?: number;
  startClientX: number;
  startClientY: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};

const ASSISTANT_POSITION_STORAGE_KEY = "safety-hub:floating-assistant-position";
const ASSISTANT_EDGE_GAP = 8;
const ASSISTANT_TRIGGER_SIZE = 72;
const DRAG_CLICK_SUPPRESSION_MS = 180;

type AssistantContext = {
  action: MascotAction;
  greeting: string;
  message: string;
  urgent: boolean;
};

function getAssistantContext(pathname: string, awarenessDoneToday: boolean): AssistantContext {
  if (pathname.startsWith("/safety-culture/rewards")) {
    return { action: "happy", greeting: "เลือกรางวัลกันไหม?", message: "ฉันช่วยดูว่าคะแนนตอนนี้แลกอะไรได้บ้าง", urgent: false };
  }
  if (pathname.startsWith("/safety-culture/leaderboard")) {
    return { action: "salute", greeting: "มาดูอันดับกัน", message: "ฉันสรุปอันดับและแต้มที่ควรไล่ต่อให้ได้", urgent: false };
  }
  if (pathname.startsWith("/safety-culture/post")) {
    return { action: "clipboard", greeting: "มีเรื่องดี ๆ มาแชร์ไหม?", message: "ฉันช่วยชวนคิดหัวข้อโพสต์ Safety Culture ได้", urgent: false };
  }
  if (pathname.startsWith("/safety-culture/admin-")) {
    return { action: "radio", greeting: "พร้อมช่วยจัดการ", message: "ตรวจข้อมูลให้เรียบร้อยก่อนบันทึกนะ", urgent: false };
  }
  if (pathname.startsWith("/safety-culture")) {
    return { action: "announce", greeting: "สวัสดีจาก Safety Culture", message: "ฉันช่วยแนะนำกิจกรรมและคะแนนที่น่าสนใจได้", urgent: false };
  }
  if (!awarenessDoneToday) {
    return { action: "flashlight", greeting: "อย่าลืม Safety Awareness", message: "วันนี้ยังมีงาน Safety ที่ควรทำให้ครบก่อนเริ่มงาน", urgent: true };
  }
  return { action: "happy", greeting: "วันนี้ทำได้ดีมาก", message: "ฉันช่วยแนะนำงานถัดไปเพื่อสะสมคะแนนต่อได้", urgent: false };
}

function clampPosition(
  position: DragPosition,
  width = ASSISTANT_TRIGGER_SIZE,
  height = ASSISTANT_TRIGGER_SIZE
): DragPosition {
  if (typeof window === "undefined") return position;
  return {
    right: Math.min(
      Math.max(ASSISTANT_EDGE_GAP, position.right),
      Math.max(ASSISTANT_EDGE_GAP, window.innerWidth - width - ASSISTANT_EDGE_GAP)
    ),
    bottom: Math.min(
      Math.max(ASSISTANT_EDGE_GAP, position.bottom),
      Math.max(ASSISTANT_EDGE_GAP, window.innerHeight - height - ASSISTANT_EDGE_GAP)
    ),
  };
}

function snapPositionToNearestEdge(
  position: DragPosition,
  width = ASSISTANT_TRIGGER_SIZE,
  height = ASSISTANT_TRIGGER_SIZE
): DragPosition {
  if (typeof window === "undefined") return position;
  const clamped = clampPosition(position, width, height);
  const centerX = window.innerWidth - clamped.right - width / 2;
  return {
    ...clamped,
    right: centerX < window.innerWidth / 2
      ? Math.max(ASSISTANT_EDGE_GAP, window.innerWidth - width - ASSISTANT_EDGE_GAP)
      : ASSISTANT_EDGE_GAP,
  };
}

export function FloatingSafetyAssistant() {
  const pathname = usePathname() ?? "";
  const { mascot } = useAppTheme();
  const {
    currentUserPoints,
    awarenessDoneToday,
    awarenessRequiredToday,
    isEventLive,
    personalRankings,
    rewardsCatalog,
    safetyCultureEvent,
    teamStandings,
  } = useAppState();
  const [open, setOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptId>("today");
  const [position, setPosition] = useState<DragPosition | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const asideRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastDragPositionRef = useRef<DragPosition | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const mouseMoveCleanupRef = useRef<(() => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const context = useMemo(
    () => getAssistantContext(pathname, awarenessDoneToday),
    [pathname, awarenessDoneToday]
  );
  const sortedRewards = useMemo(
    () => [...rewardsCatalog].sort((a, b) => a.points - b.points),
    [rewardsCatalog]
  );
  const redeemableRewards = sortedRewards.filter((reward) => reward.points <= currentUserPoints);
  const nextReward = sortedRewards.find((reward) => reward.points > currentUserPoints);
  const activeUser = personalRankings.find((person) => person.active);
  const activeTeam = activeUser ? teamStandings.find((team) => team.name === activeUser.team) : undefined;

  const prompts: Array<{ id: PromptId; label: string; Icon: typeof Sparkles }> = [
    { id: "today", label: "วันนี้ต้องทำอะไร", Icon: Sparkles },
    { id: "rewards", label: "คะแนนแลกอะไรได้", Icon: Gift },
    { id: "kyt", label: "ไปทำ KYT", Icon: ClipboardCheck },
    { id: "rank", label: "ดูอันดับ", Icon: Trophy },
  ];

  const botAnswer = useMemo(() => {
    if (activePrompt === "rewards") {
      if (redeemableRewards.length > 0) {
        const topReward = redeemableRewards[redeemableRewards.length - 1];
        return {
          text: `ตอนนี้คุณมี ${currentUserPoints.toLocaleString()} แต้ม แลกได้ ${redeemableRewards.length} รางวัล แนะนำดู "${topReward.name}" ก่อนเลย`,
          href: "/safety-culture/rewards",
          cta: "ดูรางวัล",
        };
      }
      return {
        text: nextReward
          ? `ยังขาดอีก ${(nextReward.points - currentUserPoints).toLocaleString()} แต้ม เพื่อแลก "${nextReward.name}"`
          : "ตอนนี้ยังไม่มีรางวัลใหม่ในระบบ แต่คะแนนของคุณยังสะสมต่อได้",
        href: "/safety-culture/rewards",
        cta: "ดูแคตตาล็อก",
      };
    }

    if (activePrompt === "kyt") {
      return {
        text: "KYT เหมาะมากก่อนเริ่มงานหรือก่อนเข้าพื้นที่เสี่ยง ฉันพาไปหน้าแบบฟอร์มให้ได้ทันที",
        href: "/were-ok/kyt",
        cta: "ไปทำ KYT",
      };
    }

    if (activePrompt === "rank") {
      return {
        text: activeUser
          ? `ตอนนี้คุณอยู่อันดับ ${activeUser.rank} ในทีม ${activeUser.team}${activeTeam ? ` ทีมมี ${activeTeam.points.toLocaleString()} แต้ม` : ""}`
          : "ฉันยังไม่เจออันดับของคุณในข้อมูลปัจจุบัน ลองเปิด Leaderboard เพื่อดูภาพรวมทีม",
        href: "/safety-culture/leaderboard",
        cta: "เปิด Leaderboard",
      };
    }

    if (awarenessRequiredToday && !awarenessDoneToday) {
      return {
        text: "งานสำคัญวันนี้คือทำ Safety Awareness ให้ครบก่อน เริ่มจากหน้าแรกได้เลย ระบบจะช่วยเก็บคะแนน KPI ให้",
        href: "/",
        cta: "ทำ Safety Awareness",
      };
    }

    if (isEventLive) {
      return {
        text: `วันนี้ทำ Awareness แล้ว เยี่ยมเลย ตอนนี้มีกิจกรรม "${safetyCultureEvent.headline}" กำลังจัดอยู่ ไปเก็บแต้มต่อได้`,
        href: "/safety-culture",
        cta: "ดูกิจกรรม",
      };
    }

    return {
      text: "วันนี้พื้นฐานเรียบร้อยแล้ว แนะนำแชร์พฤติกรรมปลอดภัยหรือดูรางวัลที่คะแนนใกล้แลกได้",
      href: "/safety-culture/post",
      cta: "แชร์ Safety",
    };
  }, [
    activePrompt,
    activeTeam,
    activeUser,
    awarenessDoneToday,
    awarenessRequiredToday,
    currentUserPoints,
    isEventLive,
    nextReward,
    redeemableRewards,
    safetyCultureEvent.headline,
  ]);

  useEffect(() => {
    setOpen(false);
    setActivePrompt("today");
  }, [pathname]);

  useEffect(() => {
    const storedPosition = window.localStorage.getItem(ASSISTANT_POSITION_STORAGE_KEY);
    if (storedPosition) {
      try {
        const parsed = JSON.parse(storedPosition) as DragPosition;
        if (Number.isFinite(parsed.right) && Number.isFinite(parsed.bottom)) {
          const nextPosition = clampPosition(parsed);
          lastDragPositionRef.current = nextPosition;
          setPosition(nextPosition);
        }
      } catch {
        window.localStorage.removeItem(ASSISTANT_POSITION_STORAGE_KEY);
      }
    }

    function handleResize() {
      setWindowWidth(window.innerWidth);
      setPosition((current) => {
        if (!current) return current;
        const nextPosition = clampPosition(current);
        lastDragPositionRef.current = nextPosition;
        return nextPosition;
      });
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      mouseMoveCleanupRef.current?.();
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    };
  }, []);

  // ปิดเมื่อกดที่ว่างด้านนอก หรือกด Esc
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (asideRef.current && !asideRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const isDockedLeft = position ? position.right > windowWidth / 2 : false;
  const assistantStyle: CSSProperties | undefined = position
    ? { bottom: position.bottom, right: position.right }
    : undefined;

  function startDrag(clientX: number, clientY: number, rect: DOMRect, pointerId?: number) {
    dragRef.current = {
      pointerId,
      startClientX: clientX,
      startClientY: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      moved: false,
    };
  }

  function moveDrag(clientX: number, clientY: number, width: number, height: number) {
    const drag = dragRef.current;
    if (!drag) return false;

    const distance = Math.hypot(clientX - drag.startClientX, clientY - drag.startClientY);
    if (distance > 4) {
      drag.moved = true;
    }
    if (!drag.moved) return false;

    const nextLeft = clientX - drag.offsetX;
    const nextTop = clientY - drag.offsetY;
    const nextPosition = clampPosition({
      bottom: window.innerHeight - (nextTop + height),
      right: window.innerWidth - (nextLeft + width),
    }, width, height);
    lastDragPositionRef.current = nextPosition;
    setPosition(nextPosition);
    setOpen(false);
    setIsDragging(true);
    return true;
  }

  function finishDrag(width = ASSISTANT_TRIGGER_SIZE, height = ASSISTANT_TRIGGER_SIZE) {
    const drag = dragRef.current;
    if (drag?.moved) {
      suppressClickRef.current = true;
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimerRef.current = null;
      }, DRAG_CLICK_SUPPRESSION_MS);

      const nextPosition = snapPositionToNearestEdge(
        lastDragPositionRef.current ?? position ?? { right: ASSISTANT_EDGE_GAP, bottom: ASSISTANT_EDGE_GAP },
        width,
        height
      );
      lastDragPositionRef.current = nextPosition;
      setPosition(nextPosition);
      window.localStorage.setItem(ASSISTANT_POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
    }
    setIsDragging(false);
    dragRef.current = null;
  }

  function handleTriggerPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    startDrag(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect(), event.pointerId);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTriggerPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (moveDrag(event.clientX, event.clientY, rect.width, rect.height)) {
      event.preventDefault();
    }
  }

  function handleTriggerPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const rect = event.currentTarget.getBoundingClientRect();
    finishDrag(rect.width, rect.height);
  }

  function handleTriggerPointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
  }

  function handleTriggerMouseDown(event: ReactMouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!dragRef.current) {
      startDrag(event.clientX, event.clientY, rect);
    }

    function handleMouseMove(moveEvent: MouseEvent) {
      if (moveDrag(moveEvent.clientX, moveEvent.clientY, rect.width, rect.height)) {
        moveEvent.preventDefault();
      }
    }

    function handleMouseUp() {
      finishDrag(rect.width, rect.height);
      mouseMoveCleanupRef.current?.();
    }

    mouseMoveCleanupRef.current?.();
    mouseMoveCleanupRef.current = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      mouseMoveCleanupRef.current = null;
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleTriggerTouchStart(event: ReactTouchEvent<HTMLButtonElement>) {
    if (dragRef.current) return;
    const touch = event.touches[0];
    if (!touch) return;
    startDrag(touch.clientX, touch.clientY, event.currentTarget.getBoundingClientRect());
  }

  function handleTriggerTouchMove(event: ReactTouchEvent<HTMLButtonElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (moveDrag(touch.clientX, touch.clientY, rect.width, rect.height)) {
      event.preventDefault();
    }
  }

  function handleTriggerTouchEnd(event: ReactTouchEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    finishDrag(rect.width, rect.height);
  }

  function handleTriggerTouchCancel() {
    dragRef.current = null;
    setIsDragging(false);
  }

  function handleTriggerClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setOpen((current) => !current);
  }

  return (
    <aside
      ref={asideRef}
      style={assistantStyle}
      className={cn(
        "floating-safety-assistant fixed bottom-[calc(var(--mobile-bottomnav-h)+14px)] right-3 z-[35] flex flex-col font-sans md:bottom-5 md:right-5",
        position && (isDragging ? "transition-none" : "transition-[right,bottom] duration-200 ease-out"),
        isDockedLeft ? "items-start" : "items-end"
      )}
      aria-label="ผู้ช่วยน้องวางใจ"
    >
      <div
        className={cn(
          "mb-2 flex max-h-[68vh] w-[min(calc(100vw-24px),350px)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(var(--brand-nav-rgb),0.97)] text-white shadow-[0_18px_46px_var(--brand-shadow)] backdrop-blur-xl transition-all duration-200 md:max-h-[min(70vh,560px)] md:w-[352px]",
          isDockedLeft ? "origin-bottom-left" : "origin-bottom-right",
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2 scale-95 opacity-0"
        )}
      >
        <div className="flex items-start gap-2.5 border-b border-white/10 p-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--brand-accent)]">
            <Bot className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-black">น้องวางใจ AI Safety Buddy</p>
            <p className="mt-0.5 text-[10.5px] font-bold leading-relaxed text-white/65">{context.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/65 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            aria-label="ย่อผู้ช่วย"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-2.5">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.08] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-white/70">
              <Trophy className="h-3.5 w-3.5 text-[var(--brand-accent)]" strokeWidth={2.5} />
              คะแนนของฉัน
            </span>
            <span className="text-[15px] font-black text-[var(--brand-accent)]">{currentUserPoints.toLocaleString()}</span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2">
              <Image
                src={mascot(context.action)}
                alt=""
                width={40}
                height={40}
                className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-white/10 object-contain"
              />
              <div className="rounded-2xl rounded-tl-md bg-white/[0.10] px-3 py-2">
                <p className="text-[11.5px] font-black">{context.greeting}</p>
                <p className="mt-0.5 text-[10.5px] font-bold leading-relaxed text-white/68">{context.message}</p>
              </div>
            </div>

            <div className="ml-10 rounded-2xl rounded-tl-md bg-[var(--brand-accent)] px-3 py-2 text-[var(--brand-accent-contrast)]">
              <div className="mb-1 flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-[0.12em] opacity-80">
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.6} />
                Hybrid AI
              </div>
              <p className="text-[11px] font-black leading-relaxed">{botAnswer.text}</p>
              <Link
                href={botAnswer.href}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-[rgba(var(--brand-nav-rgb),0.92)] px-3 py-1.5 text-[10px] font-black text-white shadow-sm transition hover:brightness-110"
              >
                {botAnswer.cta}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.7} />
              </Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {prompts.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePrompt(id)}
                className={cn(
                  "min-h-[42px] rounded-xl border px-2.5 py-2 text-left text-[10px] font-black leading-snug outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]",
                  activePrompt === id
                    ? "border-[var(--brand-accent)] bg-white text-[var(--brand-nav)]"
                    : "border-white/10 bg-white/[0.08] text-white/78 hover:bg-white/[0.14]"
                )}
              >
                <span className="mb-1 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[var(--brand-accent)]" strokeWidth={2.5} />
                  {label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[9.5px] font-bold leading-relaxed text-white/58">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.5} />
            เวอร์ชันนี้เป็นผู้ช่วยแบบ Hybrid ยังไม่ส่งข้อมูลไป AI ภายนอก
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleTriggerClick}
        onPointerDown={handleTriggerPointerDown}
        onPointerMove={handleTriggerPointerMove}
        onPointerUp={handleTriggerPointerUp}
        onPointerCancel={handleTriggerPointerCancel}
        onMouseDown={handleTriggerMouseDown}
        onTouchStart={handleTriggerTouchStart}
        onTouchMove={handleTriggerTouchMove}
        onTouchEnd={handleTriggerTouchEnd}
        onTouchCancel={handleTriggerTouchCancel}
        className={cn(
          "floating-safety-assistant-trigger group relative flex h-[56px] w-[56px] touch-none select-none items-center justify-center rounded-full border-2 border-white/70 bg-[rgba(var(--brand-nav-rgb),0.90)] shadow-[0_14px_34px_var(--brand-shadow)] outline-none backdrop-blur-lg transition-transform [-webkit-user-select:none] [-webkit-touch-callout:none] active:scale-95 hover:scale-105 focus-visible:ring-3 focus-visible:ring-[var(--brand-accent)] md:h-[64px] md:w-[64px]",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          open && "scale-105"
        )}
        aria-expanded={open}
        aria-label={open ? "ย่อผู้ช่วยน้องวางใจ" : "เปิดผู้ช่วยน้องวางใจ"}
        title="ลากเพื่อย้ายตำแหน่ง หรือกดเพื่อเปิดผู้ช่วย"
      >
        <span className="absolute -left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--brand-nav)] bg-[var(--brand-accent)] text-[9px] font-black text-[var(--brand-accent-contrast)]">
          {context.urgent ? "!" : "AI"}
        </span>
        <Image
          src={mascot(context.action)}
          alt="น้องวางใจ AI Safety Buddy"
          width={96}
          height={96}
          className="floating-safety-assistant-image h-[66px] w-[66px] max-w-none object-contain md:h-[76px] md:w-[76px]"
        />
      </button>
    </aside>
  );
}
