import { useState, useMemo } from "react";
import WarningWindowSelector from "@/components/schedule/WarningWindowSelector";
import ScheduleWindow from "@/components/schedule/ScheduleWindow";
import RiskCard from "@/components/schedule/RiskCard";
import WeeklyPlanView from "@/components/schedule/WeeklyPlanView";
import ConflictBanner from "@/components/schedule/ConflictBanner";
import { useAppStore } from "@/store/useAppStore";
import { computeWarningParts, computeUnscheduledWarningParts, computeScheduledParts } from "@/store/selectors";
import { detectConflicts } from "@/utils/conflictUtils";
import { CalendarClock, AlertTriangle, LayoutGrid, CalendarRange } from "lucide-react";

type ViewMode = "CARD" | "WEEKLY";

export default function SchedulePage() {
  const parts = useAppStore((s) => s.parts);
  const warningWindow = useAppStore((s) => s.warningWindow);
  const customCycles = useAppStore((s) => s.customCycles);
  const scheduledPartIds = useAppStore((s) => s.scheduledPartIds);
  const openDrawerForPart = useAppStore((s) => s.openDrawerForPart);
  const [viewMode, setViewMode] = useState<ViewMode>("CARD");

  const scheduledParts = useMemo(
    () => computeScheduledParts(parts, scheduledPartIds),
    [parts, scheduledPartIds]
  );
  const conflicts = useMemo(() => detectConflicts(scheduledParts), [scheduledParts]);

  const warningParts = useMemo(
    () => computeUnscheduledWarningParts(parts, warningWindow, customCycles, scheduledPartIds),
    [parts, warningWindow, customCycles, scheduledPartIds]
  );
  const allWarning = useMemo(
    () => computeWarningParts(parts, warningWindow, customCycles),
    [parts, warningWindow, customCycles]
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-gradient-to-b from-aviation-50/30 to-white">
      <div className="max-w-[1800px] mx-auto space-y-5 stagger">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-alert-warning to-alert-critical flex items-center justify-center shadow-lg shadow-alert-warning/30">
              <CalendarClock className="w-5.5 h-5.5 text-white" strokeWidth={2.1} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-aviation-800 tracking-tight">预警排程</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                通过时间窗口生成风险清单，拖入计划检修窗口并标记处理方式
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 bg-white px-4 py-2 rounded-lg border border-aviation-100 shadow-card">
            <AlertTriangle className="w-4 h-4 text-alert-warning" />
            <span>窗口风险总数 <b className="text-alert-critical font-mono-tabular text-sm">{allWarning.length}</b> 件，<b className="text-alert-critical">{warningParts.length}</b> 件待排程</span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode("CARD")}
              className={[
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                viewMode === "CARD"
                  ? "bg-white text-aviation-700 shadow-md shadow-gray-200"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <LayoutGrid className="w-4 h-4" />
              卡片拖拽模式
            </button>
            <button
              onClick={() => setViewMode("WEEKLY")}
              className={[
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                viewMode === "WEEKLY"
                  ? "bg-white text-aviation-700 shadow-md shadow-gray-200"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <CalendarRange className="w-4 h-4" />
              📅 周计划视图
            </button>
          </div>
        </div>

        <ConflictBanner
          conflicts={conflicts}
          onJumpToPart={(partId) => openDrawerForPart(partId)}
        />

        <WarningWindowSelector />

        {viewMode === "CARD" ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-[600px]">
            {/* Risk list */}
            <div className="xl:col-span-5 flex flex-col min-h-0">
              <div className="bg-white rounded-2xl border border-aviation-100 shadow-card overflow-hidden flex flex-col h-full">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-alert-warning/10 text-alert-warning flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm text-aviation-800">风险待排程列表</h3>
                    <span className="px-2 py-0.5 rounded-md bg-alert-critical/10 text-alert-critical text-[11px] font-bold">
                      {warningParts.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                  {warningParts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-alert-safe/10 text-alert-safe flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">太棒了！</div>
                      <div className="text-xs text-gray-500">所有风险件均已排入检修计划</div>
                      <div className="text-[11px] text-gray-400 mt-3">可切换更大的时间窗口查看更多</div>
                    </div>
                  ) : (
                    <div className="space-y-3 stagger">
                      {warningParts.map((p) => (
                        <RiskCard key={p.id} part={p} canDrag />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule window */}
            <div className="xl:col-span-7 min-h-[600px]">
              <ScheduleWindow />
            </div>
          </div>
        ) : (
          <div className="w-full">
            <WeeklyPlanView />
          </div>
        )}
      </div>
    </div>
  );
}
