import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { LifePart, ScheduleStatus } from "@/types";
import { SCHEDULE_LABEL } from "@/types";
import { ShoppingCart, Wrench, CalendarCheck2, XCircle, Check } from "lucide-react";

const OPTIONS: {
  value: ScheduleStatus;
  label: string;
  icon: any;
  colorClass: string;
  desc: string;
}[] = [
  {
    value: "NEED_ORDER",
    label: "需订件",
    icon: ShoppingCart,
    colorClass: "from-blue-500 to-blue-700 text-blue-600 border-blue-200 bg-blue-50",
    desc: "库房缺件需发起采购订单",
  },
  {
    value: "NEED_REPAIR",
    label: "需送修",
    icon: Wrench,
    colorClass: "from-purple-500 to-purple-700 text-purple-600 border-purple-200 bg-purple-50",
    desc: "拆下后送 OEM/AMO 大修",
  },
  {
    value: "MERGE_CHECK",
    label: "合并定检",
    icon: CalendarCheck2,
    colorClass: "from-emerald-500 to-emerald-700 text-emerald-600 border-emerald-200 bg-emerald-50",
    desc: "与就近 A/C 检工作包合并",
  },
];

export default function StatusMarker({ partId }: { partId: LifePart["id"] }) {
  const parts = useAppStore((s) => s.parts);
  const setScheduleStatus = useAppStore((s) => s.setScheduleStatus);
  const part = useMemo(() => parts.find((p) => p.id === partId), [parts, partId]);
  if (!part) return null;

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <Check className="w-3 h-3" />
        处理标记
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const active = part.scheduleStatus === o.value;
          const [gradient, text, border, bg] = o.colorClass.split(" ");
          return (
            <button
              key={o.value}
              onClick={() => setScheduleStatus(part.id, active ? "NONE" : o.value)}
              className={[
                "relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all duration-200",
                active
                  ? `${bg} ${border} shadow-md`
                  : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-white hover:border-gray-200 hover:text-gray-600",
              ].join(" ")}
            >
              <div
                className={[
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  active
                    ? `bg-gradient-to-br ${gradient} text-white shadow-inner`
                    : "bg-white border border-gray-100 text-gray-400",
                ].join(" ")}
              >
                <o.icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <div className={`text-[11px] font-semibold ${active ? text : ""}`}>
                {SCHEDULE_LABEL[o.value]}
              </div>
              {active && (
                <div className={`absolute top-1 right-1 w-4 h-4 rounded-full bg-gradient-to-br ${gradient} text-white flex items-center justify-center animate-fade-in`}>
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {part.scheduleStatus !== "NONE" && (
        <button
          onClick={() => setScheduleStatus(part.id, "NONE")}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-3 h-3" />
          清除标记
        </button>
      )}
    </div>
  );
}
