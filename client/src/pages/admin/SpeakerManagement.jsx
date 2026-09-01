import { useState, useEffect } from "react";
import {
  getSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
} from "../../services/speakerService";
import { getEvents } from "../../services/eventService";
import Modal from "../../components/common/Modal";
import "./SpeakerManagement.css";

const EMPTY_FORM = {
  event: "",
  name: "",
  designation: "",
  company: "",
  email: "",
  photo: "",
  bio: "",
};

// "Ada Lovelace" -> "AL". Shown when a speaker has no photo, so every card
// still looks deliberate instead of having a hole in it.
const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

function SpeakerManagement() {
  const [speakers, setSpeakers] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All");

  // One modal serves both jobs: editingId null means "adding a new speaker".
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Photo URLs are typed by hand for now, so some will be broken. We record
  // which images failed and fall back to initials for those.
  const [brokenPhotos, setBrokenPhotos] = useState([]);

  useEffect(() => {
    Promise.all([getSpeakers(), getEvents()])
      .then(([speakerData, eventData]) => {
        setSpeakers(speakerData);
        setEvents(eventData);
      })
      .catch(() => setError("Failed to load speakers."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear the old message as soon as anything is edited, otherwise a stale
    // error looks like a fresh rejection.
    setFormError("");
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEdit = (speaker) => {
    setForm({
      event: speaker.event?._id || "",
      name: speaker.name || "",
      designation: speaker.designation || "",
      company: speaker.company || "",
      email: speaker.email || "",
      photo: speaker.photo || "",
      bio: speaker.bio || "",
    });
    setEditingId(speaker._id);
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
    if (!form.name.trim()) return setFormError("Speaker name is required.");

    setIsSaving(true);
    try {
      if (editingId) {
        // `event` is deliberately left out. The API's update whitelist won't
        // move a speaker between events, so the UI doesn't pretend it can.
        const updated = await updateSpeaker(editingId, {
          name: form.name.trim(),
          designation: form.designation,
          company: form.company,
          email: form.email,
          photo: form.photo,
          bio: form.bio,
        });

        // The response isn't populated, so we keep the event object we
        // already have in state instead of losing the title.
        setSpeakers((prev) =>
          prev.map((s) => (s._id === editingId ? { ...updated, event: s.event } : s))
        );
      } else {
        const created = await createSpeaker({ ...form, name: form.name.trim() });
        const eventForSpeaker = events.find((ev) => ev._id === form.event);
        // Newest first, matching the API's sort order.
        setSpeakers((prev) => [{ ...created, event: eventForSpeaker }, ...prev]);
      }

      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save the speaker.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (speaker) => {
    const confirmed = window.confirm(`Remove ${speaker.name}? This can't be undone.`);
    if (!confirmed) return;

    setBusyId(speaker._id);
    try {
      await deleteSpeaker(speaker._id);
      setSpeakers((prev) => prev.filter((s) => s._id !== speaker._id));
    } catch {
      alert("Failed to delete the speaker. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredSpeakers = speakers.filter((speaker) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      speaker.name.toLowerCase().includes(query) ||
      (speaker.company || "").toLowerCase().includes(query) ||
      (speaker.designation || "").toLowerCase().includes(query);
    const matchesEvent = eventFilter === "All" || speaker.event?._id === eventFilter;
    return matchesSearch && matchesEvent;
  });

  // Shown as read-only text in edit mode, since the event can't be changed.
  const editingEventTitle = events.find((ev) => ev._id === form.event)?.title || "—";

  return (
    <div className="speaker-management">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Speakers</h1>
          <p>Manage the people presenting at each event.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Add Speaker
        </button>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by name, company or role..."
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
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading speakers...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : filteredSpeakers.length === 0 ? (
        <div className="admin-empty">
          <p>No speakers found.</p>
          <p className="admin-empty-sub">
            {speakers.length === 0
              ? "Add your first speaker to start building the schedule."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="speaker-grid">
          {filteredSpeakers.map((speaker) => (
            <div key={speaker._id} className="speaker-card">
              <div className="speaker-card-top">
                {speaker.photo && !brokenPhotos.includes(speaker._id) ? (
                  <img
                    src={speaker.photo}
                    alt={speaker.name}
                    className="speaker-avatar-img"
                    onError={() => setBrokenPhotos((prev) => [...prev, speaker._id])}
                  />
                ) : (
                  <span className="speaker-avatar">{getInitials(speaker.name)}</span>
                )}

                <div className="speaker-identity">
                  <h3 className="speaker-name">{speaker.name}</h3>
                  {speaker.designation && <p className="speaker-role">{speaker.designation}</p>}
                  {speaker.company && <p className="speaker-company">{speaker.company}</p>}
                  {speaker.email && (
                    <a href={`mailto:${speaker.email}`} className="speaker-email">
                      {speaker.email}
                    </a>
                  )}
                </div>
              </div>

              {speaker.bio && <p className="speaker-bio">{speaker.bio}</p>}

              <div className="speaker-card-footer">
                <span className="speaker-event">{speaker.event?.title || "—"}</span>
                <div className="admin-table-actions">
                  <button
                    type="button"
                    className="admin-link"
                    disabled={busyId === speaker._id}
                    onClick={() => openEdit(speaker)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-link admin-link-danger"
                    disabled={busyId === speaker._id}
                    onClick={() => handleDelete(speaker)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        title={editingId ? "Edit Speaker" : "Add Speaker"}
        onClose={closeForm}
      >
        {events.length === 0 ? (
          <p className="admin-state-text">
            You need at least one event before you can add speakers.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="speaker-form-grid">
              {editingId ? (
                <div className="speaker-field">
                  <span>Event</span>
                  <p className="speaker-readonly">{editingEventTitle}</p>
                </div>
              ) : (
                <label className="speaker-field">
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

              <label className="speaker-field">
                <span>Name *</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Ada Lovelace"
                  className="admin-search"
                />
              </label>

              <label className="speaker-field">
                <span>Designation</span>
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleFormChange}
                  placeholder="e.g. Head of Engineering"
                  className="admin-search"
                />
              </label>

              <label className="speaker-field">
                <span>Company</span>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleFormChange}
                  placeholder="e.g. TechConnect"
                  className="admin-search"
                />
              </label>

              <label className="speaker-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="e.g. ada@example.com"
                  className="admin-search"
                />
              </label>

              <label className="speaker-field">
                <span>Photo URL</span>
                <input
                  type="url"
                  name="photo"
                  value={form.photo}
                  onChange={handleFormChange}
                  placeholder="https://..."
                  className="admin-search"
                />
              </label>

              <label className="speaker-field">
                <span>Bio</span>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="A short introduction..."
                  className="admin-search"
                />
              </label>
            </div>

            {formError && <p className="admin-state-text admin-state-error">{formError}</p>}

            <div className="speaker-modal-actions">
              <button type="button" className="admin-link" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : editingId ? "Save Changes" : "Add Speaker"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default SpeakerManagement;