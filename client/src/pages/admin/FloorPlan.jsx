import { useState, useEffect } from "react";
import { getBooths, updateBooth } from "../../services/boothService";
import { getEvents } from "../../services/eventService";
import Modal from "../../components/common/Modal";
import "./FloorPlan.css";

// Same enum as server/models/Booth.js — the legend and the modal dropdown
// both read from this so they can never drift apart.
const BOOTH_STATUSES = ["Available", "Reserved", "Occupied", "Pending", "Maintenance"];

// "A1" -> { row: "A", number: 1 }. Booth numbers are free text, so anything
// without a letter prefix lands in a shared "Other" row instead of breaking
// the layout.
const parseBoothNumber = (boothNumber = "") => {
  const match = /^([A-Za-z]*)\s*(\d*)/.exec(boothNumber.trim());
  const letters = (match?.[1] || "").toUpperCase();
  return { row: letters || "Other", number: match?.[2] ? Number(match[2]) : 0 };
};

function FloorPlan() {
  const [booths, setBooths] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // The booth whose detail modal is open. null means closed.
  const [activeBooth, setActiveBooth] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    Promise.all([getBooths(), getEvents()])
      .then(([boothData, eventData]) => {
        setBooths(boothData);
        setEvents(eventData);
        // A floor plan only makes sense for one event at a time, so open on
        // the first event instead of an empty selector.
        if (eventData.length > 0) setSelectedEventId(eventData[0]._id);
      })
      .catch(() => setError("Failed to load the floor plan."))
      .finally(() => setIsLoading(false));
  }, []);

  const eventBooths = booths.filter((b) => b.event?._id === selectedEventId);

  // Group booths into rows by their letter prefix: A1/A2/A3 all sit in row A.
  const grouped = new Map();
  eventBooths.forEach((booth) => {
    const { row } = parseBoothNumber(booth.boothNumber);
    if (!grouped.has(row)) grouped.set(row, []);
    grouped.get(row).push(booth);
  });

  // Rows go A, B, C... and within a row booths sort numerically so A10
  // lands after A9 (plain string sorting would put it after A1).
  const floorRows = [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, items]) => ({
      label,
      booths: [...items].sort(
        (x, y) => parseBoothNumber(x.boothNumber).number - parseBoothNumber(y.boothNumber).number
      ),
    }));

  const availableCount = eventBooths.filter((b) => b.status === "Available").length;
  const occupiedCount = eventBooths.filter((b) => b.status === "Occupied").length;
  const occupancy = eventBooths.length
    ? Math.round((occupiedCount / eventBooths.length) * 100)
    : 0;

  const openBooth = (booth) => {
    setActiveBooth(booth);
    setModalError("");
  };

  const handleStatusChange = async (newStatus) => {
    setModalError("");
    setIsSaving(true);
    try {
      await updateBooth(activeBooth._id, { status: newStatus });
      // Update both the grid and the open modal so the tile recolours
      // instantly behind the dialog.
      setBooths((prev) =>
        prev.map((b) => (b._id === activeBooth._id ? { ...b, status: newStatus } : b))
      );
      setActiveBooth((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to update the status.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="floor-plan-page">
      <div className="admin-page-header">
        <h1>Floor Plan</h1>
        <p>A visual map of the hall. Click any booth to see its details.</p>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading floor plan...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : events.length === 0 ? (
        <div className="admin-empty">
          <p>No events yet.</p>
          <p className="admin-empty-sub">Create an event and add booths to see a floor plan.</p>
        </div>
      ) : (
        <>
          <div className="admin-filters">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="admin-select"
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
          </div>

          {eventBooths.length > 0 && (
            <div className="admin-stats-grid floor-summary">
              <div className="admin-stat-card">
                <span className="admin-stat-value">{eventBooths.length}</span>
                <span className="admin-stat-label">Booths</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{availableCount}</span>
                <span className="admin-stat-label">Available</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{occupiedCount}</span>
                <span className="admin-stat-label">Occupied</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-value">{occupancy}%</span>
                <span className="admin-stat-label">Occupancy</span>
              </div>
            </div>
          )}

          <div className="floor-legend">
            {BOOTH_STATUSES.map((option) => (
              <span key={option} className="floor-legend-item">
                <span className={`floor-swatch floor-booth-${option.toLowerCase()}`} />
                {option}
              </span>
            ))}
          </div>

          {eventBooths.length === 0 ? (
            <div className="admin-empty">
              <p>No booths in this event yet.</p>
              <p className="admin-empty-sub">
                Add booths on the Booths page and they'll show up here automatically.
              </p>
            </div>
          ) : (
            <div className="admin-panel floor-hall">
              {floorRows.map((row) => (
                <div key={row.label} className="floor-row">
                  <span className="floor-row-label">{row.label}</span>
                  <div className="floor-row-booths">
                    {row.booths.map((booth) => (
                      <button
                        key={booth._id}
                        type="button"
                        className={`floor-booth floor-booth-${booth.status.toLowerCase()}`}
                        onClick={() => openBooth(booth)}
                        title={`${booth.boothNumber} — ${booth.status}`}
                      >
                        <span className="floor-booth-number">{booth.boothNumber}</span>
                        {booth.exhibitor?.companyName && (
                          <span className="floor-booth-company">{booth.exhibitor.companyName}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="floor-entrance">ENTRANCE</div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={activeBooth !== null}
        title={`Booth ${activeBooth?.boothNumber || ""}`}
        onClose={() => setActiveBooth(null)}
      >
        {activeBooth && (
          <>
            <dl className="floor-detail">
              <div>
                <dt>Event</dt>
                <dd>{activeBooth.event?.title || "—"}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{activeBooth.size || "—"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{activeBooth.category || "—"}</dd>
              </div>
              <div>
                <dt>Exhibitor</dt>
                <dd>{activeBooth.exhibitor?.companyName || "Unassigned"}</dd>
              </div>
            </dl>

            {activeBooth.exhibitor ? (
              // Flipping an assigned booth to Available here would leave the
              // exhibitor still pointing at it. Releasing properly is the
              // Booths page's job, so we only show the status read-only.
              <p className="floor-detail-note">
                Status: <strong>{activeBooth.status}</strong>. This booth belongs to{" "}
                {activeBooth.exhibitor.companyName} — use the Booths page to reassign or
                release it.
              </p>
            ) : (
              <label className="floor-status-field">
                <span>Status</span>
                <select
                  value={activeBooth.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isSaving}
                  className="admin-select"
                >
                  {BOOTH_STATUSES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            )}

            {modalError && <p className="admin-state-text admin-state-error">{modalError}</p>}
          </>
        )}
      </Modal>
    </div>
  );
}

export default FloorPlan;