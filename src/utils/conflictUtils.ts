import type { LifePart, ScheduleConflict } from "@/types";
import { BAY_PREFIXES } from "@/types";

function generateSuggestions(
  type: ScheduleConflict["type"],
  parts: LifePart[],
  keyDate: string,
  keyBase?: string,
  keyBay?: string,
  allScheduled?: LifePart[]
): string[] {
  const suggestions: string[] = [];
  const sorted = [...parts].sort(
    (a, b) => a.remainingDays - b.remainingDays || a.remainingCycles - b.remainingCycles
  );
  const shortest = sorted[0];
  const longest = sorted[sorted.length - 1];

  if (type === "AIRCRAFT_DATE") {
    suggestions.push(
      `✓ 建议：${parts.length}件属同一飞机，合并到 ${keyDate} 一次停场完成，准备工作包 ${parts
        .map((p) => p.partNumber)
        .join("+")}`
    );
    if (parts.length >= 3) {
      suggestions.push(
        `→ 分流：${longest.name}(${longest.partNumber}) 寿命充裕(${longest.remainingDays}天)，建议改期 +7 天`
      );
    }
    suggestions.push(
      `→ 换件评估：检查 ${sorted
        .slice(0, Math.min(2, sorted.length))
        .map((p) => p.partNumber)
        .join("/")} 是否有可替换航材，优先调换`
    );
  }

  if (type === "BAY_DATE" && keyBase) {
    const usedBays = new Set(
      (allScheduled || [])
        .filter((p) => p.plannedBase === keyBase && p.plannedDate === keyDate && p.plannedBay)
        .map((p) => p.plannedBay as string)
    );
    const candidates: string[] = [];
    for (const prefix of BAY_PREFIXES) {
      for (let i = 1; i <= 20; i++) {
        const bay = `${prefix}${String(i).padStart(2, "0")}`;
        if (!usedBays.has(bay)) {
          candidates.push(bay);
          break;
        }
      }
      if (candidates.length >= 2) break;
    }
    if (candidates.length > 0) {
      suggestions.push(
        `→ 换机位：保留 ${shortest?.name || "紧急件"} 在原机位 ${keyBay || ""}，将 ${
          longest?.name || "次急件"
        } 调整到 ${candidates[0]}`
      );
    }
    suggestions.push(
      `→ 改期：${longest?.name || "寿命最充裕件"}(${longest?.partNumber}) 建议改期 ±3 天`
    );
  }

  if (type === "BASE_OVERLOAD" && keyBase) {
    const nearby: Record<string, string[]> = {
      "PEK-MRO(北京基地)": ["XIAMEN-MRO(厦门)", "CHENGDU-SVC(成都)"],
      "SHA-BASE(上海基地)": ["XIAMEN-MRO(厦门)", "CAN-TECH(广州技术)"],
      "CAN-TECH(广州技术)": ["SHA-BASE(上海基地)", "XIAMEN-MRO(厦门)"],
      "XIAMEN-MRO(厦门)": ["SHA-BASE(上海基地)", "CAN-TECH(广州技术)"],
      "CHENGDU-SVC(成都)": ["PEK-MRO(北京基地)"],
    };
    const nearbys = nearby[keyBase] || ["其他就近基地"];
    suggestions.push(
      `🏭 分流建议：当日 ${parts.length} 件超出 ${keyBase} 容量(约3件/日)，建议将 ${
        longest?.name || "后2件"
      } 分流到 ${nearbys[0]}`
    );
    suggestions.push(
      `→ 改期：把寿命最长的 ${Math.max(1, parts.length - 5)} 件分散到前后 3-7 天`
    );
    suggestions.push(`→ 另可安排加班消化 1-2 件，或外包 AMO 处理大修件`);
  }

  return suggestions.slice(0, 3);
}

export function detectConflicts(scheduledParts: LifePart[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  let conflictId = 0;

  const partsWithDate = scheduledParts.filter((p) => p.plannedDate);

  const byAircraftDate = new Map<string, LifePart[]>();
  const byBayDate = new Map<string, LifePart[]>();
  const byBaseDate = new Map<string, LifePart[]>();

  for (const p of partsWithDate) {
    const aircraftKey = `${p.aircraftReg}|${p.plannedDate}`;
    if (!byAircraftDate.has(aircraftKey)) byAircraftDate.set(aircraftKey, []);
    byAircraftDate.get(aircraftKey)!.push(p);

    if (p.plannedBay && p.plannedBase) {
      const bayKey = `${p.plannedBase}|${p.plannedBay}|${p.plannedDate}`;
      if (!byBayDate.has(bayKey)) byBayDate.set(bayKey, []);
      byBayDate.get(bayKey)!.push(p);
    }

    if (p.plannedBase) {
      const baseKey = `${p.plannedBase}|${p.plannedDate}`;
      if (!byBaseDate.has(baseKey)) byBaseDate.set(baseKey, []);
      byBaseDate.get(baseKey)!.push(p);
    }
  }

  for (const [key, parts] of byAircraftDate.entries()) {
    if (parts.length >= 2) {
      const [aircraftReg, date] = key.split("|");
      const partIds = parts.map((p) => p.id);
      const partNumbers = parts.map((p) => p.partNumber);
      const base = parts[0]?.plannedBase;
      const baseParts = base
        ? partsWithDate.filter((p) => p.plannedBase === base && p.plannedDate === date)
        : [];
      const suggestions = generateSuggestions(
        "AIRCRAFT_DATE",
        parts,
        date,
        undefined,
        undefined,
        scheduledParts
      );
      conflicts.push({
        id: `C${String(++conflictId).padStart(4, "0")}`,
        type: "AIRCRAFT_DATE",
        severity: "CRITICAL",
        description: `飞机 ${aircraftReg} 在 ${date} 安排了 ${parts.length} 件寿命件更换，存在同日同机作业冲突`,
        relatedPartIds: partIds,
        partIds,
        partNumbers,
        keyDate: date,
        keyAircraft: aircraftReg,
        keyBase: base,
        suggestions,
        capacityInfo: {
          baseCapacityTotal: 3,
          baseCapacityUsed: baseParts.length || parts.length,
          bayCapacityTotal: 1,
          bayCapacityUsed: parts.length,
        },
      });
    }
  }

  for (const [key, parts] of byBayDate.entries()) {
    if (parts.length >= 2) {
      const [base, bay, date] = key.split("|");
      const partIds = parts.map((p) => p.id);
      const partNumbers = parts.map((p) => p.partNumber);
      const baseParts = partsWithDate.filter(
        (p) => p.plannedBase === base && p.plannedDate === date
      );
      const suggestions = generateSuggestions(
        "BAY_DATE",
        parts,
        date,
        base,
        bay,
        scheduledParts
      );
      conflicts.push({
        id: `C${String(++conflictId).padStart(4, "0")}`,
        type: "BAY_DATE",
        severity: "WARNING",
        description: `📍 ${base} 机位 ${bay} 在 ${date} 被 ${parts.length} 件任务占用`,
        relatedPartIds: partIds,
        partIds,
        partNumbers,
        keyDate: date,
        keyBase: base,
        keyBay: bay,
        suggestions,
        capacityInfo: {
          baseCapacityTotal: 3,
          baseCapacityUsed: baseParts.length,
          bayCapacityTotal: 1,
          bayCapacityUsed: parts.length,
        },
      });
    }
  }

  for (const [key, parts] of byBaseDate.entries()) {
    if (parts.length >= 3) {
      const [base, date] = key.split("|");
      const partIds = parts.map((p) => p.id);
      const partNumbers = parts.map((p) => p.partNumber);
      const severity: ScheduleConflict["severity"] = parts.length >= 5 ? "CRITICAL" : "WARNING";
      const suggestions = generateSuggestions(
        "BASE_OVERLOAD",
        parts,
        date,
        base,
        undefined,
        scheduledParts
      );
      conflicts.push({
        id: `C${String(++conflictId).padStart(4, "0")}`,
        type: "BASE_OVERLOAD",
        severity,
        description:
          parts.length >= 5
            ? `🚨 ${base} 在 ${date} 排了 ${parts.length} 件，严重超载(上限5件)`
            : `⚠️ ${base} 在 ${date} 排了 ${parts.length} 件，负荷偏高(基准3件/日)，建议分流`,
        relatedPartIds: partIds,
        partIds,
        partNumbers,
        keyDate: date,
        keyBase: base,
        suggestions,
        capacityInfo: {
          baseCapacityTotal: 3,
          baseCapacityUsed: parts.length,
        },
      });
    }
  }

  return conflicts;
}

export function getMaxSeverity(conflicts: ScheduleConflict[]): "CRITICAL" | "WARNING" | null {
  if (conflicts.length === 0) return null;
  if (conflicts.some((c) => c.severity === "CRITICAL")) return "CRITICAL";
  return "WARNING";
}

export function getConflictsForPart(
  conflicts: ScheduleConflict[],
  partId: string
): ScheduleConflict[] {
  return conflicts.filter((c) => c.relatedPartIds.includes(partId));
}

export function getConflictsOnDate(
  conflicts: ScheduleConflict[],
  dateStr: string
): ScheduleConflict[] {
  return conflicts.filter((c) => c.keyDate === dateStr);
}

export function getBaseDailyCapacity(
  allScheduled: LifePart[],
  base: string,
  date: string
): {
  total: number;
  used: number;
  bays: Record<string, number>;
} {
  const todays = allScheduled.filter((p) => p.plannedBase === base && p.plannedDate === date);
  const bays: Record<string, number> = {};
  for (const p of todays) {
    if (p.plannedBay) bays[p.plannedBay] = (bays[p.plannedBay] || 0) + 1;
  }
  return { total: 3, used: todays.length, bays };
}

export function getAvailableBays(
  allScheduled: LifePart[],
  base: string,
  date: string
): string[] {
  const used = new Set(
    allScheduled
      .filter((p) => p.plannedBase === base && p.plannedDate === date && p.plannedBay)
      .map((p) => p.plannedBay as string)
  );
  const available: string[] = [];
  for (const prefix of BAY_PREFIXES) {
    for (let i = 1; i <= 20; i++) {
      const bay = `${prefix}${String(i).padStart(2, "0")}`;
      if (!used.has(bay)) available.push(bay);
    }
  }
  return available;
}
