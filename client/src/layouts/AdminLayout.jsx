import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminLayout.css";
import "../styles/admin.css";

// Nav list ab layout ke paas hai. Har portal apni list khud rakhta hai aur
// Sidebar ka kaam sirf usay dikhana hai.
const ADMIN_NAV = [
  { label: "Dashboard", to: "/admin" },
  { label: "Events", to: "/admin/events" },
  { label: "Exhibitors", to: "/admin/exhibitors" },
  { label: "Booths", to: "/admin/booths" },
  { label: "Floor Plan", to: "/admin/floor-plan" },
  { label: "Sessions", to: "/admin/sessions" },
  { label: "Speakers", to: "/admin/speakers" },
  { label: "Attendees", to: "/admin/attendees" },
  { label: "Analytics", to: "/admin/analytics" },
  { label: "Reports", to: "/admin/reports" },
  { label: "Feedback", to: "/admin/feedback" },
  { label: "Inquiries", to: "/admin/inquiries" },
  { label: "Profile", to: "/admin/profile" },
  { label: "Settings", to: "/admin/settings" },
];

function AdminLayout() {
  return (
    <div className="admin-layout">
            <Sidebar items={ADMIN_NAV} homePath="/admin" subtitle="Organizer Portal" />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;