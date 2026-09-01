import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Pass, { printPass } from "../../components/attendee/Pass";
import { getMyRegistrations } from "../../services/attendeeService";
import "./Dashboard.css";

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

function Dashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignore = false;

    getMyRegistrations()
      .then((data) => {
        if (!ignore) setRegistrations(data);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Couldn't load your registrations.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const today = startOfDay(new Date());

  // Is page ka ek hi kaam hai: agla pass. Poori list My Registrations par hai.
  const featured =
    registrations
      .filter((item) => item.status === "Registered" && item.event)
      .filter((item) => startOfDay(item.event.date) >= today)
      .sort((a, b) => new Date(a.event.date) - new Date(b.event.date))[0] || null;

  if (isLoading) {
    return (
      <div className="attendee-home">
        <h1 className="attendee-title">Your pass</h1>
        <p className="admin-state-text">Loading your pass...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="attendee-home">
        <h1 className="attendee-title">Your pass</h1>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="attendee-home">
      <h1 className="attendee-title">{featured ? "Next up" : "Your pass"}</h1>

      {featured ? (
        <>
          <Pass registration={featured} />

          <div className="pass-actions">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => printPass(featured)}
            >
              Print pass
            </button>
            <span className="pass-actions-hint">
              Pick “Save as PDF” in the print dialog to keep a copy on your phone.
            </span>
          </div>
        </>
      ) : (
        <div className="pass pass-blank">
          <p className="pass-label">No pass yet</p>
          <p className="pass-name">Nothing booked</p>
          <p className="pass-blank-text">
            <Link to="/attendee/expos" className="admin-link">
              Pick an expo
            </Link>{" "}
            and your pass appears here, ready to show at the door.
          </p>
        </div>
      )}

      {registrations.length > 0 && (
        <p className="attendee-more">
          <Link to="/attendee/registrations" className="admin-link">
            See all {registrations.length} registration{registrations.length > 1 ? "s" : ""}
          </Link>
        </p>
      )}
    </div>
  );
}

export default Dashboard;