import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./AdminLayout.css";
import "../styles/admin.css";
import "./AttendeeLayout.css";

// Sirf ek item — har agla step apni line khud yahan joregata. Admin portal mein
// pehle poori list bana di gayi thi aur aadhe links khaali page par le jate the.
const ATTENDEE_NAV = [
  { label: "Dashboard", to: "/attendee" },
  { label: "Browse Expos", to: "/attendee/expos" },
  { label: "My Registrations", to: "/attendee/registrations" },
  { label: "Schedule", to: "/attendee/sessions" },
  { label: "Saved", to: "/attendee/bookmarks" },
  { label: "Leave a Review", to: "/attendee/feedback" },
  { label: "Account", to: "/attendee/profile" },
];
function AttendeeLayout() {
  return (
    <div className="admin-layout attendee-portal">
      <Sidebar items={ATTENDEE_NAV} homePath="/attendee" subtitle="Attendee Portal" />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AttendeeLayout;