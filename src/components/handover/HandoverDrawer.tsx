import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { findNotesByPartId, findPartsWithNotes, computePendingNotesCount } from "@/store/selectors";
import NoteItem from "./NoteItem";
import NoteForm from "./NoteForm";
import NoteCardWithSchedule from "./NoteCardWithSchedule";
import PartDetailModal from "@/components/parts/PartDetailModal";
import type { LifePart } from "@/types";
import { CATEGORY_LABEL, RISK_LABEL } from "@/types";
import { riskColor, riskBgClass } from "@/utils/riskUtils";
import {
  X,
  MessageSquareText,
  Plane,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  PlayCircle,
  ChevronRight,
  List,
  ListOrdered,
  Search,
} from "lucide-react";

type ViewMode = "PART" | "TIMELINE";

export default function HandoverDrawer() {
  const drawerOpen = useAppStore((s) => s.drawerOpen);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const activePartId = useAppStore((s) => s.activePartId);
  const openDrawerForPart = useAppStore((s) => s.openDrawerForPart);
  const parts = useAppStore((s) => s.parts);
  const handoverNotes = useAppStore((s) => s.handoverNotes);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "CONFIRMED">("ALL");
  const [aircraftFilter, setAircraftFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("PART");
  const [detailPart, setDetailPart] = useState<LifePart | null>(null);

  const partsWithNotes = useMemo(() => findPartsWithNotes(parts, handoverNotes), [parts, handoverNotes]);

  const filteredPartsWithNotes = useMemo(() => {
    if (!aircraftFilter.trim()) return partsWithNotes;
    const kw = aircraftFilter.trim().toLowerCase();
    return partsWithNotes.filter(p => p.aircraftReg.toLowerCase().includes(kw));
  }, [partsWithNotes, aircraftFilter]);

  const currentPart: LifePart | undefined = useMemo(() => {
    if (activePartId) return parts.find(p => p.id === activePartId);
    return filteredPartsWithNotes[0];
  }, [activePartId, parts, filteredPartsWithNotes]);

  const notesForPart = useMemo(() => {
    if (!currentPart) return [];
    let arr = findNotesByPartId(handoverNotes, currentPart.id);
    if (filter !== "ALL") arr = arr.filter(n => n.status === filter);
    return arr;
  }, [currentPart, handoverNotes, filter]);

  const timelineNotes = useMemo(() => {
    let arr = [...handoverNotes];
    if (filter !== "ALL") arr = arr.filter(n => n.status === filter);
    if (aircraftFilter.trim()) {
      const kw = aircraftFilter.trim().toLowerCase();
      arr = arr.filter(n => {
        const part = parts.find(p => p.id === n.partId);
        return part?.aircraftReg.toLowerCase().includes(kw);
      });
    }
    return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [handoverNotes, filter, aircraftFilter, parts]);

  const counts = useMemo(() => {
    const unconfirmed = computePendingNotesCount(handoverNotes);
    return {
      total: handoverNotes.length,
      pending: handoverNotes.filter(n => n.status === "PENDING").length,
      progress: handoverNotes.filter(n => n.status === "IN_PROGRESS").length,
      confirmed: handoverNotes.filter(n => n.status === "CONFIRMED").length,
      unconfirmed,
    };
  }, [handoverNotes]);

  if (!drawerOpen) return null;

  const isTimeline = viewMode === "TIMELINE";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-40 animate-fade-in"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="fixed top-0 right-0 bottom-0 z-50 w-full md:w-[620px] max-w-full bg-white shadow-2xl flex flex-col animate-slide-in-right border-l border-aviation-100">
        <div className="px-6 py-4 bg-gradient-to-r from-aviation-700 via-aviation-800 to-aviation-700 text-white border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <MessageSquareText className="w-5 h-5" strokeWidth={2.1} />
              </div>
              <div>
                <h2 className="font-bold text-lg">交接备注中心</h2>
                <p className="text-[11px] text-aviation-100 mt-0.5">
                  夜班决策留痕 · 白班确认闭环 · 寿命件管理无遗漏
                </p>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-md text-aviation-100 hover:bg-white/15 hover:text-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold font-mono-tabular">{counts.total}</div>
              <div className="text-[10px] text-aviation-100">全部备注</div>
            </div>
            <div className="bg-alert-warning/30 rounded-lg p-2 text-center border border-alert-warning/30">
              <div className="text-xl font-bold font-mono-tabular text-white">{counts.pending}</div>
              <div className="text-[10px] text-aviation-100">待处理</div>
            </div>
            <div className="bg-aviation-500/30 rounded-lg p-2 text-center">
              <div className="text-xl font-bold font-mono-tabular text-white">{counts.progress}</div>
              <div className="text-[10px] text-aviation-100">处理中</div>
            </div>
            <div className="bg-alert-safe/30 rounded-lg p-2 text-center">
              <div className="text-xl font-bold font-mono-tabular text-white">{counts.confirmed}</div>
              <div className="text-[10px] text-aviation-100">已确认</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 p-0.5 rounded-lg bg-white/10 w-fit">
            <button
              onClick={() => setViewMode("PART")}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                !isTimeline ? "bg-white text-aviation-800 shadow-sm" : "text-white/80 hover:text-white hover:bg-white/10",
              ].join(" ")}
            >
              <List className="w-3.5 h-3.5" />
              零件视图
            </button>
            <button
              onClick={() => setViewMode("TIMELINE")}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                isTimeline ? "bg-white text-aviation-800 shadow-sm" : "text-white/80 hover:text-white hover:bg-white/10",
              ].join(" ")}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              全局时间线
            </button>
          </div>
        </div>

        {!isTimeline ? (
          <div className="flex-1 min-h-0 flex">
            <div className="w-56 shrink-0 border-r border-gray-100 bg-gray-50/40 overflow-y-auto scrollbar-thin">
              <div className="p-3 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                  <Plane className="w-3 h-3" />
                  涉及寿命件
                </div>
                <div className="relative mb-2">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={aircraftFilter}
                    onChange={(e) => setAircraftFilter(e.target.value)}
                    placeholder="输入飞机号筛选..."
                    className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-xs w-full focus:ring-2 focus:ring-aviation-500/40 outline-none pl-7"
                  />
                </div>
                <div className="text-[10px] text-gray-400">
                  共 <b className="text-gray-700">{filteredPartsWithNotes.length}</b> 件有备注记录
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                {filteredPartsWithNotes.map((p) => {
                  const pNotes = handoverNotes.filter(n => n.partId === p.id);
                  const unread = pNotes.filter(n => n.status !== "CONFIRMED").length;
                  const active = currentPart?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => openDrawerForPart(p.id)}
                      className={[
                        "w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2",
                        active
                          ? "bg-white shadow-card border border-aviation-200"
                          : "hover:bg-white hover:border border-transparent",
                      ].join(" ")}
                    >
                      <span
                        className="w-1 shrink-0 rounded-full self-stretch"
                        style={{ backgroundColor: riskColor(p.riskLevel) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono-tabular text-[11px] font-semibold text-aviation-800 truncate">
                            {p.aircraftReg}
                          </span>
                          {unread > 0 && (
                            <span className="px-1.5 h-4 min-w-[16px] rounded-full bg-alert-critical text-white text-[9px] font-bold flex items-center justify-center shrink-0 animate-pulse-fast">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">
                          {p.name}
                        </div>
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          <span
                            className="px-1 py-0.5 rounded text-[9px] font-semibold"
                            style={{
                              backgroundColor: `${riskColor(p.riskLevel)}15`,
                              color: riskColor(p.riskLevel),
                            }}
                          >
                            {RISK_LABEL[p.riskLevel]}
                          </span>
                          <span className="px-1 py-0.5 rounded bg-gray-100 text-gray-600 text-[9px]">
                            {CATEGORY_LABEL[p.category]}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 transition-transform ${active ? "text-aviation-600 translate-x-0.5" : "text-gray-300"}`} />
                    </button>
                  );
                })}
                {filteredPartsWithNotes.length === 0 && (
                  <div className="py-8 text-center text-[11px] text-gray-400">
                  <MessageSquareText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  暂无交接记录
                </div>
              )}
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              {currentPart ? (
                <div
                  className="p-4 border-b border-gray-100"
                  style={{
                    background: `linear-gradient(135deg, ${riskColor(currentPart.riskLevel)}0A, #ffffff 60%)`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${riskBgClass(currentPart.riskLevel)}`}
                    >
                      <Plane className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-aviation-800 leading-snug line-clamp-2">
                        {currentPart.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-mono-tabular text-gray-500">
                          {currentPart.partNumber}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="font-mono-tabular text-gray-700 font-semibold">
                          {currentPart.aircraftReg}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span
                          className="font-mono-tabular font-semibold"
                          style={{ color: riskColor(currentPart.riskLevel) }}
                        >
                          {currentPart.remainingDays}天 / {currentPart.remainingCycles.toLocaleString()}FC
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-400 border-b border-gray-100">
                  请从左侧选择一件寿命件查看备注
                </div>
              )}

              {currentPart && (
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/40 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white border border-gray-200">
                    <Filter className="w-3.5 h-3.5 ml-2 text-gray-400" />
                    {(
                      [
                        { key: "ALL", label: "全部", icon: MessageSquareText },
                        { key: "PENDING", label: "待处理", icon: AlertCircle },
                        { key: "IN_PROGRESS", label: "处理中", icon: PlayCircle },
                        { key: "CONFIRMED", label: "已确认", icon: CheckCircle2 },
                      ] as const
                    ).map((t) => {
                      const active = filter === t.key;
                      const count =
                        t.key === "ALL"
                          ? handoverNotes.filter(n => n.partId === currentPart.id).length
                          : handoverNotes.filter(n => n.partId === currentPart.id && n.status === t.key).length;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setFilter(t.key)}
                          className={[
                            "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                            active
                              ? "bg-aviation-700 text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          <t.icon className="w-3 h-3" />
                          {t.label}
                          <span
                            className={[
                              "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                              active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                            ].join(" ")}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    按时间升序
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4">
                {currentPart && notesForPart.length > 0 ? (
                  <div className="space-y-3 stagger pb-10">
                    {notesForPart.map((n) => (
                      <NoteItem key={n.id} note={n} />
                    ))}
                  </div>
                ) : currentPart ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                      <MessageSquareText className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-1">暂无{filter === "ALL" ? "" : "符合条件的"}备注</div>
                    <div className="text-xs text-gray-400 max-w-xs">
                      请在下方输入框记录判断依据、处理动作或待确认事项
                    </div>
                  </div>
                ) : null}
              </div>

              {currentPart && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/60">
                  <NoteForm partId={currentPart.id} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={aircraftFilter}
                    onChange={(e) => setAircraftFilter(e.target.value)}
                    placeholder="输入飞机号筛选..."
                    className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-xs w-full focus:ring-2 focus:ring-aviation-500/40 outline-none pl-7"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-50 border border-gray-200">
                  <Filter className="w-3.5 h-3.5 ml-2 text-gray-400" />
                  {(
                    [
                      { key: "ALL", label: "全部", icon: MessageSquareText },
                      { key: "PENDING", label: "待处理", icon: AlertCircle },
                      { key: "IN_PROGRESS", label: "处理中", icon: PlayCircle },
                      { key: "CONFIRMED", label: "已确认", icon: CheckCircle2 },
                    ] as const
                  ).map((t) => {
                    const active = filter === t.key;
                    const count =
                      t.key === "ALL"
                        ? timelineNotes.length
                        : timelineNotes.filter(n => n.status === t.key).length;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setFilter(t.key)}
                        className={[
                          "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                          active
                            ? "bg-aviation-700 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <t.icon className="w-3 h-3" />
                        {t.label}
                        <span
                          className={[
                            "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                          ].join(" ")}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  按时间倒序（共 {timelineNotes.length}条）
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4">
              {timelineNotes.length > 0 ? (
                <div className="space-y-3 stagger pb-10">
                  {timelineNotes.map((n) => {
                    const part = parts.find(p => p.id === n.partId);
                    return (
                      <NoteCardWithSchedule
                        key={n.id}
                        note={n}
                        part={part}
                        onOpenPart={(partId) => {
                          openDrawerForPart(partId);
                          setViewMode("PART");
                        }}
                        onOpenPartDetail={(p) => setDetailPart(p)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                    <ListOrdered className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="text-sm font-medium text-gray-700 mb-1">暂无{filter === "ALL" ? "" : "符合条件的"}备注</div>
                  <div className="text-xs text-gray-400 max-w-xs">
                    暂无交接备注记录
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {detailPart && (
        <PartDetailModal part={detailPart} onClose={() => setDetailPart(null)} />
      )}
    </>
  );
}
