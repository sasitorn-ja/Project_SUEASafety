// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Heart,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import TigerMascot from "@/components/TigerMascot";
const sueaShield = "/images/mascots/suea-shield.png";
const sueaThumbsUp = "/images/mascots/suea-thumbs-up.png";

const T = {
  background: "#f1ecdf",
  background2: "#ece5d2",
  foreground: "#0e0f12",
  foreground2: "#33312c",
  foreground3: "#767269",
  card: "#ffffff",
  surface2: "#f5eedf",
  primary: "#ffc400",
  primaryForeground: "#0e0f12",
  primarySoft: "#fff4cf",
  ok: "#1f7a55",
  info: "#234c8e",
  warning: "#c97a00",
  border: "rgba(14,15,18,0.10)",
  borderStrong: "#0e0f12",
  radius: "14px",
};

const categories = [
  {
    id: "A",
    title: "ตรวจ Safety Audit / Caring",
    subtitle: "เลือกหมวดกิจกรรม >> Check-in สถานที่ >> เลือกวัน >> Linewalk หรือ Safety Contact",
    points: 10,
    steps: [
      { name: "เลือกหมวดกิจกรรม", desc: "เลือกประเภทสถานที่ เช่น โรงงาน, สำนักงาน หรือ Site งาน" },
      { name: "Check-in สถานที่", desc: "ปักหมุดเลือกจุดที่ต้องการตรวจประเมิน" },
      { name: "เลือกวัน", desc: "ระบุวันที่สำหรับการเข้าตรวจความปลอดภัย" },
      { name: "Linewalk หรือ Safety Contact", desc: "ทำข้อประเมิน Linewalk หรือบันทึกข้อมูล Safety Contact" },
    ],
  },
];



const featureTiles = [
  { label: "บันทึกกิจกรรม", icon: ClipboardCheck, tone: T.ok },
  { label: "แชร์รูปปลอดภัย", icon: ImagePlus, tone: T.info },
  { label: "รับหัวใจ", icon: Heart, tone: "#b7352d" },
  { label: "สะสมแต้ม", icon: Trophy, tone: T.warning },
];

function ClipboardCheck() {
  return null;
}

function ImagePlus() {
  return null;
}

function Badge({ icon: Icon, children, dark = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        minHeight: 30,
        padding: "5px 11px",
        borderRadius: 999,
        border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : T.border}`,
        background: dark ? "rgba(255,255,255,0.09)" : T.card,
        color: dark ? "#fff7df" : T.foreground2,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={14} strokeWidth={2.4} />
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: T.foreground3,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            margin: "4px 0 0",
            color: T.foreground,
            fontSize: 22,
            lineHeight: 1.25,
            fontWeight: 800,
          }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

function Timeline({ steps, variant }) {
  const isAudit = variant === "A";
  const accent = isAudit ? T.primary : T.foreground;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {steps.map((step, index) => (
        <div
          key={step.name}
          style={{
            display: "grid",
            gridTemplateColumns: "30px minmax(0,1fr)",
            gap: 10,
            alignItems: "start",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              color: isAudit ? T.foreground : T.card,
              background: accent,
              fontSize: 12,
              fontWeight: 900,
              boxShadow: isAudit ? "0 8px 16px rgba(255,196,0,0.22)" : "none",
            }}
          >
            {index + 1}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: T.foreground, fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>
              {step.name}
            </div>
            <div style={{ color: T.foreground3, fontSize: 12.5, lineHeight: 1.55, marginTop: 2 }}>
              {step.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryCard({ cat, isOpen, onToggle, onStart }) {
  const isAudit = cat.id === "A";
  const Icon = isAudit ? ShieldCheck : UsersRound;

  return (
    <article
      style={{
        background: T.card,
        border: `1px solid ${isOpen ? (isAudit ? "rgba(201,122,0,0.42)" : "rgba(14,15,18,0.22)") : T.border}`,
        borderRadius: T.radius,
        boxShadow: isOpen
          ? "0 16px 34px rgba(34,25,11,0.10)"
          : "0 8px 22px rgba(34,25,11,0.05)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          border: 0,
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
          fontFamily: "inherit",
          color: "inherit",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "52px minmax(0,1fr) auto",
            gap: 14,
            alignItems: "start",
            padding: 18,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: isAudit ? T.primarySoft : T.surface2,
              color: isAudit ? T.warning : T.foreground,
              border: `1px solid ${isAudit ? "rgba(255,196,0,0.38)" : T.border}`,
            }}
          >
            <Icon size={26} strokeWidth={2.2} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: T.foreground,
                  fontSize: 17,
                  lineHeight: 1.25,
                  fontWeight: 900,
                }}
              >
                {cat.title}
              </h3>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: isAudit ? T.primary : T.foreground,
                  color: isAudit ? T.foreground : T.card,
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                <Star size={11} fill="currentColor" strokeWidth={1.5} />
                +{cat.points} pts
              </span>
            </div>
            <p
              style={{
                margin: "7px 0 0",
                color: T.foreground3,
                fontSize: 13.5,
                lineHeight: 1.55,
              }}
            >
              {cat.subtitle}
            </p>
          </div>

          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: isOpen ? T.primary : T.surface2,
              color: T.foreground,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 180ms ease, background 180ms ease",
            }}
          >
            <ChevronDown size={18} strokeWidth={2.6} />
          </div>
        </div>
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 260ms ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              borderTop: `1px solid ${T.border}`,
              background: isAudit
                ? "linear-gradient(180deg, #fff8dc 0%, #f5eedf 100%)"
                : "linear-gradient(180deg, #f8f2e7 0%, #eee6d6 100%)",
              padding: 18,
            }}
          >
            <Timeline steps={cat.steps} variant={cat.id} />
            <button
              type="button"
              onClick={onStart}
              style={{
                width: "100%",
                marginTop: 18,
                minHeight: 44,
                border: `1px solid ${isAudit ? "rgba(201,122,0,0.22)" : T.foreground}`,
                borderRadius: 12,
                background: isAudit ? T.primary : T.foreground,
                color: isAudit ? T.primaryForeground : T.card,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: isAudit ? "0 12px 18px rgba(255,196,0,0.22)" : "none",
              }}
            >
              เริ่มกิจกรรม
              <ArrowRight size={17} strokeWidth={2.8} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}



function Hero({ isDesktop }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: isDesktop ? 18 : 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(105deg, rgba(58,28,5,0.98) 0%, rgba(84,47,12,0.95) 48%, rgba(39,24,10,0.96) 100%)",
        color: "#fff8e6",
        minHeight: isDesktop ? 220 : 280,
        boxShadow: "0 20px 42px rgba(42,26,9,0.16)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(255,196,0,0.16) 0 1px, transparent 1px 100%), linear-gradient(0deg, rgba(255,196,0,0.10) 0 1px, transparent 1px 100%)",
          backgroundSize: "44px 44px",
          opacity: 0.22,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 12,
          background:
            "repeating-linear-gradient(135deg, #ffc400 0 22px, #0e0f12 22px 44px)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: isDesktop ? "minmax(0,1fr) 250px" : "1fr",
          gap: isDesktop ? 24 : 12,
          alignItems: "center",
          minHeight: "inherit",
          padding: isDesktop ? "28px 34px 34px" : "22px 18px 100px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: isDesktop ? 44 : 34,
              lineHeight: 1.05,
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            Safety <span style={{ color: T.primary }}>Effort</span>
          </h1>
          <p
            style={{
              maxWidth: 650,
              margin: "12px 0 0",
              color: "rgba(255,248,230,0.86)",
              fontSize: isDesktop ? 15.5 : 14,
              lineHeight: 1.75,
              fontWeight: 600,
            }}
          >
            ปักหมุดเลือกพื้นที่และบันทึกรายงานความปลอดภัย Linewalk หรือบันทึกข้อมูล Safety Contact เพื่อสร้างสภาพแวดล้อมการทำงานร่วมกันที่ปลอดภัยยิ่งขึ้น
          </p>
        </div>

        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: isDesktop ? "relative" : "absolute",
            right: isDesktop ? "auto" : 12,
            bottom: isDesktop ? "auto" : 8,
            justifySelf: "center",
            alignSelf: "end",
            width: isDesktop ? 230 : 150,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <img
            src={isHovered ? sueaThumbsUp : sueaShield}
            alt="SUEA Safety Mascot"
            style={{
              width: isDesktop ? "185px" : "120px",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 14px 24px rgba(0,0,0,0.22))",
              transition: "transform 0.2s ease",
            }}
            className={isHovered ? "cat-anim-bounce" : "cat-anim-float"}
          />
        </div>
      </div>
    </section>
  );
}

export default function Category() {
  const navigate = useNavigate();
  const [open, setOpen] = useState("A");
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDesktop = width >= 900;
  const px = width >= 768 ? 32 : 16;

  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "linear-gradient(180deg, #efe6d4 0%, #f1ecdf 170px, #f1ecdf 100%)",
        fontFamily: "'Prompt','Sarabun','TH Sarabun New',Helvetica,sans-serif",
        color: T.foreground,
        padding: `18px ${px}px ${width >= 768 ? 32 : 24}px`,
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        <Hero isDesktop={width >= 768} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "minmax(0, 1.6fr) minmax(320px, 1fr)" : "1fr",
            gap: 20,
            alignItems: "start",
            width: "100%",
          }}
        >
          {/* Left Column: Categories */}
          <section style={{ display: "grid", gap: 14, minWidth: 0 }}>
            <SectionTitle
              eyebrow="Choose activity"
              title="เลือกหมวดกิจกรรม"
              right={
                <Badge icon={ShieldCheck}>
                  {categories.length} หมวด
                </Badge>
              }
            />

            <div style={{ display: "grid", gap: 14 }}>
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  isOpen={open === cat.id}
                  onToggle={() => setOpen((prev) => (prev === cat.id ? null : cat.id))}
                  onStart={() => navigate(cat.id === "A" ? "/activity" : "/create-post")}
                />
              ))}
            </div>
          </section>

          {/* Right Column: Safety Stats & Alerts Dashboard */}
          <aside
            style={{
              display: "grid",
              gap: 16,
              position: isDesktop ? "sticky" : "static",
              top: 86,
            }}
          >
            {/* Safety Stats Card */}
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: T.radius,
                padding: 18,
                boxShadow: "0 8px 22px rgba(34,25,11,0.05)",
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>
                <Trophy size={18} color={T.primary} strokeWidth={2.4} />
                <strong style={{ color: T.foreground, fontSize: 15 }}>สถานะความปลอดภัย (Dashboard)</strong>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.foreground2, fontWeight: 600 }}>ชั่วโมงทำงานปลอดภัยสะสม:</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.ok }}>1,250,480 ชม.</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.foreground2, fontWeight: 600 }}>การตรวจเดือนนี้สำเร็จแล้ว:</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.foreground }}>48 ครั้ง</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.foreground2, fontWeight: 600 }}>ระดับความเสี่ยงภาพรวม:</span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: "#1f7a55",
                      background: "#eefaf4",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    ต่ำมาก (Class A)
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Alerts / Tips Card */}
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: T.radius,
                padding: 18,
                boxShadow: "0 8px 22px rgba(34,25,11,0.05)",
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>
                <Lightbulb size={18} color={T.warning} strokeWidth={2.4} />
                <strong style={{ color: T.foreground, fontSize: 15 }}>ข้อเสนอแนะ & แจ้งเตือนภัย</strong>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    color: T.foreground2,
                    lineHeight: 1.5,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "#fff9eb",
                    borderLeft: `3px solid ${T.primary}`,
                  }}
                >
                  <strong>ระวังลมกระโชกแรง:</strong> พยากรณ์อากาศแจ้งเตือนลมพัดแรงเป็นระยะ ขอให้จัดเก็บอุปกรณ์ภายนอกอาคารให้มิดชิด
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: T.foreground2,
                    lineHeight: 1.5,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "#f0f6ff",
                    borderLeft: `3px solid #3b82f6`,
                  }}
                >
                  <strong>การดูแล PPE:</strong> หมวกนิรภัยที่ชำรุดหรือร้าวควรส่งเคลมทันทีเพื่อความปลอดภัยเต็มประสิทธิภาพ
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: T.foreground3,
            fontSize: 12,
            fontWeight: 800,
            paddingTop: 2,
          }}
        >
          <MessageCircle size={14} strokeWidth={2.2} />
          ร่วมสร้างความปลอดภัยผ่านการลงมือทำเล็ก ๆ ทุกวัน
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck

