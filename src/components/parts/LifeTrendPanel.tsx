import { useMemo } from "react";
import { Clock, Calendar, CheckCircle2, AlertTriangle, Package, Wrench, ClipboardList, AlertCircle } from "lucide-react";
import type { LifePart, RiskLevel } from "@/types";
import { SCHEDULE_LABEL } from "@/types";
import { riskColor, riskBgClass } from "@/utils/riskUtils";
import { useAppStore } from "@/store/useAppStore";
import { findNotesByPartId } from "@/store/selectors";

interface LifeTrendPanelProps {
  part: LifePart;
}

type CycleRiskLevel = "CRITICAL" | "WARNING" | "CAUTION" | "NORMAL";
type DayRiskLevel = "CRITICAL" | "WARNING" | "CAUTION" | "NORMAL";

function getCycleRisk(remainingCycles: number, totalCycles: number): CycleRiskLevel {
  if (totalCycles <= 0) return "NORMAL";
  const ratio = remainingCycles / totalCycles;
  if (ratio <= 0.05) return "CRITICAL";
  if (ratio <= 0.15) return "WARNING";
  if (ratio <= 0.30) return "CAUTION";
  return "NORMAL";
}

function getDayRisk(remainingDays: number): DayRiskLevel {
  if (remainingDays <= 15) return "CRITICAL";
  if (remainingDays <= 30) return "WARNING";
  if (remainingDays <= 60) return "CAUTION";
  return "NORMAL";
}

function getOverallRisk(cycleRisk: CycleRiskLevel, dayRisk: DayRiskLevel): RiskLevel {
  const order: Record<string, number> = { CRITICAL: 0, WARNING: 1, CAUTION: 2, NORMAL: 3 };
  return order[cycleRisk] <= order[dayRisk] ? (cycleRisk as RiskLevel) : (dayRisk as RiskLevel);
}

const RISK_LEVEL_LABEL: Record<RiskLevel, { label: string; color: string }> = {
  CRITICAL: { label: "紧急", color: "#c53030" },
  WARNING: { label: "高", color: "#e86a2c" },
  CAUTION: { label: "中", color: "#d69e2e" },
  NORMAL: { label: "低", color: "#2e7d52" },
};

export default function LifeTrendPanel({ part }: LifeTrendPanelProps) {
  const handoverNotes = useAppStore((s) => s.handoverNotes);
  const notes = useMemo(() => findNotesByPartId(handoverNotes, part.id), [handoverNotes, part.id]);
  const unconfirmedCount = notes.filter((n) => n.status !== "CONFIRMED").length;

  const cycleRisk = useMemo(
    () => getCycleRisk(part.remainingCycles, part.totalCycles),
    [part.remainingCycles, part.totalCycles]
  );
  const dayRisk = useMemo(() => getDayRisk(part.remainingDays), [part.remainingDays]);
  const overallRisk = useMemo(() => getOverallRisk(cycleRisk, dayRisk), [cycleRisk, dayRisk]);

  const usedCyclePct = part.totalCycles > 0
    ? Math.min(100, Math.max(0, Math.round((part.usedCycles / part.totalCycles) * 100)))
    : 0;
  const usedDayPct = part.totalDays > 0
    ? Math.min(100, Math.max(0, Math.round((part.usedDays / part.totalDays) * 100)))
    : 0;

  const cycleMessage = useMemo(() => {
    switch (cycleRisk) {
      case "CRITICAL":
        return "🔴 循环寿命极紧张，立即订件并排停场";
      case "WARNING":
        return "🟠 循环寿命进入警告区，启动采购流程";
      case "CAUTION":
        return "🟡 可关注，考虑与下次定检合并";
      default:
        return "🟢 循环充裕，正常监控";
    }
  }, [cycleRisk]);

  const dayMessage = useMemo(() => {
    switch (dayRisk) {
      case "CRITICAL":
        return "🔴 15天内到期，必须尽快停场";
      case "WARNING":
        return "🟠 30天内到期，锁定停场日期";
      case "CAUTION":
        return "🟡 60天窗口内，安排与定检合并";
      default:
        return "🟢 日历寿命充裕";
    }
  }, [dayRisk]);

  const scheduleAdvice = useMemo(() => {
    switch (part.scheduleStatus) {
      case "NEED_ORDER":
        return { icon: Package, text: "📦 请确认库房库存，缺件则发采购单", color: "text-aviation-700" };
      case "NEED_REPAIR":
        return { icon: Wrench, text: "🔧 联系 OEM/AMO 确认大修周期和报价", color: "text-purple-700" };
      case "MERGE_CHECK":
        return { icon: ClipboardList, text: "📋 并入就近 A/C 检工作包，确保工卡完备", color: "text-emerald-700" };
      default:
        return { icon: AlertCircle, text: "请先标记处理方式（订件/送修/合并定检）", color: "text-gray-500" };
    }
  }, [part.scheduleStatus]);

  const overallAdvice = useMemo(() => {
    switch (overallRisk) {
      case "CRITICAL":
        return "立即启动紧急换件流程，10个工作日内到位备件";
      case "WARNING":
        return "本月内完成停场计划，同步订件/送修";
      case "CAUTION":
        return "纳入下月排程，优先合并与同机定检";
      default:
        return "持续监控，下个计划周期再评估";
    }
  }, [overallRisk]);

  const hasScheduleDetails = part.plannedDate || part.plannedBay || part.plannedBase;
  const AdviceIcon = scheduleAdvice.icon;

  const riskGradientColors: Record<RiskLevel, string> = {
    CRITICAL: "from-red-50 via-red-50/60 to-white",
    WARNING: "from-orange-50 via-orange-50/60 to-white",
    CAUTION: "from-amber-50 via-amber-50/60 to-white",
    NORMAL: "from-emerald-50 via-emerald-50/60 to-white",
  };

  return (
    <div className="rounded-xl border border-aviation-100 bg-gradient-to-br from-aviation-50 via-white to-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-lg">📊</span>
        <h3 className="text-base font-bold text-aviation-800">寿命趋势看板 · 决策辅助</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 第1栏：循环寿命 */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-alert-warning" />
              飞行循环 (FC)
            </h4>
          </div>
          <div className="mb-3">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span
                className="text-2xl font-bold font-mono-tabular"
                style={{ color: riskColor(cycleRisk as RiskLevel) }}
              >
                {part.remainingCycles.toLocaleString()}
              </span>
              <span className="text-gray-400 text-sm font-mono-tabular">
                / {part.totalCycles.toLocaleString()} FC
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono-tabular">
              剩余 {part.totalCycles > 0 ? Math.round((part.remainingCycles / part.totalCycles) * 100) : 0}%
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${usedCyclePct}%`,
                background: `linear-gradient(90deg, ${riskColor(cycleRisk as RiskLevel)}EE, ${riskColor(cycleRisk as RiskLevel)}88)`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 font-mono-tabular mb-3">
            <span>已用 {part.usedCycles.toLocaleString()}</span>
            <span>额定 {part.totalCycles.toLocaleString()}</span>
          </div>
          <div className="text-xs leading-relaxed">{cycleMessage}</div>
        </div>

        {/* 第2栏：日历寿命 */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-aviation-600" />
              日历寿命
            </h4>
          </div>
          <div className="mb-3">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span
                className="text-2xl font-bold font-mono-tabular"
                style={{ color: riskColor(dayRisk as RiskLevel) }}
              >
                {part.remainingDays}
              </span>
              <span className="text-gray-400 text-sm">天</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-400">到期：</span>
              <span
                className={`font-mono-tabular font-semibold ${
                  part.remainingDays <= 30 ? "text-alert-critical" : "text-aviation-700"
                }`}
              >
                {part.expiryDate}
              </span>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${usedDayPct}%`,
                background: "linear-gradient(90deg, #1e3a5f, #34659d, #5b8fc9)",
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 font-mono-tabular mb-3">
            <span>已用 {part.usedDays} 天</span>
            <span>额定 {part.totalDays} 天</span>
          </div>
          <div className="text-xs leading-relaxed">{dayMessage}</div>
        </div>

        {/* 第3栏：排程状态 */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-aviation-600" />
              当前排程状态
            </h4>
          </div>

          {part.isScheduled ? (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-7 h-7 text-alert-safe shrink-0" />
                <span className="text-base font-bold text-alert-safe">已纳入排程</span>
              </div>
              {hasScheduleDetails ? (
                <div className="space-y-1.5 text-xs pl-9">
                  {part.plannedDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-gray-500">停场：</span>
                      <b className="font-mono-tabular text-gray-700">{part.plannedDate}</b>
                    </div>
                  )}
                  {part.plannedBay && (
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-gray-500">机位：</span>
                      <b className="font-mono-tabular text-gray-700">{part.plannedBay}</b>
                    </div>
                  )}
                  {part.plannedBase && (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-gray-500">基地：</span>
                      <b className="text-gray-700">{part.plannedBase}</b>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pl-9">
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                    ⚠️ 已排程但未设定停场日期/基地
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-7 h-7 text-alert-critical shrink-0" />
                <span className="text-base font-bold text-alert-critical">尚未排程</span>
              </div>
              <div className="pl-9">
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                  请拖入检修窗口
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            <div className="mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                  part.scheduleStatus !== "NONE"
                    ? riskBgClass(overallRisk)
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {SCHEDULE_LABEL[part.scheduleStatus]}
              </span>
            </div>
            <div className={`flex items-start gap-1.5 text-xs leading-relaxed ${scheduleAdvice.color}`}>
              <AdviceIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{scheduleAdvice.text}</span>
            </div>
          </div>
        </div>

        {/* 第4栏：综合决策 */}
        <div
          className={`rounded-xl border border-gray-100 bg-gradient-to-br ${riskGradientColors[overallRisk]} p-4 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" style={{ color: RISK_LEVEL_LABEL[overallRisk].color }} />
              综合决策建议
            </h4>
          </div>

          <div
            className="rounded-lg border p-3 mb-3"
            style={{
              borderColor: `${RISK_LEVEL_LABEL[overallRisk].color}40`,
              backgroundColor: `${RISK_LEVEL_LABEL[overallRisk].color}0A`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white"
                style={{ backgroundColor: RISK_LEVEL_LABEL[overallRisk].color }}
              >
                建议级别：{RISK_LEVEL_LABEL[overallRisk].label}
              </span>
            </div>
            <div
              className="text-sm font-semibold leading-relaxed"
              style={{ color: RISK_LEVEL_LABEL[overallRisk].color }}
            >
              {overallAdvice}
            </div>
          </div>

          {unconfirmedCount > 0 && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <b>{unconfirmedCount}</b> 条交接备注未确认，请及时跟进处理
              </span>
            </div>
          )}

          {unconfirmedCount === 0 && notes.length > 0 && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>交接备注均已确认，状态良好</span>
            </div>
          )}

          {notes.length === 0 && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>暂无交接备注</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
