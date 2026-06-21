import { create } from "zustand";
import type {
  Filters,
  HandoverNote,
  HandoverStatus,
  LifePart,
  ScheduleStatus,
  WarningWindow,
  AuthorRole,
} from "@/types";
import { mockParts, mockRemovals, mockDocs, mockNotes } from "@/data/mockData";
import type { RemovalRecord, AirworthinessDoc } from "@/types";

const STORAGE_KEY = "life-part-tracker:v1";

interface PersistedState {
  handoverNotes: HandoverNote[];
  parts: LifePart[];
  scheduledPartIds: string[];
  filters: Filters;
  warningWindow: WarningWindow;
  customCycles: number;
}

function loadPersisted(): Partial<PersistedState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

function persistState(s: AppState) {
  if (typeof window === "undefined") return;
  try {
    const toSave: PersistedState = {
      handoverNotes: s.handoverNotes,
      parts: s.parts,
      scheduledPartIds: s.scheduledPartIds,
      filters: s.filters,
      warningWindow: s.warningWindow,
      customCycles: s.customCycles,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
  }
}

interface AppState {
  filters: Filters;
  warningWindow: WarningWindow;
  customCycles: number;
  parts: LifePart[];
  removalRecords: RemovalRecord[];
  airworthinessDocs: AirworthinessDoc[];
  handoverNotes: HandoverNote[];
  scheduledPartIds: string[];
  drawerOpen: boolean;
  activePartId: string | null;

  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  setWarningWindow: (w: WarningWindow) => void;
  setCustomCycles: (n: number) => void;

  addHandoverNote: (note: Omit<HandoverNote, "id" | "createdAt">) => void;
  updateNoteStatus: (id: string, status: HandoverStatus, confirmedBy: string) => void;

  schedulePart: (partId: string) => void;
  unschedulePart: (partId: string) => void;
  setScheduleStatus: (partId: string, status: ScheduleStatus) => void;
  updateScheduleDetails: (partId: string, details: Partial<Pick<LifePart, "plannedDate" | "plannedBay" | "plannedBase">>) => void;

  openDrawerForPart: (partId: string) => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
}

const DEFAULT_FILTERS: Filters = {
  partNumber: "",
  serialNumber: "",
  aircraftReg: "",
  minRemainingCycles: null,
  maxRemainingCycles: null,
  minRemainingDays: null,
  maxRemainingDays: null,
};

function nowISO(): string {
  return new Date().toISOString();
}

export const useAppStore = create<AppState>((set) => {
  const persisted = loadPersisted();

  return {
    filters: { ...DEFAULT_FILTERS, ...persisted.filters },
    warningWindow: persisted.warningWindow ?? "30D",
    customCycles: persisted.customCycles ?? 500,
    parts: persisted.parts ?? [...mockParts],
    removalRecords: [...mockRemovals],
    airworthinessDocs: [...mockDocs],
    handoverNotes: persisted.handoverNotes ?? [...mockNotes],
    scheduledPartIds: persisted.scheduledPartIds ?? mockParts.filter((p) => p.isScheduled).map((p) => p.id),
    drawerOpen: false,
    activePartId: null,

    setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
    resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
    setWarningWindow: (w) => set({ warningWindow: w }),
    setCustomCycles: (n) => set({ customCycles: n }),

    addHandoverNote: (note) =>
      set((s) => ({
        handoverNotes: [
          ...s.handoverNotes,
          {
            ...note,
            id: `N${Date.now()}`,
            createdAt: nowISO(),
          },
        ],
      })),

    updateNoteStatus: (id, status, confirmedBy) =>
      set((s) => ({
        handoverNotes: s.handoverNotes.map((n) =>
          n.id === id
            ? {
                ...n,
                status,
                confirmedBy: status === "CONFIRMED" || status === "IN_PROGRESS" ? confirmedBy : n.confirmedBy,
                confirmedAt: status === "CONFIRMED" ? nowISO() : n.confirmedAt,
              }
            : n
        ),
      })),

    schedulePart: (partId) =>
      set((s) => {
        if (s.scheduledPartIds.includes(partId)) return {};
        return {
          scheduledPartIds: [...s.scheduledPartIds, partId],
          parts: s.parts.map((p) => (p.id === partId ? { ...p, isScheduled: true } : p)),
        };
      }),

    unschedulePart: (partId) =>
      set((s) => ({
        scheduledPartIds: s.scheduledPartIds.filter((x) => x !== partId),
        parts: s.parts.map((p) => (p.id === partId ? { ...p, isScheduled: false } : p)),
      })),

    setScheduleStatus: (partId, status) =>
      set((s) => ({
        parts: s.parts.map((p) => (p.id === partId ? { ...p, scheduleStatus: status } : p)),
      })),

    updateScheduleDetails: (partId, details) =>
      set((s) => ({
        parts: s.parts.map((p) => (p.id === partId ? { ...p, ...details } : p)),
      })),

    openDrawerForPart: (partId) => set({ activePartId: partId, drawerOpen: true }),
    closeDrawer: () => set({ drawerOpen: false }),
    setDrawerOpen: (open) => set({ drawerOpen: open }),
  };
});

useAppStore.subscribe((state) => persistState(state));

export function mockCurrentUser(): { name: string; role: AuthorRole } {
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;
  return {
    name: isNight ? "刘建华" : "陈明亮",
    role: isNight ? "NIGHT_SHIFT" : "DAY_SHIFT",
  };
}
