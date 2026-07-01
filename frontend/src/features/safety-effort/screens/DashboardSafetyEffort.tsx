"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Factory,
  MapPinned,
  ShieldCheck,
  Speech,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LocationTypeRow = {
  locationType: string;
  name: string;
  submissions: number;
  total: number;
  safe: number;
  unsafeAct: number;
  unsafeCond: number;
  unsafe: number;
  safeRate: number;
};

type BusinessUnitRow = {
  name: string;
  submissions: number;
  total: number;
  safe: number;
  unsafeAct: number;
  unsafeCond: number;
  unsafe: number;
  safeRate: number;
  legacyLinewalk: number;
  totalLinewalk: number;
};

type OverviewSummary = {
  submissions: number;
  total: number;
  safe: number;
  unsafeAct: number;
  unsafeCond: number;
  unsafe: number;
  legacyLinewalk: number;
  totalLinewalk: number;
  safeRate: number;
};

type LinewalkOverview = {
  summary: OverviewSummary;
  byLocationType: LocationTypeRow[];
  byBusinessUnit: BusinessUnitRow[];
  activityComparison?: {
    linewalk: number;
    safetyContact: number;
  };
};

const CHART_COLORS = {
  plant: "#0B82F0",
  office: "#38BDF8",
  site: "#F59E0B",
  legacy: "#94A3B8",
  safe: "#22C55E",
  unsafeAction: "#F97316",
  unsafeCondition: "#EF4444",
};

const LOCATION_COLOR_MAP: Record<string, string> = {
  Plant: CHART_COLORS.plant,
  Office: CHART_COLORS.office,
  Site: CHART_COLORS.site,
  "ข้อมูลเก่า": CHART_COLORS.legacy,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function percent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getBangkokDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getBangkokMonthStartKey(date = new Date()) {
  const todayKey = getBangkokDateKey(date);
  const [year, month] = todayKey.split("-");
  return `${year}-${month}-01`;
}

function DashboardCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#D8E9FB] bg-white shadow-[0_22px_50px_rgba(8,59,132,0.08)]">
      <div className="border-b border-[#E4F0FB] bg-[linear-gradient(180deg,#F9FCFF_0%,#F1F8FF_100%)] px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#E5F4FF_0%,#D4ECFF_100%)] text-[#0B82F0] shadow-[inset_0_0_0_1px_rgba(11,130,240,0.08)]">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-black leading-tight text-[#0B2F6B] sm:text-[20px]">{title}</h2>
            <p className="mt-1 text-[12.5px] font-bold leading-relaxed text-[#5B7594] sm:text-[13px]">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

export default function DashboardSafetyEffort() {
  const [overview, setOverview] = useState<LinewalkOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() => getBangkokMonthStartKey());
  const [dateTo, setDateTo] = useState(() => getBangkokDateKey());
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (dateRangeInvalid) {
        setOverview(null);
        setLoading(false);
        setError("วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
        const response = await fetch(`/api/safety-effort/reports/linewalk-overview?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("โหลดข้อมูล dashboard ไม่สำเร็จ");
        const payload = await response.json().catch(() => null);
        if (!cancelled) {
          setOverview(payload?.data ?? null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setOverview(null);
          setError(fetchError instanceof Error ? fetchError.message : "โหลดข้อมูล dashboard ไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateRangeInvalid, dateTo]);

  const summary = overview?.summary ?? {
    submissions: 0,
    total: 0,
    safe: 0,
    unsafeAct: 0,
    unsafeCond: 0,
    unsafe: 0,
    legacyLinewalk: 0,
    totalLinewalk: 0,
    safeRate: 0,
  };

  const areaChartData = useMemo(
    () =>
      (overview?.byLocationType ?? [])
        .filter((item) => item.submissions > 0)
        .map((item) => ({
          name: item.name,
          value: item.submissions,
          percentLabel: percent(summary.totalLinewalk > 0 ? (item.submissions / summary.totalLinewalk) * 100 : 0),
          color: LOCATION_COLOR_MAP[item.name] ?? CHART_COLORS.legacy,
        })),
    [overview?.byLocationType, summary.totalLinewalk],
  );

  const statusChartData = useMemo(() => {
    const wanted = ["Plant", "Office", "Site"];
    return wanted.map((name) => {
      const found = overview?.byLocationType?.find((item) => item.name === name);
      return {
        name,
        safe: found?.safe ?? 0,
        unsafeAction: found?.unsafeAct ?? 0,
        unsafeCondition: found?.unsafeCond ?? 0,
        total: found?.total ?? 0,
      };
    });
  }, [overview?.byLocationType]);

  const businessUnitChartData = useMemo(
    () =>
      [...(overview?.byBusinessUnit ?? [])]
        .sort((a, b) => b.totalLinewalk - a.totalLinewalk || b.safeRate - a.safeRate)
        .slice(0, 12)
        .map((item) => ({
          name: item.name,
          safeRate: Number(item.safeRate || 0),
          totalLinewalk: item.totalLinewalk,
          safe: item.safe,
          unsafe: item.unsafe,
        })),
    [overview?.byBusinessUnit],
  );

  const strongestBusinessUnit = businessUnitChartData[0];
  const activityComparison = overview?.activityComparison ?? { linewalk: 0, safetyContact: 0 };
  const activityChartData = [
    { name: "Linewalk", value: activityComparison.linewalk, color: "#0B82F0" },
    { name: "Safety Contact", value: activityComparison.safetyContact, color: "#22C55E" },
  ];
  const leadingActivity = [...activityChartData].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="page-shell-wide bg-[radial-gradient(circle_at_top_left,rgba(11,130,240,0.08),transparent_28%),linear-gradient(180deg,#F7FBFF_0%,#EEF6FF_100%)] px-3 pt-3 pb-8 font-sarabun sm:px-4 lg:px-5">
      <div className="mx-auto max-w-[1520px]">
        <section className="overflow-hidden rounded-[32px] border border-[#D4E7FB] bg-[linear-gradient(135deg,#FFFFFF_0%,#F5FAFF_52%,#EDF6FF_100%)] shadow-[0_26px_60px_rgba(8,59,132,0.08)]">
          <div className="grid gap-5 px-5 py-5 sm:px-7 sm:py-6 lg:grid-cols-[1.35fr_0.95fr] lg:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9E2FB] bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#0B82F0]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Safety Dashboard
              </div>
              <h1 className="mt-3 text-[28px] font-black leading-[1.05] text-[#0B2F6B] sm:text-[34px] lg:text-[40px]">
                Dashboard ภาพรวม
                <br />
                Line walk ความปลอดภัย
              </h1>
              <p className="mt-3 max-w-[760px] text-[13px] font-bold leading-relaxed text-[#5B7594] sm:text-[14px]">
                หน้านี้สรุปเฉพาะข้อมูลที่ต้องใช้จริง 3 มุมมอง ได้แก่ พื้นที่การตรวจ สถานะความปลอดภัยตามหมวด และความปลอดภัยแยกตามโรงงานจากข้อมูล BU ที่อ้างอิง
                <span className="font-black text-[#0B82F0]"> DIVISION_NAME</span>
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D7EAFE] bg-white px-3 py-2 text-[12px] font-black text-[#5B7594]">
                <Calendar className="h-4 w-4 text-[#0B82F0]" />
                ช่วงวันที่ {dateFrom || "-"} ถึง {dateTo || "-"}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-[#D7EAFE] bg-white/95 p-4 shadow-[0_10px_24px_rgba(11,130,240,0.06)]">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#EAF6FF] text-[#0B82F0]">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-[#0B2F6B]">เลือกช่วงเวลา Dashboard</div>
                    <div className="text-[11.5px] font-bold text-[#6E86A5]">ทุกกราฟจะเปลี่ยนตามช่วงวันที่นี้</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="mb-1.5 text-[11px] font-black text-[#6E86A5]">วันที่เริ่มต้น</div>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#CFE2F6] bg-[#F9FCFF] px-3 text-[13px] font-black text-[#0B2F6B] outline-none transition focus:border-[#0B82F0] focus:ring-2 focus:ring-[#DCEEFF]"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1.5 text-[11px] font-black text-[#6E86A5]">วันที่สิ้นสุด</div>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#CFE2F6] bg-[#F9FCFF] px-3 text-[13px] font-black text-[#0B2F6B] outline-none transition focus:border-[#0B82F0] focus:ring-2 focus:ring-[#DCEEFF]"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom(getBangkokMonthStartKey());
                      setDateTo(getBangkokDateKey());
                    }}
                    className="h-10 rounded-full border border-[#BFD9F6] bg-[#F5FAFF] px-4 text-[12px] font-black text-[#0B82F0]"
                  >
                    เดือนปัจจุบัน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo(getBangkokDateKey());
                    }}
                    className="h-10 rounded-full border border-[#D7EAFE] bg-white px-4 text-[12px] font-black text-[#5B7594]"
                  >
                    ดูทั้งหมดถึงวันนี้
                  </button>
                </div>
                {dateRangeInvalid && (
                  <div className="mt-3 text-[12px] font-black text-[#D92D20]">วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-[#D7EAFE] bg-white/95 p-4 shadow-[0_10px_24px_rgba(11,130,240,0.06)]">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">Line walk ทั้งหมด</div>
                <div className="mt-2 text-[28px] font-black leading-none text-[#0B2F6B]">{formatNumber(summary.totalLinewalk)}</div>
                <div className="mt-2 text-[12px] font-bold text-[#5B7594]">รวม submission ปัจจุบันและข้อมูลเก่า</div>
              </div>
              <div className="rounded-[22px] border border-[#D7EAFE] bg-white/95 p-4 shadow-[0_10px_24px_rgba(11,130,240,0.06)]">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">Safe Rate</div>
                <div className="mt-2 text-[28px] font-black leading-none text-[#129B63]">{percent(summary.safeRate)}</div>
                <div className="mt-2 text-[12px] font-bold text-[#5B7594]">คิดจากรายการประเมินใน answers จริง</div>
              </div>
              <div className="rounded-[22px] border border-[#D7EAFE] bg-white/95 p-4 shadow-[0_10px_24px_rgba(11,130,240,0.06)]">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">Safe</div>
                <div className="mt-2 text-[28px] font-black leading-none text-[#129B63]">{formatNumber(summary.safe)}</div>
                <div className="mt-2 text-[12px] font-bold text-[#5B7594]">รายการปลอดภัยทั้งหมด</div>
              </div>
              <div className="rounded-[22px] border border-[#D7EAFE] bg-white/95 p-4 shadow-[0_10px_24px_rgba(11,130,240,0.06)]">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">Unsafe</div>
                <div className="mt-2 text-[28px] font-black leading-none text-[#E35549]">{formatNumber(summary.unsafe)}</div>
                <div className="mt-2 text-[12px] font-bold text-[#5B7594]">รวม Unsafe Action และ Unsafe Condition</div>
              </div>
            </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-4 rounded-[28px] border border-[#D7EAFE] bg-white px-6 py-14 text-center shadow-[0_18px_40px_rgba(8,59,132,0.06)]">
            <div className="text-[22px] font-black text-[#0B2F6B]">กำลังโหลด Dashboard</div>
            <div className="mt-2 text-[13px] font-bold text-[#5B7594]">ระบบกำลังเตรียมข้อมูลกราฟ Line walk ล่าสุด</div>
          </div>
        ) : error ? (
          <div className="mt-4 rounded-[28px] border border-[#FFD5D0] bg-[linear-gradient(180deg,#FFF8F7_0%,#FFF2EF_100%)] px-6 py-10 text-center shadow-[0_18px_40px_rgba(154,52,18,0.08)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#E35549] shadow-sm">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="mt-4 text-[22px] font-black text-[#A33922]">โหลดข้อมูลไม่สำเร็จ</div>
            <div className="mt-2 text-[13px] font-bold text-[#9A5D4D]">{error}</div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.02fr_1.18fr]">
            <DashboardCard
              title="ภาพรวมพื้นที่การตรวจ Line walk"
              description="สัดส่วนการตรวจแยกตามพื้นที่ Plant, Office, Site และข้อมูลเก่าที่นำมารวมในภาพรวม"
              icon={<MapPinned className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_0.92fr] lg:items-center">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={areaChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={72}
                        outerRadius={112}
                        paddingAngle={3}
                        stroke="#ffffff"
                        strokeWidth={4}
                      >
                        {areaChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _name, props) => [
                          `${formatNumber(Number(value))} ครั้ง • ${props.payload.percentLabel}`,
                          props.payload.name,
                        ]}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #D7EAFE",
                          boxShadow: "0 12px 30px rgba(8,59,132,0.10)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-3">
                  {areaChartData.map((item) => (
                    <div key={item.name} className="rounded-[18px] border border-[#E2EDF8] bg-[#F9FCFF] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[14px] font-black text-[#0B2F6B]">{item.name}</span>
                        </div>
                        <span className="text-[13px] font-black text-[#0B82F0]">{item.percentLabel}</span>
                      </div>
                      <div className="mt-1.5 text-[12px] font-bold text-[#6E86A5]">
                        จำนวนครั้งที่ตรวจ {formatNumber(item.value)} ครั้ง
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="เปรียบเทียบจำนวน Linewalk / Safety Contact"
              description="ดูว่ากิจกรรมประเภทไหนถูกทำมากกว่ากันจากข้อมูลรวมในระบบ"
              icon={<Speech className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div className="rounded-[22px] border border-[#DCEBFA] bg-[linear-gradient(135deg,#F9FCFF_0%,#EEF6FF_100%)] p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">กิจกรรมที่มากกว่า</div>
                  <div className="mt-2 text-[24px] font-black leading-tight text-[#0B2F6B]">{leadingActivity?.name || "-"}</div>
                  <div className="mt-2 text-[13px] font-bold text-[#5B7594]">
                    {leadingActivity ? `จำนวน ${formatNumber(leadingActivity.value)} ครั้ง` : "ยังไม่มีข้อมูล"}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {activityChartData.map((item) => (
                      <div key={item.name} className="rounded-[18px] border border-[#D7EAFE] bg-white px-4 py-3">
                        <div className="text-[12px] font-black text-[#5B7594]">{item.name}</div>
                        <div className="mt-1 text-[22px] font-black" style={{ color: item.color }}>
                          {formatNumber(item.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid stroke="#E6F0FA" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#5B7594", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#5B7594", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value: number) => [`${formatNumber(Number(value))} ครั้ง`, "จำนวนทำรายการ"]}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #D7EAFE",
                          boxShadow: "0 12px 30px rgba(8,59,132,0.10)",
                        }}
                      />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={56}>
                        {activityChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          formatter={(value: number) => formatNumber(value)}
                          style={{ fill: "#0B2F6B", fontSize: 12, fontWeight: 900 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="สถานะความปลอดภัยแยกตามหมวด (Status Line walk)"
              description="เปรียบเทียบสถานะ Safe, Unsafe Action และ Unsafe Condition แยกตามหมวดพื้นที่การตรวจ"
              icon={<BarChart3 className="h-5 w-5" strokeWidth={2.3} />}
            >
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} barGap={8} barCategoryGap="20%">
                    <CartesianGrid stroke="#E6F0FA" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#5B7594", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#5B7594", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #D7EAFE",
                        boxShadow: "0 12px 30px rgba(8,59,132,0.10)",
                      }}
                    />
                    <Bar dataKey="safe" name="Safe" fill={CHART_COLORS.safe} radius={[10, 10, 0, 0]} />
                    <Bar dataKey="unsafeAction" name="Unsafe Action" fill={CHART_COLORS.unsafeAction} radius={[10, 10, 0, 0]} />
                    <Bar dataKey="unsafeCondition" name="Unsafe Condition" fill={CHART_COLORS.unsafeCondition} radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] border border-[#DCF3E7] bg-[#F5FFF9] px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5F8E77]">Safe รวม</div>
                  <div className="mt-1 text-[22px] font-black text-[#129B63]">{formatNumber(summary.safe)}</div>
                </div>
                <div className="rounded-[18px] border border-[#FFE0CF] bg-[#FFF8F2] px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#A9652D]">Unsafe Action</div>
                  <div className="mt-1 text-[22px] font-black text-[#F97316]">{formatNumber(summary.unsafeAct)}</div>
                </div>
                <div className="rounded-[18px] border border-[#FFD7D3] bg-[#FFF6F5] px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#B65A52]">Unsafe Condition</div>
                  <div className="mt-1 text-[22px] font-black text-[#EF4444]">{formatNumber(summary.unsafeCond)}</div>
                </div>
              </div>
            </DashboardCard>

            <div className="xl:col-span-2">
              <DashboardCard
                title="ความปลอดภัยแยกตามโรงงาน (Safety Line walk BU)"
                description="จัดอันดับตามข้อมูลโรงงานที่ดึงจาก DIVISION_NAME ในฐานข้อมูล เพื่อดู BU ที่มีอัตราความปลอดภัยสูงและปริมาณการตรวจมาก"
                icon={<Factory className="h-5 w-5" strokeWidth={2.3} />}
              >
                <div className="mb-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[22px] border border-[#DCEBFA] bg-[linear-gradient(135deg,#F9FCFF_0%,#EEF6FF_100%)] p-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">BU เด่นที่สุดตอนนี้</div>
                    <div className="mt-2 flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#0B82F0] shadow-sm">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[20px] font-black leading-tight text-[#0B2F6B]">
                          {strongestBusinessUnit?.name || "ยังไม่มีข้อมูล BU"}
                        </div>
                        <div className="mt-1 text-[13px] font-bold text-[#5B7594]">
                          Safe Rate {percent(strongestBusinessUnit?.safeRate || 0)} จาก {formatNumber(strongestBusinessUnit?.totalLinewalk || 0)} ครั้ง
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] border border-[#D7EAFE] bg-white p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">จำนวน BU</div>
                      <div className="mt-1 text-[24px] font-black text-[#0B2F6B]">{formatNumber(overview?.byBusinessUnit?.length ?? 0)}</div>
                    </div>
                    <div className="rounded-[18px] border border-[#D7EAFE] bg-white p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7B93B2]">Legacy Line walk</div>
                      <div className="mt-1 text-[24px] font-black text-[#0B2F6B]">{formatNumber(summary.legacyLinewalk)}</div>
                    </div>
                  </div>
                </div>

                <div className="h-[520px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={businessUnitChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 12, bottom: 4 }}
                    >
                      <CartesianGrid stroke="#E6F0FA" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "#5B7594", fontSize: 12, fontWeight: 700 }}
                        tickFormatter={(value) => `${value}%`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={220}
                        tick={{ fill: "#0B2F6B", fontSize: 12, fontWeight: 800 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number, _name, props) => [
                          `${Number(value).toFixed(1)}%`,
                          `Safe Rate • ตรวจ ${formatNumber(props.payload.totalLinewalk)} ครั้ง`,
                        ]}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #D7EAFE",
                          boxShadow: "0 12px 30px rgba(8,59,132,0.10)",
                        }}
                      />
                      <Bar dataKey="safeRate" fill={CHART_COLORS.plant} radius={[0, 12, 12, 0]} barSize={24}>
                        <LabelList
                          dataKey="safeRate"
                          position="right"
                          formatter={(value: number) => percent(value)}
                          style={{ fill: "#0B2F6B", fontSize: 12, fontWeight: 900 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {businessUnitChartData.slice(0, 4).map((item) => (
                    <div key={item.name} className="rounded-[18px] border border-[#DCEBFA] bg-[#F9FCFF] px-4 py-3">
                      <div className="truncate text-[13px] font-black text-[#0B2F6B]">{item.name}</div>
                      <div className="mt-1 text-[20px] font-black text-[#0B82F0]">{percent(item.safeRate)}</div>
                      <div className="mt-1 text-[12px] font-bold text-[#6E86A5]">
                        Safe {formatNumber(item.safe)} • Unsafe {formatNumber(item.unsafe)}
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
