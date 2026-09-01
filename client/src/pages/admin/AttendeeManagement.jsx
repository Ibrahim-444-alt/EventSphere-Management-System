import { useState, useEffect } from "react";
import {
  getAttendees,
  createAttendee,
  updateAttendee,
  checkInAttendee,
  deleteAttendee,
} from "../../services/attendeeService";
import { getEvents } from "../../services/eventService";
import Modal from "../../components/common/Modal";
import "./AttendeeManagement.css";

// Must match the enums in server/models/Registration.js.
const TICKET_TYPES = ["General", "Student", "VIP", "Press"];
const STATUS_FILTER_OPTIONS = ["All", "Registered", "Cancelled"];
const CHECKIN_FILTER_OPTIONS = ["All", "Checked in", "Not checked in"];

const EMPTY_FORM = {
  event: "",
  name: "",
  email: "",
  phone: "",
  organization: "",
  ticketType: "General",
};

// Events can run over several days, so the arrival stamp shows the day too.
const formatCheckInTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

function AttendeeManagement() {
  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [checkInFilter, setCheckInFilter] = useState("All");

  // One modal for both register and edit. editingId null means "registering".
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.all([getAttendees(), getEvents()])
      .then(([attendeeData, eventData]) => {
        setAttendees(attendeeData);
        setEvents(eventData);
      })
      .catch(() => setError("Failed to load attendees."))
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

  const openEdit = (attendee) => {
    setForm({
      event: attendee.event?._id || "",
      name: attendee.name || "",
      email: attendee.email || "",
      phone: attendee.phone || "",
      organization: attendee.organization || "",
      ticketType: attendee.ticketType || "General",
    });
    setEditingId(attendee._id);
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

    if (!editingId && !form.event) return setFormError("Please choose an event.");
    if (!form.name.trim()) return setFormError("Attendee name is required.");
    if (!form.email.trim()) return setFormError("Email is required.");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone,
      organization: form.organization,
      ticketType: form.ticketType,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateAttendee(editingId, payload);
        // The response isn't populated, so we keep the event object already
        // in state instead of losing the title from the table.
        setAttendees((prev) =>
          prev.map((a) => (a._id === editingId ? { ...updated, event: a.event } : a))
        );
      } else {
        const created = await createAttendee({ ...payload, event: form.event });
        const eventForAttendee = events.find((ev) => ev._id === form.event);
        // Newest first, matching the API's sort order.
        setAttendees((prev) => [{ ...created, event: eventForAttendee }, ...prev]);
      }

      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save the registration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckIn = async (attendee, checkedIn) => {
    setBusyId(attendee._id);
    try {
      const updated = await checkInAttendee(attendee._id, checkedIn);
      setAttendees((prev) =>
        prev.map((a) =>
          a._id === attendee._id
            ? { ...a, checkedIn: updated.checkedIn, checkInAt: updated.checkInAt }
            : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update the check-in.");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (attendee, status) => {
    if (status === "Cancelled") {
      const confirmed = window.confirm(`Cancel ${attendee.name}'s registration?`);
      if (!confirmed) return;
    }

    setBusyId(attendee._id);
    try {
      const updated = await updateAttendee(attendee._id, { status });
      // checkedIn/checkInAt come from the response because the server clears
      // them on cancellation — we don't recreate that rule here.
      setAttendees((prev) =>
        prev.map((a) =>
          a._id === attendee._id
            ? {
                ...a,
                status: updated.status,
                checkedIn: updated.checkedIn,
                checkInAt: updated.checkInAt,
              }
            : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update the registration.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (attendee) => {
    const confirmed = window.confirm(
      `Delete ${attendee.name}'s registration? This can't be undone — use Cancel if you just want to keep a record.`
    );
    if (!confirmed) return;

    setBusyId(attendee._id);
    try {
      await deleteAttendee(attendee._id);
      setAttendees((prev) => prev.filter((a) => a._id !== attendee._id));
    } catch {
      alert("Failed to delete the registration. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // Stats are scoped to the chosen event but ignore the search and status
  // boxes, so the numbers stay steady while you're looking someone up.
  const eventScoped = attendees.filter(
    (a) => eventFilter === "All" || a.event?._id === eventFilter
  );

  const summary = {
    registered: eventScoped.filter((a) => a.status === "Registered").length,
    checkedIn: eventScoped.filter((a) => a.checkedIn).length,
    cancelled: eventScoped.filter((a) => a.status === "Cancelled").length,
  };

  const filteredAttendees = eventScoped.filter((attendee) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      attendee.name.toLowerCase().includes(query) ||
      attendee.email.toLowerCase().includes(query) ||
      (attendee.organization || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || attendee.status === statusFilter;
    const matchesCheckIn =
      checkInFilter === "All" ||
      (checkInFilter === "Checked in" ? attendee.checkedIn : !attendee.checkedIn);
    return matchesSearch && matchesStatus && matchesCheckIn;
  });

  // Shown as read-only text in edit mode, since the event can't be changed.
  const editingEventTitle = events.find((ev) => ev._id === form.event)?.title || "—";

  return (
    <div className="attendee-management">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Attendees</h1>
          <p>Register visitors, look them up and check them in at the door.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Register Attendee
        </button>
      </div>

      {!isLoading && !error && attendees.length > 0 && (
        <div className="admin-stats-grid attendee-summary">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{summary.registered}</span>
            <span className="admin-stat-label">Registered</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{summary.checkedIn}</span>
            <span className="admin-stat-label">Checked In</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{summary.cancelled}</span>
            <span className="admin-stat-label">Cancelled</span>
          </div>
        </div>
      )}

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by name, email or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="admin-select"
        >
          <option value="All">All events</option>
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>{ev.title}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={checkInFilter}
          onChange={(e) => setCheckInFilter(e.target.value)}
          className="admin-select"
        >
          {CHECKIN_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading attendees...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : filteredAttendees.length === 0 ? (
        <div className="admin-empty">
          <p>No attendees found.</p>
          <p className="admin-empty-sub">
            {attendees.length === 0
              ? "Register your first attendee to open the door."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="admin-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Organization</th>
                <th>Event</th>
                <th>Ticket</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendees.map((attendee) => (
                <tr
                  key={attendee._id}
                  className={attendee.status === "Cancelled" ? "attendee-row-cancelled" : ""}
                >
                  <td>
                    <span className="attendee-name">{attendee.name}</span>
                    <span className="attendee-email">{attendee.email}</span>
                    {attendee.phone && <span className="attendee-email">{attendee.phone}</span>}
                  </td>
                  <td>{attendee.organization || <span className="admin-table-muted">—</span>}</td>
                  <td>{attendee.event?.title || "—"}</td>
                  <td>
                    <span
                      className={`admin-badge attendee-ticket attendee-ticket-${attendee.ticketType.toLowerCase()}`}
                    >
                      {attendee.ticketType}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-badge attendee-status attendee-status-${attendee.status.toLowerCase()}`}
                    >
                      {attendee.status}
                    </span>
                  </td>
                  <td>
                    {attendee.status === "Cancelled" ? (
                      <span className="admin-table-muted">—</span>
                    ) : attendee.checkedIn ? (
                      <span className="attendee-checkin">
                        <span className="attendee-checkin-time">
                          ✓ {formatCheckInTime(attendee.checkInAt)}
                        </span>
                        <button
                          type="button"
                          className="admin-link"
                          disabled={busyId === attendee._id}
                          onClick={() => handleCheckIn(attendee, false)}
                        >
                          Undo
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn attendee-checkin-btn"
                        disabled={busyId === attendee._id}
                        onClick={() => handleCheckIn(attendee, true)}
                      >
                        Check in
                      </button>
                    )}
                  </td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-link"
                      disabled={busyId === attendee._id}
                      onClick={() => openEdit(attendee)}
                    >
                      Edit
                    </button>

                    {attendee.status === "Cancelled" ? (
                      <button
                        type="button"
                        className="admin-link"
                        disabled={busyId === attendee._id}
                        onClick={() => handleStatusChange(attendee, "Registered")}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-link"
                        disabled={busyId === attendee._id}
                        onClick={() => handleStatusChange(attendee, "Cancelled")}
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      className="admin-link admin-link-danger"
                      disabled={busyId === attendee._id}
                      onClick={() => handleDelete(attendee)}
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
        isOpen={isFormOpen}
        title={editingId ? "Edit Registration" : "Register Attendee"}
        onClose={closeForm}
      >
        {events.length === 0 ? (
          <p className="admin-state-text">
            You need at least one event before you can register attendees.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="attendee-form-grid">
              {editingId ? (
                <div className="attendee-field">
                  <span>Event</span>
                  <p className="attendee-readonly">{editingEventTitle}</p>
                </div>
              ) : (
                <label className="attendee-field">
                  <span>Event *</span>
                  <select
                    name="event"
                    value={form.event}
                    onChange={handleFormChange}
                    className="admin-select"
                  >
                    <option value="">Select an event</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="attendee-field">
                <span>Name *</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Hamza Sheikh"
                  className="admin-search"
                />
              </label>

              <label className="attendee-field">
                <span>Email *</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="e.g. hamza@example.com"
                  className="admin-search"
                />
              </label>

              <label className="attendee-field">
                <span>Phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="e.g. 0300 1234567"
                  className="admin-search"
                />
              </label>

              <label className="attendee-field">
                <span>Organization</span>
                <input
                  type="text"
                  name="organization"
                  value={form.organization}
                  onChange={handleFormChange}
                  placeholder="e.g. Bahria University"
                  className="admin-search"
                />
              </label>

              <label className="attendee-field">
                <span>Ticket Type</span>
                <select
                  name="ticketType"
                  value={form.ticketType}
                  onChange={handleFormChange}
                  className="admin-select"
                >
                  {TICKET_TYPES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            {formError && <p className="admin-state-text admin-state-error">{formError}</p>}

            <div className="attendee-modal-actions">
              <button type="button" className="admin-link" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : editingId ? "Save Changes" : "Register"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default AttendeeManagement;