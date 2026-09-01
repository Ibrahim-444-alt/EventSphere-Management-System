import { useState, useEffect } from "react";
import { downloadReport, saveBlob } from "../../services/reportService";
import { getOverview } from "../../services/analyticsService";
import { getEvents } from "../../services/eventService";
import "./Reports.css";

// The `type` values must match the REPORTS keys in
// server/controllers/reportController.js — that's the contract between them.
const REPORT_TYPES = [
  {
    type: "attendees",
    title: "Attendee List",
    description:
      "Everyone registered, with contact details, ticket type and check-in times.",
    unit: "registrations",
    count: (o) => o.totals.registrations,
  },
  {
    type: "exhibitors",
    title: "Exhibitor Directory",
    description:
      "Companies, contact people, assigned booths and application status.",
    unit: "exhibitors",
    count: (o) => o.totals.exhibitors,
  },
  {
    type: "booths",
    title: "Booth Allocation",
    description: "Every booth, its status, and which company is standing in it.",
    unit: "booths",
    count: (o) => o.totals.booths,
  },
  {
    type: "sessions",
    title: "Session Schedule",
    description: "The full programme with halls, times and speakers.",
    unit: "sessions",
    count: (o) => o.totals.sessions,
  },
  {
    type: "feedback",
    title: "Feedback Responses",
    description: "Every rating and comment, including the hidden ones.",
    unit: "responses",
    count: (o) => o.totals.feedback,
  },
];

const toSlug = (text = "") =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Reports() {
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("All");
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyType, setBusyType] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  // The row counts come from the analytics endpoint we already built — no
  // second endpoint needed just to say "this file will have 12 rows".
  useEffect(() => {
    let ignore = false;

    setError("");
    setNotice(null);

    const params = eventFilter === "All" ? {} : { event: eventFilter };

    getOverview(params)
      .then((data) => {
        if (!ignore) setOverview(data);
      })
      .catch(() => {
        if (!ignore) setError("Failed to load the report sizes.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [eventFilter]);

  const eventTitle = (id) => events.find((ev) => ev._id === id)?.title || "Unknown event";

  const scopeLabel = eventFilter === "All" ? "All events" : eventTitle(eventFilter);

  const handleDownload = async (report) => {
    setBusyType(report.type);
    setNotice(null);

    const params = eventFilter === "All" ? {} : { event: eventFilter };

    try {
      const blob = await downloadReport(report.type, params);

      // The server suggests a filename in its Content-Disposition header, but
      // reading a custom header from JS needs the API to expose it through
      // CORS. Building the name here is simpler, and lets us stamp the event
      // into it so two downloads never overwrite each other.
      const stamp = new Date().toISOString().slice(0, 10);
      const scopePart = eventFilter === "All" ? "all-events" : toSlug(eventTitle(eventFilter));

      saveBlob(blob, `${report.type}-${scopePart}-${stamp}.csv`);

      setNotice({ text: `${report.title} downloaded.`, isError: false });
    } catch {
      setNotice({
        text: `Could not download the ${report.title}. Please try again.`,
        isError: true,
      });
    } finally {
      setBusyType(null);
    }
  };

  return (
    <div className="reports">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Reports</h1>
          <p>Export your expo data as CSV — opens straight in Excel or Sheets.</p>
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

      {notice && (
        <p className={`report-notice${notice.isError ? " report-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {isLoading ? (
        <p className="admin-state-text">Loading reports...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : (
        <div className="reports-grid">
          {REPORT_TYPES.map((report) => {
            const rowCount = overview ? report.count(overview) : 0;
            const isBusy = busyType === report.type;

            return (
              <article key={report.type} className="report-card">
                <h2 className="report-card-title">{report.title}</h2>
                <p className="report-card-desc">{report.description}</p>

                <p className="report-card-count">
                  <span className="report-card-rows">{rowCount}</span> {report.unit}
                  <span className="report-card-scope"> · {scopeLabel}</span>
                </p>

                <div className="report-card-footer">
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={isBusy || rowCount === 0}
                    onClick={() => handleDownload(report)}
                  >
                    {isBusy ? "Preparing..." : "Download CSV"}
                  </button>
                  {rowCount === 0 && (
                    <span className="admin-table-muted">Nothing to export yet.</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Reports;