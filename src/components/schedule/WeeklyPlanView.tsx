import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { computeScheduledParts } from "@/store/selectors";
import type { LifePart, ScheduleStatus } from "@/types";
import { RISK_LABEL, SCHEDULE_LABEL } from "@/types";
import { riskBarClass } from "@/utils/riskUtils";
import { detectConflicts, getConflictsForPart, getConflictsOnDate, getMaxSeverity, getBaseDailyCapacity } from "@/utils/conflictUtils";
import type { ScheduleConflict } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Factory,
  Package,
  MapPin,
  ShoppingCart,
  Wrench,
  CalendarCheck2,
  AlertTriangle,
} from "lucide-react";

const WEEK_DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function highlightKeywords(text: string): React.ReactNode {
  const keywords = ["换机位", "改期", "分流"];
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestKw = "";
    for (const kw of keywords) {
      const idx = remaining.indexOf(kw);
      if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
        earliestIdx = idx;
        earliestKw = kw;
      }
    }
    if (earliestIdx === -1) {
      parts.push(<span key={keyIdx++}>{remaining}</span>);
      break;
    }
    if (earliestIdx > 0) {
      parts.push(<span key={keyIdx++}>{remaining.slice(0, earliestIdx)}</span>);
    }
    parts.push(
      <b key={keyIdx++} className="font-semibold text-gray-900">
        {earliestKw}
      </b>
    );
    remaining = remaining.slice(earliestIdx + earliestKw.length);
  }
  return <>{parts}</>;
}

function getCapacityColorClasses(used: number, total: number): { bar: string; bg: string; badge: string } {
  const ratio = used / total;
  if (ratio <= 0.8) {
    return {
      bar: "bg-gradient-to-r from-emerald-400 to-emerald-500",
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      badge: "",
    };
  } else if (ratio <= 1) {
    return {
      bar: "bg-gradient-to-r from-amber-400 to-amber-500",
      bg: "bg-amber-50 border-amber-200 text-amber-700",
      badge: "",
    };
  } else {
    return {
      bar: "bg-gradient-to-r from-red-400 to-red-500",
      bg: "bg-red-50 border-red-200 text-red-700",
      badge: "text-red-600",
    };
  }
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

function getShorterLife(part: LifePart): { value: number; unit: string } {
  const cyclesPerDayEstimate = 4;
  const daysFromCycles = part.remainingCycles / cyclesPerDayEstimate;
  if (daysFromCycles < part.remainingDays) {
    return { value: part.remainingCycles, unit: "FC" };
  }
  return { value: part.remainingDays, unit: "天" };
}

function ScheduleBadge({ status }: { status: ScheduleStatus }) {
  if (status === "NONE") return null;
  const config: Record<Exclude<ScheduleStatus, "NONE">, { icon: any; cls: string; label: string }> = {
    NEED_ORDER: { icon: ShoppingCart, cls: "bg-blue-100 text-blue-700 border-blue-200", label: SCHEDULE_LABEL.NEED_ORDER },
    NEED_REPAIR: { icon: Wrench, cls: "bg-purple-100 text-purple-700 border-purple-200", label: SCHEDULE_LABEL.NEED_REPAIR },
    MERGE_CHECK: { icon: CalendarCheck2, cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: SCHEDULE_LABEL.MERGE_CHECK },
  };
  const c = config[status as Exclude<ScheduleStatus, "NONE">];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${c.cls}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

interface PartRowProps {
  part: LifePart;
  onClick: () => void;
  conflicts?: ScheduleConflict[];
}

function PartRow({ part, onClick, conflicts }: PartRowProps) {
  const life = getShorterLife(part);
  const partConflicts = conflicts || [];
  const hasConflicts = partConflicts.length > 0;
  const maxSev = hasConflicts ? getMaxSeverity(partConflicts) : null;

  return (
    <div
      onClick={onClick}
      className="group relative flex items-start gap-2.5 p-2.5 rounded-lg border border-transparent hover:border-aviation-200 hover:bg-aviation-50/40 cursor-pointer transition-all duration-150"
    >
      <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${riskBarClass(part.riskLevel)}`} />
      <div className="pl-2.5 flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          {hasConflicts && (
            <span
              className={[
                "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold shrink-0",
                maxSev === "CRITICAL"
                  ? "bg-alert-critical/15 text-alert-critical border border-alert-critical/30"
                  : "bg-alert-warning/15 text-alert-warning border border-alert-warning/30",
              ].join(" ")}
              title={`涉及 ${partConflicts.length} 个排程冲突`}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              冲突
            </span>
          )}
          <span
            className={[
              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0",
              part.riskLevel === "CRITICAL"
                ? "bg-alert-critical/15 text-alert-critical"
                : part.riskLevel === "WARNING"
                  ? "bg-alert-warning/15 text-alert-warning"
                  : "bg-alert-caution/15 text-alert-caution",
            ].join(" ")}
          >
            {RISK_LABEL[part.riskLevel]}
          </span>
          <span className="font-mono-tabular text-xs font-semibold text-aviation-800 shrink-0">
            {part.partNumber}
          </span>
          <span className="text-xs text-gray-700 truncate min-w-0 flex-1">{part.name}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[11px]">
          <span className="text-gray-500">
            <MapPin className="w-3 h-3 inline -mt-0.5 mr-0.5 text-gray-400" />
            {part.installPosition}
          </span>
          <span
            className={[
              "font-mono-tabular font-semibold",
              part.riskLevel === "CRITICAL"
                ? "text-alert-critical"
                : part.riskLevel === "WARNING"
                  ? "text-alert-warning"
                  : "text-alert-caution",
            ].join(" ")}
          >
            剩余 {life.value.toLocaleString()}{life.unit}
          </span>
          <ScheduleBadge status={part.scheduleStatus} />
          {part.plannedBay && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
              机位 {part.plannedBay}
            </span>
          )}
        </div>
        {hasConflicts && (
          <div className="mt-2 space-y-1.5">
            {partConflicts.map((c) => (
              <div key={c.id}>
                <div
                  className={[
                    "text-[10px] px-2 py-1 rounded border leading-snug",
                    c.severity === "CRITICAL"
                      ? "bg-alert-critical/10 border-alert-critical/30 text-alert-critical"
                      : "bg-alert-warning/10 border-alert-warning/30 text-alert-warning",
                  ].join(" ")}
                >
                  {c.severity === "CRITICAL" ? "🔴" : "🟠"} {c.description}
                </div>
                {c.suggestions && c.suggestions.length > 0 && (
                  <div className="mt-1 pl-3 space-y-0.5 border-l-2 border-gray-200 ml-2">
                    {c.suggestions.slice(0, 3).map((sug, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] text-gray-500 italic leading-snug py-0.5"
                      >
                        💡 → {highlightKeywords(sug)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WeeklyPlanView() {
  const parts = useAppStore((s) => s.parts);
  const scheduledPartIds = useAppStore((s) => s.scheduledPartIds);
  const openDrawerForPart = useAppStore((s) => s.openDrawerForPart);

  const [windowStart, setWindowStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const scheduledParts = useMemo(
    () => computeScheduledParts(parts, scheduledPartIds),
    [parts, scheduledPartIds]
  );

  const conflicts = useMemo(() => detectConflicts(scheduledParts), [scheduledParts]);
  const hasCriticalConflict = conflicts.some((c) => c.severity === "CRITICAL");

  const dateRange = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 14; i++) {
      days.push(addDays(windowStart, i));
    }
    return days;
  }, [windowStart]);

  const rangeStartStr = formatDate(dateRange[0]);
  const rangeEndStr = formatDate(dateRange[dateRange.length - 1]);

  const rangeStartMs = dateRange[0].getTime();
  const rangeEndMs = addDays(dateRange[dateRange.length - 1], 1).getTime();

  const grouped = useMemo(() => {
    const byDate = new Map<string, Map<string, Map<string, LifePart[]>>>();
    const unscheduled: LifePart[] = [];

    for (const part of scheduledParts) {
      if (!part.plannedDate) {
        unscheduled.push(part);
        continue;
      }
      const pd = new Date(part.plannedDate);
      pd.setHours(0, 0, 0, 0);
      const pdMs = pd.getTime();
      if (pdMs < rangeStartMs || pdMs >= rangeEndMs) {
        continue;
      }
      const dateKey = formatDate(pd);
      const baseKey = part.plannedBase || "未指定基地";
      const acKey = part.aircraftReg;

      if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
      const byBase = byDate.get(dateKey)!;
      if (!byBase.has(baseKey)) byBase.set(baseKey, new Map());
      const byAc = byBase.get(baseKey)!;
      if (!byAc.has(acKey)) byAc.set(acKey, []);
      byAc.get(acKey)!.push(part);
    }

    return { byDate, unscheduled };
  }, [scheduledParts, rangeStartMs, rangeEndMs]);

  const stats = useMemo(() => {
    const allInRange: LifePart[] = [];
    for (const byBase of grouped.byDate.values()) {
      for (const byAc of byBase.values()) {
        for (const list of byAc.values()) {
          allInRange.push(...list);
        }
      }
    }
    const bases = new Set<string>();
    const aircrafts = new Set<string>();
    for (const p of allInRange) {
      if (p.plannedBase) bases.add(p.plannedBase);
      aircrafts.add(p.aircraftReg);
    }
    return {
      total: allInRange.length,
      bases: bases.size,
      aircraft: aircrafts.size,
    };
  }, [grouped]);

  const shiftWeek = (delta: number) => {
    setWindowStart((prev) => addDays(prev, delta * 7));
  };

  return (
    <div className="bg-white rounded-2xl border border-aviation-100 shadow-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-aviation-50/50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aviation-500 to-aviation-700 flex items-center justify-center shadow-md shadow-aviation-500/20">
            <span className="text-base">📅</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-aviation-800 leading-tight">周计划视图</h2>
            <p className="text-xs text-gray-500 font-mono-tabular mt-0.5">
              {rangeStartStr} ~ {rangeEndStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-aviation-700 hover:shadow-sm transition-all"
            title="上一周"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-medium text-gray-600">← 上一周 / 下一周 →</span>
          <button
            onClick={() => shiftWeek(1)}
            className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-aviation-700 hover:shadow-sm transition-all"
            title="下一周"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aviation-50 border border-aviation-100">
            <Package className="w-3.5 h-3.5 text-aviation-500" />
            <span className="text-[11px] text-gray-500">总排程</span>
            <span className="text-sm font-bold text-aviation-700 font-mono-tabular">{stats.total}</span>
            <span className="text-[11px] text-gray-500">件</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
            <Factory className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[11px] text-gray-500">覆盖基地</span>
            <span className="text-sm font-bold text-indigo-700 font-mono-tabular">{stats.bases}</span>
            <span className="text-[11px] text-gray-500">个</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <Plane className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] text-gray-500">涉及飞机</span>
            <span className="text-sm font-bold text-emerald-700 font-mono-tabular">{stats.aircraft}</span>
            <span className="text-[11px] text-gray-500">架</span>
          </div>
          <div
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
              conflicts.length > 0
                ? hasCriticalConflict
                  ? "bg-alert-critical/10 border-alert-critical/30"
                  : "bg-alert-warning/10 border-alert-warning/30"
                : "bg-alert-safe/10 border-alert-safe/30",
            ].join(" ")}
          >
            <AlertTriangle
              className={[
                "w-3.5 h-3.5",
                conflicts.length > 0
                  ? hasCriticalConflict
                    ? "text-alert-critical"
                    : "text-alert-warning"
                  : "text-alert-safe",
              ].join(" ")}
            />
            <span className="text-[11px] text-gray-500">排程冲突</span>
            <span
              className={[
                "text-sm font-bold font-mono-tabular",
                conflicts.length > 0
                  ? hasCriticalConflict
                    ? "text-alert-critical"
                    : "text-alert-warning"
                  : "text-alert-safe",
              ].join(" ")}
            >
              {conflicts.length}
            </span>
            <span className="text-[11px] text-gray-500">个</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 max-h-[75vh] overflow-y-auto scrollbar-thin p-4 space-y-4">
        {dateRange.map((date) => {
          const dateKey = formatDate(date);
          const weekDay = WEEK_DAYS[date.getDay()];
          const byBase = grouped.byDate.get(dateKey);
          const dayCount = byBase
            ? Array.from(byBase.values()).reduce(
                (sum, byAc) => sum + Array.from(byAc.values()).reduce((s, l) => s + l.length, 0),
                0
              )
            : 0;
          const dayConflicts = getConflictsOnDate(conflicts, dateKey);
          const dayHasCritical = dayConflicts.some((c) => c.severity === "CRITICAL");

          const baseCapacities = byBase
            ? Array.from(byBase.keys()).map((baseName) => {
                const cap = getBaseDailyCapacity(scheduledParts, baseName, dateKey);
                return { baseName, ...cap };
              })
            : [];

          return (
            <div key={dateKey} className="rounded-xl border border-gray-200 overflow-hidden">
              {/* Date separator */}
              <div className="px-4 py-2.5 bg-gradient-to-r from-aviation-50 via-aviation-50/70 to-white border-b border-aviation-100 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">📆</span>
                  <span className="font-mono-tabular text-sm font-bold text-aviation-800">{dateKey}</span>
                  <span className="text-xs font-medium text-aviation-600">{weekDay}</span>
                  {dayConflicts.length > 0 && (
                    <span
                      className={[
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                        dayHasCritical
                          ? "bg-alert-critical/15 text-alert-critical border border-alert-critical/30"
                          : "bg-alert-warning/15 text-alert-warning border border-alert-warning/30",
                      ].join(" ")}
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      ⚠️ {dayConflicts.length}个冲突
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-4 w-px bg-aviation-200" />
                  <span className="text-xs text-gray-500">
                    共 <b className="font-mono-tabular text-aviation-700 text-sm">{dayCount}</b> 件
                  </span>
                </div>
              </div>

              {/* Daily base capacity summary */}
              {baseCapacities.length > 0 && (
                <div className="px-4 py-2 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {baseCapacities.map(({ baseName, total, used }) => {
                      const colors = getCapacityColorClasses(used, total);
                      const isOverload = used > total;
                      return (
                        <div
                          key={baseName}
                          title={`点击查看 ${baseName} 换机位建议`}
                          className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${colors.bg}`}
                        >
                          <span>🏭</span>
                          <span className="font-semibold">{baseName}</span>
                          <span className={`font-mono-tabular font-bold ${isOverload ? "text-red-600" : ""}`}>
                            {used}/{total}
                          </span>
                          {isOverload ? (
                            <span className="text-red-600 font-bold">⚠️超载</span>
                          ) : used / total > 0.8 ? (
                            <span className="text-amber-600">⚡高负荷</span>
                          ) : (
                            <span className="text-emerald-600">✅正常</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Day content */}
              <div className="p-3 space-y-3">
                {dayCount === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">— 当日暂无排程 —</div>
                ) : (
                  byBase &&
                  Array.from(byBase.entries()).map(([baseName, byAc]) => {
                    const baseCount = Array.from(byAc.values()).reduce((s, l) => s + l.length, 0);
                    const capacity = getBaseDailyCapacity(scheduledParts, baseName, dateKey);
                    const { used, total } = capacity;
                    const colors = getCapacityColorClasses(used, total);
                    const isOverload = used > total;
                    const barPct = Math.min(100, (used / total) * 100);

                    return (
                      <div key={baseName} className="space-y-2">
                        {/* Base header with capacity bar */}
                        <div className="flex items-center gap-2 px-1 flex-wrap">
                          <span className="text-sm">🏭</span>
                          <span className="text-sm font-semibold text-indigo-700">{baseName}</span>
                          <span className="h-4 w-px bg-indigo-200" />
                          <span className="text-xs text-gray-500">
                            ▎<b className="font-mono-tabular text-indigo-600">{baseCount}</b> 件
                          </span>
                          {/* Capacity progress bar */}
                          <div className="flex items-center gap-2 ml-1">
                            <div className="relative w-[120px] h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <div
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${colors.bar}`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span
                              className={`text-[11px] font-mono-tabular font-semibold ${
                                isOverload ? "text-red-600" : used / total > 0.8 ? "text-amber-600" : "text-gray-600"
                              }`}
                            >
                              {used}/{total}
                            </span>
                            {isOverload && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                ⚠️ 超载
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Aircraft cards */}
                        <div className="pl-2 space-y-2">
                          {Array.from(byAc.entries()).map(([acReg, acParts]) => (
                            <div
                              key={acReg}
                              className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm overflow-hidden"
                            >
                              {/* Aircraft header */}
                              <div className="px-3 py-2 border-b border-gray-100 bg-white/60 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Plane className="w-4 h-4 text-aviation-500" />
                                  <span className="font-mono-tabular font-bold text-sm text-aviation-800">
                                    {acReg}
                                  </span>
                                  {acParts.length > 1 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-aviation-100 text-aviation-700 text-[10px] font-semibold">
                                      {acParts.length}件合批
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Part list */}
                              <div className="p-1.5 space-y-0.5">
                                {acParts.map((p) => (
                                  <PartRow
                                    key={p.id}
                                    part={p}
                                    onClick={() => openDrawerForPart(p.id)}
                                    conflicts={getConflictsForPart(conflicts, p.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Unscheduled section */}
        {grouped.unscheduled.length > 0 && (
          <div className="rounded-xl border-2 border-dashed border-alert-warning/40 overflow-hidden bg-alert-warning/5">
            <div className="px-4 py-2.5 bg-gradient-to-r from-alert-warning/10 to-transparent border-b border-alert-warning/20 flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="font-bold text-sm text-alert-warning">未排定日期</span>
              <span className="h-4 w-px bg-alert-warning/30" />
              <span className="text-xs text-gray-500">
                共 <b className="font-mono-tabular text-alert-warning text-sm">{grouped.unscheduled.length}</b> 件已加入计划但未设置日期
              </span>
            </div>
            <div className="p-3 space-y-2">
              {Array.from(
                grouped.unscheduled.reduce((map, p) => {
                  const key = p.plannedBase || "未指定基地";
                  if (!map.has(key)) map.set(key, []);
                  map.get(key)!.push(p);
                  return map;
                }, new Map<string, LifePart[]>())
              ).map(([baseName, baseParts]) => (
                <div key={baseName} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-sm">🏭</span>
                    <span className="text-sm font-semibold text-indigo-700">{baseName}</span>
                    <span className="h-4 w-px bg-indigo-200" />
                    <span className="text-xs text-gray-500">
                      <b className="font-mono-tabular text-indigo-600">{baseParts.length}</b> 件
                    </span>
                  </div>
                  <div className="pl-2 space-y-2">
                    {Array.from(
                      baseParts.reduce((map, p) => {
                        if (!map.has(p.aircraftReg)) map.set(p.aircraftReg, []);
                        map.get(p.aircraftReg)!.push(p);
                        return map;
                      }, new Map<string, LifePart[]>())
                    ).map(([acReg, acParts]) => (
                      <div
                        key={acReg}
                        className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm overflow-hidden"
                      >
                        <div className="px-3 py-2 border-b border-gray-100 bg-white/60 flex items-center gap-2">
                          <Plane className="w-4 h-4 text-aviation-500" />
                          <span className="font-mono-tabular font-bold text-sm text-aviation-800">{acReg}</span>
                          {acParts.length > 1 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-aviation-100 text-aviation-700 text-[10px] font-semibold">
                              {acParts.length}件合批
                            </span>
                          )}
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          {acParts.map((p) => (
                            <PartRow
                              key={p.id}
                              part={p}
                              onClick={() => openDrawerForPart(p.id)}
                              conflicts={getConflictsForPart(conflicts, p.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
