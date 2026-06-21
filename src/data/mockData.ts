import type {
  LifePart,
  RemovalRecord,
  AirworthinessDoc,
  HandoverNote,
  PartCategory,
  RiskLevel,
} from "@/types";
import { addDays, formatDate } from "@/utils/dateUtils";

const now = new Date();

function makePart(
  idx: number,
  category: PartCategory,
  risk: RiskLevel,
  remainingDays: number,
  remainingCyclesRatio: number,
  opts: Partial<LifePart> = {}
): LifePart {
  const totalCycles =
    category === "ENGINE_LLP"
      ? 30000
      : category === "LANDING_GEAR"
        ? 60000
        : category === "EMERGENCY_EQ"
          ? 5000
          : 20000;
  const totalDays =
    category === "ENGINE_LLP"
      ? 365 * 15
      : category === "LANDING_GEAR"
        ? 365 * 12
        : category === "EMERGENCY_EQ"
          ? 365 * 5
          : 365 * 10;
  const usedCycles = Math.round(totalCycles * (1 - remainingCyclesRatio));
  const usedDays = totalDays - remainingDays;
  return {
    id: `P${String(idx).padStart(4, "0")}`,
    partNumber: `PN-${category.slice(0, 2)}-${1000 + idx}`,
    serialNumber: `SN${category.slice(0, 2)}${2024}${String(idx).padStart(5, "0")}`,
    name: opts.name ?? "默认寿命件",
    category,
    aircraftReg: opts.aircraftReg ?? `B-${1000 + (idx % 15)}`,
    installPosition: opts.installPosition ?? "未指定位置",
    totalCycles,
    usedCycles,
    remainingCycles: Math.round(totalCycles * remainingCyclesRatio),
    totalDays,
    usedDays,
    remainingDays,
    expiryDate: formatDate(addDays(now, remainingDays)),
    riskLevel: risk,
    scheduleStatus: opts.scheduleStatus ?? "NONE",
    isScheduled: opts.isScheduled ?? false,
    scheduledDate: opts.scheduledDate,
    lastRemovalId: opts.lastRemovalId,
    airworthinessRefs: opts.airworthinessRefs ?? [],
  };
}

export const mockParts: LifePart[] = [
  makePart(1, "ENGINE_LLP", "CRITICAL", 9, 0.03, {
    name: "CFM56-7B 风扇盘 LPC Stage 1",
    aircraftReg: "B-5123",
    installPosition: "左发 #1 低压压气机一级盘",
    airworthinessRefs: ["CAAC-AD-2023-08-12", "EASA AD 2022-0245"],
    scheduleStatus: "NEED_ORDER",
    lastRemovalId: "R001",
  }),
  makePart(2, "ENGINE_LLP", "CRITICAL", 22, 0.045, {
    name: "CFM56-7B 高压涡轮一级盘",
    aircraftReg: "B-6234",
    installPosition: "右发 #2 HPT Stage 1 Disk",
    airworthinessRefs: ["FAA AD 2023-12-51"],
    lastRemovalId: "R002",
  }),
  makePart(3, "LANDING_GEAR", "CRITICAL", 12, 0.048, {
    name: "B737NG 主起落架支柱组件",
    aircraftReg: "B-1987",
    installPosition: "左侧主起落架 MLG-L",
    airworthinessRefs: ["CAAC-AD-2022-23-01"],
    scheduleStatus: "NEED_REPAIR",
    lastRemovalId: "R003",
  }),
  makePart(4, "ENGINE_LLP", "WARNING", 38, 0.12, {
    name: "CFM56-7B 低压涡轮三级盘",
    aircraftReg: "B-5432",
    installPosition: "左发 #1 LPT Stage 3",
    airworthinessRefs: ["EASA AD 2023-0091"],
    lastRemovalId: "R004",
  }),
  makePart(5, "EMERGENCY_EQ", "WARNING", 26, 0.10, {
    name: "ELT 应急定位发射机",
    aircraftReg: "B-2567",
    installPosition: "后货舱壁板 AFT CARGO RH",
    airworthinessRefs: ["CAAC-AD-2024-01-05"],
    scheduleStatus: "MERGE_CHECK",
    lastRemovalId: "R005",
  }),
  makePart(6, "LANDING_GEAR", "WARNING", 35, 0.13, {
    name: "B737NG 前起落架作动筒",
    aircraftReg: "B-3012",
    installPosition: "前起落架 NLG 收放作动筒",
    airworthinessRefs: ["FAA AD 2022-08-15"],
    lastRemovalId: "R006",
  }),
  makePart(7, "ENGINE_LLP", "CAUTION", 58, 0.27, {
    name: "CFM56-7B 燃烧室机匣",
    aircraftReg: "B-5123",
    installPosition: "右发 #2 燃烧室机匣组件",
    airworthinessRefs: ["CAAC-AD-2023-14-02"],
    lastRemovalId: "R007",
  }),
  makePart(8, "EMERGENCY_EQ", "CAUTION", 49, 0.22, {
    name: "机组氧气瓶 (1800L)",
    aircraftReg: "B-6543",
    installPosition: "E/E舱 氧气系统",
    airworthinessRefs: ["FAA AD 2023-09-27"],
    lastRemovalId: "R008",
  }),
  makePart(9, "LANDING_GEAR", "CAUTION", 65, 0.28, {
    name: "B737NG 主轮刹车组件",
    aircraftReg: "B-2876",
    installPosition: "主起落架 四轮刹车组",
    airworthinessRefs: ["EASA AD 2024-0108"],
    scheduleStatus: "MERGE_CHECK",
    lastRemovalId: "R009",
  }),
  makePart(10, "ENGINE_LLP", "NORMAL", 120, 0.55, {
    name: "CFM56-7B 高压压气机四级盘",
    aircraftReg: "B-5489",
    installPosition: "左发 #1 HPC Stage 4",
    airworthinessRefs: ["CAAC-AD-2022-19-03"],
    lastRemovalId: "R010",
  }),
  makePart(11, "OTHER", "WARNING", 29, 0.14, {
    name: "APU 涡轮叶轮 (GTCP131-9B)",
    aircraftReg: "B-5123",
    installPosition: "APU 舱 APU 涡轮一级",
    airworthinessRefs: ["FAA AD 2023-11-45"],
    lastRemovalId: "R011",
  }),
  makePart(12, "ENGINE_LLP", "NORMAL", 240, 0.72, {
    name: "CFM56-7B 风扇轴",
    aircraftReg: "B-6789",
    installPosition: "左发 #1 风扇轴组件",
    airworthinessRefs: ["EASA AD 2022-0876"],
    lastRemovalId: "R012",
  }),
  makePart(13, "EMERGENCY_EQ", "CAUTION", 72, 0.30, {
    name: "滑梯气瓶 (舱门 R3)",
    aircraftReg: "B-5123",
    installPosition: "R3 舱门滑梯气瓶",
    airworthinessRefs: ["CAAC-AD-2023-06-18"],
    lastRemovalId: "R013",
  }),
  makePart(14, "LANDING_GEAR", "NORMAL", 180, 0.62, {
    name: "B737NG 前轮转弯作动筒",
    aircraftReg: "B-5432",
    installPosition: "前起落架 转弯作动器",
    airworthinessRefs: ["FAA AD 2022-14-02"],
    lastRemovalId: "R014",
  }),
  makePart(15, "ENGINE_LLP", "WARNING", 31, 0.11, {
    name: "CFM56-7B 高压涡轮二级叶片",
    aircraftReg: "B-1987",
    installPosition: "右发 #2 HPT Stage 2 Blade",
    airworthinessRefs: ["CAAC-AD-2024-02-11"],
    scheduleStatus: "NEED_ORDER",
    lastRemovalId: "R015",
  }),
];

export const mockRemovals: RemovalRecord[] = [
  { id: "R001", partId: "P0001", date: "2025-11-18", station: "上海浦东 PVG", reason: "定期拆装（按MPD ATA72）", fromPosition: "右发 #1 LPC Stage 1", operator: "张工 / 定检车间" },
  { id: "R002", partId: "P0002", date: "2025-09-02", station: "广州白云 CAN", reason: "孔探发现缺陷换装", fromPosition: "左发 #2 HPT Stage 1", toAircraft: "库存待修", operator: "李工 / 发动机车间" },
  { id: "R003", partId: "P0003", date: "2026-01-07", station: "北京首都 PEK", reason: "C检期间拆下送修", fromPosition: "MLG-R 主起落架右", operator: "王工 / 起落架车间" },
  { id: "R004", partId: "P0004", date: "2025-06-14", station: "成都双流 CTU", reason: "MPD 强制到期", fromPosition: "右发 #1 LPT Stage 3", operator: "赵工 / 定检车间" },
  { id: "R005", partId: "P0005", date: "2025-04-22", station: "西安咸阳 XIY", reason: "年度检查到期", fromPosition: "AFT CARGO LH", operator: "钱工 / 应急设备车间" },
  { id: "R006", partId: "P0006", date: "2025-02-11", station: "杭州萧山 HGH", reason: "4C检拆装", fromPosition: "NLG Actuator", operator: "孙工 / 定检车间" },
  { id: "R007", partId: "P0007", date: "2024-11-05", station: "深圳宝安 SZX", reason: "HMV 热检", fromPosition: "左发 #2 燃烧室", operator: "周工 / 发动机车间" },
  { id: "R008", partId: "P0008", date: "2024-08-19", station: "重庆江北 CKG", reason: "氧气年检", fromPosition: "E/E 氧气架", operator: "吴工 / 应急设备车间" },
  { id: "R009", partId: "P0009", date: "2024-05-27", station: "昆明长水 KMG", reason: "刹车磨损超标", fromPosition: "MLG 刹车组", toAircraft: "B-2877", operator: "郑工 / 起落架车间" },
  { id: "R010", partId: "P0010", date: "2024-03-03", station: "长沙黄花 CSX", reason: "C检定检", fromPosition: "左发 #1 HPC Stage 4", operator: "冯工 / 定检车间" },
  { id: "R011", partId: "P0011", date: "2025-07-15", station: "武汉天河 WUH", reason: "APU 性能衰退", fromPosition: "APU 涡轮", operator: "陈工 / APU车间" },
  { id: "R012", partId: "P0012", date: "2024-01-20", station: "厦门高崎 XMN", reason: "2C 拆装", fromPosition: "右发 #1 风扇轴", operator: "褚工 / 发动机车间" },
  { id: "R013", partId: "P0013", date: "2024-09-08", station: "青岛胶东 TAO", reason: "滑梯气瓶压力检查到期", fromPosition: "R1 舱门", operator: "卫工 / 应急设备车间" },
  { id: "R014", partId: "P0014", date: "2023-12-01", station: "大连周水子 DLC", reason: "A检更换", fromPosition: "NLG 转弯", operator: "蒋工 / 起落架车间" },
  { id: "R015", partId: "P0015", date: "2025-10-29", station: "郑州新郑 CGO", reason: "叶片损伤超标", fromPosition: "左发 #2 HPT Stage 2", toAircraft: "报废", operator: "沈工 / 发动机车间" },
];

export const mockDocs: AirworthinessDoc[] = [
  { docNumber: "CAAC-AD-2023-08-12", title: "关于CFM56系列发动机风扇盘检查的适航指令", issueDate: "2023-08-15", authority: "CAAC", link: "https://www.caac.gov.cn" },
  { docNumber: "EASA AD 2022-0245", title: "CFM56-7B LPC Disk Inspection", issueDate: "2022-03-02", authority: "EASA", link: "https://ad.easa.europa.eu" },
  { docNumber: "FAA AD 2023-12-51", title: "Airworthiness Directive: CFM56 HPT Stage 1 Disk Life", issueDate: "2023-12-20", authority: "FAA", link: "https://www.faa.gov" },
  { docNumber: "CAAC-AD-2022-23-01", title: "B737系列主起落架支柱大修周期调整", issueDate: "2022-11-10", authority: "CAAC", link: "https://www.caac.gov.cn" },
  { docNumber: "EASA AD 2023-0091", title: "LPT Stage 3 Disk Life Limit Reduction", issueDate: "2023-02-14", authority: "EASA", link: "https://ad.easa.europa.eu" },
  { docNumber: "CAAC-AD-2024-01-05", title: "ELT应急定位发射机电池更换要求", issueDate: "2024-01-12", authority: "CAAC", link: "https://www.caac.gov.cn" },
  { docNumber: "FAA AD 2022-08-15", title: "B737 NLG Actuator Inspection", issueDate: "2022-04-27", authority: "FAA", link: "https://www.faa.gov" },
  { docNumber: "CAAC-AD-2023-14-02", title: "CFM56燃烧室机匣裂纹检查", issueDate: "2023-07-03", authority: "CAAC", link: "https://www.caac.gov.cn" },
  { docNumber: "FAA AD 2023-09-27", title: "Crew Oxygen Bottle Hydrostatic Test", issueDate: "2023-09-30", authority: "FAA", link: "https://www.faa.gov" },
  { docNumber: "EASA AD 2024-0108", title: "B737 Brake Assembly Life Extension", issueDate: "2024-02-01", authority: "EASA", link: "https://ad.easa.europa.eu" },
  { docNumber: "CAAC-AD-2022-19-03", title: "HPC Stage 4 Disk Eddy Current Inspection", issueDate: "2022-09-18", authority: "CAAC", link: "https://www.caac.gov.cn" },
  { docNumber: "FAA AD 2023-11-45", title: "APU GTCP131-9B Turbine Wheel Life", issueDate: "2023-11-08", authority: "FAA", link: "https://www.faa.gov" },
  { docNumber: "EASA AD 2022-0876", title: "Fan Shaft Magnetic Particle Inspection", issueDate: "2022-10-19", authority: "EASA", link: "https://ad.easa.europa.eu" },
  { docNumber: "CAAC-AD-2023-06-18", title: "滑梯气瓶压力与寿命管理规定", issueDate: "2023-06-22", authority: "CAAC", link: "https://www.caac.gov.cn" },
  { docNumber: "FAA AD 2022-14-02", title: "NLG Steering Actuator Replacement", issueDate: "2022-05-11", authority: "FAA", link: "https://www.faa.gov" },
  { docNumber: "CAAC-AD-2024-02-11", title: "HPT Stage 2 Blade非计划拆下要求", issueDate: "2024-02-19", authority: "CAAC", link: "https://www.caac.gov.cn" },
];

export const mockNotes: HandoverNote[] = [
  {
    id: "N001",
    partId: "P0001",
    content: "该件剩余循环仅920次，按计划B-5123下月PVG-C-Check（7月14日），已联系库房查询新件库存，供应商回复有新件在途约7月5日到港。需白班确认新件入库进度。",
    author: "刘建华",
    authorRole: "NIGHT_SHIFT",
    createdAt: "2026-06-21T23:45:00",
    status: "PENDING",
  },
  {
    id: "N002",
    partId: "P0001",
    content: "新件信息确认：供应商运单号781-23456789，预计7月5日14:30到达PVG货站，已通知库房优先报关入库。",
    author: "陈明亮",
    authorRole: "DAY_SHIFT",
    createdAt: "2026-06-22T09:12:00",
    status: "IN_PROGRESS",
  },
  {
    id: "N003",
    partId: "P0003",
    content: "B-1987主起落架支柱剩余寿命12天，原计划8月C检但日历寿命不等待。已与AMO协调紧急送修报价，预计修理周期45天，需尽快拆换。建议与7月定检合并或安排专项停场。",
    author: "王晓峰",
    authorRole: "NIGHT_SHIFT",
    createdAt: "2026-06-21T22:30:00",
    status: "PENDING",
  },
  {
    id: "N004",
    partId: "P0005",
    content: "B-2567 ELT电池已订（PO#45678），到货日期7月1日。该机6月30日有CAN过夜停场，建议合并完成更换，无需单独停场。",
    author: "赵明远",
    authorRole: "DAY_SHIFT",
    createdAt: "2026-06-20T16:20:00",
    status: "CONFIRMED",
    confirmedBy: "孙志伟",
    confirmedAt: "2026-06-21T08:45:00",
  },
  {
    id: "N005",
    partId: "P0015",
    content: "P0015（HPT二级叶片）紧急！该件之前从B-1987拆下送修但厂家反馈修理报废率80%。建议直接采购新件，当前报价已提交主管审批，请白班跟进审批状态。",
    author: "刘建华",
    authorRole: "NIGHT_SHIFT",
    createdAt: "2026-06-22T01:15:00",
    status: "PENDING",
  },
  {
    id: "N006",
    partId: "P0009",
    content: "B-2876刹车组件7月下旬到期，该机7月25日有PEK 4C检，已纳入定检工作包（WO-2026-0725-018），无需另行安排。",
    author: "周立群",
    authorRole: "SUPERVISOR",
    createdAt: "2026-06-19T11:00:00",
    status: "CONFIRMED",
    confirmedBy: "周立群",
    confirmedAt: "2026-06-19T11:00:00",
  },
];
