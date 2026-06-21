import { useMemo, useState } from "react";
import { Plus, Check, Edit2, Trash2, Save, AlertTriangle } from "lucide-react";
import type { LifePart, TaskStep, TaskType, TaskStatus } from "@/types";
import { TASK_TYPE_LABEL, TASK_TYPE_DEFAULT_TITLE, TASK_STATUS_LABEL } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { findTasksByPartId } from "@/store/selectors";
import { daysFromToday, formatDate, today } from "@/utils/dateUtils";

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

export default function TaskStepsPanel({ part }: TaskStepsPanelProps) {
  const taskSteps = useAppStore((s) => s.taskSteps);
  const addTaskStep = useAppStore((s) => s.addTaskStep);
  const updateTaskStep = useAppStore((s) => s.updateTaskStep);
  const deleteTaskStep = useAppStore((s) => s.deleteTaskStep);
  const toggleTaskStepStatus = useAppStore((s) => s.toggleTaskStepStatus);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    type: getDefaultType(part.scheduleStatus),
    title: TASK_TYPE_DEFAULT_TITLE[getDefaultType(part.scheduleStatus)],
    assignee: "",
    dueDate: "",
    notes: "",
  });

  const tasks = useMemo(() => findTasksByPartId(taskSteps, part.id), [taskSteps, part.id]);

  const tasksWithEffectiveStatus = useMemo(
    () => tasks.map((t) => ({ ...t, effectiveStatus: getEffectiveStatus(t) })),
    [tasks]
  );

  const doneCount = tasksWithEffectiveStatus.filter((t) => t.effectiveStatus === "DONE").length;
  const overdueCount = tasksWithEffectiveStatus.filter((t) => t.effectiveStatus === "OVERDUE").length;
  const totalCount = tasks.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

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

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      {/* Header */}
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

      {/* Body */}
      <div className="p-5">
        {/* Form */}
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

        {/* Timeline */}
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
                  {/* Timeline line and dot */}
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

                  {/* Task card */}
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
