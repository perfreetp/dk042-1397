import type { HandoverNote } from "@/types";
import { HANDOVER_LABEL, ROLE_LABEL } from "@/types";
import { formatDateTime } from "@/utils/dateUtils";
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
} from "lucide-react";

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

export default function NoteItem({ note }: { note: HandoverNote }) {
  const updateNoteStatus = useAppStore((s) => s.updateNoteStatus);
  const user = mockCurrentUser();
  const canChange = note.status !== "CONFIRMED";

  return (
    <div
      className={[
        "relative rounded-xl p-4 border-2 transition-all",
        note.status === "CONFIRMED"
          ? "bg-gray-50/60 border-gray-100"
          : note.status === "PENDING"
            ? "bg-alert-warning/5 border-alert-warning/20 shadow-sm"
            : "bg-aviation-50/40 border-aviation-200/40 shadow-sm",
      ].join(" ")}
    >
      {note.authorRole === "NIGHT_SHIFT" && note.status !== "CONFIRMED" && (
        <div className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full bg-alert-warning text-white text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
          <Moon className="w-2.5 h-2.5" />
          夜班交接
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aviation-400 to-aviation-600 flex items-center justify-center shadow-inner shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold text-gray-800">{note.author}</div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <RoleBadge role={note.authorRole} />
              <StatusChip status={note.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0 font-mono-tabular">
          <Clock className="w-3 h-3" />
          {formatDateTime(note.createdAt)}
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-10">
        {note.content}
      </p>

      {(note.confirmedBy || canChange) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 pl-10">
          {note.confirmedAt && note.confirmedBy ? (
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-alert-safe" />
              由 <b className="text-gray-700">{note.confirmedBy}</b> 于 {formatDateTime(note.confirmedAt)} 确认
            </div>
          ) : canChange ? (
            <div className="text-[11px] text-gray-400">点击右侧按钮更新状态</div>
          ) : null}

          {canChange && (
            <div className="flex items-center gap-1.5">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
