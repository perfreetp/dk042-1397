import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BASE_OPTIONS } from "@/types";
import { daysFromToday } from "@/utils/dateUtils";
import { CalendarDays, MapPin, Building2, ClipboardList } from "lucide-react";

const BAY_OPTIONS = (() => {
  const options: string[] = [];
  for (let i = 1; i <= 20; i++) options.push(`A${String(i).padStart(2, "0")}`);
  for (let i = 1; i <= 15; i++) options.push(`B${String(i).padStart(2, "0")}`);
  for (let i = 1; i <= 10; i++) options.push(`C${String(i).padStart(2, "0")}`);
  for (let i = 1; i <= 8; i++) options.push(`D${String(i).padStart(2, "0")}`);
  return options;
})();

interface SchedulePlannerProps {
  partId: string;
}

export default function SchedulePlanner({ partId }: SchedulePlannerProps) {
  const parts = useAppStore((s) => s.parts);
  const updateScheduleDetails = useAppStore((s) => s.updateScheduleDetails);
  const part = useMemo(() => parts.find((p) => p.id === partId), [parts, partId]);

  if (!part) return null;

  const days = part.plannedDate ? daysFromToday(part.plannedDate) : null;
  const hasAnyDetail = part.plannedDate || part.plannedBay || part.plannedBase;

  const summaryParts = [];
  if (part.plannedDate) summaryParts.push(`📅 ${part.plannedDate}`);
  if (part.plannedBay) summaryParts.push(`机位 ${part.plannedBay}`);
  if (part.plannedBase) summaryParts.push(`基地 ${part.plannedBase}`);

  return (
    <div className="rounded-lg border border-aviation-100 bg-gradient-to-b from-aviation-50/60 to-white p-3 space-y-2.5">
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <ClipboardList className="w-3 h-3" />
        检修计划详情
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            <CalendarDays className="w-3 h-3" />
            计划停场日期
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={part.plannedDate || ""}
              onChange={(e) => updateScheduleDetails(partId, { plannedDate: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-aviation-500/40 focus:border-aviation-500 outline-none"
            />
            {days !== null && (
              <span className="text-[11px] text-gray-400 shrink-0">
                距离今天 {days >= 0 ? `${days} 天` : `已过 ${Math.abs(days)} 天`}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
              <MapPin className="w-3 h-3" />
              机位
            </div>
            <input
              type="text"
              list={`bay-list-${partId}`}
              value={part.plannedBay || ""}
              placeholder="如 A12"
              onChange={(e) => updateScheduleDetails(partId, { plannedBay: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-aviation-500/40 focus:border-aviation-500 outline-none"
            />
            <datalist id={`bay-list-${partId}`}>
              {BAY_OPTIONS.map((bay) => (
                <option key={bay} value={bay} />
              ))}
            </datalist>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
              <Building2 className="w-3 h-3" />
              维修基地
            </div>
            <select
              value={part.plannedBase || ""}
              onChange={(e) => updateScheduleDetails(partId, { plannedBase: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-aviation-500/40 focus:border-aviation-500 outline-none"
            >
              <option value="">选择基地</option>
              {BASE_OPTIONS.map((base) => (
                <option key={base} value={base}>
                  {base}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {hasAnyDetail && (
        <div className="text-[11px] text-aviation-700 bg-aviation-700/5 border border-aviation-100 rounded-md px-2.5 py-1.5">
          {summaryParts.join(" · ")}
        </div>
      )}
    </div>
  );
}
