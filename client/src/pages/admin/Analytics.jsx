import { useState, useEffect } from "react";
import { getOverview } from "../../services/analyticsService";
import { getEvents } from "../../services/eventService";
import "./Analytics.css";

const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

// A horizontal bar list — enough of a chart for every breakdown on this page,
// and it needs no chart library at all. Kept local to this file because it's
// the only page using it; if Reports needs it later, move it to
// components/common and import it in both places.
function BarChart({ title, rows, tone = "accent", emptyText = "Nothing to show yet." }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  // Bars are measured against the tallest bar, not the total, so a set of
  // small numbers is still readable instead of five invisible slivers.
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="admin-panel analytics-chart">
      <h2>{title}</h2>

      {total === 0 ? (
        <p className="admin-state-text">{emptyText}</p>
      ) : (
        rows.map((row) => (
          <div key={row.label} className="analytics-bar-row">
            <span className="analytics-bar-label">{row.label}</span>
            <span className="analytics-bar-track">
              <span
                className={`analytics-bar-fill analytics-bar-fill-${tone}`}
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </span>
            <span className="analytics-bar-value">{row.count}</span>
          </div>
        ))
      )}
    </div>
  );
}

function Analytics() {
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // The event list never changes while you're on this page, so it's fetched
  // once and left alone.
  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  // The numbers, on the other hand, are recomputed by the server every time
  // the event filter changes — we don't slice them in the browser.
  useEffect(() => {
    let ignore = false;

    setIsRefreshing(true);
    setError("");

    const params = eventFilter === "All" ? {} : { event: eventFilter };

    getOverview(params)
      .then((data) => {
        // If you switch events quickly, an older, slower response can land
        // after a newer one and overwrite it with stale numbers. This flag
        // makes the outdated request drop its own result.
        if (!ignore) setOverview(data);
      })
      .catch(() => {
        if (!ignore) setError("Failed to load analytics.");
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [eventFilter]);

  const eventTitle = (id) => events.find((ev) => ev._id === id)?.title || "Unknown event";

  const scopeLabel =
    eventFilter === "All" ? "All events" : eventTitle(eventFilter);

  return (
    <div className="analytics">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Analytics</h1>
          <p>
            {scopeLabel}
            {isRefreshing && <span className="analytics-refreshing"> · updating…</span>}
          </p>
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="admin-select"
          disabled={isLoading}
        >
          <option value="All">All events</option>
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Crunching the numbers...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : !overview ? (
        <div className="admin-empty">
          <p>No data available.</p>
        </div>
      ) : (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{overview.registrations.registered}</span>
              <span className="admin-stat-label">Registered Attendees</span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-value">{overview.registrations.turnoutRate}%</span>
              <span className="admin-stat-label">
                Turnout · {overview.registrations.checkedIn} checked in
              </span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-value">{overview.totals.exhibitors}</span>
              <span className="admin-stat-label">Exhibitors</span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-value">{overview.booths.occupancyRate}%</span>
              <span className="admin-stat-label">
                Booth Occupancy · {overview.booths.occupied} of {overview.totals.booths}
              </span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-value">{overview.totals.sessions}</span>
              <span className="admin-stat-label">
                Sessions · {overview.totals.speakers} speakers
              </span>
            </div>

            <div className="admin-stat-card">
              <span className="admin-stat-value">
                {overview.feedback.published ? overview.feedback.averageRating : "—"}
              </span>
              <span className="admin-stat-label">
                Average Rating
                {overview.feedback.published > 0 && (
                  <span className="analytics-stars">
                    {renderStars(Math.round(overview.feedback.averageRating))}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="analytics-charts">
            <BarChart
              title="Attendees by Ticket Type"
              rows={overview.registrations.byTicketType}
              emptyText="No registrations yet."
            />

            <BarChart
              title="Exhibitors by Status"
              rows={overview.exhibitors.byStatus}
              emptyText="No exhibitor applications yet."
            />

            <BarChart
              title="Booths by Status"
              rows={overview.booths.byStatus}
              tone="green"
              emptyText="No booths created yet."
            />

            <BarChart
              title="Sessions by Type"
              rows={overview.sessions.byType}
              emptyText="No sessions scheduled yet."
            />

            <BarChart
              title="Feedback by Rating"
              rows={overview.feedback.byRating.map((row) => ({
                label: `${row.label} ★`,
                count: row.count,
              }))}
              tone="amber"
              emptyText="No published feedback yet."
            />

            <BarChart
              title="Feedback by Category"
              rows={overview.feedback.byCategory}
              tone="amber"
              emptyText="No published feedback yet."
            />

            {/* Comparing events only makes sense when we're looking at all of
                them — with one event selected there's nothing to compare. */}
            {eventFilter === "All" && (
              <BarChart
                title="Busiest Events"
                rows={overview.topEvents.map((row) => ({
                  label: eventTitle(row.event),
                  count: row.count,
                }))}
                emptyText="No registrations yet."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;