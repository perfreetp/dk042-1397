import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { computeWarningParts } from "@/store/selectors";
import type { WarningWindow } from "@/types";
import { WINDOW_LABEL } from "@/types";
import { CalendarDays, Repeat } from "lucide-react";

const OPTIONS: { value: WarningWindow; label: string; sub: string }[] = [
  { value: "30D", label: "未来 30 天", sub: "近期紧急处理" },
  { value: "60D", label: "未来 60 天", sub: "月度排程窗口" },
  { value: "90D", label: "未来 90 天", sub: "季度滚动计划" },
  { value: "CUSTOM", label: "自定义循环", sub: "按飞行 FC 数筛选" },
];

export default function WarningWindowSelector() {
  const window = useAppStore((s) => s.warningWindow);
  const setWarningWindow = useAppStore((s) => s.setWarningWindow);
  const customCycles = useAppStore((s) => s.customCycles);
  const setCustomCycles = useAppStore((s) => s.setCustomCycles);
  const parts = useAppStore((s) => s.parts);

  const warningCount = useMemo(
    () => computeWarningParts(parts, window, customCycles).length,
    [parts, window, customCycles]
  );

  return (
    <div className="bg-white rounded-2xl border border-aviation-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-alert-warning/10 text-alert-warning flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-aviation-800 text-sm">预警时间窗口</h3>
            <p className="text-xs text-gray-500">当前窗口命中 <b className="text-alert-critical">{warningCount}</b> 件风险寿命件</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {OPTIONS.map((o) => {
          const active = window === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setWarningWindow(o.value)}
              className={[
                "relative group text-left p-3.5 rounded-xl border-2 transition-all duration-200",
                active
                  ? "bg-gradient-to-br from-aviation-700 to-aviation-800 text-white border-aviation-700 shadow-lg shadow-aviation-700/20"
                  : "bg-white text-gray-700 border-gray-100 hover:border-aviation-200 hover:bg-aviation-50/40",
              ].join(" ")}
            >
              <div className={`text-sm font-semibold ${active ? "text-white" : "text-aviation-800"}`}>
                {WINDOW_LABEL[o.value]}
              </div>
              <div className={`text-[11px] mt-1 ${active ? "text-aviation-100" : "text-gray-500"}`}>
                {o.sub}
              </div>
              {active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse-slow" />
              )}
            </button>
          );
        })}
      </div>

      {window === "CUSTOM" && (
        <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-aviation-50/60 border border-aviation-100">
          <Repeat className="w-4 h-4 text-aviation-600 shrink-0" />
          <span className="text-sm text-gray-700 whitespace-nowrap">剩余飞行循环 ≤</span>
          <input
            type="number"
            value={customCycles}
            onChange={(e) => setCustomCycles(Math.max(0, Number(e.target.value) || 0))}
            className="px-3 py-2 rounded-lg bg-white border border-aviation-200 w-32 font-mono-tabular text-sm focus:outline-none focus:ring-2 focus:ring-aviation-500/50 focus:border-aviation-500"
          />
          <span className="text-xs text-gray-500">FC（Flight Cycles）</span>
        </div>
      )}
    </div>
  );
}
