import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="notfound-page">
      <span className="notfound-code" aria-hidden="true">404</span>

      {/* Screen reader ko "404" bekaar hai, is liye ooper wala aria-hidden hai
          aur asal khabar h1 mein likhi hai. */}
      <h1>Page not found</h1>

      <p className="notfound-text">
        The link you followed may be broken, or the page may have been moved.
      </p>

      <div className="notfound-actions">
        <Link to="/" className="notfound-btn notfound-btn-primary">Go Home</Link>
        <Link to="/events" className="notfound-btn">Browse Events</Link>
      </div>
    </div>
  );
}

export default NotFound;