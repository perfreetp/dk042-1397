import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { computeFilteredParts } from "@/store/selectors";
import { CATEGORY_LABEL, RISK_LABEL, SCHEDULE_LABEL, type LifePart } from "@/types";
import { riskBgClass, riskBarClass, riskColor } from "@/utils/riskUtils";
import { cyclePercentage } from "@/utils/dateUtils";
import { ChevronRight, MessageSquare, Calendar, Wrench } from "lucide-react";
import PartDetailModal from "./PartDetailModal";

function ProgressBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = cyclePercentage(used, total);
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ScheduleBadge({ status }: { status: LifePart["scheduleStatus"] }) {
  if (status === "NONE") return null;
  const map = {
    NEED_ORDER: "bg-blue-50 text-blue-700 border-blue-200",
    NEED_REPAIR: "bg-purple-50 text-purple-700 border-purple-200",
    MERGE_CHECK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[status]}`}>
      {status === "NEED_ORDER" && <Wrench className="w-3 h-3" />}
      {status === "MERGE_CHECK" && <Calendar className="w-3 h-3" />}
      {SCHEDULE_LABEL[status]}
    </span>
  );
}

export default function PartsTable() {
  const allParts = useAppStore((s) => s.parts);
  const filters = useAppStore((s) => s.filters);
  const handoverNotes = useAppStore((s) => s.handoverNotes);
  const openDrawerForPart = useAppStore((s) => s.openDrawerForPart);
  const [selectedPart, setSelectedPart] = useState<LifePart | null>(null);

  const parts = useMemo(
    () => computeFilteredParts(allParts, filters),
    [allParts, filters]
  );

  const noteCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of handoverNotes) {
      map.set(note.partId, (map.get(note.partId) || 0) + 1);
    }
    return map;
  }, [handoverNotes]);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-aviation-100 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-aviation-50 text-aviation-700 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3.5 font-semibold w-1.5"></th>
              <th className="text-left px-3 py-3.5 font-semibold">件号 / 序号</th>
              <th className="text-left px-3 py-3.5 font-semibold">名称 / 类别</th>
              <th className="text-left px-3 py-3.5 font-semibold">装机飞机</th>
              <th className="text-left px-3 py-3.5 font-semibold min-w-[160px]">循环寿命 (FC)</th>
              <th className="text-left px-3 py-3.5 font-semibold min-w-[160px]">日历寿命</th>
              <th className="text-left px-3 py-3.5 font-semibold">风险</th>
              <th className="text-left px-3 py-3.5 font-semibold">状态</th>
              <th className="text-left px-3 py-3.5 font-semibold w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {parts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                  <div className="inline-flex flex-col items-center gap-2">
                    <Wrench className="w-10 h-10 text-gray-200" />
                    <div className="text-sm">暂无匹配的寿命件数据</div>
                    <div className="text-xs">请调整筛选条件</div>
                  </div>
                </td>
              </tr>
            )}
            {parts.map((p, idx) => {
              const noteCount = noteCountMap.get(p.id) || 0;
              const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/40";
              return (
                <tr
                  key={p.id}
                  className={`${rowBg} hover:bg-aviation-50/60 transition-colors duration-150 group cursor-pointer border-t border-gray-100`}
                  onClick={() => setSelectedPart(p)}
                >
                  <td className={`px-0 py-3 align-top`}>
                    <div className={`w-1 h-full min-h-[72px] ${riskBarClass(p.riskLevel)} rounded-r-sm`} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono-tabular font-semibold text-aviation-800 text-sm">
                      {p.partNumber}
                    </div>
                    <div className="font-mono-tabular text-xs text-gray-500 mt-0.5">{p.serialNumber}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-gray-800 font-medium leading-snug max-w-[260px] line-clamp-2">{p.name}</div>
                    <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-aviation-50 text-aviation-600 text-[11px] border border-aviation-100">
                      {CATEGORY_LABEL[p.category]}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono-tabular font-semibold text-aviation-700">{p.aircraftReg}</div>
                    <div className="text-[11px] text-gray-500 leading-snug mt-0.5 max-w-[140px] line-clamp-2">
                      {p.installPosition}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-mono-tabular font-bold text-base`}
                        style={{ color: riskColor(p.riskLevel) }}
                      >
                        {p.remainingCycles.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">/ {p.totalCycles.toLocaleString()}</span>
                    </div>
                    <ProgressBar used={p.usedCycles} total={p.totalCycles} color={riskColor(p.riskLevel)} />
                    <div className="text-[10px] text-gray-400 mt-1 font-mono-tabular">
                      剩余 {cyclePercentage(p.remainingCycles, p.totalCycles)}%
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-mono-tabular font-bold text-base`}
                        style={{ color: riskColor(p.riskLevel) }}
                      >
                        {p.remainingDays}
                      </span>
                      <span className="text-xs text-gray-400">天</span>
                    </div>
                    <ProgressBar used={p.usedDays} total={p.totalDays} color={riskColor(p.riskLevel)} />
                    <div className="text-[10px] text-gray-500 mt-1 font-mono-tabular">
                      到寿 {p.expiryDate}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${riskBgClass(
                        p.riskLevel
                      )}`}
                    >
                      {RISK_LABEL[p.riskLevel]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <ScheduleBadge status={p.scheduleStatus} />
                      {p.isScheduled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-alert-warning/10 text-alert-warning border border-alert-warning/20">
                          <Calendar className="w-3 h-3" />
                          已排程
                        </span>
                      )}
                      {noteCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawerForPart(p.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-aviation-50 text-aviation-700 border border-aviation-200 hover:bg-aviation-100 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          备注 {noteCount}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button className="opacity-0 group-hover:opacity-100 transition-all inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-aviation-600 text-white text-xs font-medium hover:bg-aviation-700 shadow-sm">
                      详情
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedPart && <PartDetailModal part={selectedPart} onClose={() => setSelectedPart(null)} />}
    </div>
  );
}
