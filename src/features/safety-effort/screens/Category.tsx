"use client";

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

const HERO_MASCOT = "/images/mascots/wangjai/scenes/safety-effort-user-mascot.png";

const steps = [
  {
    title: "เลือกหมวดกิจกรรม",
    description: "เลือกประเภทสถานที่ เช่น โรงงาน, สำนักงาน หรือ Site งาน",
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

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero} aria-labelledby="safety-effort-title">
          <div className={styles.heroGrid} />
          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <h1 id="safety-effort-title">
                <ShieldCheck aria-hidden="true" />
                <span>Safety <strong>Effort</strong></span>
              </h1>
              <p>
                ปักหมุดเลือกพื้นที่และบันทึกรายงานความปลอดภัย Linewalk<br className={styles.desktopBreak} />
                หรือบันทึกข้อมูล Safety Contact เพื่อสร้างสภาพแวดล้อม<br className={styles.desktopBreak} />
                การทำงานร่วมกันที่ปลอดภัยยิ่งขึ้น
              </p>
            </div>
            <img className={`${styles.heroMascot} mascot-motion mascot-motion-hero`} src={HERO_MASCOT} alt="น้องวางใจขยิบตาถือคลิปบอร์ด Safety First" />
          </div>
          <div className={styles.hazardStripe} />
        </section>

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
                  <strong>จำนวนการตรวจเดือนนี้</strong>
                  <b>9 ครั้ง</b>
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
