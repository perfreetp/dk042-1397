import { useMemo } from "react";
import { X, MapPin, Calendar, FileText, Wrench, User, AlertTriangle, MessageSquare, Plane, Clock, CheckCircle2 } from "lucide-react";
import type { LifePart } from "@/types";
import { CATEGORY_LABEL, RISK_LABEL, SCHEDULE_LABEL, HANDOVER_LABEL, ROLE_LABEL } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { findRemovalById, findDocsByNumbers, findNotesByPartId } from "@/store/selectors";
import { riskBgClass, riskColor } from "@/utils/riskUtils";
import { cyclePercentage } from "@/utils/dateUtils";
import { formatDateTime } from "@/utils/dateUtils";
import LifeTrendPanel from "./LifeTrendPanel";

export default function PartDetailModal({ part, onClose }: { part: LifePart; onClose: () => void }) {
  const removalRecords = useAppStore((s) => s.removalRecords);
  const airworthinessDocs = useAppStore((s) => s.airworthinessDocs);
  const handoverNotes = useAppStore((s) => s.handoverNotes);
  const openDrawerForPart = useAppStore((s) => s.openDrawerForPart);

  const removal = useMemo(
    () => findRemovalById(removalRecords, part.lastRemovalId),
    [removalRecords, part.lastRemovalId]
  );
  const docs = useMemo(
    () => findDocsByNumbers(airworthinessDocs, part.airworthinessRefs),
    [airworthinessDocs, part.airworthinessRefs]
  );
  const notes = useMemo(
    () => findNotesByPartId(handoverNotes, part.id),
    [handoverNotes, part.id]
  );

  const cyclePct = cyclePercentage(part.remainingCycles, part.totalCycles);
  const dayPct = cyclePercentage(part.remainingDays, part.totalDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/45 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col animate-stagger-fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex items-start gap-5" style={{ background: `linear-gradient(135deg, ${riskColor(part.riskLevel)}10, #f8fafc 60%)` }}>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 shrink-0 ${riskBgClass(part.riskLevel)}`}>
            <Plane className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-aviation-800 leading-snug">{part.name}</h2>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${riskBgClass(part.riskLevel)}`}>
                {RISK_LABEL[part.riskLevel]}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-aviation-50 text-aviation-700 border border-aviation-100">
                {CATEGORY_LABEL[part.category]}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="text-gray-400 text-xs">件号</span>{" "}
                <b className="font-mono-tabular text-aviation-800">{part.partNumber}</b>
              </div>
              <div>
                <span className="text-gray-400 text-xs">序号</span>{" "}
                <b className="font-mono-tabular text-aviation-800">{part.serialNumber}</b>
              </div>
              <div>
                <span className="text-gray-400 text-xs">飞机</span>{" "}
                <b className="font-mono-tabular text-aviation-800">{part.aircraftReg}</b>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-7">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
            <div className="rounded-xl border border-gray-100 p-5 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-alert-warning" />
                  飞行循环 (FC)
                </h3>
                <span className="text-xs text-gray-400">Flight Cycles</span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold font-mono-tabular" style={{ color: riskColor(part.riskLevel) }}>
                  {part.remainingCycles.toLocaleString()}
                </span>
                <span className="text-gray-400">/ {part.totalCycles.toLocaleString()} 剩余 {cyclePct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${100 - cyclePct}%`,
                    background: `linear-gradient(90deg, ${riskColor(part.riskLevel)}, ${riskColor(part.riskLevel)}BB)`,
                  }}
                />
              </div>
              <div className="mt-2.5 flex justify-between text-[11px] text-gray-500 font-mono-tabular">
                <span>已用 {part.usedCycles.toLocaleString()}</span>
                <span>额定 {part.totalCycles.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-5 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-aviation-600" />
                  日历寿命
                </h3>
                <span className="text-xs text-gray-400">Calendar Life</span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold font-mono-tabular" style={{ color: riskColor(part.riskLevel) }}>
                  {part.remainingDays}
                </span>
                <span className="text-gray-500">天 剩余 {dayPct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${100 - dayPct}%`,
                    background: `linear-gradient(90deg, #1e3a5f, #34659d)`,
                  }}
                />
              </div>
              <div className="mt-2.5 flex justify-between items-center text-[11px]">
                <span className="text-gray-500">预计到寿日期：</span>
                <span className={`font-mono-tabular font-semibold ${part.remainingDays <= 30 ? "text-alert-critical" : "text-aviation-700"}`}>
                  {part.expiryDate}
                </span>
              </div>
            </div>
          </div>

          {/* 寿命趋势看板 */}
          <div className="mb-7">
            <LifeTrendPanel part={part} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Install Position */}
              <section>
                <h3 className="text-xs font-bold text-aviation-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  当前装机位置
                </h3>
                <div className="rounded-xl border border-aviation-100 p-4 bg-aviation-50/40">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-aviation-100 flex items-center justify-center shadow-sm shrink-0">
                      <Plane className="w-5 h-5 text-aviation-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-aviation-800">{part.installPosition}</div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>执管飞机 <b className="text-gray-700 font-mono-tabular">{part.aircraftReg}</b></span>
                        <span className={part.scheduleStatus !== "NONE" ? "" : "hidden"}>
                          处理标记 <b className="text-aviation-700">{SCHEDULE_LABEL[part.scheduleStatus]}</b>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Last Removal */}
              <section>
                <h3 className="text-xs font-bold text-aviation-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5" />
                  上次拆装记录
                </h3>
                {removal ? (
                  <div className="rounded-xl border border-gray-100 p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-aviation-400" />
                    <div className="pl-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-aviation-50 text-aviation-700 text-xs font-medium border border-aviation-100 font-mono-tabular">
                            {removal.date}
                          </span>
                          <span className="text-xs text-gray-500">{removal.station}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <User className="w-3.5 h-3.5" />
                          {removal.operator}
                        </div>
                      </div>
                      <div className="text-sm text-gray-800 mb-3">
                        <b>拆装原因：</b>
                        {removal.reason}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>拆下位置：<b className="text-gray-800">{removal.fromPosition}</b></div>
                        {removal.toAircraft && <div>新装去向：<b className="text-gray-800">{removal.toAircraft}</b></div>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    暂无拆装记录
                  </div>
                )}
              </section>

              {/* Airworthiness Docs */}
              <section>
                <h3 className="text-xs font-bold text-aviation-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  适航文件依据
                </h3>
                {docs.length > 0 ? (
                  <div className="space-y-2">
                    {docs.map((d) => (
                      <a
                        key={d.docNumber}
                        href={d.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-aviation-300 hover:bg-aviation-50/40 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-md bg-aviation-50 text-aviation-700 flex items-center justify-center shrink-0 border border-aviation-100 group-hover:bg-aviation-600 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <b className="font-mono-tabular text-sm text-aviation-800">{d.docNumber}</b>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                d.authority === "CAAC"
                                  ? "bg-red-50 text-red-700"
                                  : d.authority === "FAA"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {d.authority}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono-tabular">{d.issueDate}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1 leading-snug">{d.title}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                    未关联适航文件
                  </div>
                )}
              </section>
            </div>

            {/* Right column - Handover notes preview */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-aviation-700 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-alert-warning" />
                    交接备注 ({notes.length})
                  </h3>
                  <button
                    onClick={() => {
                      openDrawerForPart(part.id);
                      onClose();
                    }}
                    className="text-xs px-2.5 py-1 rounded-md bg-aviation-600 hover:bg-aviation-700 text-white transition-colors"
                  >
                    打开面板
                  </button>
                </div>
                {notes.some((n) => n.status !== "CONFIRMED") && (
                  <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-alert-warning/15 border border-alert-warning/30">
                    <AlertTriangle className="w-4 h-4 text-alert-warning shrink-0 mt-0.5" />
                    <div className="text-[11px] font-semibold text-alert-warning leading-relaxed">
                      ⚠️ 存在待处理交接，请及时确认
                    </div>
                  </div>
                )}
                {notes.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-6">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    暂无交接班备注
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.slice(-3).map((n) => (
                      <div key={n.id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-aviation-700">{n.author}</span>
                            <span className="text-[10px] text-gray-400">({ROLE_LABEL[n.authorRole]})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                n.status === "CONFIRMED"
                                  ? "bg-alert-safe/10 text-alert-safe"
                                  : n.status === "IN_PROGRESS"
                                    ? "bg-aviation-600/10 text-aviation-600"
                                    : "bg-alert-warning/10 text-alert-warning"
                              }`}
                            >
                              {HANDOVER_LABEL[n.status]}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">{n.content}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-mono-tabular">
                          <span>创建：{formatDateTime(n.createdAt)}</span>
                          {n.confirmedBy && (
                            <span className="inline-flex items-center gap-1 text-alert-safe">
                              <CheckCircle2 className="w-3 h-3" />
                              {n.confirmedBy}{n.confirmedAt ? ` · ${formatDateTime(n.confirmedAt)}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
