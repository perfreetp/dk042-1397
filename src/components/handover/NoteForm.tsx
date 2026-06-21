import { useState } from "react";
import { useAppStore, mockCurrentUser } from "@/store/useAppStore";
import type { AuthorRole } from "@/types";
import { ROLE_LABEL } from "@/types";
import { Send, Moon, Sun, Shield, FileText } from "lucide-react";

const ROLE_OPTIONS: { value: AuthorRole; icon: any; cls: string }[] = [
  { value: "DAY_SHIFT", icon: Sun, cls: "from-sky-400 to-sky-600" },
  { value: "NIGHT_SHIFT", icon: Moon, cls: "from-alert-warning to-orange-600" },
  { value: "SUPERVISOR", icon: Shield, cls: "from-purple-500 to-purple-700" },
];

export default function NoteForm({ partId }: { partId: string }) {
  const [content, setContent] = useState("");
  const [role, setRole] = useState<AuthorRole>(() => mockCurrentUser().role);
  const [sending, setSending] = useState(false);
  const addHandoverNote = useAppStore((s) => s.addHandoverNote);
  const user = mockCurrentUser();

  const submit = () => {
    if (!content.trim() || !partId) return;
    setSending(true);
    setTimeout(() => {
      addHandoverNote({
        partId,
        content: content.trim(),
        author: user.name,
        authorRole: role,
        status: "PENDING",
      });
      setContent("");
      setSending(false);
    }, 200);
  };

  const placeholder =
    role === "NIGHT_SHIFT"
      ? "请写明夜班判断原因、处理建议和需要白班确认的事项..."
      : role === "SUPERVISOR"
        ? "请写明主管指示、审批意见或协调结论..."
        : "请记录决策依据、操作过程、待跟进事项...";

  return (
    <div className="rounded-xl border-2 border-aviation-200/50 bg-gradient-to-br from-white to-aviation-50/40 p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-aviation-800">
          <FileText className="w-4 h-4 text-aviation-600" />
          新增交接备注
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-aviation-100">
          {ROLE_OPTIONS.map((r) => {
            const active = role === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={[
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                  active
                    ? `bg-gradient-to-br ${r.cls} text-white shadow-sm`
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                ].join(" ")}
                title={ROLE_LABEL[r.value]}
              >
                <r.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{ROLE_LABEL[r.value]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-aviation-500/50 focus:border-aviation-500 transition-all resize-none leading-relaxed"
      />

      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-gray-400">
          以 <b className="text-gray-600">{user.name}</b> 身份提交 · 状态默认为 <b className="text-alert-warning">待处理</b>
        </div>
        <button
          onClick={submit}
          disabled={!content.trim() || sending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-to-br from-aviation-600 to-aviation-800 hover:from-aviation-700 hover:to-aviation-900 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-aviation-700/20 transition-all active:scale-95"
        >
          <Send className={`w-3.5 h-3.5 ${sending ? "animate-pulse" : ""}`} />
          {sending ? "提交中..." : "提交备注"}
        </button>
      </div>
    </div>
  );
}
