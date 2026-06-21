export type PartCategory = "ENGINE_LLP" | "LANDING_GEAR" | "EMERGENCY_EQ" | "OTHER";

export type RiskLevel = "CRITICAL" | "WARNING" | "CAUTION" | "NORMAL";

export type ScheduleStatus = "NONE" | "NEED_ORDER" | "NEED_REPAIR" | "MERGE_CHECK";

export type HandoverStatus = "PENDING" | "IN_PROGRESS" | "CONFIRMED";

export type AuthorRole = "DAY_SHIFT" | "NIGHT_SHIFT" | "SUPERVISOR";

export type WarningWindow = "30D" | "60D" | "90D" | "CUSTOM";

export type TaskType = "ORDER" | "REPAIR" | "MERGE" | "PREPARE" | "INSTALL" | "VERIFY";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE";

export interface TaskStep {
  id: string;
  partId: string;
  type: TaskType;
  title: string;
  assignee: string;
  dueDate: string;
  notes?: string;
  status: TaskStatus;
  completedAt?: string;
  order: number;
}

export interface ScheduleConflict {
  id: string;
  type: "AIRCRAFT_DATE" | "BAY_DATE" | "BASE_OVERLOAD";
  severity: "WARNING" | "CRITICAL";
  description: string;
  relatedPartIds: string[];
  partIds: string[];
  partNumbers: string[];
  keyDate?: string;
  keyBase?: string;
  keyAircraft?: string;
  keyBay?: string;
}

export interface LifePart {
  id: string;
  partNumber: string;
  serialNumber: string;
  name: string;
  category: PartCategory;
  aircraftReg: string;
  installPosition: string;
  totalCycles: number;
  usedCycles: number;
  remainingCycles: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  expiryDate: string;
  riskLevel: RiskLevel;
  scheduleStatus: ScheduleStatus;
  isScheduled: boolean;
  scheduledDate?: string;
  plannedDate?: string;
  plannedBay?: string;
  plannedBase?: string;
  lastRemovalId?: string;
  airworthinessRefs: string[];
}

export interface RemovalRecord {
  id: string;
  partId: string;
  date: string;
  station: string;
  reason: string;
  fromPosition: string;
  toAircraft?: string;
  operator: string;
}

export interface AirworthinessDoc {
  docNumber: string;
  title: string;
  issueDate: string;
  authority: "CAAC" | "FAA" | "EASA";
  link: string;
}

export interface HandoverNote {
  id: string;
  partId: string;
  content: string;
  author: string;
  authorRole: AuthorRole;
  createdAt: string;
  status: HandoverStatus;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface Filters {
  partNumber: string;
  serialNumber: string;
  aircraftReg: string;
  minRemainingCycles: number | null;
  maxRemainingCycles: number | null;
  minRemainingDays: number | null;
  maxRemainingDays: number | null;
}

export const CATEGORY_LABEL: Record<PartCategory, string> = {
  ENGINE_LLP: "发动机LLP",
  LANDING_GEAR: "起落架大修件",
  EMERGENCY_EQ: "应急设备",
  OTHER: "其他寿命件",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  CRITICAL: "紧急",
  WARNING: "预警",
  CAUTION: "关注",
  NORMAL: "正常",
};

export const SCHEDULE_LABEL: Record<ScheduleStatus, string> = {
  NONE: "未标记",
  NEED_ORDER: "需订件",
  NEED_REPAIR: "需送修",
  MERGE_CHECK: "合并定检",
};

export const HANDOVER_LABEL: Record<HandoverStatus, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "处理中",
  CONFIRMED: "已确认",
};

export const ROLE_LABEL: Record<AuthorRole, string> = {
  DAY_SHIFT: "白班计划员",
  NIGHT_SHIFT: "夜班计划员",
  SUPERVISOR: "主管",
};

export const WINDOW_LABEL: Record<WarningWindow, string> = {
  "30D": "未来30天",
  "60D": "未来60天",
  "90D": "未来90天",
  CUSTOM: "自定义循环",
};

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  ORDER: "订件",
  REPAIR: "送修",
  MERGE: "合并定检",
  PREPARE: "准备备件",
  INSTALL: "现场安装",
  VERIFY: "适航验证",
};

export const TASK_TYPE_DEFAULT_TITLE: Record<TaskType, string> = {
  ORDER: "发起采购订单",
  REPAIR: "安排送修",
  MERGE: "合并到定检工作包",
  PREPARE: "准备备件",
  INSTALL: "现场安装与检查",
  VERIFY: "适航验证与签字放行",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: "待开始",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
  OVERDUE: "已逾期",
};

export const CONFLICT_TYPE_LABEL: Record<ScheduleConflict["type"], string> = {
  AIRCRAFT_DATE: "同机同日撞期",
  BAY_DATE: "机位同日占用",
  BASE_OVERLOAD: "基地负荷过高",
};

export const BASE_OPTIONS: string[] = ["PEK-MRO(北京基地)", "SHA-BASE(上海基地)", "CAN-TECH(广州技术)", "XIAMEN-MRO(厦门)", "CHENGDU-SVC(成都)"];
export const BAY_PREFIXES: string[] = ["A", "B", "C", "D"];
