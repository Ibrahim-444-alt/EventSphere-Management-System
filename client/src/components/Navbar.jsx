import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { roleHome } from "../utils/roleHome";
import ThemeToggle from "./common/ThemeToggle";
import "./Navbar.css";


function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);

  const navLinkClass = ({ isActive }) =>
    isActive ? "navbar-link navbar-link-active" : "navbar-link";

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand" onClick={closeMenu}>EventSphere</NavLink>

        <div className="navbar-right">
          <ul className={isOpen ? "navbar-links navbar-links-open" : "navbar-links"}>
            <li><NavLink to="/" end className={navLinkClass} onClick={closeMenu}>Home</NavLink></li>
            <li><NavLink to="/about" className={navLinkClass} onClick={closeMenu}>About</NavLink></li>
            <li><NavLink to="/events" className={navLinkClass} onClick={closeMenu}>Events</NavLink></li>
            <li><NavLink to="/contact" className={navLinkClass} onClick={closeMenu}>Contact</NavLink></li>

            {isAuthenticated ? (
              <>
                <li><NavLink to={roleHome(user.role)} className={navLinkClass} onClick={closeMenu}>{user.name.split(" ")[0]}</NavLink></li>
                <li><button type="button" className="navbar-cta navbar-logout" onClick={handleLogout}>Log Out</button></li>
              </>
            ) : (
              <>
                <li><NavLink to="/login" className={navLinkClass} onClick={closeMenu}>Login</NavLink></li>
                <li><NavLink to="/register" className="navbar-cta" onClick={closeMenu}>Register</NavLink></li>
              </>
            )}
          </ul>

          <div className="navbar-utility">
            <ThemeToggle />

            <button type="button" className="navbar-toggle" onClick={() => setIsOpen((prev) => !prev)} aria-label="Toggle navigation menu" aria-expanded={isOpen}>
              <span className="navbar-toggle-bar"></span>
              <span className="navbar-toggle-bar"></span>
              <span className="navbar-toggle-bar"></span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;