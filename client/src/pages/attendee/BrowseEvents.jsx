import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import Modal from "../../components/common/Modal";
import { getEvents } from "../../services/eventService";
import { getMyRegistrations, registerForEvent } from "../../services/attendeeService";
import { getPublicSettings } from "../../services/settingsService";
import "./BrowseEvents.css";

// Wohi list jo server ke registerForEvent mein hai. Dono jagah hona maqsad ke
// khilaf nahi: yahan se banda faltu koshish se bachta hai, wahan se rok pukhta
// hoti hai.
const OPEN_STATUSES = ["Upcoming", "Ongoing"];

// Registration model ka enum. Isse aage koi value bhejein to Mongoose rok degi.
const TICKET_TYPES = ["General", "Student", "VIP", "Press"];

const EMPTY_FORM = { ticketType: "General", phone: "", organization: "" };

const formatDay = (value) => new Date(value).getDate();
const formatMonth = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: "short" }).toUpperCase();
const formatYear = (value) => new Date(value).getFullYear();

const isDeadlinePassed = (event) =>
  Boolean(event.registrationDeadline) && new Date(event.registrationDeadline) < new Date();

function BrowseEvents() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);

  const [openEvent, setOpenEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    // Teen requests ek sath. getPublicSettings wohi function hai jo Phase 4
    // mein banaya tha aur tab se bekaar para tha — ye uska asli maqsad hai.
    Promise.all([getEvents(), getMyRegistrations(), getPublicSettings()])
      .then(([eventList, registrations, settings]) => {
        if (ignore) return;
        setEvents(eventList.filter((event) => OPEN_STATUSES.includes(event.status)));
        setMyRegistrations(registrations);
        setRegistrationsOpen(settings.registrationsOpen);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Couldn't load expos.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // event id → meri registration. populate() ki wajah se event ek object hai.
  const myByEvent = {};
  myRegistrations.forEach((item) => {
    const eventId = item.event?._id || item.event;
    if (eventId) myByEvent[eventId] = item;
  });

  const handleOpen = (event) => {
    setOpenEvent(event);
    setForm(EMPTY_FORM);
    setNotice(null);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const created = await registerForEvent({
        event: openEvent._id,
        ticketType: form.ticketType,
        phone: form.phone.trim(),
        organization: form.organization.trim(),
      });

      // create/save ka jawab populate nahi hota — us mein `event` sirf id hai.
      // Seedha state mein daal dein to myByEvent ka lookup tootta nahi, magar
      // shakl baqi records se mukhtalif reh jati hai. Is liye event ko wohi
      // chhoti si shakl de dete hain jo lookup ko chahiye.
      const normalized = { ...created, event: { _id: openEvent._id, title: openEvent.title } };

      setMyRegistrations((prev) => {
        const others = prev.filter((item) => (item.event?._id || item.event) !== openEvent._id);
        return [normalized, ...others];
      });

      setNotice({ text: `Registered for ${openEvent.title}.`, isError: false });
      setOpenEvent(null);
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Couldn't complete your registration.",
        isError: true,
      });
      setOpenEvent(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="browse">
        <h1 className="attendee-title">Browse expos</h1>
        <p className="admin-state-text">Loading expos...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="browse">
        <h1 className="attendee-title">Browse expos</h1>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="browse">
      <h1 className="attendee-title">Browse expos</h1>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {!registrationsOpen && (
        <p className="admin-notice admin-notice-error">
          Registration is closed right now. Check back later, or register at the venue.
        </p>
      )}

      {events.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-empty">
            <p>No expos are open yet.</p>
            <p className="admin-empty-sub">
              Upcoming expos appear here as soon as the organizer publishes them.
            </p>
          </div>
        </div>
      ) : (
        <ul className="expo-list">
          {events.map((event) => {
            const mine = myByEvent[event._id];
            const isRegistered = mine && mine.status === "Registered";
            const wasCancelled = mine && mine.status === "Cancelled";
            const deadlinePassed = isDeadlinePassed(event);
            const canRegister = registrationsOpen && !isRegistered && !deadlinePassed;

            return (
              <li key={event._id} className="expo" data-mine={isRegistered ? "true" : "false"}>
                <div className="expo-rail" aria-hidden="true">
                  <span className="expo-day">{formatDay(event.date)}</span>
                  <span className="expo-month">{formatMonth(event.date)}</span>
                  <span className="expo-year">{formatYear(event.date)}</span>
                </div>

                <div className="expo-body">
                  <span className="expo-eyebrow">
                    {event.status}
                    {event.theme && ` · ${event.theme}`}
                  </span>
                  <h2 className="expo-name">{event.title}</h2>
                  <p className="expo-where">
                    {event.location} · {event.startTime}&ndash;{event.endTime}
                  </p>
                  {deadlinePassed && (
                    <p className="expo-flag">
                      Online registration closed — you can still register at the venue.
                    </p>
                  )}
                </div>

                <div className="expo-action">
                  {isRegistered ? (
                    <span className="expo-done">You're in</span>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => handleOpen(event)}
                      disabled={!canRegister}
                    >
                      {wasCancelled ? "Register again" : "Register"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={Boolean(openEvent)}
        title={openEvent ? `Register for ${openEvent.title}` : ""}
        onClose={() => setOpenEvent(null)}
      >
        <form onSubmit={handleRegister}>
          <p className="browse-identity">
            Your pass will read <strong>{user?.name}</strong> ({user?.email}). To change that,
            edit your account.
          </p>

          <label className="admin-form-field">
            <span>Ticket type</span>
            <select
              name="ticketType"
              value={form.ticketType}
              onChange={handleChange}
              className="admin-select"
            >
              {TICKET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-form-field">
            <span>Phone</span>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="admin-search"
            />
            <span className="admin-form-hint">Optional — used only if the organizer needs to reach you.</span>
          </label>

          <label className="admin-form-field">
            <span>Organization</span>
            <input
              type="text"
              name="organization"
              value={form.organization}
              onChange={handleChange}
              className="admin-search"
            />
            <span className="admin-form-hint">Optional — printed on your pass.</span>
          </label>

          <div className="browse-modal-actions">
            <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
              {isSaving ? "Registering..." : "Register"}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={() => setOpenEvent(null)}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BrowseEvents;