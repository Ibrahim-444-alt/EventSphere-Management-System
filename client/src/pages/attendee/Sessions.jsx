import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../../services/eventService";
import { getSessions } from "../../services/sessionService";
import { getMyRegistrations } from "../../services/attendeeService";
import { getMyBookmarks, addBookmark, removeBookmark } from "../../services/bookmarkService";
import "./Sessions.css";

const OPEN_STATUSES = ["Upcoming", "Ongoing"];
const SESSION_TYPES = ["Talk", "Workshop", "Panel", "Keynote", "Demo"];

const formatDayHeading = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// API tareekh ISO string bhej ta hai ("2026-09-12T00:00:00.000Z"), to pehle 10
// harf hi din hain. Yahan new Date() + toISOString() se guzarna khatarnaak hai
// — timezone ke hisab se din aage peeche ho jata hai aur grouping toot jati.
const dayKey = (value) => String(value).slice(0, 10);

// Do sessions takrate hain jab har ek doosre ke khatam hone se pehle shuru ho
// jaye. Waqt "HH:MM" zero-padded hai, is liye seedha string comparison chalta
// hai — koi date maths nahi. (Yehi tareeqa server speaker clash mein use karta.)
const overlaps = (a, b) => a.startTime < b.endTime && a.endTime > b.startTime;

function Sessions() {
  const [events, setEvents] = useState([]);
  const [myEventIds, setMyEventIds] = useState([]);
  const [eventId, setEventId] = useState("");
  const [sessions, setSessions] = useState([]);

  // Set rakhne ki wajah: har row ko "kya ye saved hai?" poochna parta hai. Array
  // par includes() poori list scan karti hai, Set par has() seedha jawab deta.
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState("");

  const [typeFilter, setTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);

  // Pehla effect: expos, meri registrations, aur meri saved list. Default expo
  // wahi jis mein main registered hoon aur jo sab se qareeb hai.
  useEffect(() => {
    let ignore = false;

    Promise.all([getEvents(), getMyRegistrations(), getMyBookmarks()])
      .then(([eventList, registrations, bookmarks]) => {
        if (ignore) return;

        const open = eventList.filter((event) => OPEN_STATUSES.includes(event.status));
        const mine = registrations
          .filter((item) => item.status === "Registered" && item.event)
          .map((item) => item.event._id || item.event);

        setEvents(open);
        setMyEventIds(mine);
        setSavedIds(new Set(bookmarks.map((item) => item.session._id)));

        const registeredAndOpen = open
          .filter((event) => mine.includes(event._id))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setEventId(registeredAndOpen[0]?._id || open[0]?._id || "");
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Couldn't load the schedule.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Doosra effect: chune hue expo ke sessions. Dependency mein eventId hai —
  // ek primitive. Poora event object rakhte to har render par nayi reference
  // banti aur effect bar bar chalta rehta.
  useEffect(() => {
    if (!eventId) {
      setSessions([]);
      return;
    }

    let ignore = false;
    setIsLoadingSessions(true);

    getSessions({ event: eventId })
      .then((data) => {
        if (!ignore) setSessions(data);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Couldn't load the schedule.");
      })
      .finally(() => {
        if (!ignore) setIsLoadingSessions(false);
      });

    return () => {
      ignore = true;
    };
  }, [eventId]);

  const handleToggleSave = async (session) => {
    const isSaved = savedIds.has(session._id);

    setSavingId(session._id);
    setNotice(null);

    try {
      if (isSaved) {
        await removeBookmark(session._id);
        setSavedIds((prev) => {
          // Set ko jagah par badalna React ko nazar nahi aata — hamesha nayi
          // Set banani parti hai, warna page dobara render nahi hota.
          const next = new Set(prev);
          next.delete(session._id);
          return next;
        });
      } else {
        await addBookmark(session._id);
        setSavedIds((prev) => new Set(prev).add(session._id));
      }
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Couldn't update your saved sessions.",
        isError: true,
      });
    } finally {
      setSavingId("");
    }
  };

  // Server pehle hi date phir startTime se sort kar ke deta hai, is liye din ke
  // groups banane ke liye ek hi guzar kaafi hai — dobara sort karna fuzool.
  const groups = [];
  sessions.forEach((session) => {
    const key = dayKey(session.date);
    const last = groups[groups.length - 1];

    if (last && last.key === key) last.sessions.push(session);
    else groups.push({ key, date: session.date, sessions: [session] });
  });

  // Takraav poore din par nikalte hain, filter lagne se pehle. Warna type
  // filter asli clash ko chhupa deta — aur attendee ko ghalat tasalli mil jati.
  const clashIds = new Set();
  groups.forEach((group) => {
    const live = group.sessions.filter((session) => session.status !== "Cancelled");

    live.forEach((session, index) => {
      live.slice(index + 1).forEach((other) => {
        if (overlaps(session, other)) {
          clashIds.add(session._id);
          clashIds.add(other._id);
        }
      });
    });
  });

  const selectedEvent = events.find((event) => event._id === eventId) || null;
  const isMine = selectedEvent ? myEventIds.includes(selectedEvent._id) : false;

  if (isLoading) {
    return (
      <div className="sched">
        <h1 className="attendee-title">Schedule</h1>
        <p className="admin-state-text">Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="sched">
        <h1 className="attendee-title">Schedule</h1>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="sched">
        <h1 className="attendee-title">Schedule</h1>
        <div className="admin-panel">
          <div className="admin-empty">
            <p>No expos are open right now.</p>
            <p className="admin-empty-sub">Check back when the next one is announced.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sched">
      <h1 className="attendee-title">Schedule</h1>

      <div className="sched-controls">
        <label className="admin-form-field">
          <span>Expo</span>
          <select
            className="admin-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
                {myEventIds.includes(event._id) ? " — you're registered" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form-field">
          <span>Type</span>
          <select
            className="admin-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {SESSION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {!isMine && selectedEvent && (
        <p className="sched-note">
          You're not registered for {selectedEvent.title} yet.{" "}
          <Link to="/attendee/expos" className="admin-link">
            Register
          </Link>{" "}
          to get in the door.
        </p>
      )}

      {clashIds.size > 0 && (
        <p className="sched-note sched-note-clash">
          Some sessions run at the same time. Those are marked so you can pick one.
        </p>
      )}

      {isLoadingSessions ? (
        <p className="admin-state-text">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-empty">
            <p>The schedule isn't published yet.</p>
            <p className="admin-empty-sub">Talks and workshops appear here once the organizer adds them.</p>
          </div>
        </div>
      ) : (
        groups.map((group) => {
          const visible = typeFilter
            ? group.sessions.filter((session) => session.type === typeFilter)
            : group.sessions;

          // Filter ke baad khaali din ka heading dikhana bekaar hai.
          if (visible.length === 0) return null;

          return (
            <section key={group.key} className="sched-day">
              <div className="sched-day-head">
                <h2 className="sched-day-date">{formatDayHeading(group.date)}</h2>
                <span className="sched-day-count">
                  {visible.length} session{visible.length > 1 ? "s" : ""}
                </span>
              </div>

              <ul className="sched-list">
                {visible.map((session) => {
                  const isCancelled = session.status === "Cancelled";
                  const hasClash = clashIds.has(session._id);
                  const isSaved = savedIds.has(session._id);
                  const isSaving = savingId === session._id;

                  return (
                    <li
                      key={session._id}
                      className="sess"
                      data-status={session.status}
                      data-clash={hasClash ? "true" : "false"}
                    >
                      <div className="sess-time">
                        <span className="sess-start">{session.startTime}</span>
                        <span className="sess-end">{session.endTime}</span>
                      </div>

                      <div className="sess-body">
                        <div className="sess-head">
                          <h3 className="sess-title">{session.title}</h3>
                          <span className="sess-tag">{session.type}</span>

                          {/* Cancelled session save karne ka koi matlab nahi —
                              server bhi usay 400 ke sath rok deta hai. */}
                          {!isCancelled && (
                            <button
                              type="button"
                              className="sess-save"
                              data-saved={isSaved ? "true" : "false"}
                              onClick={() => handleToggleSave(session)}
                              disabled={isSaving}
                            >
                              {isSaving ? "..." : isSaved ? "Saved" : "Save"}
                            </button>
                          )}
                        </div>

                        {session.speaker && (
                          <p className="sess-speaker">
                            {session.speaker.name}
                            {session.speaker.designation && `, ${session.speaker.designation}`}
                            {session.speaker.company && ` · ${session.speaker.company}`}
                          </p>
                        )}

                        {session.description && <p className="sess-desc">{session.description}</p>}

                        <p className="sess-meta">
                          {session.hall || "Hall to be announced"}
                          {session.capacity > 0 && ` · ${session.capacity} seats`}
                        </p>

                        {isCancelled && <p className="sess-flag">Cancelled by the organizer</p>}
                        {!isCancelled && hasClash && (
                          <p className="sess-flag sess-flag-clash">Overlaps another session</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

export default Sessions;