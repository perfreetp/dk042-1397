import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { findNotesByPartId } from "@/store/selectors";
import type { LifePart } from "@/types";
import { CATEGORY_LABEL, RISK_LABEL, SCHEDULE_LABEL } from "@/types";
import { riskColor } from "@/utils/riskUtils";
import {
  GripVertical,
  Plane,
  Calendar,
  Repeat,
  MessageSquare,
  MapPin,
  Info,
  X,
} from "lucide-react";
import StatusMarker from "./StatusMarker";

export default function RiskCard({
  part,
  canDrag = true,
  showRemove = false,
  onRemove,
}: {
  part: LifePart;
  canDrag?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
}) {
  const openDrawerForPart = useAppStore((s) => s.openDrawerForPart);
  const handoverNotes = useAppStore((s) => s.handoverNotes);
  const notesCount = useMemo(
    () => findNotesByPartId(handoverNotes, part.id).length,
    [handoverNotes, part.id]
  );
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    setDragging(true);
    e.dataTransfer.setData("text/plain", part.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => setDragging(false);

  return (
    <div
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={[
        "group relative rounded-2xl bg-white border-2 shadow-card transition-all duration-200 overflow-hidden",
        dragging
          ? "opacity-50 scale-[0.98] shadow-hover rotate-[0.5deg]"
          : "hover:shadow-hover hover:-translate-y-0.5",
        canDrag ? "cursor-grab active:cursor-grabbing" : "",
      ].join(" ")}
      style={{ borderColor: `${riskColor(part.riskLevel)}45` }}
    >
      {/* Risk left bar */}
      <div
        className={[
          "absolute left-0 top-0 bottom-0 w-1.5",
          part.riskLevel === "CRITICAL"
            ? "bg-alert-critical animate-pulse-fast"
            : part.riskLevel === "WARNING"
              ? "bg-alert-warning animate-pulse-slow"
              : "bg-alert-caution",
        ].join(" ")}
      />
      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start gap-2 p-3.5 pb-2">
          {canDrag && (
            <div className="pt-1 opacity-40 group-hover:opacity-100 transition-opacity text-gray-400 shrink-0">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${riskColor(part.riskLevel)}15`,
                  color: riskColor(part.riskLevel),
                }}
              >
                {RISK_LABEL[part.riskLevel]}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-aviation-50 text-aviation-700 text-[10px] font-medium border border-aviation-100">
                {CATEGORY_LABEL[part.category]}
              </span>
              {showRemove && onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="ml-auto p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  title="移出计划"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-sm font-semibold text-aviation-800 leading-snug line-clamp-2">
              {part.name}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 font-mono-tabular">
              <span>PN: <b className="text-gray-700">{part.partNumber}</b></span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 px-3.5 pb-3">
          <div className="rounded-lg bg-gray-50 p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
              <Repeat className="w-3 h-3" />
              剩余循环
            </div>
            <div
              className="text-lg font-bold font-mono-tabular leading-tight"
              style={{ color: riskColor(part.riskLevel) }}
            >
              {part.remainingCycles.toLocaleString()}
              <span className="text-[10px] text-gray-400 font-normal ml-1">FC</span>
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
              <Calendar className="w-3 h-3" />
              剩余天数
            </div>
            <div
              className="text-lg font-bold font-mono-tabular leading-tight"
              style={{ color: riskColor(part.riskLevel) }}
            >
              {part.remainingDays}
              <span className="text-[10px] text-gray-400 font-normal ml-1">天</span>
            </div>
          </div>
        </div>

        {/* Aircraft + Position */}
        <div className="px-3.5 pb-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
            <Plane className="w-3.5 h-3.5 text-aviation-500 shrink-0" />
            <b className="font-mono-tabular text-aviation-800">{part.aircraftReg}</b>
            <span className="text-gray-400 truncate max-w-[120px]">· {part.installPosition.split(" ")[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {notesCount > 0 && (
              <button
                onClick={() => openDrawerForPart(part.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-alert-warning/10 text-alert-warning border border-alert-warning/20 hover:bg-alert-warning/20 transition-colors text-[11px] font-medium"
              >
                <MessageSquare className="w-3 h-3" />
                {notesCount}
              </button>
            )}
            <button
              onClick={() => setExpanded((x) => !x)}
              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-aviation-700 transition-colors"
              title="展开详情"
            >
              <Info className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Expanded section */}
        {expanded && (
          <div className="px-3.5 pb-4 pt-1 border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white animate-fade-in">
            <div className="space-y-3">
              <div className="flex items-start gap-1.5 text-xs text-gray-600 pt-2">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">装机位置</div>
                  <div className="text-gray-700">{part.installPosition}</div>
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-gray-600">
                <Calendar className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">预计到寿</div>
                  <div className={`font-mono-tabular font-semibold ${part.remainingDays <= 30 ? "text-alert-critical" : "text-gray-700"}`}>
                    {part.expiryDate}
                  </div>
                </div>
              </div>
              {part.scheduleStatus !== "NONE" && (
                <div className="rounded-md border border-gray-200 p-2 text-[11px]">
                  <span className="text-gray-500">当前标记：</span>
                  <b className="text-aviation-700">{SCHEDULE_LABEL[part.scheduleStatus]}</b>
                </div>
              )}
              <StatusMarker partId={part.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
