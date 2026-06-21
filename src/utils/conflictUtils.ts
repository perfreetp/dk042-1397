import type { LifePart, ScheduleConflict } from "@/types";

export function detectConflicts(scheduledParts: LifePart[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  let conflictId = 0;

  const partsWithDate = scheduledParts.filter((p) => p.plannedDate);
  const partMap = new Map(scheduledParts.map((p) => [p.id, p]));

  const byAircraftDate = new Map<string, LifePart[]>();
  const byBayDate = new Map<string, LifePart[]>();
  const byBaseDate = new Map<string, LifePart[]>();

  for (const p of partsWithDate) {
    const aircraftKey = `${p.aircraftReg}|${p.plannedDate}`;
    if (!byAircraftDate.has(aircraftKey)) byAircraftDate.set(aircraftKey, []);
    byAircraftDate.get(aircraftKey)!.push(p);

    if (p.plannedBay) {
      const bayKey = `${p.plannedBay}|${p.plannedDate}`;
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
      });
    }
  }

  for (const [key, parts] of byBayDate.entries()) {
    if (parts.length >= 2) {
      const [bay, date] = key.split("|");
      const partIds = parts.map((p) => p.id);
      const partNumbers = parts.map((p) => p.partNumber);
      conflicts.push({
        id: `C${String(++conflictId).padStart(4, "0")}`,
        type: "BAY_DATE",
        severity: "WARNING",
        description: `停机位 ${bay} 在 ${date} 被 ${parts.length} 件占用，存在机位冲突`,
        relatedPartIds: partIds,
        partIds,
        partNumbers,
        keyDate: date,
        keyBay: bay,
      });
    }
  }

  for (const [key, parts] of byBaseDate.entries()) {
    if (parts.length >= 4) {
      const [base, date] = key.split("|");
      const partIds = parts.map((p) => p.id);
      const partNumbers = parts.map((p) => p.partNumber);
      conflicts.push({
        id: `C${String(++conflictId).padStart(4, "0")}`,
        type: "BASE_OVERLOAD",
        severity: "WARNING",
        description: `基地 ${base} 在 ${date} 排了 ${parts.length} 件，负荷偏高，建议分流`,
        relatedPartIds: partIds,
        partIds,
        partNumbers,
        keyDate: date,
        keyBase: base,
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

export function getConflictsForPart(conflicts: ScheduleConflict[], partId: string): ScheduleConflict[] {
  return conflicts.filter((c) => c.relatedPartIds.includes(partId));
}

export function getConflictsOnDate(conflicts: ScheduleConflict[], dateStr: string): ScheduleConflict[] {
  return conflicts.filter((c) => c.keyDate === dateStr);
}
