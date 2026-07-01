"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ImageIcon,
  Loader2,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { type MascotAction, useAppTheme } from "@/providers/theme-provider";
import { useAppState } from "@/providers/app-providers";

type ChatRole = "user" | "assistant";
type ChatMessage = { id: string; role: ChatRole; content: string; error?: boolean; image?: string };
type AssistantApiResponse = { ok: boolean; data?: { reply?: string }; error?: string };
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
const ASSISTANT_NAME = "พี่เซฟ เซฟตี้ แคร์ริ่ง";

function getAssistantErrorMessage(status?: number, error?: string) {
  if (status === 401) {
    return "เซสชันหมดอายุหรือยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่แล้วลองถามพี่เซฟอีกครั้งนะ";
  }
  if (status === 403) {
    return "บัญชีนี้ยังไม่มีสิทธิ์ใช้งานผู้ช่วย AI กรุณาติดต่อผู้ดูแลระบบนะ";
  }
  if (status === 503 || error?.includes("OPENROUTER_API_KEY")) {
    return "ระบบ AI ยังไม่ได้ตั้งค่า OpenRouter ในโปรดักชัน กรุณาตรวจสอบ OPENROUTER_API_KEY แล้วลองใหม่อีกครั้งนะ";
  }
  if (error?.startsWith("openrouter_error")) {
    return "ตอนนี้ OpenRouter ตอบกลับไม่สำเร็จ กรุณาตรวจสอบเครดิต/โมเดล หรือรอสักครู่แล้วลองใหม่อีกครั้งนะ";
  }
  return "ขออภัย ตอนนี้พี่เซฟเชื่อมต่อ AI ไม่ได้ชั่วคราว ลองใหม่อีกครั้งนะ";
}

type AssistantContext = {
  action: MascotAction;
  greeting: string;
  message: string;
  urgent: boolean;
};

function getAssistantContext(pathname: string, awarenessDoneToday: boolean): AssistantContext {
  if (pathname.startsWith("/safety-culture/rewards")) {
    return { action: "happy", greeting: "เลือกรางวัลกันไหม?", message: "ฉันช่วยดูว่า Coin ตอนนี้แลกอะไรได้บ้าง", urgent: false };
  }
  if (pathname.startsWith("/safety-culture/leaderboard")) {
    return { action: "salute", greeting: "มาดูอันดับกัน", message: "ฉันสรุปอันดับและ Coin ที่ควรไล่ต่อให้ได้", urgent: false };
  }
  if (pathname.startsWith("/safety-culture/post")) {
    return { action: "clipboard", greeting: "มีเรื่องดี ๆ มาแชร์ไหม?", message: "ฉันช่วยชวนคิดหัวข้อโพสต์ Safety Culture ได้", urgent: false };
  }
  if (pathname.startsWith("/safety-culture/admin-")) {
    return { action: "radio", greeting: "พร้อมช่วยจัดการ", message: "ตรวจข้อมูลให้เรียบร้อยก่อนบันทึกนะ", urgent: false };
  }
  if (pathname.startsWith("/safety-culture")) {
    return { action: "announce", greeting: "สวัสดีจาก Safety Culture", message: "ฉันช่วยแนะนำกิจกรรมและ Coin ที่น่าสนใจได้", urgent: false };
  }
  if (!awarenessDoneToday) {
    return { action: "flashlight", greeting: "อย่าลืม Safety Awareness", message: "วันนี้ยังมีงาน Safety ที่ควรทำให้ครบก่อนเริ่มงาน", urgent: true };
  }
  return { action: "happy", greeting: "วันนี้ทำได้ดีมาก", message: "ฉันช่วยแนะนำงานถัดไปเพื่อสะสม Coin ต่อได้", urgent: false };
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
    personalRankings,
  } = useAppState();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DragPosition | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const asideRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastDragPositionRef = useRef<DragPosition | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const context = useMemo(
    () => getAssistantContext(pathname, awarenessDoneToday),
    [pathname, awarenessDoneToday]
  );
  const activeUser = personalRankings.find((person) => person.active);

  const greeting = useMemo<ChatMessage>(
    () => ({
      id: "greeting",
      role: "assistant",
      content: `${context.greeting} ${context.message} ลองพิมพ์คำถามด้านความปลอดภัยมาคุยกับพี่เซฟได้เลยนะ`,
    }),
    [context.greeting, context.message]
  );

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const history = [...chatMessages, userMessage];
    setChatMessages(history);
    setChatInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          context: {
            page: pathname,
            points: currentUserPoints,
            awarenessDoneToday,
            rank: activeUser?.rank ?? null,
            team: activeUser?.team ?? null,
          },
        }),
      });
      const payload = (await res.json().catch(() => null)) as AssistantApiResponse | null;

      if (!res.ok || !payload?.ok || !payload.data?.reply) {
        throw new Error(getAssistantErrorMessage(res.status, payload?.error || `request_failed_${res.status}`));
      }

      setChatMessages((current) => [
        ...current,
        { id: `a-${Date.now()}`, role: "assistant", content: payload.data!.reply!.trim() },
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : getAssistantErrorMessage(),
          error: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Downscale + compress an image to keep the AI request small (lower cost & faster).
  const downscaleImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_failed"));
      reader.onload = () => {
        const img = new window.Image();
        img.onerror = () => reject(new Error("decode_failed"));
        img.onload = () => {
          const maxSide = 1024;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("no_canvas"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const analyzeSafetyPhoto = async (file: File) => {
    if (isSending) return;
    setIsSending(true);
    let dataUrl: string;
    try {
      dataUrl = await downscaleImage(file);
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "ขออภัย อ่านรูปไม่สำเร็จ ลองเลือกรูปใหม่อีกครั้งนะ",
          error: true,
        },
      ]);
      setIsSending(false);
      return;
    }

    setChatMessages((current) => [
      ...current,
      { id: `ui-${Date.now()}`, role: "user", content: "ตรวจรูปด้านความปลอดภัย", image: dataUrl },
    ]);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ppe",
          image: dataUrl,
          context: { page: pathname },
        }),
      });
      const payload = (await res.json().catch(() => null)) as AssistantApiResponse | null;

      if (!res.ok || !payload?.ok || !payload.data?.reply) {
        throw new Error(getAssistantErrorMessage(res.status, payload?.error || `request_failed_${res.status}`));
      }

      setChatMessages((current) => [
        ...current,
        { id: `a-${Date.now()}`, role: "assistant", content: payload.data!.reply!.trim() },
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : getAssistantErrorMessage(),
          error: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void analyzeSafetyPhoto(file);
  };

  useEffect(() => {
    const node = chatScrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chatMessages, isSending, open]);

  useEffect(() => {
    setOpen(false);
    setChatMessages([]);
    setChatInput("");
  }, [pathname]);

  useEffect(() => {
    const storedPosition = window.localStorage.getItem(ASSISTANT_POSITION_STORAGE_KEY);
    if (storedPosition) {
      try {
        const parsed = JSON.parse(storedPosition) as DragPosition;
        if (Number.isFinite(parsed.right) && Number.isFinite(parsed.bottom)) {
          // Always re-dock to the nearest edge so a position saved on a
          // different screen width can never end up stranded in the middle.
          const nextPosition = snapPositionToNearestEdge(parsed);
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
        const nextPosition = snapPositionToNearestEdge(current);
        lastDragPositionRef.current = nextPosition;
        return nextPosition;
      });
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const updateKeyboardOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(offset > 80 ? Math.round(offset) : 0);
    };

    updateKeyboardOffset();
    viewport.addEventListener("resize", updateKeyboardOffset);
    viewport.addEventListener("scroll", updateKeyboardOffset);
    return () => {
      viewport.removeEventListener("resize", updateKeyboardOffset);
      viewport.removeEventListener("scroll", updateKeyboardOffset);
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
  const panelStyle: CSSProperties = {
    bottom: isInputFocused && keyboardOffset > 0
      ? `calc(${keyboardOffset}px + env(safe-area-inset-bottom) + 10px)`
      : undefined,
  };

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
    moveDrag(event.clientX, event.clientY, rect.width, rect.height);
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
        "floating-safety-assistant fixed bottom-[calc(var(--mobile-bottomnav-h)+14px)] right-3 z-[60] flex flex-col font-sans lg:bottom-5 lg:right-5",
        position && (isDragging ? "transition-none" : "transition-[right,bottom] duration-200 ease-out"),
        isDockedLeft ? "items-start" : "items-end"
      )}
      aria-label="ผู้ช่วยพี่เซฟ เซฟตี้ แคร์ริ่ง"
    >
      <div
        style={panelStyle}
        className={cn(
          "fixed bottom-[calc(var(--mobile-bottomnav-h)+84px)] flex max-h-[min(68vh,560px)] w-[min(calc(100vw-24px),350px)] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[linear-gradient(145deg,#E3F2FD_0%,#FFFFFF_42%,#E3F2FD_100%)] text-[#0D47A1] shadow-[0_18px_46px_rgba(13,71,161,0.18)] backdrop-blur-xl transition-all duration-200 md:bottom-24 md:max-h-[min(70vh,560px)] md:w-[352px]",
          isInputFocused && "max-h-[min(58vh,430px)]",
          isDockedLeft ? "left-3 origin-bottom-left" : "right-3 origin-bottom-right",
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2 scale-95 opacity-0"
        )}
      >
        {/* กรอบบน: โชว์เต็มตอนยังไม่เริ่มคุย / ยุบเป็นแถบเล็กเมื่อเริ่มสนทนาแล้ว
            (chatMessages ถูกรีเซ็ตเมื่อ remount เช่น โหลดเว็บใหม่ → กลับมาโชว์เต็มเหมือนเดิม) */}
        {chatMessages.length === 0 ? (
          <div className="relative overflow-hidden px-3 pb-2 pt-2.5">
            <div className="pointer-events-none absolute -right-8 top-4 h-24 w-24 rounded-full border-[14px] border-[#2196F3]/12" />
            <ShieldCheck className="pointer-events-none absolute right-5 top-9 h-12 w-12 text-[#0D47A1]/10" strokeWidth={1.6} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#2196F3] text-white outline-none shadow-[0_6px_14px_rgba(33,150,243,0.22)] transition hover:bg-[#0D47A1] focus-visible:ring-2 focus-visible:ring-[#2196F3]"
              aria-label="ปิดผู้ช่วย"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>

            <div className="relative grid grid-cols-[92px_minmax(0,1fr)] items-center gap-2 pr-7">
              <div className="relative h-[100px]">
                <Image
                  src={mascot("idea2")}
                  alt={ASSISTANT_NAME}
                  width={200}
                  height={250}
                  className="mascot-motion mascot-motion-compact absolute -left-5 bottom-[-14px] h-[148px] w-[118px] max-w-none object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.24)]"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-black leading-tight text-[#0D47A1]">
                  {ASSISTANT_NAME}
                </p>
                <p className="mt-0.5 text-[11px] font-bold leading-snug text-[#60748C]">
                  ผู้ช่วยแนะนำงานด้านความปลอดภัย
                </p>
              </div>
            </div>

            <div className="relative mt-2 border-t border-[#E2E8F0] px-0.5 pt-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[12px] font-black text-[#0D47A1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/icons/STCoin.png" alt="Coin" className="h-4.5 w-4.5 object-contain" />
                  Coin ของฉัน
                </span>
                <span className="text-[17px] font-black leading-none text-[#2196F3]">
                  {currentUserPoints.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-2.5 px-3 py-2.5">
            <Image
              src="/images/mascots/wangjai/20.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 flex-shrink-0 rounded-full bg-[#eaf4ff] object-cover object-[50%_38%] p-0.5 ring-1 ring-white/20"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-black leading-tight text-[#0D47A1]">
                {ASSISTANT_NAME}
              </p>
              <p className="flex items-center gap-1 text-[10px] font-bold leading-tight text-[#60748C]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/icons/STCoin.png" alt="Coin" className="h-3 w-3 object-contain" />
                {currentUserPoints.toLocaleString()} Coin
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2196F3] text-white outline-none shadow-[0_6px_14px_rgba(33,150,243,0.22)] transition hover:bg-[#0D47A1] focus-visible:ring-2 focus-visible:ring-[#2196F3]"
              aria-label="ปิดผู้ช่วย"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        )}

        <div className="mx-2.5 flex min-h-0 flex-1 flex-col rounded-t-2xl border border-[#E2E8F0] bg-[#E3F2FD] px-2.5 pb-2.5 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <div ref={chatScrollRef} className="min-h-[96px] flex-1 space-y-2.5 overflow-y-auto pr-1">
          {[greeting, ...chatMessages].map((message) =>
            message.role === "assistant" ? (
              <div key={message.id} className="flex items-start gap-2">
                <Image
                  src="/images/mascots/wangjai/20.png"
                  alt=""
                  width={40}
                  height={40}
                  className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-[#eaf4ff] object-cover object-[50%_38%] p-0.5 ring-1 ring-white/20"
                />
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl rounded-tl-md px-3 py-2 text-[12px] font-bold leading-relaxed",
                    message.error ? "bg-[#EF4444] text-white" : "bg-white text-[#0D47A1] shadow-[0_8px_18px_rgba(13,71,161,0.08)]"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%] overflow-hidden rounded-2xl rounded-tr-md bg-[#2196F3] text-[12px] font-bold leading-relaxed text-white shadow-[0_8px_18px_rgba(33,150,243,0.18)]">
                  {message.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={message.image} alt="รูปที่ส่งให้ตรวจ" className="max-h-44 w-full object-cover" />
                  ) : null}
                  <p className="whitespace-pre-wrap px-3 py-2">{message.content}</p>
                </div>
              </div>
            )
          )}
          {isSending ? (
            <div className="flex items-center gap-2 pl-10 text-[10px] font-bold text-[#60748C]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2196F3]" strokeWidth={2.5} />
              พี่เซฟกำลังพิมพ์...
            </div>
          ) : null}
        </div>

        <div className="pt-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(chatInput);
            }}
            className="flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-1.5 py-1.5 shadow-[0_8px_22px_rgba(13,71,161,0.12)]"
          >
            <button
              type="button"
              disabled={isSending}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#E3F2FD] text-[#0D47A1] outline-none transition hover:bg-[#D7EAFE] focus-visible:ring-2 focus-visible:ring-[#2196F3] disabled:opacity-50"
              aria-label="แนบรูปเพื่อตรวจ PPE"
            >
              <ImageIcon className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <input
              ref={inputRef}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="ถามเรื่องความปลอดภัย..."
              disabled={isSending}
              className="min-w-0 flex-1 !border-0 !bg-transparent px-2 py-2 text-[16px] font-bold leading-none text-[#0D47A1] !shadow-none outline-none placeholder:text-[#8CA4BF] focus:!border-0 focus:!shadow-none disabled:opacity-60 md:text-[13px]"
            />
            <button
              type="submit"
              disabled={isSending || !chatInput.trim()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#2196F3] text-white outline-none transition hover:bg-[#0D47A1] focus-visible:ring-2 focus-visible:ring-[#2196F3] disabled:opacity-40"
              aria-label="ส่งข้อความ"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
              ) : (
                <Send className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 text-[9px] font-bold leading-relaxed text-[#60748C]">
            <ShieldCheck className="h-3 w-3 flex-shrink-0 text-[#2196F3]" strokeWidth={2.4} />
            พี่เซฟ AI อาจมีข้อผิดพลาด โปรดตรวจสอบข้อมูลสำคัญก่อนดำเนินการ
          </p>
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
        className={cn(
          "floating-safety-assistant-trigger group relative flex h-[56px] w-[56px] touch-none select-none items-center justify-center rounded-full border-2 border-white/70 bg-[rgba(var(--brand-nav-rgb),0.90)] shadow-[0_14px_34px_var(--brand-shadow)] outline-none backdrop-blur-lg transition-all [-webkit-user-select:none] [-webkit-touch-callout:none] active:scale-95 hover:scale-105 focus-visible:ring-3 focus-visible:ring-[var(--brand-accent)] md:h-[64px] md:w-[64px]",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          open && "pointer-events-none scale-90 opacity-0"
        )}
        aria-expanded={open}
        aria-label={open ? "ย่อผู้ช่วยพี่เซฟ" : "เปิดผู้ช่วยพี่เซฟ"}
        title="ลากเพื่อย้ายตำแหน่ง หรือกดเพื่อเปิดผู้ช่วย"
      >
        <span className="absolute -left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--brand-nav)] bg-[var(--brand-accent)] text-[9px] font-black text-[var(--brand-accent-contrast)]">
          {context.urgent ? "!" : "AI"}
        </span>
        <Image
          src="/images/mascots/wangjai/25.png"
          alt={ASSISTANT_NAME}
          width={96}
          height={96}
          className="floating-safety-assistant-image h-[66px] w-[66px] max-w-none object-contain md:h-[76px] md:w-[76px]"
        />
      </button>
    </aside>
  );
}
