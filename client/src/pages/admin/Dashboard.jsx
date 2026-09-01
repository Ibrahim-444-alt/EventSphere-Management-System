import { useState, useEffect } from "react";
import { getOverview, getRecentActivity } from "../../services/analyticsService";
import { getEvents } from "../../services/eventService";
import "./Dashboard.css";

// The analytics endpoint returns [{ label, count }] for each breakdown, so
// picking one value out of it needs a tiny lookup rather than an index.
const statusCount = (rows, label) => rows.find((row) => row.label === label)?.count || 0;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getOverview(), getRecentActivity(), getEvents()])
      .then(([overviewData, activityData, eventData]) => {
        setOverview(overviewData);
        setActivity(activityData);
        // The event list is short, and the dashboard needs exactly one number
        // out of it — how many events are still upcoming. Not worth its own
        // endpoint or another aggregation.
        setUpcomingEvents(eventData.filter((ev) => ev.status === "Upcoming").length);
      })
      .catch(() => setError("Failed to load the dashboard."))
      .finally(() => setIsLoading(false));
  }, []);

  // Built from the API response instead of being typed out by hand, so these
  // numbers can never drift away from what the other pages show.
  const stats = overview
    ? [
        { label: "Total Events", value: overview.totals.events },
        { label: "Upcoming Events", value: upcomingEvents },
        { label: "Total Exhibitors", value: overview.totals.exhibitors },
        {
          label: "Pending Applications",
          value: statusCount(overview.exhibitors.byStatus, "Pending"),
        },
        { label: "Registered Attendees", value: overview.registrations.registered },
        { label: "Checked In", value: overview.registrations.checkedIn },
        { label: "Total Booths", value: overview.totals.booths },
        { label: "Available Booths", value: overview.booths.available },
        { label: "Occupied Booths", value: overview.booths.occupied },
        { label: "Sessions", value: overview.totals.sessions },
        { label: "Speakers", value: overview.totals.speakers },
        { label: "Feedback Received", value: overview.totals.feedback },
      ]
    : [];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>An overview of every event, exhibitor, and booth on the platform.</p>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading your dashboard...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : (
        <>
          <div className="admin-stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="admin-stat-card">
                <span className="admin-stat-value">{stat.value.toLocaleString()}</span>
                <span className="admin-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="admin-panel">
            <h2>Recent Registrations</h2>

            {activity.length === 0 ? (
              <p className="admin-state-text">
                No registrations yet. They'll appear here as soon as people sign up.
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Event</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>
                        <span className={`admin-badge admin-badge-${row.type.toLowerCase()}`}>
                          {row.type}
                        </span>
                      </td>
                      <td>{row.event}</td>
                      <td>{formatDate(row.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;