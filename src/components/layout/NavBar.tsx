import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Plane,
  ListChecks,
  CalendarClock,
  Bell,
  MessageSquareText,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { useAppStore, mockCurrentUser } from "@/store/useAppStore";
import { ROLE_LABEL } from "@/types";
import type { HandoverNote } from "@/types";
import { computePendingNotesCount } from "@/store/selectors";

export default function NavBar() {
  const handoverNotes = useAppStore((s) => s.handoverNotes);
  const drawerOpen = useAppStore((s) => s.drawerOpen);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const pendingCount = useMemo(
    () => computePendingNotesCount(handoverNotes),
    [handoverNotes]
  );
  const user = mockCurrentUser();
  const hour = new Date().getHours();
  const isNightTheme = hour >= 20 || hour < 6;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-white/15 text-white shadow-inner"
        : "text-aviation-100 hover:bg-white/10 hover:text-white",
    ].join(" ");

  return (
    <header className="bg-aviation-700 text-white shadow-md z-30 sticky top-0">
      <div className="flex items-center h-16 px-6 gap-6">
        <div className="flex items-center gap-3 min-w-[240px]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-alert-warning to-aviation-500 flex items-center justify-center shadow-lg">
            <Plane className="w-6 h-6 text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base tracking-wide">航材寿命件台账</div>
            <div className="text-[11px] text-aviation-200 font-mono-tabular">
              Life Parts Tracking · v1.0
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink to="/parts" className={linkClass}>
            <ListChecks className="w-4 h-4" />
            <span>寿命件清单</span>
          </NavLink>
          <NavLink to="/schedule" className={linkClass}>
            <CalendarClock className="w-4 h-4" />
            <span>预警排程</span>
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-aviation-200 bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
            {isNightTheme ? <Moon className="w-3.5 h-3.5 text-alert-warning" /> : <Sun className="w-3.5 h-3.5 text-yellow-300" />}
            <span className="font-mono-tabular">{new Date().toLocaleDateString("zh-CN")}</span>
          </div>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-all duration-200 border border-white/10"
          >
            <MessageSquareText className="w-4 h-4" />
            <span className="hidden sm:inline">交接备注</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-alert-critical text-white text-[11px] font-bold flex items-center justify-center shadow-lg animate-pulse-fast">
                {pendingCount}
              </span>
            )}
          </button>

          <button className="p-2 rounded-md bg-white/5 hover:bg-white/15 transition-all border border-white/10">
            <Bell className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-white/10 ml-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aviation-400 to-aviation-600 flex items-center justify-center shadow-inner">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-[10px] text-aviation-200">{ROLE_LABEL[user.role]}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
