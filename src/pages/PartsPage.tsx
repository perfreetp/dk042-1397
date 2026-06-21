import PartsFilterBar from "@/components/parts/PartsFilterBar";
import PartsTable from "@/components/parts/PartsTable";
import { ListChecks } from "lucide-react";

export default function PartsPage() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-gradient-to-b from-aviation-50/30 to-white">
      <div className="max-w-[1600px] mx-auto space-y-5 stagger">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aviation-600 to-aviation-800 flex items-center justify-center shadow-lg shadow-aviation-700/20">
              <ListChecks className="w-5.5 h-5.5 text-white" strokeWidth={2.1} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-aviation-800 tracking-tight">寿命件清单</h1>
              <p className="text-sm text-gray-500 mt-0.5">按多维度条件筛选在册寿命件，查看单件详细信息与适航依据</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-white px-4 py-2 rounded-lg border border-aviation-100 shadow-card">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-alert-critical animate-pulse-fast" /> 紧急
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-alert-warning animate-pulse-slow" /> 预警
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-alert-caution" /> 关注
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-alert-safe" /> 正常
            </span>
          </div>
        </div>

        <PartsFilterBar />
        <PartsTable />
      </div>
    </div>
  );
}
