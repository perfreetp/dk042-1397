import type { HandoverNote, LifePart } from "@/types";
import { HANDOVER_LABEL, ROLE_LABEL, SCHEDULE_LABEL } from "@/types";
import { formatDateTime } from "@/utils/dateUtils";
import { riskColor } from "@/utils/riskUtils";
import { useAppStore, mockCurrentUser } from "@/store/useAppStore";
import {
  User,
  Moon,
  Sun,
  Shield,
  Clock,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Plane,
  MapPin,
  Calendar,
  FolderOpen,
  ExternalLink,
  XCircle,
} from "lucide-react";

interface NoteCardWithScheduleProps {
  note: HandoverNote;
  part: LifePart | undefined;
  onOpenPart?: (partId: string) => void;
  onOpenPartDetail?: (part: LifePart) => void;
}

function relativeTime(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHr < 24) return `${diffHr}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  return formatDateTime(iso);
}

function RoleBadge({ role }: { role: HandoverNote["authorRole"] }) {
  const map = {
    NIGHT_SHIFT: { icon: Moon, label: ROLE_LABEL.NIGHT_SHIFT, cls: "bg-alert-warning/10 text-alert-warning border-alert-warning/20" },
    DAY_SHIFT: { icon: Sun, label: ROLE_LABEL.DAY_SHIFT, cls: "bg-sky-50 text-sky-700 border-sky-200" },
    SUPERVISOR: { icon: Shield, label: ROLE_LABEL.SUPERVISOR, cls: "bg-purple-50 text-purple-700 border-purple-200" },
  } as const;
  const c = map[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>
      <c.icon className="w-3 h-3" strokeWidth={2.2} />
      {c.label}
    </span>
  );
}

function StatusChip({ status }: { status: HandoverNote["status"] }) {
  const map = {
    PENDING: { icon: AlertCircle, label: HANDOVER_LABEL.PENDING, cls: "bg-alert-warning/10 text-alert-warning border-alert-warning/30 animate-pulse-slow" },
    IN_PROGRESS: { icon: PlayCircle, label: HANDOVER_LABEL.IN_PROGRESS, cls: "bg-aviation-600/10 text-aviation-700 border-aviation-600/30" },
    CONFIRMED: { icon: CheckCircle2, label: HANDOVER_LABEL.CONFIRMED, cls: "bg-alert-safe/10 text-alert-safe border-alert-safe/30" },
  } as const;
  const c = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${c.cls}`}>
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function ScheduleBadge({ status }: { status: LifePart["scheduleStatus"] }) {
  if (status === "NONE") return null;
  const map = {
    NEED_ORDER: "bg-amber-50 text-amber-700 border-amber-200",
    NEED_REPAIR: "bg-orange-50 text-orange-700 border-orange-200",
    MERGE_CHECK: "bg-indigo-50 text-indigo-700 border-indigo-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${map[status]}`}>
      {SCHEDULE_LABEL[status]}
    </span>
  );
}

export default function NoteCardWithSchedule({ note, part, onOpenPart, onOpenPartDetail }: NoteCardWithScheduleProps) {
  const updateNoteStatus = useAppStore((s) => s.updateNoteStatus);
  const user = mockCurrentUser();
  const canChange = note.status !== "CONFIRMED";

  const borderColor = part ? riskColor(part.riskLevel) : "#9ca3af";

  return (
    <div
      className={[
        "relative rounded-xl border-2 transition-all overflow-hidden",
        note.status === "CONFIRMED"
          ? "bg-gray-50/60 border-gray-100"
          : note.status === "PENDING"
            ? "bg-alert-warning/5 border-alert-warning/20 shadow-sm"
            : "bg-aviation-50/40 border-aviation-200/40 shadow-sm",
      ].join(" ")}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: borderColor }}
      />

      {note.authorRole === "NIGHT_SHIFT" && note.status !== "CONFIRMED" && (
        <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-alert-warning text-white text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 z-10">
          <Moon className="w-2.5 h-2.5" />
          夜班交接
        </div>
      )}

      <div className="pl-4 pr-4 pt-4 pb-3 border-b border-gray-100/60">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip status={note.status} />
            {part && (
              <>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-tabular font-semibold text-aviation-700">
                  <Plane className="w-3 h-3" />
                  {part.aircraftReg}
                </span>
                {part.plannedBase && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {part.plannedBase}
                    {part.plannedBay ? ` · 机位${part.plannedBay}` : ""}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono-tabular shrink-0">
            <Clock className="w-3 h-3" />
            {relativeTime(note.createdAt)}
          </div>
        </div>
        {part && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-aviation-800">{part.name}</span>
            <span className="text-[11px] font-mono-tabular text-gray-500">({part.partNumber})</span>
          </div>
        )}
      </div>

      <div className="pl-4 pr-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aviation-400 to-aviation-600 flex items-center justify-center shadow-inner shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{note.author}</span>
              <RoleBadge role={note.authorRole} />
            </div>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 border-y border-gray-100/60 bg-gray-50/40">
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          {part ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                {part.isScheduled ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-alert-safe" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-alert-critical" />
                )}
                <span className={part.isScheduled ? "text-alert-safe font-semibold" : "text-alert-critical font-semibold"}>
                  {part.isScheduled ? "已排程" : "未排程"}
                </span>
              </span>
              {part.plannedDate && (
                <span className="inline-flex items-center gap-1 text-gray-600">
                  <Calendar className="w-3.5 h-3.5" />
                  计划停场：<b className="text-aviation-700">{part.plannedDate}</b>
                </span>
              )}
              {part.scheduleStatus !== "NONE" && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-gray-500">处理标记：</span>
                    <ScheduleBadge status={part.scheduleStatus} />
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-gray-400">零件信息不可用</span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        {note.confirmedAt && note.confirmedBy ? (
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-alert-safe" />
            由 <b className="text-gray-700">{note.confirmedBy}</b> 于 {formatDateTime(note.confirmedAt)} 确认
          </div>
        ) : canChange ? (
          <div className="text-[11px] text-gray-400">点击右侧按钮更新状态</div>
        ) : null}

        <div className="flex items-center gap-1.5 flex-wrap">
          {canChange && (
            <>
              {note.status === "PENDING" && (
                <button
                  onClick={() => updateNoteStatus(note.id, "IN_PROGRESS", user.name)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-aviation-600 hover:bg-aviation-700 text-white transition-colors"
                >
                  <PlayCircle className="w-3 h-3" />
                  开始处理
                </button>
              )}
              <button
                onClick={() => updateNoteStatus(note.id, "CONFIRMED", user.name)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-alert-safe hover:bg-alert-safe/90 text-white transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                确认完成
              </button>
            </>
          )}
          {part && onOpenPart && (
            <button
              onClick={() => onOpenPart(part.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors border border-gray-200"
            >
              <FolderOpen className="w-3 h-3" />
              查看寿命件
            </button>
          )}
          {part && onOpenPartDetail && (
            <button
              onClick={() => onOpenPartDetail(part)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white hover:bg-gray-50 text-aviation-700 transition-colors border border-aviation-200"
            >
              <ExternalLink className="w-3 h-3" />
              打开详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
