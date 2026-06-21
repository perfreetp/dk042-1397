import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "@/components/layout/NavBar";
import Sidebar from "@/components/layout/Sidebar";
import PartsPage from "@/pages/PartsPage";
import SchedulePage from "@/pages/SchedulePage";
import HandoverDrawer from "@/components/handover/HandoverDrawer";

export default function App() {
  return (
    <Router>
      <div className="h-full flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 min-h-0 flex">
          <Sidebar />
          <Routes>
            <Route path="/" element={<Navigate to="/parts" replace />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="*" element={<Navigate to="/parts" replace />} />
          </Routes>
        </div>
        <HandoverDrawer />
      </div>
    </Router>
  );
}
