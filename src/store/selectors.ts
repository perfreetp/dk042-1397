import type {
  Filters,
  WarningWindow,
  LifePart,
  RemovalRecord,
  AirworthinessDoc,
  HandoverNote,
} from "@/types";
import { RISK_ORDER } from "@/utils/riskUtils";

export function computeFilteredParts(parts: LifePart[], filters: Filters): LifePart[] {
  return parts
    .filter((p) => {
      if (filters.partNumber && !p.partNumber.toLowerCase().includes(filters.partNumber.toLowerCase()))
        return false;
      if (filters.serialNumber && !p.serialNumber.toLowerCase().includes(filters.serialNumber.toLowerCase()))
        return false;
      if (filters.aircraftReg && !p.aircraftReg.toLowerCase().includes(filters.aircraftReg.toLowerCase()))
        return false;
      if (filters.minRemainingCycles != null && p.remainingCycles < filters.minRemainingCycles) return false;
      if (filters.maxRemainingCycles != null && p.remainingCycles > filters.maxRemainingCycles) return false;
      if (filters.minRemainingDays != null && p.remainingDays < filters.minRemainingDays) return false;
      if (filters.maxRemainingDays != null && p.remainingDays > filters.maxRemainingDays) return false;
      return true;
    })
    .sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel] || a.remainingDays - b.remainingDays);
}

export function computeWarningParts(
  parts: LifePart[],
  warningWindow: WarningWindow,
  customCycles: number
): LifePart[] {
  let maxDays = 30;
  let maxCycles = Infinity;
  if (warningWindow === "30D") maxDays = 30;
  else if (warningWindow === "60D") maxDays = 60;
  else if (warningWindow === "90D") maxDays = 90;
  else {
    maxDays = 365;
    maxCycles = customCycles;
  }
  return parts
    .filter((p) => p.remainingDays <= maxDays || p.remainingCycles <= maxCycles)
    .filter((p) => p.riskLevel !== "NORMAL")
    .sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel] || a.remainingDays - b.remainingDays);
}

export function computeScheduledParts(parts: LifePart[], scheduledPartIds: string[]): LifePart[] {
  return scheduledPartIds
    .map((id) => parts.find((p) => p.id === id))
    .filter((p): p is LifePart => !!p)
    .sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
}

export function computeUnscheduledWarningParts(
  parts: LifePart[],
  warningWindow: WarningWindow,
  customCycles: number,
  scheduledPartIds: string[]
): LifePart[] {
  const wp = computeWarningParts(parts, warningWindow, customCycles);
  return wp.filter((p) => !scheduledPartIds.includes(p.id));
}

export function computePendingNotesCount(handoverNotes: HandoverNote[]): number {
  return handoverNotes.filter((n) => n.status !== "CONFIRMED").length;
}

export function findRemovalById(records: RemovalRecord[], id?: string): RemovalRecord | undefined {
  if (!id) return undefined;
  return records.find((r) => r.id === id);
}

export function findDocsByNumbers(docs: AirworthinessDoc[], refs: string[]): AirworthinessDoc[] {
  return docs.filter((d) => refs.includes(d.docNumber));
}

export function findNotesByPartId(notes: HandoverNote[], partId: string): HandoverNote[] {
  return notes
    .filter((n) => n.partId === partId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function findPartsWithNotes(parts: LifePart[], notes: HandoverNote[]): LifePart[] {
  const partIdsWithNotes = new Set(notes.map((n) => n.partId));
  const partsWithNotes = parts.filter((p) => partIdsWithNotes.has(p.id));
  return partsWithNotes.sort((a, b) => {
    const aNotes = notes.filter((n) => n.partId === a.id);
    const bNotes = notes.filter((n) => n.partId === b.id);
    const aPending = aNotes.filter((n) => n.status !== "CONFIRMED").length;
    const bPending = bNotes.filter((n) => n.status !== "CONFIRMED").length;
    if (aPending !== bPending) return bPending - aPending;
    const aLatest = aNotes.reduce((acc, n) => (n.createdAt > acc ? n.createdAt : acc), "");
    const bLatest = bNotes.reduce((acc, n) => (n.createdAt > acc ? n.createdAt : acc), "");
    return bLatest.localeCompare(aLatest);
  });
}
