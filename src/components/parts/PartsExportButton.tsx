import { useState, useMemo } from "react";
import { Download, X, Copy, Check, FileSpreadsheet } from "lucide-react";
import type { LifePart, ScheduleConflict } from "@/types";
import { RISK_LABEL, SCHEDULE_LABEL, CONFLICT_TYPE_LABEL } from "@/types";
import { RISK_ORDER } from "@/utils/riskUtils";
import { riskColor } from "@/utils/riskUtils";
import { formatDate } from "@/utils/dateUtils";
import { detectConflicts } from "@/utils/conflictUtils";
import { useAppStore } from "@/store/useAppStore";
import { findTasksByPartId } from "@/store/selectors";

interface PartsExportButtonProps {
  parts: LifePart[];
}

type ExportVersion = "BASIC" | "PLANNING";

const BASIC_HEADERS = [
  "风险",
  "飞机号",
  "件号",
  "序号",
  "名称",
  "装机位置",
  "剩余循环",
  "剩余天数",
  "到寿日期",
  "排程状态",
];

const PLANNING_HEADERS = [
  "风险等级",
  "飞机号",
  "件号 PN",
  "序号 SN",
  "名称",
  "装机位置",
  "剩余循环",
  "剩余天数",
  "预计到寿日",
  "是否已排程",
  "计划停场日期",
  "停机位",
  "维修基地",
  "处理方式",
  "待办交接",
  "最新交接进展",
  "处理进度",
  "排程冲突",
  "交接未确认",
  "📋 改期/换机位建议",
];

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return "\"" + value.replace(/"/g, "\"\"") + "\"";
  }
  return value;
}

export default function PartsExportButton({ parts }: PartsExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [version, setVersion] = useState<ExportVersion>("BASIC");

  const taskSteps = useAppStore((s) => s.taskSteps);
  const handoverNotes = useAppStore((s) => s.handoverNotes);

  const noteInfoMap = useMemo(() => {
    const map = new Map<string, { pendingCount: number; latestContent: string; latestCreatedAt: string }>();
    for (const n of handoverNotes) {
      const existing = map.get(n.partId);
      const info = existing || { pendingCount: 0, latestContent: "", latestCreatedAt: "" };
      if (n.status !== "CONFIRMED") {
        info.pendingCount++;
      }
      if (!existing || n.createdAt > existing.latestCreatedAt) {
        info.latestContent = n.content;
        info.latestCreatedAt = n.createdAt;
      }
      map.set(n.partId, info);
    }
    return map;
  }, [handoverNotes]);

  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => {
      const riskDiff = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      const regDiff = a.aircraftReg.localeCompare(b.aircraftReg);
      if (regDiff !== 0) return regDiff;
      return a.expiryDate.localeCompare(b.expiryDate);
    });
  }, [parts]);

  const partConflictsMap = useMemo(() => {
    const scheduled = sortedParts.filter((p) => p.isScheduled && p.plannedDate);
    const all = detectConflicts(scheduled);
    const map = new Map<string, ScheduleConflict[]>();
    for (const c of all) {
      for (const pid of c.relatedPartIds) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid)!.push(c);
      }
    }
    return map;
  }, [sortedParts]);

  const partTaskSummary = useMemo(() => {
    const todayStr = formatDate(new Date());
    const map = new Map<string, { total: number; done: number; overdue: number }>();
    for (const p of sortedParts) {
      const tasks = findTasksByPartId(taskSteps, p.id);
      const done = tasks.filter((t) => t.status === "DONE").length;
      const overdue = tasks.filter((t) => t.status === "OVERDUE" || (t.status !== "DONE" && t.dueDate < todayStr)).length;
      map.set(p.id, { total: tasks.length, done, overdue });
    }
    return map;
  }, [sortedParts, taskSteps]);

  const partUnconfirmedNotes = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of handoverNotes) {
      if (n.status !== "CONFIRMED") {
        map.set(n.partId, (map.get(n.partId) || 0) + 1);
      }
    }
    return map;
  }, [handoverNotes]);

  const riskSummary = useMemo(() => {
    const conflictPartIds = new Set<string>();
    const suggestPartIds = new Set<string>();
    const bayChangePartIds = new Set<string>();
    const divertPartIds = new Set<string>();
    const reschedulePartIds = new Set<string>();

    for (const [partId, confs] of partConflictsMap.entries()) {
      let hasBay = false;
      let hasDivert = false;
      let hasReschedule = false;
      for (const conf of confs) {
        for (const pid of conf.relatedPartIds) {
          conflictPartIds.add(pid);
        }
        if (conf.suggestions && conf.suggestions.length > 0) {
          suggestPartIds.add(partId);
          for (const s of conf.suggestions) {
            if (s.includes("换机位")) hasBay = true;
            if (s.includes("分流")) hasDivert = true;
            if (s.includes("改期")) hasReschedule = true;
          }
        }
      }
      if (hasBay) bayChangePartIds.add(partId);
      if (hasDivert) divertPartIds.add(partId);
      if (hasReschedule) reschedulePartIds.add(partId);
    }

    let totalUnconfirmed = 0;
    for (const n of handoverNotes) {
      if (n.status !== "CONFIRMED") totalUnconfirmed++;
    }
    let totalOverdue = 0;
    for (const s of partTaskSummary.values()) {
      totalOverdue += s.overdue;
    }
    return {
      conflictCount: conflictPartIds.size,
      unconfirmedCount: totalUnconfirmed,
      overdueCount: totalOverdue,
      suggestCount: suggestPartIds.size,
      bayChangeCount: bayChangePartIds.size,
      divertCount: divertPartIds.size,
      rescheduleCount: reschedulePartIds.size,
    };
  }, [partConflictsMap, handoverNotes, partTaskSummary]);

  const stats = useMemo(() => {
    const total = sortedParts.length;
    const critical = sortedParts.filter((p) => p.riskLevel === "CRITICAL").length;
    const warning = sortedParts.filter((p) => p.riskLevel === "WARNING").length;
    const caution = sortedParts.filter((p) => p.riskLevel === "CAUTION").length;
    return { total, critical, warning, caution };
  }, [sortedParts]);

  const basicTsv = useMemo(() => {
    const lines = [BASIC_HEADERS.join("\t")];
    for (const p of sortedParts) {
      const row = [
        RISK_LABEL[p.riskLevel],
        p.aircraftReg,
        p.partNumber,
        p.serialNumber,
        p.name,
        p.installPosition,
        String(p.remainingCycles),
        String(p.remainingDays),
        p.expiryDate,
        SCHEDULE_LABEL[p.scheduleStatus],
      ];
      lines.push(row.join("\t"));
    }
    return lines.join("\n");
  }, [sortedParts]);

  const basicCsv = useMemo(() => {
    const lines = [BASIC_HEADERS.map(escapeCSVField).join(",")];
    for (const p of sortedParts) {
      const row = [
        RISK_LABEL[p.riskLevel],
        p.aircraftReg,
        p.partNumber,
        p.serialNumber,
        p.name,
        p.installPosition,
        String(p.remainingCycles),
        String(p.remainingDays),
        p.expiryDate,
        SCHEDULE_LABEL[p.scheduleStatus],
      ].map(escapeCSVField);
      lines.push(row.join(","));
    }
    return "\uFEFF" + lines.join("\n");
  }, [sortedParts]);

  const planningTsv = useMemo(() => {
    const lines = [PLANNING_HEADERS.join("\t")];
    for (const p of sortedParts) {
      const noteInfo = noteInfoMap.get(p.id);
      const pendingCount = noteInfo?.pendingCount || 0;
      const latestContent = noteInfo?.latestContent || "";
      const taskSum = partTaskSummary.get(p.id);
      const conflicts = partConflictsMap.get(p.id) || [];
      const unconfirmed = partUnconfirmedNotes.get(p.id) || 0;

      let progressText = "-";
      if (taskSum && taskSum.total > 0) {
        progressText = `已完成${taskSum.done}/共${taskSum.total}`;
        if (taskSum.overdue > 0) {
          progressText += ` · ${taskSum.overdue}项逾期`;
        }
      }

      const conflictText = conflicts.length > 0 ? `${conflicts.length}个冲突` : "-";
      const unconfirmedText = unconfirmed > 0 ? `${unconfirmed}条未确认` : "-";

      const allSuggestions: string[] = [];
      for (const c of conflicts) {
        if (c.suggestions) {
          for (const s of c.suggestions) {
            allSuggestions.push(s);
          }
        }
      }
      const suggestionText = allSuggestions.length > 0
        ? allSuggestions.slice(0, 3).map((s) => `💡${s}`).join("; ")
        : "-";

      const row = [
        RISK_LABEL[p.riskLevel],
        p.aircraftReg,
        p.partNumber,
        p.serialNumber,
        p.name,
        p.installPosition,
        `${p.remainingCycles}FC`,
        `${p.remainingDays}天`,
        p.expiryDate,
        p.isScheduled ? "已排程" : "未排程",
        p.plannedDate || "-",
        p.plannedBay || "-",
        p.plannedBase || "-",
        SCHEDULE_LABEL[p.scheduleStatus],
        pendingCount > 0 ? `${pendingCount}条待办` : "-",
        latestContent || "-",
        progressText,
        conflictText,
        unconfirmedText,
        suggestionText,
      ];
      lines.push(row.join("\t"));
    }
    return lines.join("\n");
  }, [sortedParts, noteInfoMap, partTaskSummary, partConflictsMap, partUnconfirmedNotes]);

  const planningCsv = useMemo(() => {
    const lines = [PLANNING_HEADERS.map(escapeCSVField).join(",")];
    for (const p of sortedParts) {
      const noteInfo = noteInfoMap.get(p.id);
      const pendingCount = noteInfo?.pendingCount || 0;
      const latestContent = noteInfo?.latestContent || "";
      const taskSum = partTaskSummary.get(p.id);
      const conflicts = partConflictsMap.get(p.id) || [];
      const unconfirmed = partUnconfirmedNotes.get(p.id) || 0;

      let progressText = "-";
      if (taskSum && taskSum.total > 0) {
        progressText = `已完成${taskSum.done}/共${taskSum.total}`;
        if (taskSum.overdue > 0) {
          progressText += ` · ${taskSum.overdue}项逾期`;
        }
      }

      const conflictText = conflicts.length > 0 ? `${conflicts.length}个冲突` : "-";
      const unconfirmedText = unconfirmed > 0 ? `${unconfirmed}条未确认` : "-";

      const allSuggestions: string[] = [];
      for (const c of conflicts) {
        if (c.suggestions) {
          for (const s of c.suggestions) {
            allSuggestions.push(s);
          }
        }
      }
      const suggestionText = allSuggestions.length > 0
        ? allSuggestions.slice(0, 3).map((s) => `💡${s}`).join("; ")
        : "-";

      const row = [
        RISK_LABEL[p.riskLevel],
        p.aircraftReg,
        p.partNumber,
        p.serialNumber,
        p.name,
        p.installPosition,
        `${p.remainingCycles}FC`,
        `${p.remainingDays}天`,
        p.expiryDate,
        p.isScheduled ? "已排程" : "未排程",
        p.plannedDate || "-",
        p.plannedBay || "-",
        p.plannedBase || "-",
        SCHEDULE_LABEL[p.scheduleStatus],
        pendingCount > 0 ? `${pendingCount}条待办` : "-",
        latestContent || "-",
        progressText,
        conflictText,
        unconfirmedText,
        suggestionText,
      ].map(escapeCSVField);
      lines.push(row.join(","));
    }
    return "\uFEFF" + lines.join("\n");
  }, [sortedParts, noteInfoMap, partTaskSummary, partConflictsMap, partUnconfirmedNotes]);

  const currentTsv = version === "BASIC" ? basicTsv : planningTsv;
  const currentCsv = version === "BASIC" ? basicCsv : planningCsv;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("复制失败", e);
    }
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([currentCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = formatDate(new Date());
    a.download = version === "BASIC"
      ? `life-parts-summary-${dateStr}.csv`
      : `life-parts-planning-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyBtnText = version === "BASIC" ? "复制台账到剪贴板" : "复制排程计划(维修用)";
  const downloadBtnText = version === "BASIC" ? "下载台账 CSV" : "下载排程计划CSV(库房用)";
  const tableColSpan = version === "BASIC" ? 10 : 20;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-aviation-700 hover:bg-aviation-800 text-white text-sm font-medium transition-all shadow-lg shadow-aviation-700/30"
      >
        <Download className="w-4 h-4" />
        导出台账
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-aviation-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-aviation-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">寿命件台账摘要导出</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    共 <b className="text-gray-700">{stats.total}</b> 件
                    <span className="mx-1.5 text-gray-300">|</span>
                    <span className="text-[#c53030] font-medium">紧急 {stats.critical}</span>
                    <span className="mx-1.5 text-gray-300">·</span>
                    <span className="text-[#e86a2c] font-medium">预警 {stats.warning}</span>
                    <span className="mx-1.5 text-gray-300">·</span>
                    <span className="text-[#d69e2e] font-medium">关注 {stats.caution}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-gray-400" />
                按 <b className="text-gray-600">风险等级 → 飞机号 → 到寿日期</b> 升序排列
              </p>
              <div className="inline-flex rounded-lg bg-gray-200/70 p-0.5">
                <button
                  onClick={() => setVersion("BASIC")}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    version === "BASIC"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📋 基础版 · 风险台账
                </button>
                <button
                  onClick={() => setVersion("PLANNING")}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    version === "PLANNING"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🗓️ 计划版 · 维修/库房
                </button>
              </div>
            </div>

            {version === "PLANNING" && (
              <div className="px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  📊 本次导出台账汇总（{sortedParts.length}件）
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    ⚠️ 排程冲突
                    {riskSummary.conflictCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-[#c53030]">
                        {riskSummary.conflictCount} 件
                      </span>
                    ) : (
                      <span className="text-gray-500">0 件</span>
                    )}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    🔔 交接未确认
                    {riskSummary.unconfirmedCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-[#f97316]">
                        {riskSummary.unconfirmedCount} 件
                      </span>
                    ) : (
                      <span className="text-gray-500">0 件</span>
                    )}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    ⏰ 处理逾期待办
                    {riskSummary.overdueCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-[#c53030]">
                        {riskSummary.overdueCount} 项
                      </span>
                    ) : (
                      <span className="text-gray-500">0 项</span>
                    )}
                  </span>
                  {riskSummary.suggestCount > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="inline-flex items-center gap-1.5">
                        💡 建议可优化
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-[#2563eb]">
                          {riskSummary.suggestCount} 件
                        </span>
                        <span className="text-xs text-gray-500">
                          （其中换机位 {riskSummary.bayChangeCount} 件 / 分流 {riskSummary.divertCount} 件 / 改期 {riskSummary.rescheduleCount} 件）
                        </span>
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  以上项目建议在发送给维修控制/航材库房前逐一确认闭环
                </p>
              </div>
            )}

            <div className="flex-1 overflow-auto max-h-[60vh]">
              {version === "BASIC" ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-aviation-50">
                    <tr className="text-aviation-700 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">风险</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">飞机号</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">件号 PN</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">序号 SN</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">名称</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">装机位置</th>
                      <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">剩余循环 FC</th>
                      <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">剩余天数</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">到寿日期</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">排程状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedParts.length === 0 && (
                      <tr>
                        <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400">
                          暂无数据
                        </td>
                      </tr>
                    )}
                    {sortedParts.map((p, idx) => {
                      const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/40";
                      return (
                        <tr key={p.id} className={`${rowBg} border-t border-gray-100`}>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white whitespace-nowrap"
                              style={{ backgroundColor: riskColor(p.riskLevel) }}
                            >
                              {RISK_LABEL[p.riskLevel]}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono-tabular font-semibold text-aviation-700 whitespace-nowrap">
                            {p.aircraftReg}
                          </td>
                          <td className="px-3 py-3 font-mono-tabular text-gray-800 whitespace-nowrap">{p.partNumber}</td>
                          <td className="px-3 py-3 font-mono-tabular text-gray-600 text-xs whitespace-nowrap">{p.serialNumber}</td>
                          <td className="px-3 py-3 text-gray-800 max-w-[200px] truncate" title={p.name}>
                            {p.name}
                          </td>
                          <td className="px-3 py-3 text-gray-600 text-xs max-w-[140px] truncate" title={p.installPosition}>
                            {p.installPosition}
                          </td>
                          <td
                            className="px-3 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap"
                            style={{ color: riskColor(p.riskLevel) }}
                          >
                            {p.remainingCycles.toLocaleString()}
                          </td>
                          <td
                            className="px-3 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap"
                            style={{ color: riskColor(p.riskLevel) }}
                          >
                            {p.remainingDays}
                          </td>
                          <td className="px-3 py-3 font-mono-tabular text-gray-700 whitespace-nowrap">{p.expiryDate}</td>
                          <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{SCHEDULE_LABEL[p.scheduleStatus]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-aviation-50">
                    <tr className="text-aviation-700 text-xs uppercase tracking-wider">
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[72px]">风险等级</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[80px]">飞机号</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[100px]">件号 PN</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[100px]">序号 SN</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[140px]">名称</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[100px]">装机位置</th>
                      <th className="text-right px-3 py-3 font-semibold whitespace-nowrap min-w-[90px]">剩余循环</th>
                      <th className="text-right px-3 py-3 font-semibold whitespace-nowrap min-w-[80px]">剩余天数</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[100px]">预计到寿日</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[88px]">是否已排程</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[108px]">计划停场日期</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[72px]">停机位</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[140px]">维修基地</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[80px]">处理方式</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[88px]">待办交接</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[200px]">最新交接进展</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[110px]">📋 处理进度</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[90px]">⚠️ 排程冲突</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[110px]">🔔 交接未确认</th>
                      <th className="text-left px-3 py-3 font-semibold whitespace-nowrap min-w-[220px]">📋 改期/换机位建议</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedParts.length === 0 && (
                      <tr>
                        <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400">
                          暂无数据
                        </td>
                      </tr>
                    )}
                    {sortedParts.map((p, idx) => {
                      const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/40";
                      const noteInfo = noteInfoMap.get(p.id);
                      const pendingCount = noteInfo?.pendingCount || 0;
                      const latestContent = noteInfo?.latestContent || "";
                      const taskSum = partTaskSummary.get(p.id);
                      const conflicts = partConflictsMap.get(p.id) || [];
                      const unconfirmed = partUnconfirmedNotes.get(p.id) || 0;
                      return (
                        <tr key={p.id} className={`${rowBg} border-t border-gray-100`}>
                          <td className="px-3 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white whitespace-nowrap"
                              style={{ backgroundColor: riskColor(p.riskLevel) }}
                            >
                              {RISK_LABEL[p.riskLevel]}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono-tabular font-semibold text-aviation-700 whitespace-nowrap">
                            {p.aircraftReg}
                          </td>
                          <td className="px-3 py-3 font-mono-tabular text-gray-800 whitespace-nowrap">{p.partNumber}</td>
                          <td className="px-3 py-3 font-mono-tabular text-gray-600 text-xs whitespace-nowrap">{p.serialNumber}</td>
                          <td className="px-3 py-3 text-gray-800 max-w-[180px] truncate" title={p.name}>
                            {p.name}
                          </td>
                          <td className="px-3 py-3 text-gray-600 text-xs max-w-[120px] truncate" title={p.installPosition}>
                            {p.installPosition}
                          </td>
                          <td
                            className="px-3 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap"
                            style={{ color: riskColor(p.riskLevel) }}
                          >
                            {p.remainingCycles.toLocaleString()}FC
                          </td>
                          <td
                            className="px-3 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap"
                            style={{ color: riskColor(p.riskLevel) }}
                          >
                            {p.remainingDays}天
                          </td>
                          <td className="px-3 py-3 font-mono-tabular text-gray-700 whitespace-nowrap">{p.expiryDate}</td>
                          <td className={`px-3 py-3 text-xs font-semibold whitespace-nowrap ${
                            p.isScheduled ? "text-emerald-600" : "text-red-500"
                          }`}>
                            {p.isScheduled ? "已排程" : "未排程"}
                          </td>
                          <td className="px-3 py-3 font-mono-tabular text-[#2563eb] whitespace-nowrap">
                            {p.plannedDate || "-"}
                          </td>
                          <td className="px-3 py-3 font-mono-tabular text-gray-700 whitespace-nowrap">
                            {p.plannedBay || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap max-w-[160px] truncate" title={p.plannedBase}>
                            {p.plannedBase || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{SCHEDULE_LABEL[p.scheduleStatus]}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {pendingCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-[#f97316]">
                                {pendingCount}条待办
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs max-w-[220px] truncate" title={latestContent}>
                            {latestContent ? (
                              <span>{latestContent.length > 20 ? latestContent.slice(0, 20) + "…" : latestContent}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs">
                            {taskSum && taskSum.total > 0 ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium text-gray-700">
                                  已完成{taskSum.done}/共{taskSum.total}
                                </span>
                                {taskSum.overdue > 0 && (
                                  <span className="text-[#c53030] font-semibold">
                                    · {taskSum.overdue}项逾期
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {conflicts.length > 0 ? (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-[#c53030] cursor-help"
                                title={conflicts.map((c) => `${CONFLICT_TYPE_LABEL[c.type]}: ${c.description}`).join("\n")}
                              >
                                {conflicts.length}个冲突
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {unconfirmed > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-[#f97316]">
                                {unconfirmed}条未确认
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-500 min-w-[220px] whitespace-pre-wrap">
                            {(() => {
                              const allSuggestions: string[] = [];
                              for (const c of conflicts) {
                                if (c.suggestions) {
                                  for (const s of c.suggestions) {
                                    allSuggestions.push(s);
                                  }
                                }
                              }
                              if (allSuggestions.length === 0) {
                                return <span className="text-gray-400">—</span>;
                              }
                              return (
                                <div className="space-y-0.5">
                                  {allSuggestions.slice(0, 3).map((s, i) => (
                                    <div key={i} className="text-gray-500">
                                      💡 {s}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {copyBtnText}
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-aviation-700 hover:bg-aviation-800 text-white text-sm font-medium transition-all shadow-lg shadow-aviation-700/30"
              >
                <Download className="w-4 h-4" />
                {downloadBtnText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
