import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { computeFilteredParts } from "@/store/selectors";
import { Search, Filter, RotateCcw } from "lucide-react";

export default function PartsFilterBar() {
  const filters = useAppStore((s) => s.filters);
  const parts = useAppStore((s) => s.parts);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const filteredCount = useMemo(
    () => computeFilteredParts(parts, filters).length,
    [parts, filters]
  );
  const totalCount = parts.length;

  const inputBase =
    "w-full px-3 py-2 text-sm rounded-md bg-white border border-aviation-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-aviation-500/50 focus:border-aviation-500 transition-all font-mono-tabular";

  return (
    <div className="bg-gradient-to-r from-aviation-700 via-aviation-800 to-aviation-700 rounded-2xl p-5 shadow-lg border border-aviation-600/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">寿命件多维筛选</h3>
            <p className="text-aviation-200 text-xs mt-0.5">
              当前匹配 <b className="text-white">{filteredCount}</b> / {totalCount} 件
            </p>
          </div>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs transition-all border border-white/15"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置筛选
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <div>
          <label className="text-[11px] text-aviation-200 mb-1.5 block font-medium">件号 PN</label>
          <input
            type="text"
            placeholder="PN-EN-1001"
            value={filters.partNumber}
            onChange={(e) => setFilters({ partNumber: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label className="text-[11px] text-aviation-200 mb-1.5 block font-medium">序号 SN</label>
          <input
            type="text"
            placeholder="SNxxxxxx"
            value={filters.serialNumber}
            onChange={(e) => setFilters({ serialNumber: e.target.value })}
            className={inputBase}
          />
        </div>
        <div>
          <label className="text-[11px] text-aviation-200 mb-1.5 block font-medium">装机飞机</label>
          <input
            type="text"
            placeholder="B-5123"
            value={filters.aircraftReg}
            onChange={(e) => setFilters({ aircraftReg: e.target.value })}
            className={inputBase}
          />
        </div>
        <div className="lg:col-span-2 xl:col-span-1">
          <label className="text-[11px] text-aviation-200 mb-1.5 block font-medium">剩余循环 (FC)</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              placeholder="最小"
              value={filters.minRemainingCycles ?? ""}
              onChange={(e) =>
                setFilters({
                  minRemainingCycles: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className={inputBase + " w-1/2"}
            />
            <input
              type="number"
              placeholder="最大"
              value={filters.maxRemainingCycles ?? ""}
              onChange={(e) =>
                setFilters({
                  maxRemainingCycles: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className={inputBase + " w-1/2"}
            />
          </div>
        </div>
        <div className="lg:col-span-2 xl:col-span-1">
          <label className="text-[11px] text-aviation-200 mb-1.5 block font-medium">剩余天数 (天)</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              placeholder="最小"
              value={filters.minRemainingDays ?? ""}
              onChange={(e) =>
                setFilters({
                  minRemainingDays: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className={inputBase + " w-1/2"}
            />
            <input
              type="number"
              placeholder="最大"
              value={filters.maxRemainingDays ?? ""}
              onChange={(e) =>
                setFilters({
                  maxRemainingDays: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className={inputBase + " w-1/2"}
            />
          </div>
        </div>
        <div className="flex items-end">
          <button className="w-full px-4 py-2 rounded-md bg-alert-warning hover:bg-alert-warning/90 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-alert-warning/30 hover:shadow-hover">
            <Search className="w-4 h-4" />
            查询
          </button>
        </div>
      </div>
    </div>
  );
}
