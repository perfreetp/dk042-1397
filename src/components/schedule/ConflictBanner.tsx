import { useState, useMemo } from "react";
import type { ScheduleConflict } from "@/types";
import { getMaxSeverity } from "@/utils/conflictUtils";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface ConflictBannerProps {
  conflicts: ScheduleConflict[];
  onJumpToPart?: (partId: string) => void;
}

export default function ConflictBanner({ conflicts, onJumpToPart }: ConflictBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const maxSeverity = useMemo(() => getMaxSeverity(conflicts), [conflicts]);
  const hasCritical = maxSeverity === "CRITICAL";

  if (conflicts.length === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alert-safe/10 border border-alert-safe/30">
        <span className="text-sm">✅</span>
        <span className="text-xs font-medium text-alert-safe">暂无排程冲突</span>
      </div>
    );
  }

  const visibleConflicts = expanded ? conflicts : conflicts.slice(0, 3);
  const hiddenCount = conflicts.length - 3;

  const bannerClass = hasCritical
    ? "bg-alert-critical/10 border border-alert-critical/30 rounded-xl p-4"
    : "bg-alert-warning/10 border border-alert-warning/30 rounded-xl p-4";

  const textClass = hasCritical ? "text-alert-critical" : "text-alert-warning";
  const badgeBgClass = hasCritical ? "bg-alert-critical" : "bg-alert-warning";

  return (
    <div className={bannerClass}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${badgeBgClass} text-white shadow-md`}>
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-semibold text-sm ${textClass}`}>
              ⚠️ 检测到 {conflicts.length} 个排程冲突
            </h4>
            {conflicts.some((c) => c.severity === "CRITICAL") && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-alert-critical text-white uppercase tracking-wider">
                CRITICAL
              </span>
            )}
            {conflicts.some((c) => c.severity === "WARNING") && !conflicts.some((c) => c.severity === "CRITICAL") && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-alert-warning text-white uppercase tracking-wider">
                WARNING
              </span>
            )}
          </div>

          <div className="mt-2.5 space-y-1.5">
            {visibleConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={[
                  "text-xs leading-relaxed rounded-lg px-2.5 py-1.5",
                  conflict.severity === "CRITICAL"
                    ? "bg-white/70 border border-alert-critical/20"
                    : "bg-white/70 border border-alert-warning/20",
                ].join(" ")}
              >
                <span className={`font-medium ${conflict.severity === "CRITICAL" ? "text-alert-critical" : "text-alert-warning"}`}>
                  {conflict.severity === "CRITICAL" ? "🔴 " : "🟠 "}
                </span>
                <span className="text-gray-700">{conflict.description}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {conflict.partIds.map((partId, idx) => (
                    <button
                      key={partId}
                      onClick={() => onJumpToPart?.(partId)}
                      disabled={!onJumpToPart}
                      className={[
                        "px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-semibold transition-colors",
                        onJumpToPart
                          ? "bg-aviation-100 text-aviation-700 hover:bg-aviation-200 cursor-pointer border border-aviation-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200",
                      ].join(" ")}
                    >
                      {conflict.partNumbers[idx]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {conflicts.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`mt-2.5 flex items-center gap-1 text-xs font-medium ${textClass} hover:underline`}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  展开全部 ({conflicts.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
