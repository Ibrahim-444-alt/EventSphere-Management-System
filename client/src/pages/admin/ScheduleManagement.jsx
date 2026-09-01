import { useState, useEffect } from "react";
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
} from "../../services/sessionService";
import { getSpeakers } from "../../services/speakerService";
import { getEvents } from "../../services/eventService";
import Modal from "../../components/common/Modal";
import "./ScheduleManagement.css";

// Both lists must match the enums in server/models/Session.js.
const SESSION_TYPES = ["Talk", "Workshop", "Panel", "Keynote", "Demo"];
const SESSION_STATUSES = ["Scheduled", "Ongoing", "Completed", "Cancelled"];

const EMPTY_FORM = {
  title: "",
  type: "Talk",
  date: "",
  startTime: "",
  endTime: "",
  speaker: "",
  hall: "",
  capacity: "",
  status: "Scheduled",
  description: "",
};

// Sessions come back with a full ISO date ("2026-09-10T00:00:00.000Z") but
// <input type="date"> and our day grouping both want just "2026-09-10".
const toDateKey = (isoDate = "") => isoDate.slice(0, 10);

// The "T00:00:00" matters: new Date("2026-09-10") is parsed as UTC midnight,
// which can render as the 9th in timezones behind UTC. Adding a plain time
// makes it local midnight, so the date always reads back as itself.
const formatDay = (dateKey) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Sorts chronologically: date first, then start time within the day.
const sortKey = (session) => `${toDateKey(session.date)} ${session.startTime || ""}`;

function ScheduleManagement() {
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // One modal for both add and edit. editingId null means "adding".
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.all([getSessions(), getSpeakers(), getEvents()])
      .then(([sessionData, speakerData, eventData]) => {
        setSessions(sessionData);
        setSpeakers(speakerData);
        setEvents(eventData);
        // A schedule belongs to one event, so open on the first one rather
        // than mixing every expo's sessions into a single timeline.
        if (eventData.length > 0) setSelectedEventId(eventData[0]._id);
      })
      .catch(() => setError("Failed to load the schedule."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEdit = (session) => {
    setForm({
      title: session.title || "",
      type: session.type || "Talk",
      date: toDateKey(session.date),
      startTime: session.startTime || "",
      endTime: session.endTime || "",
      speaker: session.speaker?._id || "",
      hall: session.hall || "",
      capacity: session.capacity ? String(session.capacity) : "",
      status: session.status || "Scheduled",
      description: session.description || "",
    });
    setEditingId(session._id);
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) return setFormError("Session title is required.");
    if (!form.date) return setFormError("Please pick a date.");
    if (!form.startTime || !form.endTime) return setFormError("Start and end time are required.");
    // Times are zero-padded "HH:MM", so comparing them as strings is valid.
    if (form.endTime <= form.startTime) {
      return setFormError("End time must be after start time.");
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      speaker: form.speaker,
      hall: form.hall,
      capacity: Number(form.capacity) || 0,
      status: form.status,
      description: form.description,
    };

    setIsSaving(true);
    try {
      // The API doesn't populate its write responses, so we attach the event
      // and speaker objects we already hold in state.
      const speakerForSession = speakers.find((sp) => sp._id === form.speaker) || null;

      if (editingId) {
        const updated = await updateSession(editingId, payload);
        setSessions((prev) =>
          prev.map((s) =>
            s._id === editingId
              ? { ...updated, event: s.event, speaker: speakerForSession }
              : s
          )
        );
      } else {
        const created = await createSession({ ...payload, event: selectedEventId });
        const eventForSession = events.find((ev) => ev._id === selectedEventId);
        setSessions((prev) => [
          ...prev,
          { ...created, event: eventForSession, speaker: speakerForSession },
        ]);
      }

      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save the session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (session) => {
    const confirmed = window.confirm(`Delete "${session.title}"? This can't be undone.`);
    if (!confirmed) return;

    setBusyId(session._id);
    try {
      await deleteSession(session._id);
      setSessions((prev) => prev.filter((s) => s._id !== session._id));
    } catch {
      alert("Failed to delete the session. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const query = search.trim().toLowerCase();

  // filter() returns a new array, so sorting it doesn't mutate state.
  const eventSessions = sessions
    .filter((session) => {
      const matchesEvent = session.event?._id === selectedEventId;
      const matchesSearch =
        session.title.toLowerCase().includes(query) ||
        (session.hall || "").toLowerCase().includes(query) ||
        (session.speaker?.name || "").toLowerCase().includes(query);
      return matchesEvent && matchesSearch;
    })
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  // Group the flat list into one block per day.
  const grouped = new Map();
  eventSessions.forEach((session) => {
    const key = toDateKey(session.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(session);
  });
  const days = [...grouped.entries()];

  // Only speakers belonging to the selected event can present here.
  const eventSpeakers = speakers.filter((sp) => sp.event?._id === selectedEventId);

  return (
    <div className="schedule-management">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Schedule</h1>
          <p>Plan the talks, workshops and panels for each event.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={openCreate}
          disabled={!selectedEventId}
        >
          + Add Session
        </button>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading schedule...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : events.length === 0 ? (
        <div className="admin-empty">
          <p>No events yet.</p>
          <p className="admin-empty-sub">Create an event before building its schedule.</p>
        </div>
      ) : (
        <>
          <div className="admin-filters">
            <input
              type="text"
              placeholder="Search by title, speaker or hall..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search"
            />
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

          {days.length === 0 ? (
            <div className="admin-empty">
              <p>No sessions yet.</p>
              <p className="admin-empty-sub">
                {query
                  ? "Try a different search."
                  : "Add the first session to start building this event's schedule."}
              </p>
            </div>
          ) : (
            <div className="schedule-days">
              {days.map(([dateKey, daySessions]) => (
                <div key={dateKey} className="admin-panel schedule-day">
                  <div className="schedule-day-heading">
                    <h2>{formatDay(dateKey)}</h2>
                    <span className="schedule-day-count">
                      {daySessions.length} {daySessions.length === 1 ? "session" : "sessions"}
                    </span>
                  </div>

                  {daySessions.map((session) => (
                    <div
                      key={session._id}
                      className={
                        session.status === "Cancelled"
                          ? "schedule-item schedule-item-cancelled"
                          : "schedule-item"
                      }
                    >
                      <div className="schedule-time">
                        <span className="schedule-time-start">{session.startTime}</span>
                        <span className="schedule-time-end">{session.endTime}</span>
                      </div>

                      <div className="schedule-body">
                        <div className="schedule-title-row">
                          <h3 className="schedule-title">{session.title}</h3>
                          <span className="admin-badge session-type">{session.type}</span>
                          {session.status !== "Scheduled" && (
                            <span className="admin-badge session-status">{session.status}</span>
                          )}
                        </div>

                        <p className="schedule-meta">
                          {session.speaker?.name || "No speaker assigned"}
                          {session.hall && ` · ${session.hall}`}
                          {session.capacity > 0 && ` · ${session.capacity} seats`}
                        </p>

                        {session.description && (
                          <p className="schedule-description">{session.description}</p>
                        )}
                      </div>

                      <div className="admin-table-actions schedule-actions">
                        <button
                          type="button"
                          className="admin-link"
                          disabled={busyId === session._id}
                          onClick={() => openEdit(session)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-link admin-link-danger"
                          disabled={busyId === session._id}
                          onClick={() => handleDelete(session)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isFormOpen}
        title={editingId ? "Edit Session" : "Add Session"}
        onClose={closeForm}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="schedule-form-grid">
            <label className="schedule-field">
              <span>Title *</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="e.g. Building for Scale"
                className="admin-search"
              />
            </label>

            <label className="schedule-field">
              <span>Type</span>
              <select name="type" value={form.type} onChange={handleFormChange} className="admin-select">
                {SESSION_TYPES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="schedule-field">
              <span>Date *</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
                className="admin-search"
              />
            </label>

            <div className="schedule-form-row">
              <label className="schedule-field">
                <span>Start *</span>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleFormChange}
                  className="admin-search"
                />
              </label>

              <label className="schedule-field">
                <span>End *</span>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleFormChange}
                  className="admin-search"
                />
              </label>
            </div>

            <label className="schedule-field">
              <span>Speaker</span>
              <select
                name="speaker"
                value={form.speaker}
                onChange={handleFormChange}
                className="admin-select"
              >
                <option value="">No speaker yet</option>
                {eventSpeakers.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name}
                    {sp.company ? ` — ${sp.company}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="schedule-form-row">
              <label className="schedule-field">
                <span>Hall</span>
                <input
                  type="text"
                  name="hall"
                  value={form.hall}
                  onChange={handleFormChange}
                  placeholder="e.g. Hall A"
                  className="admin-search"
                />
              </label>

              <label className="schedule-field">
                <span>Capacity</span>
                <input
                  type="number"
                  name="capacity"
                  min="0"
                  value={form.capacity}
                  onChange={handleFormChange}
                  placeholder="0"
                  className="admin-search"
                />
              </label>
            </div>

            <label className="schedule-field">
              <span>Status</span>
              <select name="status" value={form.status} onChange={handleFormChange} className="admin-select">
                {SESSION_STATUSES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="schedule-field">
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows="3"
                placeholder="What is this session about?"
                className="admin-search"
              />
            </label>
          </div>

          {formError && <p className="admin-state-text admin-state-error">{formError}</p>}

          <div className="schedule-modal-actions">
            <button type="button" className="admin-link" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save Changes" : "Add Session"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ScheduleManagement;