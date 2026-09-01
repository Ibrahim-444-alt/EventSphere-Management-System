import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminLayout.css";
import "../styles/admin.css";
import "./ExhibitorLayout.css";

const EXHIBITOR_NAV = [
  { label: "Dashboard", to: "/exhibitor" },
  { label: "Register for Expo", to: "/exhibitor/register-expo" },
  { label: "Company Profile", to: "/exhibitor/profile" },
  { label: "My Booth", to: "/exhibitor/my-booth" },
];

function ExhibitorLayout() {
  return (
    // Do classes: "admin-layout" dhancha deti hai (sidebar + main ka flex),
    // aur "exhibitor-portal" us dhanche ke andar rang badal deti hai.
    <div className="admin-layout exhibitor-portal">
      <Sidebar items={EXHIBITOR_NAV} homePath="/exhibitor" subtitle="Exhibitor Portal" />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default ExhibitorLayout;