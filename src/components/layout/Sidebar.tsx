import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { computeWarningParts, computePendingNotesCount } from "@/store/selectors";
import { CATEGORY_LABEL, RISK_LABEL } from "@/types";
import { riskColor } from "@/utils/riskUtils";
import { AlertTriangle, Wrench, FileWarning, AlertOctagon, CheckCircle2, TrendingDown } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-card border border-aviation-100 transition-all hover:shadow-hover">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 font-medium mb-1">{title}</div>
          <div className="text-2xl font-bold font-mono-tabular text-aviation-800">{value}</div>
          {sub && <div className="text-[11px] text-gray-400 mt-1">{sub}</div>}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const parts = useAppStore((s) => s.parts);
  const warningWindow = useAppStore((s) => s.warningWindow);
  const customCycles = useAppStore((s) => s.customCycles);
  const handoverNotes = useAppStore((s) => s.handoverNotes);

  const warningParts = useMemo(
    () => computeWarningParts(parts, warningWindow, customCycles),
    [parts, warningWindow, customCycles]
  );
  const pendingCount = useMemo(
    () => computePendingNotesCount(handoverNotes),
    [handoverNotes]
  );

  const { byCategory, byRisk, criticalAircraft } = useMemo(() => {
    const byCategory = {
      ENGINE_LLP: parts.filter((p) => p.category === "ENGINE_LLP").length,
      LANDING_GEAR: parts.filter((p) => p.category === "LANDING_GEAR").length,
      EMERGENCY_EQ: parts.filter((p) => p.category === "EMERGENCY_EQ").length,
      OTHER: parts.filter((p) => p.category === "OTHER").length,
    };
    const byRisk = {
      CRITICAL: warningParts.filter((p) => p.riskLevel === "CRITICAL").length,
      WARNING: warningParts.filter((p) => p.riskLevel === "WARNING").length,
      CAUTION: warningParts.filter((p) => p.riskLevel === "CAUTION").length,
    };
    const criticalAircraft = new Set(warningParts.filter((p) => p.riskLevel === "CRITICAL").map((p) => p.aircraftReg));
    return { byCategory, byRisk, criticalAircraft };
  }, [parts, warningParts]);

  return (
    <aside className="w-80 shrink-0 bg-aviation-50/50 border-r border-aviation-100 p-5 overflow-y-auto scrollbar-thin">
      <div className="space-y-5 stagger">
        <div>
          <h3 className="text-xs font-bold text-aviation-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-alert-warning" />
            总览指标
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="在册寿命件" value={parts.length} icon={Wrench} color="#34659d" sub="发动机/起落架/应急" />
            <StatCard title="预警总数" value={warningParts.length} icon={AlertTriangle} color="#e86a2c" sub="30/60/90天窗口" />
            <StatCard title="紧急告警" value={byRisk.CRITICAL} icon={AlertOctagon} color="#c53030" sub="≤15天或5%循环" />
            <StatCard title="待处理备注" value={pendingCount} icon={FileWarning} color="#d69e2e" sub="交接班待确认" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-aviation-700 uppercase tracking-wider mb-3">按类别分布</h3>
          <div className="bg-white rounded-xl border border-aviation-100 overflow-hidden">
            {(Object.keys(byCategory) as (keyof typeof byCategory)[]).map((k, idx) => (
              <div
                key={k}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  idx > 0 ? "border-t border-aviation-50" : ""
                }`}
              >
                <span className="text-gray-700">{CATEGORY_LABEL[k]}</span>
                <span className="font-mono-tabular font-semibold text-aviation-800">
                  {byCategory[k]}
                  <span className="text-xs text-gray-400 ml-1">件</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-aviation-700 uppercase tracking-wider mb-3">风险等级分布</h3>
          <div className="bg-white rounded-xl border border-aviation-100 p-4 space-y-3">
            {(["CRITICAL", "WARNING", "CAUTION"] as const).map((k) => {
              const total = warningParts.length || 1;
              const pct = Math.round((byRisk[k] / total) * 100);
              return (
                <div key={k}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: riskColor(k) }}
                      />
                      <span className="text-gray-700">{RISK_LABEL[k]}</span>
                    </span>
                    <span className="font-mono-tabular font-semibold text-gray-800">{byRisk[k]}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: riskColor(k),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {criticalAircraft.size > 0 && (
          <div>
            <h3 className="text-xs font-bold text-alert-critical uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 animate-pulse-fast" />
              紧急涉及飞机
            </h3>
            <div className="bg-white rounded-xl border-2 border-alert-critical/30 p-3 shadow-card">
              <div className="flex flex-wrap gap-2">
                {[...criticalAircraft].map((reg) => (
                  <span
                    key={reg}
                    className="px-2.5 py-1 rounded-md bg-alert-critical/10 text-alert-critical text-sm font-mono-tabular font-semibold border border-alert-critical/20"
                  >
                    {reg}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-gray-500 leading-relaxed">
                上述飞机含紧急寿命件，请优先安排停场与换件计划
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-alert-safe uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            合规提示
          </h3>
          <div className="bg-white rounded-xl border border-aviation-100 p-4 text-[12px] text-gray-600 leading-relaxed space-y-2">
            <p>• 紧急寿命件需在 <b className="text-alert-critical">15 日历天</b>内完成拆换</p>
            <p>• 预警件建议与 <b className="text-alert-warning">就近 A/C 检</b> 合并执行</p>
            <p>• 所有换件均需留存 <b className="text-aviation-700">适航指令依据</b></p>
            <p>• 夜班决策必须记录 <b className="text-alert-caution">交接备注</b> 并次日确认</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
