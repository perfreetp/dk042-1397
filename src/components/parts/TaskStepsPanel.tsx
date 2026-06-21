import { useMemo, useState } from "react";
import { Plus, Check, Edit2, Trash2, Save, AlertTriangle, ChevronDown, ChevronRight, Send, Paperclip, FileText, X } from "lucide-react";
import type { LifePart, TaskStep, TaskType, TaskStatus, AuthorRole, TaskComment, TaskAttachment } from "@/types";
import { TASK_TYPE_LABEL, TASK_TYPE_DEFAULT_TITLE, TASK_STATUS_LABEL, ROLE_LABEL, APPROVAL_STATUS_LABEL } from "@/types";
import { useAppStore, mockCurrentUser } from "@/store/useAppStore";
import { findTasksByPartId } from "@/store/selectors";
import { daysFromToday, formatDate, formatDateTime, today } from "@/utils/dateUtils";

interface TaskStepsPanelProps {
  part: LifePart;
}

interface FormState {
  type: TaskType;
  title: string;
  assignee: string;
  dueDate: string;
  notes: string;
}

type AttachmentType = TaskAttachment["type"];

function getDefaultType(scheduleStatus: LifePart["scheduleStatus"]): TaskType {
  if (scheduleStatus === "NEED_ORDER") return "ORDER";
  if (scheduleStatus === "NEED_REPAIR") return "REPAIR";
  if (scheduleStatus === "MERGE_CHECK") return "MERGE";
  return "PREPARE";
}

function getEffectiveStatus(task: TaskStep): TaskStatus {
  if (task.status === "DONE") return "DONE";
  const daysLeft = daysFromToday(task.dueDate);
  if (daysLeft < 0) return "OVERDUE";
  return task.status;
}

function statusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "DONE":
      return "bg-alert-safe/10 text-alert-safe border-alert-safe/30";
    case "IN_PROGRESS":
      return "bg-alert-warning/10 text-alert-warning border-alert-warning/30";
    case "OVERDUE":
      return "bg-alert-critical/10 text-alert-critical border-alert-critical/30";
    default:
      return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function statusDotClass(status: TaskStatus): string {
  switch (status) {
    case "DONE":
      return "bg-alert-safe border-alert-safe";
    case "IN_PROGRESS":
      return "bg-alert-warning border-alert-warning animate-pulse-fast";
    case "OVERDUE":
      return "bg-alert-critical border-alert-critical animate-pulse";
    default:
      return "bg-white border-gray-300";
  }
}

function approvalBadgeClass(status: "PENDING" | "APPROVED" | "REJECTED"): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "APPROVED":
      return "bg-alert-safe/10 text-alert-safe border-alert-safe/30";
    case "REJECTED":
      return "bg-alert-critical/10 text-alert-critical border-alert-critical/30";
  }
}

function roleColorClass(role: AuthorRole): string {
  switch (role) {
    case "DAY_SHIFT":
      return "bg-sky-100 text-sky-700";
    case "NIGHT_SHIFT":
      return "bg-indigo-100 text-indigo-700";
    case "SUPERVISOR":
      return "bg-purple-100 text-purple-700";
  }
}

function attachmentTypeIconAndClass(type: AttachmentType): { icon: string; cls: string } {
  switch (type) {
    case "PDF":
      return { icon: "📕", cls: "bg-red-50 border-red-200 text-red-700" };
    case "EXCEL":
      return { icon: "📗", cls: "bg-green-50 border-green-200 text-green-700" };
    case "IMG":
      return { icon: "📘", cls: "bg-blue-50 border-blue-200 text-blue-700" };
    default:
      return { icon: "📄", cls: "bg-gray-50 border-gray-200 text-gray-600" };
  }
}

function detectAttachmentType(filename: string): AttachmentType {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.match(/\.(xlsx?|csv)$/)) return "EXCEL";
  if (lower.match(/\.(png|jpe?g|gif|bmp|webp|svg)$/)) return "IMG";
  return "OTHER";
}

function randomSize(): string {
  const kb = Math.floor(Math.random() * 3000) + 100;
  if (kb > 1024) return `${(kb / 1024).toFixed(1)}MB`;
  return `${kb}KB`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export default function TaskStepsPanel({ part }: TaskStepsPanelProps) {
  const taskSteps = useAppStore((s) => s.taskSteps);
  const addTaskStep = useAppStore((s) => s.addTaskStep);
  const updateTaskStep = useAppStore((s) => s.updateTaskStep);
  const deleteTaskStep = useAppStore((s) => s.deleteTaskStep);
  const toggleTaskStepStatus = useAppStore((s) => s.toggleTaskStepStatus);
  const addTaskComment = useAppStore((s) => s.addTaskComment);
  const addTaskAttachment = useAppStore((s) => s.addTaskAttachment);
  const requestTaskApproval = useAppStore((s) => s.requestTaskApproval);
  const respondTaskApproval = useAppStore((s) => s.respondTaskApproval);

  const currentUser = mockCurrentUser();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    type: getDefaultType(part.scheduleStatus),
    title: TASK_TYPE_DEFAULT_TITLE[getDefaultType(part.scheduleStatus)],
    assignee: "",
    dueDate: "",
    notes: "",
  });

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({});
  const [expandedApproval, setExpandedApproval] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentRoles, setCommentRoles] = useState<Record<string, AuthorRole>>({});
  const [approverInputs, setApproverInputs] = useState<Record<string, string>>({});
  const [responseComments, setResponseComments] = useState<Record<string, string>>({});

  const tasks = useMemo(() => findTasksByPartId(taskSteps, part.id), [taskSteps, part.id]);

  const tasksWithEffectiveStatus = useMemo(
    () => tasks.map((t) => ({ ...t, effectiveStatus: getEffectiveStatus(t) })),
    [tasks]
  );

  const doneCount = tasksWithEffectiveStatus.filter((t) => t.effectiveStatus === "DONE").length;
  const overdueCount = tasksWithEffectiveStatus.filter((t) => t.effectiveStatus === "OVERDUE").length;
  const totalCount = tasks.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const approvalStats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    for (const t of tasks) {
      if (t.approval) {
        if (t.approval.status === "PENDING") pending++;
        if (t.approval.status === "APPROVED") approved++;
      }
    }
    return { pending, approved };
  }, [tasks]);

  function resetForm() {
    const defaultType = getDefaultType(part.scheduleStatus);
    setForm({
      type: defaultType,
      title: TASK_TYPE_DEFAULT_TITLE[defaultType],
      assignee: "",
      dueDate: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleTypeChange(type: TaskType) {
    setForm((f) => ({ ...f, type, title: TASK_TYPE_DEFAULT_TITLE[type] }));
  }

  function handleOpenAdd() {
    resetForm();
    setForm((f) => ({ ...f, dueDate: today() }));
    setShowForm(true);
  }

  function handleOpenEdit(task: TaskStep) {
    setForm({
      type: task.type,
      title: task.title,
      assignee: task.assignee,
      dueDate: task.dueDate,
      notes: task.notes ?? "",
    });
    setEditingId(task.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.title.trim() || !form.assignee.trim() || !form.dueDate) return;

    if (editingId) {
      updateTaskStep(editingId, {
        type: form.type,
        title: form.title.trim(),
        assignee: form.assignee.trim(),
        dueDate: form.dueDate,
        notes: form.notes.trim() || undefined,
      });
    } else {
      const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order), 0);
      addTaskStep({
        partId: part.id,
        type: form.type,
        title: form.title.trim(),
        assignee: form.assignee.trim(),
        dueDate: form.dueDate,
        notes: form.notes.trim() || undefined,
        status: "PENDING",
        order: maxOrder + 1,
      });
    }
    resetForm();
  }

  function handleToggleDone(task: TaskStep) {
    const effective = getEffectiveStatus(task);
    if (effective === "DONE") {
      toggleTaskStepStatus(task.id, "PENDING");
    } else {
      toggleTaskStepStatus(task.id, "DONE");
    }
  }

  function handleDelete(id: string) {
    if (confirm("确认删除该步骤？")) {
      deleteTaskStep(id);
    }
  }

  function toggleExpand(map: Record<string, boolean>, setMap: (v: Record<string, boolean>) => void, id: string) {
    setMap({ ...map, [id]: !map[id] });
  }

  function handleSendComment(taskId: string) {
    const content = (commentInputs[taskId] || "").trim();
    if (!content) return;
    const role = commentRoles[taskId] || currentUser.role;
    addTaskComment(taskId, {
      author: currentUser.name,
      authorRole: role,
      content,
    });
    setCommentInputs({ ...commentInputs, [taskId]: "" });
  }

  function handleUploadAttachment(taskId: string) {
    const name = prompt("请输入附件文件名（如 报价单-2026.pdf）：");
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    const type = detectAttachmentType(trimmed);
    addTaskAttachment(taskId, {
      name: trimmed,
      type,
      size: randomSize(),
      uploadedBy: currentUser.name,
    });
  }

  function handleRequestApproval(taskId: string, prefilledApprover?: string) {
    const name = prefilledApprover || (approverInputs[taskId] || "").trim() || "周立群";
    requestTaskApproval(taskId, name);
    setApproverInputs({ ...approverInputs, [taskId]: "" });
  }

  function handleCancelApproval(taskId: string) {
    updateTaskStep(taskId, { approval: undefined });
  }

  function handleRespondApproval(taskId: string, response: "APPROVED" | "REJECTED") {
    const comment = (responseComments[taskId] || "").trim() || undefined;
    respondTaskApproval(taskId, response, currentUser.name, comment);
    setResponseComments({ ...responseComments, [taskId]: "" });
  }

  function isApprovalTask(type: TaskType, approval?: TaskStep["approval"], requiresApproval?: boolean): boolean {
    return !!approval || !!requiresApproval || type === "ORDER" || type === "INSTALL" || type === "VERIFY";
  }

  function renderApprovalHeaderBadge(task: TaskStep) {
    if (!task.approval) return null;
    const st = task.approval.status;
    const icon = st === "PENDING" ? "🕐" : st === "APPROVED" ? "✅" : "❌";
    const label = st === "PENDING" ? "待确认" : st === "APPROVED" ? "已闭环" : "退回";
    return (
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${approvalBadgeClass(st)}`}
      >
        {icon} {label}
      </span>
    );
  }

  function renderComments(task: TaskStep) {
    const expanded = !!expandedComments[task.id];
    const comments: TaskComment[] = task.comments || [];
    const count = comments.length;
    const role = commentRoles[task.id] || currentUser.role;
    const input = commentInputs[task.id] || "";

    return (
      <div className="mt-3 pt-3 border-t border-gray-200/70">
        <button
          onClick={() => toggleExpand(expandedComments, setExpandedComments, task.id)}
          className="w-full flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-aviation-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>💬 评论</span>
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]">{count}</span>
        </button>
        {expanded && (
          <div className="mt-3 space-y-3">
            {count === 0 ? (
              <div className="text-xs text-gray-400 text-center py-3 bg-gray-50/50 rounded-md">
                暂无评论
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-aviation-400 to-aviation-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {c.author.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-bold text-gray-700">{c.author}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roleColorClass(c.authorRole)}`}>
                        {ROLE_LABEL[c.authorRole]}
                      </span>
                      <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/80 rounded-md px-2.5 py-2 border border-gray-100">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-2 items-start">
              <select
                value={role}
                onChange={(e) => setCommentRoles({ ...commentRoles, [task.id]: e.target.value as AuthorRole })}
                className="shrink-0 px-2 py-1.5 text-[11px] rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none"
              >
                <option value="DAY_SHIFT">白班</option>
                <option value="NIGHT_SHIFT">夜班</option>
                <option value="SUPERVISOR">主管</option>
              </select>
              <div className="flex-1 flex gap-1.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [task.id]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(task.id); }}
                  placeholder="输入评论内容，Enter 发送..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none"
                />
                <button
                  onClick={() => handleSendComment(task.id)}
                  disabled={!input.trim()}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-aviation-600 text-white hover:bg-aviation-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderAttachments(task: TaskStep) {
    const expanded = !!expandedAttachments[task.id];
    const attachments: TaskAttachment[] = task.attachments || [];
    const count = attachments.length;

    return (
      <div className="mt-2 pt-2">
        <button
          onClick={() => toggleExpand(expandedAttachments, setExpandedAttachments, task.id)}
          className="w-full flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-aviation-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>📎 附件</span>
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]">{count}</span>
        </button>
        {expanded && (
          <div className="mt-3 space-y-2">
            {count === 0 ? (
              <div className="text-xs text-gray-400 text-center py-3 bg-gray-50/50 rounded-md">
                暂无附件
              </div>
            ) : (
              attachments.map((a) => {
                const { icon, cls } = attachmentTypeIconAndClass(a.type);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border ${cls} cursor-pointer hover:shadow-sm transition-shadow`}
                  >
                    <div className="text-xl">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-800 truncate">{a.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                        <span>{a.size}</span>
                        <span>·</span>
                        <span>{a.uploadedBy} 上传于 {formatDateTime(a.uploadedAt)}</span>
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                );
              })
            )}
            <button
              onClick={() => handleUploadAttachment(task.id)}
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 border border-dashed border-gray-300 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              ＋ 上传附件
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderApproval(task: TaskStep) {
    const showArea = isApprovalTask(task.type, task.approval, task.requiresApproval);
    if (!showArea) return null;

    const expanded = !!expandedApproval[task.id];
    const approval = task.approval;
    const approverInput = approverInputs[task.id] || "";
    const respComment = responseComments[task.id] || "";

    return (
      <div className="mt-2 pt-2">
        <button
          onClick={() => toggleExpand(expandedApproval, setExpandedApproval, task.id)}
          className="w-full flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-aviation-600 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>📋 主管确认</span>
          {approval && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${approvalBadgeClass(approval.status)}`}>
              {APPROVAL_STATUS_LABEL[approval.status]}
            </span>
          )}
        </button>
        {expanded && (
          <div className="mt-3">
            {!approval ? (
              <div className="p-3 rounded-lg border border-aviation-100 bg-aviation-50/40">
                <div className="text-[11px] text-gray-600 mb-2">该步骤为关键步骤，完成后需主管确认闭环。</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={approverInput}
                    onChange={(e) => setApproverInputs({ ...approverInputs, [task.id]: e.target.value })}
                    placeholder="主管姓名（默认 周立群）"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none"
                  />
                  <button
                    onClick={() => handleRequestApproval(task.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-aviation-600 text-white hover:bg-aviation-700 transition-colors"
                  >
                    📋 提交主管确认
                  </button>
                </div>
              </div>
            ) : approval.status === "PENDING" ? (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${approvalBadgeClass("PENDING")}`}>
                        🟡 待主管确认
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600 space-y-0.5">
                      <div>确认人：<b className="text-gray-800">{approval.approver}</b></div>
                      <div>发起于 {timeAgo(approval.requestedAt)}（{formatDateTime(approval.requestedAt)}）</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <textarea
                        value={respComment}
                        onChange={(e) => setResponseComments({ ...responseComments, [task.id]: e.target.value })}
                        placeholder="主管意见（可选）"
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none resize-none min-w-[200px]"
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleRespondApproval(task.id, "REJECTED")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-alert-critical/10 text-alert-critical hover:bg-alert-critical/20 border border-alert-critical/30 transition-colors"
                        >
                          ❌ 退回修改
                        </button>
                        <button
                          onClick={() => handleRespondApproval(task.id, "APPROVED")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-alert-safe/10 text-alert-safe hover:bg-alert-safe/20 border border-alert-safe/30 transition-colors"
                        >
                          ✅ 闭环确认
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelApproval(task.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors self-start"
                    >
                      <X className="w-3 h-3" />
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ) : approval.status === "APPROVED" ? (
              <div className="p-3 rounded-lg border border-alert-safe/30 bg-alert-safe/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${approvalBadgeClass("APPROVED")}`}>
                    ✅ 已闭环
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 space-y-0.5">
                  <div>确认人：<b className="text-gray-800">{approval.approver}</b></div>
                  <div>确认时间：{formatDateTime(approval.respondedAt || approval.requestedAt)}</div>
                </div>
                {approval.comment && (
                  <div className="mt-2 p-2 rounded-md bg-white border border-alert-safe/20 text-[11px] text-gray-700 leading-relaxed">
                    💬 <b>主管意见：</b>{approval.comment}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-alert-critical/30 bg-alert-critical/5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${approvalBadgeClass("REJECTED")}`}>
                        ❌ 退回修改
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600 space-y-0.5">
                      <div>退回人：<b className="text-gray-800">{approval.approver}</b></div>
                      <div>退回时间：{formatDateTime(approval.respondedAt || approval.requestedAt)}</div>
                    </div>
                    {approval.comment && (
                      <div className="mt-2 p-2 rounded-md bg-white border border-alert-critical/20 text-[11px] text-alert-critical leading-relaxed">
                        ⚠️ <b>退回原因：</b>{approval.comment}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRequestApproval(task.id, approval.approver)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-aviation-600 text-white hover:bg-aviation-700 transition-colors self-start"
                  >
                    🔄 重新提交
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>📋</span>
              处理动作进度
              <span className="text-gray-400 font-medium">
                （{doneCount}/{totalCount} 已完成）
              </span>
            </h3>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-alert-critical/10 text-alert-critical border border-alert-critical/30">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount} 项逾期
              </span>
            )}
            {approvalStats.pending > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                🕐 待确认 {approvalStats.pending} 项
              </span>
            )}
            {approvalStats.approved > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-alert-safe/10 text-alert-safe border border-alert-safe/30">
                ✅ 已闭环 {approvalStats.approved} 项
              </span>
            )}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden max-w-md">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #2e7d52, #34659d)",
              }}
            />
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={showForm}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-aviation-600 hover:bg-aviation-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          添加步骤
        </button>
      </div>

      <div className="p-5">
        {showForm && (
          <div className="mb-5 p-4 rounded-xl border border-aviation-200 bg-aviation-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">类型</label>
                <select
                  value={form.type}
                  onChange={(e) => handleTypeChange(e.target.value as TaskType)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none"
                >
                  {(Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((k) => (
                    <option key={k} value={k}>
                      {TASK_TYPE_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">负责人</label>
                <input
                  type="text"
                  value={form.assignee}
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                  placeholder="如：张主管"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">标题</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none"
              />
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">预计完成日期</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none"
              />
            </div>
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">备注</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="可选：补充说明"
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:border-aviation-500 focus:ring-1 focus:ring-aviation-500 outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={resetForm}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || !form.assignee.trim() || !form.dueDate}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-aviation-600 hover:bg-aviation-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                保存
              </button>
            </div>
          </div>
        )}

        {tasksWithEffectiveStatus.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            <div className="text-3xl mb-2">📝</div>
            暂无处理步骤，点击"添加步骤"开始规划
          </div>
        ) : (
          <div className="relative">
            {tasksWithEffectiveStatus.map((task, idx) => {
              const isLast = idx === tasksWithEffectiveStatus.length - 1;
              const effective = task.effectiveStatus;
              const daysLeft = daysFromToday(task.dueDate);

              return (
                <div key={task.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${statusDotClass(
                        effective
                      )}`}
                    >
                      {effective === "DONE" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[60px] ${
                          effective === "DONE" ? "bg-alert-safe/40" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>

                  <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                    <div
                      className={`rounded-lg border p-4 ${
                        effective === "OVERDUE"
                          ? "border-alert-critical/30 bg-alert-critical/5"
                          : "border-gray-100 bg-gray-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-800">
                            {idx + 1}. {task.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusBadgeClass(
                              effective
                            )}`}
                          >
                            {TASK_STATUS_LABEL[effective]}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-aviation-50 text-aviation-600 border border-aviation-100">
                            {TASK_TYPE_LABEL[task.type]}
                          </span>
                          {renderApprovalHeaderBadge(task)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mb-2">
                        <span>负责人：<b className="text-gray-700">{task.assignee}</b></span>
                        {effective === "DONE" && task.completedAt ? (
                          <span>完成于 {formatDate(task.completedAt)}</span>
                        ) : (
                          <>
                            <span>
                              预计 <b className={effective === "OVERDUE" ? "text-alert-critical" : "text-gray-700"}>
                                {task.dueDate}
                              </b>{" "}
                              完成
                            </span>
                            <span
                              className={
                                effective === "OVERDUE"
                                  ? "text-alert-critical font-semibold"
                                  : daysLeft <= 3
                                    ? "text-alert-warning font-medium"
                                    : ""
                              }
                            >
                              {effective === "OVERDUE"
                                ? `已逾期 ${Math.abs(daysLeft)} 天`
                                : `剩余 ${daysLeft} 天`}
                            </span>
                          </>
                        )}
                      </div>

                      {task.notes && (
                        <div className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                          💬 {task.notes}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {effective !== "DONE" && (
                          <button
                            onClick={() => handleToggleDone(task)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-alert-safe/10 text-alert-safe hover:bg-alert-safe/20 border border-alert-safe/20 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            标记完成
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(task)}
                          disabled={showForm}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50"
                        >
                          <Edit2 className="w-3 h-3" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-alert-critical hover:bg-alert-critical/10 border border-gray-200 hover:border-alert-critical/30 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      </div>

                      {renderComments(task)}
                      {renderAttachments(task)}
                      {renderApproval(task)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
