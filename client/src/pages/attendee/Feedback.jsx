import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getMyRegistrations } from "../../services/attendeeService";
import { getSessions } from "../../services/sessionService";
import { getPublicSettings } from "../../services/settingsService";
import { createFeedback } from "../../services/feedbackService";
import "./Feedback.css";

const CATEGORIES = ["Overall", "Venue", "Sessions", "Exhibitors", "Organization"];
const RATINGS = [1, 2, 3, 4, 5];

const EMPTY_FORM = { session: "", category: "Overall", rating: 0, comment: "" };

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function Feedback() {
  const { user } = useAuth();

  const [eligible, setEligible] = useState([]);
  const [eventId, setEventId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [done, setDone] = useState(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getMyRegistrations(), getPublicSettings()])
      .then(([registrations, settings]) => {
        if (ignore) return;

        const today = startOfDay(new Date());

        // Sirf wo expos jahan ye banda asal mein registered tha aur jo shuru ho
        // chuke hain. Guzri hui cheez ki raye hoti hai, aane wali ki nahi.
        const mine = registrations
          .filter((item) => item.status === "Registered" && item.event)
          .filter((item) => startOfDay(item.event.date) <= today)
          .map((item) => item.event)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setEligible(mine);
        setEventId(mine[0]?._id || "");
        setIsOpen(settings.feedbackOpen);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Couldn't load your expos.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Chune hue expo ke sessions — taake banda poore expo ke bajaye kisi ek talk
  // par raye de sake. Dependency primitive hai, poora object nahi.
  useEffect(() => {
    if (!eventId) {
      setSessions([]);
      return;
    }

    let ignore = false;

    getSessions({ event: eventId })
      .then((data) => {
        if (!ignore) setSessions(data.filter((item) => item.status !== "Cancelled"));
      })
      .catch(() => {
        // Sessions na mil sakein to form phir bhi chalna chahiye — banda poore
        // expo ki raye de dega. Is liye yahan error dikhana ulta nuqsan hai.
        if (!ignore) setSessions([]);
      });

    return () => {
      ignore = true;
    };
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Expo badalne par session ka chunav saaf karna zaroori hai — warna purane
  // expo ki session id nayi expo ke sath chali jati, aur server usay 400 ke
  // sath "That session belongs to a different event." keh kar rok deta.
  const handleEventChange = (e) => {
    setEventId(e.target.value);
    setForm((prev) => ({ ...prev, session: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!form.rating) {
      setNotice({ text: "Pick a rating from 1 to 5 first.", isError: true });
      return;
    }

    setIsSaving(true);

    try {
      await createFeedback({
        event: eventId,
        // Khaali string ObjectId mein cast nahi hoti, is liye null bhejte hain.
        session: form.session || null,
        name: user?.name,
        email: user?.email,
        rating: Number(form.rating),
        comment: form.comment,
        category: form.category,
      });

      const chosen = eligible.find((item) => item._id === eventId);
      setDone({ title: chosen?.title || "the expo" });
      setForm(EMPTY_FORM);
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Couldn't send your review.",
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fb">
        <h1 className="attendee-title">Leave a review</h1>
        <p className="admin-state-text">Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fb">
        <h1 className="attendee-title">Leave a review</h1>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="fb">
        <h1 className="attendee-title">Thanks</h1>
        <div className="admin-panel">
           <p className="fb-done">
            Your review of {done.title} is now live on the expo's page, under your name.
            The organizers can take it down if it breaks the rules.
          </p>
          <button type="button" className="admin-btn" onClick={() => setDone(null)}>
            Review something else
          </button>
        </div>
      </div>
    );
  }

  if (eligible.length === 0) {
    return (
      <div className="fb">
        <h1 className="attendee-title">Leave a review</h1>
        <div className="admin-panel">
          <div className="admin-empty">
            <p>Nothing to review yet.</p>
            <p className="admin-empty-sub">
              Reviews open once an expo you're registered for has started.{" "}
              <Link to="/attendee/expos" className="admin-link">
                Browse expos
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="fb">
        <h1 className="attendee-title">Leave a review</h1>
        <div className="admin-panel">
          <div className="admin-empty">
            <p>Reviews are closed right now.</p>
            <p className="admin-empty-sub">The organizers have stopped taking feedback.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fb">
      <h1 className="attendee-title">Leave a review</h1>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      <form className="admin-panel" onSubmit={handleSubmit}>
         <p className="fb-privacy">
          Your name and comment appear publicly on the expo's page. Your email address is
          never shown.
        </p>
        <div className="admin-form-grid">
          <label className="admin-form-field">
            <span>Expo</span>
            <select className="admin-select" value={eventId} onChange={handleEventChange}>
              {eligible.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title} — {formatDate(event.date)}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-form-field">
            <span>About</span>
            <select
              className="admin-select"
              name="session"
              value={form.session}
              onChange={handleChange}
            >
              <option value="">The whole expo</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.startTime} · {session.title}
                </option>
              ))}
            </select>
            <span className="admin-form-hint">
              Pick a session to review just that talk.
            </span>
          </label>
        </div>

        {/* Radio buttons, na ke buttons ka array. Keyboard se teer ke nishan
            chalte hain, screen reader "3 stars, 3 of 5" parhta hai, aur form
            khud rating bhej deta hai — ye sab muft mein. */}
        <fieldset className="fb-fieldset">
          <legend className="fb-legend">Rating</legend>
          <div className="fb-stars">
            {RATINGS.map((value) => (
              <label
                key={value}
                className="fb-star"
                data-on={Number(form.rating) >= value ? "true" : "false"}
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={Number(form.rating) === value}
                  onChange={handleChange}
                />
                <span aria-hidden="true">★</span>
                <span className="fb-sr">
                  {value} star{value > 1 ? "s" : ""}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fb-fieldset">
          <legend className="fb-legend">What's this about</legend>
          <div className="fb-chips">
            {CATEGORIES.map((category) => (
              <label
                key={category}
                className="fb-chip"
                data-on={form.category === category ? "true" : "false"}
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={form.category === category}
                  onChange={handleChange}
                />
                {category}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="admin-form-field admin-form-full">
          <span>Comment</span>
          <textarea
            className="admin-search"
            name="comment"
            value={form.comment}
            onChange={handleChange}
            placeholder="What worked, what didn't?"
          />
          <span className="admin-form-hint">
            Optional — the rating alone is useful too. Anything you write here is the part
            that shows publicly.
          </span>
        </label>

        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
          {isSaving ? "Sending..." : "Send review"}
        </button>
      </form>
    </div>
  );
}

export default Feedback;