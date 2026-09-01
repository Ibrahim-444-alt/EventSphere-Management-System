// Shared icon badge for the three user roles — used on both the Home page
// (benefits section) and the About page (role cards), so the icon set only
// has to be drawn once.
import "./RoleIcon.css";

const ICONS = {
  Organizers: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  Exhibitors: (
    <>
      <path d="M4 9l1.4-5h13.2L20 9" />
      <path d="M4 9v10h16V9" />
      <path d="M9.5 19v-6h5v6" />
    </>
  ),
  Attendees: (
    <>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5.5 5.5-5.5S14 16 14 19" />
      <circle cx="17" cy="8.5" r="2.4" />
      <path d="M15.5 19c.2-2.3 1.8-4.2 3.8-4.8" />
    </>
  ),
};

function RoleIcon({ role }) {
  return (
    <span className="role-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[role]}
      </svg>
    </span>
  );
}

export default RoleIcon;