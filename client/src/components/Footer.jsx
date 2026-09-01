import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-logo">EventSphere</span>
          <p className="footer-tagline">
            One place to manage expos, exhibitors, and attendees.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/events">Events</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} EventSphere. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;