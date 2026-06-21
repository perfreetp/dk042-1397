import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { computeScheduledParts } from "@/store/selectors";
import RiskCard from "./RiskCard";
import type { LifePart } from "@/types";
import { CalendarRange, CalendarDays, XCircle, CheckCircle2, Clock } from "lucide-react";
import { addDays, formatDate } from "@/utils/dateUtils";

function TimelineRow({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-gray-600 font-medium whitespace-nowrap">{label}</span>
      <div className={`h-1.5 rounded-full flex-1 ${color === "#c53030" ? "bg-alert-critical/10" : color === "#e86a2c" ? "bg-alert-warning/10" : "bg-alert-caution/10"}`}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.random() * 30 + 30}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ScheduleWindow() {
  const parts = useAppStore((s) => s.parts);
  const scheduledPartIds = useAppStore((s) => s.scheduledPartIds);
  const schedulePart = useAppStore((s) => s.schedulePart);
  const unschedulePart = useAppStore((s) => s.unschedulePart);
  const [dragOver, setDragOver] = useState(false);

  const scheduledParts = useMemo(
    () => computeScheduledParts(parts, scheduledPartIds),
    [parts, scheduledPartIds]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const partId = e.dataTransfer.getData("text/plain");
    if (partId) schedulePart(partId);
  };

  const today = new Date();

  return (
    <div className="rounded-2xl bg-white border border-aviation-100 shadow-card overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-aviation-700 via-aviation-800 to-aviation-700 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <CalendarRange className="w-4.5 h-4.5" strokeWidth={2.1} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">计划检修窗口</h3>
              <p className="text-[11px] text-aviation-100">
                将左侧风险卡片拖入此处进行排程 · 共 <b className="text-white">{scheduledParts.length}</b> 件待执行
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-aviation-100">
            <div className="px-2.5 py-1 rounded-md bg-white/10 font-mono-tabular">
              {formatDate(today)}
            </div>
            <span>→</span>
            <div className="px-2.5 py-1 rounded-md bg-alert-warning/30 text-white font-mono-tabular border border-white/20">
              {formatDate(addDays(today, 30))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline header */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 hidden lg:block">
        <div className="space-y-1.5">
          <TimelineRow label="紧急 (<15d)" color="#c53030" />
          <TimelineRow label="预警 (<30d)" color="#e86a2c" />
          <TimelineRow label="关注 (<60d)" color="#d69e2e" />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "relative flex-1 min-h-[320px] p-4 transition-all duration-200",
          dragOver
            ? "bg-aviation-600/5 ring-4 ring-aviation-500/30 ring-inset"
            : "bg-white",
        ].join(" ")}
      >
        {scheduledParts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div
              className={[
                "w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center mb-4 transition-all",
                dragOver
                  ? "border-aviation-500 bg-aviation-50 scale-105"
                  : "border-gray-200 bg-gray-50",
              ].join(" ")}
            >
              <CalendarDays
                className={`w-9 h-9 transition-colors ${
                  dragOver ? "text-aviation-600" : "text-gray-300"
                }`}
              />
            </div>
            <h4 className="text-sm font-semibold text-aviation-800 mb-1">
              {dragOver ? "松开以加入检修计划" : "拖入风险寿命件卡片"}
            </h4>
            <p className="text-xs text-gray-500 max-w-xs">
              拖动左侧风险列表中的卡片到本区域，即可将该寿命件纳入近期检修排程
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 stagger">
            {scheduledParts.map((p: LifePart) => (
              <RiskCard
                key={p.id}
                part={p}
                canDrag
                showRemove
                onRemove={() => unschedulePart(p.id)}
              />
            ))}
          </div>
        )}

        {dragOver && scheduledParts.length > 0 && (
          <div className="absolute inset-x-4 top-4 py-3 rounded-xl border-2 border-dashed border-aviation-500/60 bg-aviation-50/80 flex items-center justify-center text-aviation-700 text-sm font-medium pointer-events-none animate-pulse-slow">
            <CalendarDays className="w-4 h-4 mr-2" />
            松开鼠标以加入检修计划
          </div>
        )}
      </div>

      {/* Summary footer */}
      {scheduledParts.length > 0 && (
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/80">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-blue-600" />
                需订件 <b className="text-blue-700 font-mono-tabular">{scheduledParts.filter(p => p.scheduleStatus === "NEED_ORDER").length}</b>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                需送修 <b className="text-purple-700 font-mono-tabular">{scheduledParts.filter(p => p.scheduleStatus === "NEED_REPAIR").length}</b>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                合并定检 <b className="text-emerald-700 font-mono-tabular">{scheduledParts.filter(p => p.scheduleStatus === "MERGE_CHECK").length}</b>
              </span>
            </div>
            <button className="px-3.5 py-1.5 rounded-md bg-alert-warning hover:bg-alert-warning/90 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5" />
              生成排程报表
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
