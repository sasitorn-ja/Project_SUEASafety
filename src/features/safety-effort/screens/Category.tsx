"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/app-navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FolderOpen,
  HardHat,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Trophy,
  UsersRound,
} from "lucide-react";
import styles from "./safety-effort-category.module.css";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";

const HERO_MASCOT = "/images/safety-effort-mascot.png";

type MonthlyStats = {
  count: number | null;
  loading: boolean;
};

const steps = [
  {
    title: "เลือกหมวดกิจกรรม",
    description: "เลือกกิจกรรม Linewalk หรือ Safety Contact",
    icon: FolderOpen,
  },
  {
    title: "Check-in สถานที่",
    description: "ปักหมุดเลือกจุดที่ต้องการตรวจประเมิน",
    icon: MapPin,
  },
  {
    title: "เลือกวัน",
    description: "ระบุวันที่สำหรับการเข้าตรวจความปลอดภัย",
    icon: CalendarDays,
  },
  {
    title: "Linewalk หรือ Safety Contact",
    description: "ทำข้อประเมิน Linewalk หรือบันทึกข้อมูล Safety Contact",
    icon: UsersRound,
  },
] as const;

export default function Category() {
  const navigate = useNavigate();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ count: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}`;

    setMonthlyStats((current) => ({ ...current, loading: true }));
    fetch(`/api/safety-effort/submissions/me?from=${from}&to=${to}&pageSize=500`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        const countedItems = items.filter((item) => {
          const activityType = String(item?.activityType || item?.activity_type || "").toUpperCase();
          return activityType === "LINE_WALK" || activityType === "SAFETY_CONTACT";
        });
        const total = countedItems.length;
        setMonthlyStats({ count: total, loading: false });
      })
      .catch(() => {
        if (!cancelled) setMonthlyStats({ count: 0, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className="mb-3">
          <SafetyCultureHero
            eyebrow="SAFETY EFFORT"
            title={<>Safety Effort</>}
            description="ตรวจ Linewalk และบันทึก Safety Contact เพื่อสร้างสภาพแวดล้อมการทำงานที่ปลอดภัยยิ่งขึ้น"
            mascotSrc={HERO_MASCOT}
            mascotAlt="น้องวางใจขยิบตาถือคลิปบอร์ด Safety First"
            mascotAction="happy"
            variant="community"
            backgroundImage="/images/safety-effort-hero.png"
            backgroundOverlay="linear-gradient(90deg, rgba(2, 26, 66, .82) 0%, rgba(3, 33, 78, .5) 34%, rgba(3, 33, 78, .16) 56%, rgba(3, 33, 78, 0) 70%)"
          />
        </div>

        <div className={styles.contentGrid}>
          <main className={styles.activityColumn}>
            <article className={styles.activityCard}>
              <div className={styles.activityHeader}>
                <span className={styles.activityIcon}><ShieldCheck /></span>
                <div>
                  <div className={styles.activityTitleRow}>
                    <h3>ตรวจ Linewalk / Safety Contact</h3>
                    <span className={styles.points}>★ +10 pts</span>
                  </div>
                  <p>เลือกหมวดกิจกรรม &gt;&gt; Check-in สถานที่ &gt;&gt; เลือกวัน &gt;&gt; Linewalk หรือ Safety Contact</p>
                </div>
              </div>

              <ol className={styles.timeline}>
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <span className={styles.stepIcon}><Icon /></span>
                      <div>
                        <h4>{step.title}</h4>
                        <p>{step.description}</p>
                      </div>
                      {index < steps.length - 1 && <ChevronRight className={styles.stepArrow} aria-hidden="true" />}
                    </li>
                  );
                })}
              </ol>

              <button className={styles.startButton} type="button" onClick={() => navigate("/activity")}>
                เริ่มกิจกรรม <ArrowRight />
              </button>
            </article>
          </main>

          <aside className={styles.sideColumn}>
            <section className={styles.infoCard}>
              <header>
                <Trophy />
                <h2>สถิติ Safety Effort ของคุณ</h2>
                <ChevronRight />
              </header>
              <div className={styles.statusRows}>
                <div>
                  <span className={styles.rowIcon}><ClipboardCheck /></span>
                  <strong>จำนวน Line Walk / Safety Contact เดือนนี้</strong>
                  <b>{monthlyStats.loading ? "..." : monthlyStats.count?.toLocaleString("th-TH") ?? "0"} ครั้ง</b>
                </div>
                <div>
                  <span className={styles.rowIcon}><ShieldCheck /></span>
                  <strong>ระดับความเสี่ยงภาพรวม:</strong>
                  <b className={styles.lowRisk}>ต่ำมาก</b>
                </div>
              </div>
            </section>

            <section className={styles.infoCard}>
              <header>
                <Bell />
                <h2>ข้อเสนอแนะ &amp; แจ้งเตือนภัย</h2>
                <ChevronRight />
              </header>
              <div className={styles.alertRows}>
                <div>
                  <span className={styles.alertIcon}><TriangleAlert /></span>
                  <p><strong>ระวังลมกระโชกแรง:</strong> พยากรณ์อากาศแจ้งเตือนลมพัดแรงเป็นระยะ ขอให้จัดเก็บอุปกรณ์ภายนอกอาคารให้มิดชิด</p>
                </div>
                <div>
                  <span className={styles.alertIcon}><HardHat /></span>
                  <p><strong>การดูแล PPE:</strong> หมวกนิรภัยที่ชำรุดหรือร้าวควรส่งเคลมทันทีเพื่อความปลอดภัยเต็มประสิทธิภาพ</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
