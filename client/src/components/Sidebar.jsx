import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "./common/ThemeToggle";
import "./Sidebar.css";

function Sidebar({ items, homePath, subtitle }) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-link sidebar-link-active" : "sidebar-link";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        EventSphere
        {/* Sirf rang se portal pehchanwana un logon ke liye kaam nahi karta jo
            rangon mein farq nahi kar paate. Ek lafz likh dena zyada pukhta hai. */}
        {subtitle && <span className="sidebar-subtitle">{subtitle}</span>}
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === homePath} className={linkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="theme-toggle-labeled sidebar-theme-row">
          <span className="theme-toggle-label">{isDark ? "Dark mode" : "Light mode"}</span>
          <ThemeToggle className="theme-toggle-sm" />
        </div>

        <div className="sidebar-user">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-role">{user?.role}</span>
        </div>
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;