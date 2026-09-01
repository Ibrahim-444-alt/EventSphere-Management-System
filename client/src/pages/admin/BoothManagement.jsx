import { useState, useEffect } from "react";
import {
  getBooths,
  createBooth,
  updateBooth,
  deleteBooth,
  assignBooth,
} from "../../services/boothService";
import { getEvents } from "../../services/eventService";
import { getExhibitors } from "../../services/exhibitorService";
import Modal from "../../components/common/Modal";
import "./BoothManagement.css";

// These must match the enum in server/models/Booth.js exactly, otherwise
// Mongoose will reject the value.
const BOOTH_STATUSES = ["Available", "Reserved", "Occupied", "Pending", "Maintenance"];
const STATUS_FILTER_OPTIONS = ["All", ...BOOTH_STATUSES];

// Only exhibitors in these states may be given a booth.
const ASSIGNABLE_STATUSES = ["Approved", "Active"];

const EMPTY_FORM = { event: "", boothNumber: "", size: "", category: "", status: "Available" };

function BoothManagement() {
  const [booths, setBooths] = useState([]);
  const [events, setEvents] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [status, setStatus] = useState("All");

  // Create form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Assignment modal — assignTarget holds the booth being assigned,
  // and null means the modal is closed.
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedExhibitorId, setSelectedExhibitorId] = useState("");
  const [assignError, setAssignError] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Tracks which row is mid-request so we can disable just that row's buttons.
  const [busyId, setBusyId] = useState(null);

  // All three requests are independent, so they go out together instead of
  // waiting for one to finish before starting the next.
  useEffect(() => {
    Promise.all([getBooths(), getEvents(), getExhibitors()])
      .then(([boothData, eventData, exhibitorData]) => {
        setBooths(boothData);
        setEvents(eventData);
        setExhibitors(exhibitorData);
      })
      .catch(() => setError("Failed to load booths."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear the previous error as soon as the admin edits anything —
    // otherwise a stale message looks like a fresh rejection.
    setFormError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.event) return setFormError("Please choose an event.");
    if (!form.boothNumber.trim()) return setFormError("Booth number is required.");

    setIsSaving(true);
    try {
      const created = await createBooth({ ...form, boothNumber: form.boothNumber.trim() });

      // The create response isn't populated with the event, so we attach the
      // event we already have in state to keep the table showing a real title.
      const eventForBooth = events.find((ev) => ev._id === form.event);
      setBooths((prev) => [...prev, { ...created, event: eventForBooth }]);

      setForm(EMPTY_FORM);
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create the booth.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const previousBooths = booths;

    // Update the UI right away so the dropdown feels responsive, then roll
    // back if the server rejects it.
    setBooths((prev) => prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b)));
    setBusyId(id);

    try {
      await updateBooth(id, { status: newStatus });
    } catch {
      setBooths(previousBooths);
      alert("Failed to update the booth status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id, boothNumber) => {
    const confirmed = window.confirm(`Delete booth ${boothNumber}? This can't be undone.`);
    if (!confirmed) return;

    setBusyId(id);
    try {
      await deleteBooth(id);
      setBooths((prev) => prev.filter((b) => b._id !== id));
    } catch {
      alert("Failed to delete the booth. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openAssignModal = (booth) => {
    setAssignTarget(booth);
    setSelectedExhibitorId(booth.exhibitor?._id || "");
    setAssignError("");
  };

  const closeAssignModal = () => {
    setAssignTarget(null);
    setSelectedExhibitorId("");
    setAssignError("");
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError("");

    if (!selectedExhibitorId) return setAssignError("Please choose an exhibitor.");

    const targetId = assignTarget._id;
    setIsAssigning(true);

    try {
      const updated = await assignBooth(targetId, selectedExhibitorId);
      const exhibitor = exhibitors.find((ex) => ex._id === selectedExhibitorId);

      setBooths((prev) =>
        prev.map((b) => {
          // The booth we just assigned.
          if (b._id === targetId) {
            return { ...b, status: updated.status, exhibitor };
          }
          // The server frees any other booth this exhibitor was holding, so
          // mirror that here rather than making the admin refresh the page.
          if (b.exhibitor?._id === selectedExhibitorId) {
            return { ...b, exhibitor: null, status: "Available" };
          }
          return b;
        })
      );

      closeAssignModal();
    } catch (err) {
      setAssignError(err.response?.data?.message || "Failed to assign the booth.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRelease = async (booth) => {
    const confirmed = window.confirm(
      `Release booth ${booth.boothNumber} from ${booth.exhibitor?.companyName}?`
    );
    if (!confirmed) return;

    setBusyId(booth._id);
    try {
      const updated = await assignBooth(booth._id, null);
      setBooths((prev) =>
        prev.map((b) =>
          b._id === booth._id ? { ...b, exhibitor: null, status: updated.status } : b
        )
      );
    } catch {
      alert("Failed to release the booth. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // A booth can only go to an exhibitor who applied to THAT event and has
  // been approved — an exhibitor from another expo isn't eligible.
  const eligibleExhibitors = assignTarget
    ? exhibitors.filter(
        (ex) =>
          ex.event?._id === assignTarget.event?._id &&
          ASSIGNABLE_STATUSES.includes(ex.status)
      )
    : [];

  // Derived from booths rather than exhibitor.booth, so the hint can never
  // go stale after an assignment.
  const boothHeldBy = (exhibitorId) => booths.find((b) => b.exhibitor?._id === exhibitorId);

  const filteredBooths = booths.filter((booth) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      booth.boothNumber.toLowerCase().includes(query) ||
      (booth.category || "").toLowerCase().includes(query);
    const matchesEvent = eventFilter === "All" || booth.event?._id === eventFilter;
    const matchesStatus = status === "All" || booth.status === status;
    return matchesSearch && matchesEvent && matchesStatus;
  });

  // Quick counts so the admin can see occupancy at a glance.
  const summary = {
    total: booths.length,
    available: booths.filter((b) => b.status === "Available").length,
    occupied: booths.filter((b) => b.status === "Occupied").length,
  };

  return (
    <div className="booth-management">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Booths</h1>
          <p>Create booth spaces and track their availability across events.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setIsFormOpen((open) => !open);
            setFormError("");
          }}
        >
          {isFormOpen ? "Cancel" : "+ Add Booth"}
        </button>
      </div>

      {!isLoading && !error && booths.length > 0 && (
        <div className="admin-stats-grid booth-summary">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{summary.total}</span>
            <span className="admin-stat-label">Total Booths</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{summary.available}</span>
            <span className="admin-stat-label">Available</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{summary.occupied}</span>
            <span className="admin-stat-label">Occupied</span>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="admin-panel booth-form-panel">
          <h2>Add a Booth</h2>

          {events.length === 0 ? (
            <p className="admin-state-text">
              You need at least one event before you can create booths.
            </p>
          ) : (
            <form onSubmit={handleCreate} noValidate>
              <div className="booth-form-grid">
                <label className="booth-field">
                  <span>Event *</span>
                  <select name="event" value={form.event} onChange={handleFormChange} className="admin-select">
                    <option value="">Select an event</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                  </select>
                </label>

                <label className="booth-field">
                  <span>Booth Number *</span>
                  <input
                    type="text"
                    name="boothNumber"
                    value={form.boothNumber}
                    onChange={handleFormChange}
                    placeholder="e.g. A1"
                    className="admin-search"
                  />
                </label>

                <label className="booth-field">
                  <span>Size</span>
                  <input
                    type="text"
                    name="size"
                    value={form.size}
                    onChange={handleFormChange}
                    placeholder="e.g. 3x3 m"
                    className="admin-search"
                  />
                </label>

                <label className="booth-field">
                  <span>Category</span>
                  <input
                    type="text"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    placeholder="e.g. Standard"
                    className="admin-search"
                  />
                </label>

                <label className="booth-field">
                  <span>Status</span>
                  <select name="status" value={form.status} onChange={handleFormChange} className="admin-select">
                    {BOOTH_STATUSES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              {formError && <p className="admin-state-text admin-state-error">{formError}</p>}

              <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Create Booth"}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by booth number or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="admin-select">
          <option value="All">All events</option>
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>{ev.title}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading booths...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : filteredBooths.length === 0 ? (
        <div className="admin-empty">
          <p>No booths found.</p>
          <p className="admin-empty-sub">
            {booths.length === 0
              ? "Add your first booth to start building the floor plan."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booth</th>
                <th>Event</th>
                <th>Size</th>
                <th>Category</th>
                <th>Exhibitor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooths.map((booth) => (
                <tr key={booth._id}>
                  <td className="booth-number">{booth.boothNumber}</td>
                  <td>{booth.event?.title || "—"}</td>
                  <td>{booth.size || "—"}</td>
                  <td>{booth.category || "—"}</td>
                  <td>{booth.exhibitor?.companyName || <span className="admin-table-muted">Unassigned</span>}</td>
                  <td>
                    <select
                      value={booth.status}
                      onChange={(e) => handleStatusChange(booth._id, e.target.value)}
                      disabled={busyId === booth._id}
                      className={`booth-status-select booth-status-${booth.status.toLowerCase()}`}
                    >
                      {BOOTH_STATUSES.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-link"
                      disabled={busyId === booth._id}
                      onClick={() => openAssignModal(booth)}
                    >
                      {booth.exhibitor ? "Reassign" : "Assign"}
                    </button>

                    {booth.exhibitor && (
                      <button
                        type="button"
                        className="admin-link"
                        disabled={busyId === booth._id}
                        onClick={() => handleRelease(booth)}
                      >
                        Release
                      </button>
                    )}

                    <button
                      type="button"
                      className="admin-link admin-link-danger"
                      disabled={busyId === booth._id}
                      onClick={() => handleDelete(booth._id, booth.boothNumber)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={assignTarget !== null}
        title={`Assign Booth ${assignTarget?.boothNumber || ""}`}
        onClose={closeAssignModal}
      >
        <p className="booth-assign-event">{assignTarget?.event?.title || "This event"}</p>

        {eligibleExhibitors.length === 0 ? (
          <p className="admin-state-text">
            No approved exhibitors for this event yet. Approve an application on the
            Exhibitors page first.
          </p>
        ) : (
          <form onSubmit={handleAssign} noValidate>
            <label className="booth-field">
              <span>Exhibitor *</span>
              <select
                value={selectedExhibitorId}
                onChange={(e) => {
                  setSelectedExhibitorId(e.target.value);
                  setAssignError("");
                }}
                className="admin-select"
              >
                <option value="">Select an exhibitor</option>
                {eligibleExhibitors.map((ex) => {
                  const held = boothHeldBy(ex._id);
                  const hint =
                    held && held._id !== assignTarget._id ? ` (currently in ${held.boothNumber})` : "";
                  return (
                    <option key={ex._id} value={ex._id}>
                      {ex.companyName}
                      {hint}
                    </option>
                  );
                })}
              </select>
            </label>

            {assignError && <p className="admin-state-text admin-state-error">{assignError}</p>}

            <div className="booth-modal-actions">
              <button type="button" className="admin-link" onClick={closeAssignModal}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={isAssigning}>
                {isAssigning ? "Assigning..." : "Assign Booth"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default BoothManagement;