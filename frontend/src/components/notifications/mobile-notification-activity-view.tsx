"use client";

import { ChevronLeft, CircleDollarSign, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type SafetyCultureFeedEvent } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";

function getActivityStatusMeta(status: SafetyCultureFeedEvent["status"]) {
  return status === "open"
    ? {
        label: "เปิดกิจกรรม",
        iconClass: "text-[#18b989]",
        note: "กิจกรรมนี้ยังเปิดรับการมีส่วนร่วม",
      }
    : {
        label: "ปิดกิจกรรม",
        iconClass: "text-[#71809c]",
        note: "กิจกรรมนี้ไม่รับการส่งข้อมูลแล้ว",
      };
}

type MobileNotificationActivityViewProps = {
  activity: SafetyCultureFeedEvent;
  onBack: () => void;
};

export function MobileNotificationActivityView({ activity, onBack }: MobileNotificationActivityViewProps) {
  const { theme } = useAppTheme();
  const isWangjai = theme === "wangjai";
  const pageBackgroundClass = isWangjai
    ? "bg-[linear-gradient(180deg,#eef4fb_0%,#f7fbff_220px,#f8fbff_100%)]"
    : "bg-[linear-gradient(180deg,#f6efe3_0%,#fdf8f0_220px,#fffdf8_100%)]";
  const headerBorderClass = isWangjai ? "border-[#dbe8f7]" : "border-[var(--c-eee2cb)]";
  const headerSurfaceClass = isWangjai ? "bg-[rgba(247,251,255,0.96)]" : "bg-[rgba(255,253,248,0.96)]";
  const headerButtonClass = isWangjai
    ? "border-[#cfe0f4] bg-white text-[#42698d]"
    : "border-[var(--c-ddd9cd)] bg-white text-[#667085]";
  const cardBorderClass = isWangjai ? "border-[#dbe8f7] bg-white" : "border-[var(--c-e4d3b3)] bg-[var(--c-fffdfa)]";
  const titleTextClass = isWangjai ? "text-[#183b5e]" : "text-[var(--c-2f261d)]";
  const bodyTextClass = isWangjai ? "text-[#52708d]" : "text-[#667085]";
  const surfaceSoftClass = isWangjai ? "border-[#dbe8f7] bg-[#f5faff]" : "border-[var(--c-eee2cb)] bg-[var(--c-faf8f2)]";
  const subtlePillClass = isWangjai ? "border-[#cfe0f4] bg-white text-[#42698d]" : "border-[var(--c-ddd9cd)] bg-white text-[var(--c-5c3214)]";
  const pointsPillClass = isWangjai ? "bg-[#edf6ff] text-[#2f69a3]" : "bg-[#effff6] text-[#18b989]";
  const imageFrameClass = isWangjai ? "border-[#dbe8f7] bg-[#edf6ff]" : "border-[var(--c-eee2cb)] bg-[var(--c-faf8f2)]";
  const statusMeta = getActivityStatusMeta(activity.status);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden font-sarabun", pageBackgroundClass)}>
      <div className={cn("sticky top-0 z-10 border-b px-3 py-3 backdrop-blur-sm", headerBorderClass, headerSurfaceClass)}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className={cn("inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border", headerButtonClass)}
            aria-label="กลับไปหน้าการแจ้งเตือน"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
          <div className="min-w-0">
            <div className={cn("text-[16px] font-black", titleTextClass)}>กิจกรรมจากการแจ้งเตือน</div>
            <div className={cn("truncate text-[11.5px] font-bold", isWangjai ? "text-[#6f8ba7]" : "text-[#8E8A81]")}>{activity.dateLabel}</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-4">
          <Card className={cn("rounded-[24px] border p-4 shadow-[0_18px_34px_rgba(62,36,13,0.08)]", cardBorderClass)}>
            <div className="min-w-0">
              <h2 className={cn("text-[24px] font-black leading-tight", titleTextClass)}>{activity.title}</h2>
              <p className={cn("mt-1 text-[13px] font-bold", bodyTextClass)}>{activity.subtitle}</p>
            </div>

            <div className={cn("mt-4 overflow-hidden rounded-[22px] border", imageFrameClass)}>
              {activity.imageSrc ? (
                <img src={activity.imageSrc} alt={activity.title} className="block aspect-[4/3] min-h-[220px] w-full object-cover" />
              ) : (
                <div className={cn("flex aspect-[4/3] min-h-[220px] items-center justify-center px-8 text-center text-[21px] font-black", isWangjai ? "text-[#6f8ba7]" : "text-[#8E8A81]")}>
                  {activity.imageText}
                </div>
              )}
            </div>
          </Card>

          <Card className={cn("rounded-[22px] border p-5 shadow-none", cardBorderClass)}>
            <div className={cn("mb-3 text-[18px] font-black", titleTextClass)}>รายละเอียดของกิจกรรมนี้:</div>
            <p className={cn("text-[15px] font-bold leading-relaxed", bodyTextClass)}>{activity.details}</p>
            <div className={cn("mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-black", pointsPillClass)}>
              <CircleDollarSign className="h-4 w-4" strokeWidth={2.2} />
              Points: {activity.points}
            </div>
          </Card>

          <Card className={cn("rounded-[22px] border p-5 shadow-none", cardBorderClass)}>
            <div className={cn("mb-3 text-[18px] font-black", titleTextClass)}>สถานะกิจกรรม:</div>
            <div className={cn("flex flex-col items-center justify-center gap-3 rounded-[18px] border px-4 py-5 text-center", surfaceSoftClass)}>
              <Clock3 className={cn("h-14 w-14", statusMeta.iconClass)} strokeWidth={1.8} />
              <div className={cn("text-[20px] font-black", isWangjai ? "text-[#2f69a3]" : "text-[var(--c-5c3214)]")}>{statusMeta.label}</div>
              <p className={cn("max-w-[260px] text-[14px] font-bold leading-relaxed", bodyTextClass)}>{statusMeta.note}</p>
              <span className={cn("rounded-full border px-3 py-1 text-[12px] font-black", subtlePillClass)}>{activity.dateLabel}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
