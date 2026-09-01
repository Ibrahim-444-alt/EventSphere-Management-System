import { useState, useEffect } from "react";
import {
  getFeedback,
  createFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from "../../services/feedbackService";
import { getEvents } from "../../services/eventService";
import { getSessions } from "../../services/sessionService";
import Modal from "../../components/common/Modal";
import "./FeedbackManagement.css";

// Must match the enums in server/models/Feedback.js.
const CATEGORIES = ["Overall", "Venue", "Sessions", "Exhibitors", "Organization"];
const RATING_VALUES = [1, 2, 3, 4, 5];
const RATING_FILTER_OPTIONS = ["All", "5", "4", "3", "2", "1"];
const STATUS_FILTER_OPTIONS = ["All", "Published", "Hidden"];

const EMPTY_FORM = {
  event: "",
  session: "",
  name: "",
  email: "",
  rating: 0,
  comment: "",
  category: "Overall",
};

// Filled stars up to the rating, hollow ones after — no icon library needed.
const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

function FeedbackManagement() {
  const [feedback, setFeedback] = useState([]);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.all([getFeedback(), getEvents(), getSessions()])
      .then(([feedbackData, eventData, sessionData]) => {
        setFeedback(feedbackData);
        setEvents(eventData);
        setSessions(sessionData);
      })
      .catch(() => setError("Failed to load feedback."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Changing the event invalidates the chosen session, since a session
      // belongs to exactly one event — the API rejects a mismatch anyway.
      ...(name === "event" ? { session: "" } : {}),
    }));
    setFormError("");
  };

  const handleRatingPick = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
    setFormError("");
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.event) return setFormError("Please choose an event.");
    if (!form.name.trim()) return setFormError("Name is required.");
    if (!form.rating) return setFormError("Please choose a rating from 1 to 5.");

    setIsSaving(true);
    try {
      const created = await createFeedback({
        event: form.event,
        session: form.session,
        name: form.name.trim(),
        email: form.email.trim(),
        rating: form.rating,
        comment: form.comment.trim(),
        category: form.category,
      });

      // The response isn't populated, so we attach the event and session we
      // already have in state — otherwise the new card would show blanks.
      const eventForFeedback = events.find((ev) => ev._id === form.event) || null;
      const sessionForFeedback = sessions.find((s) => s._id === form.session) || null;

      setFeedback((prev) => [
        { ...created, event: eventForFeedback, session: sessionForFeedback },
        ...prev,
      ]);

      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to submit the feedback.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (item, status) => {
    setBusyId(item._id);
    try {
      const updated = await updateFeedbackStatus(item._id, status);
      setFeedback((prev) =>
        prev.map((f) => (f._id === item._id ? { ...f, status: updated.status } : f))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update the feedback.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete this feedback from ${item.name}? Hiding it keeps the record — deleting doesn't.`
    );
    if (!confirmed) return;

    setBusyId(item._id);
    try {
      await deleteFeedback(item._id);
      setFeedback((prev) => prev.filter((f) => f._id !== item._id));
    } catch {
      alert("Failed to delete the feedback. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // Stats follow the event filter but ignore search/rating/status, so the
  // averages don't move around while you're reading through comments.
  const eventScoped = feedback.filter(
    (f) => eventFilter === "All" || f.event?._id === eventFilter
  );

  // Hidden feedback is excluded from the score: it gets hidden because it's
  // spam or abuse, and that shouldn't drag the event's rating down.
  const published = eventScoped.filter((f) => f.status === "Published");
  const hiddenCount = eventScoped.length - published.length;

  const averageNumber = published.length
    ? published.reduce((sum, f) => sum + f.rating, 0) / published.length
    : 0;
  const averageLabel = published.length ? averageNumber.toFixed(1) : "—";

  // 5 stars at the top, 1 at the bottom — how people expect to read it.
  const distribution = [...RATING_VALUES].reverse().map((rating) => ({
    rating,
    count: published.filter((f) => f.rating === rating).length,
  }));
  // Bars are sized against the biggest bucket, not the total, so a spread of
  // small numbers is still readable.
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const filteredFeedback = eventScoped.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      (item.comment || "").toLowerCase().includes(query);
    const matchesRating = ratingFilter === "All" || item.rating === Number(ratingFilter);
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    return matchesSearch && matchesRating && matchesStatus && matchesCategory;
  });

  const sessionOptions = sessions.filter((s) => s.event?._id === form.event);

  return (
    <div className="feedback-management">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Feedback</h1>
          <p>See what visitors thought, and hide anything abusive.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Add Feedback
        </button>
      </div>

      {!isLoading && !error && feedback.length > 0 && (
        <>
          <div className="admin-stats-grid feedback-summary">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{eventScoped.length}</span>
              <span className="admin-stat-label">Total Responses</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{averageLabel}</span>
              <span className="admin-stat-label">
                Average Rating
                {published.length > 0 && (
                  <span className="feedback-stars feedback-stars-inline">
                    {renderStars(Math.round(averageNumber))}
                  </span>
                )}
              </span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{hiddenCount}</span>
              <span className="admin-stat-label">Hidden</span>
            </div>
          </div>

          {published.length > 0 && (
            <div className="admin-panel feedback-distribution">
              <h2>Rating Breakdown</h2>
              {distribution.map((row) => (
                <div key={row.rating} className="feedback-dist-row">
                  <span className="feedback-dist-label">
                    {row.rating} <span className="feedback-stars">★</span>
                  </span>
                  <span className="feedback-dist-bar">
                    <span
                      className="feedback-dist-fill"
                      style={{ width: `${(row.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="feedback-dist-count">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search names and comments..."
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
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="admin-select"
        >
          {RATING_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All ratings" : `${option} stars`}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="admin-select"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>{option}</option>
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
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading feedback...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : filteredFeedback.length === 0 ? (
        <div className="admin-empty">
          <p>No feedback found.</p>
          <p className="admin-empty-sub">
            {feedback.length === 0
              ? "Once visitors start rating your events, their responses land here."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="feedback-list">
          {filteredFeedback.map((item) => (
            <article
              key={item._id}
              className={`feedback-card${item.status === "Hidden" ? " feedback-card-hidden" : ""}`}
            >
              <div className="feedback-card-top">
                <span
                  className="feedback-stars feedback-stars-lg"
                  title={`${item.rating} out of 5`}
                >
                  {renderStars(item.rating)}
                </span>
                <div className="feedback-badges">
                  <span className="admin-badge feedback-category">{item.category}</span>
                  {item.status === "Hidden" && (
                    <span className="admin-badge feedback-status-hidden">Hidden</span>
                  )}
                </div>
              </div>

              <div className="feedback-meta">
                <span className="feedback-author">{item.name}</span>
                {item.email && <span className="feedback-contact">{item.email}</span>}
                <span className="feedback-contact">{formatDate(item.createdAt)}</span>
              </div>

              <p className="feedback-context">
                {item.event?.title || "Unknown event"}
                {item.session?.title && (
                  <span className="feedback-session"> · {item.session.title}</span>
                )}
              </p>

              {item.comment ? (
                <p className="feedback-comment">{item.comment}</p>
              ) : (
                <p className="feedback-comment admin-table-muted">
                  No comment — rating only.
                </p>
              )}

              <div className="feedback-card-actions">
                {item.status === "Hidden" ? (
                  <button
                    type="button"
                    className="admin-link"
                    disabled={busyId === item._id}
                    onClick={() => handleStatusChange(item, "Published")}
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-link"
                    disabled={busyId === item._id}
                    onClick={() => handleStatusChange(item, "Hidden")}
                  >
                    Hide
                  </button>
                )}
                <button
                  type="button"
                  className="admin-link admin-link-danger"
                  disabled={busyId === item._id}
                  onClick={() => handleDelete(item)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={isFormOpen} title="Add Feedback" onClose={closeForm}>
        {events.length === 0 ? (
          <p className="admin-state-text">
            You need at least one event before you can record feedback.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="feedback-form-grid">
              <label className="feedback-field">
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

              <label className="feedback-field">
                <span>Session (optional)</span>
                <select
                  name="session"
                  value={form.session}
                  onChange={handleFormChange}
                  className="admin-select"
                  disabled={!form.event}
                >
                  <option value="">About the whole event</option>
                  {sessionOptions.map((s) => (
                    <option key={s._id} value={s._id}>{s.title}</option>
                  ))}
                </select>
              </label>

              <label className="feedback-field">
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

              <label className="feedback-field">
                <span>Email (optional)</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="e.g. hamza@example.com"
                  className="admin-search"
                />
              </label>

              <div className="feedback-field">
                <span>Rating *</span>
                <div className="feedback-star-picker">
                  {RATING_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`feedback-star-btn${value <= form.rating ? " is-active" : ""}`}
                      onClick={() => handleRatingPick(value)}
                      aria-label={`${value} star${value > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="feedback-star-hint">
                    {form.rating ? `${form.rating} / 5` : "Not rated"}
                  </span>
                </div>
              </div>

              <label className="feedback-field">
                <span>Category</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className="admin-select"
                >
                  {CATEGORIES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="feedback-field">
                <span>Comment</span>
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleFormChange}
                  rows="4"
                  placeholder="What did they say?"
                  className="admin-search feedback-textarea"
                />
              </label>
            </div>

            {formError && <p className="admin-state-text admin-state-error">{formError}</p>}

            <div className="feedback-modal-actions">
              <button type="button" className="admin-link" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Add Feedback"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default FeedbackManagement;