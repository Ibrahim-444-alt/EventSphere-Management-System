import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBookmarks, removeBookmark } from "../../services/bookmarkService";
// Timeline ka look Schedule page ne banaya tha aur yahan bilkul wohi chahiye.
// CSS global hoti hai, to bina import bhi chal jati — magar phir ye page chupke
// se doosre page par tika hota. Import likh dena us rishte ko zahir kar deta
// hai. (Phase 9 mein ye rules ek shared timeline.css mein jayenge.)
import "./Sessions.css";
import "./Bookmarks.css";

const formatDayHeading = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const dayKey = (value) => String(value).slice(0, 10);

const overlaps = (a, b) => a.startTime < b.endTime && a.endTime > b.startTime;

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    let ignore = false;

    getMyBookmarks()
      .then((data) => {
        if (!ignore) setBookmarks(data);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Couldn't load your saved sessions.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRemove = async (bookmark) => {
    setRemovingId(bookmark._id);
    setNotice(null);

    try {
      await removeBookmark(bookmark.session._id);
      setBookmarks((prev) => prev.filter((item) => item._id !== bookmark._id));
      setNotice({ text: `Removed “${bookmark.session.title}”.`, isError: false });
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Couldn't remove this session.",
        isError: true,
      });
    } finally {
      setRemovingId("");
    }
  };

  // Server pehle hi date phir startTime se sort kar ke deta hai (populate ke
  // baad JS mein), is liye ek guzar mein groups ban jate hain.
  const groups = [];
  bookmarks.forEach((bookmark) => {
    const key = dayKey(bookmark.session.date);
    const last = groups[groups.length - 1];

    if (last && last.key === key) last.items.push(bookmark);
    else groups.push({ key, date: bookmark.session.date, items: [bookmark] });
  });

  // Yehi is page ka asal faida. Schedule par takraav ek ittila thi; yahan wo
  // faisla hai — ye dono maine khud chune hain, aur dono mein ja nahi sakta.
  const clashIds = new Set();
  groups.forEach((group) => {
    const live = group.items
      .map((item) => item.session)
      .filter((session) => session.status !== "Cancelled");

    live.forEach((session, index) => {
      live.slice(index + 1).forEach((other) => {
        if (overlaps(session, other)) {
          clashIds.add(session._id);
          clashIds.add(other._id);
        }
      });
    });
  });

  if (isLoading) {
    return (
      <div className="sched">
        <h1 className="attendee-title">Saved sessions</h1>
        <p className="admin-state-text">Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="sched">
        <h1 className="attendee-title">Saved sessions</h1>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="sched">
      <h1 className="attendee-title">Saved sessions</h1>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {bookmarks.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-empty">
            <p>Nothing saved yet.</p>
            <p className="admin-empty-sub">
              <Link to="/attendee/sessions" className="admin-link">
                Open the schedule
              </Link>{" "}
              and hit Save on the talks you want to catch.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="saved-summary">
            {bookmarks.length} session{bookmarks.length > 1 ? "s" : ""} saved
            {clashIds.size > 0 && (
              <span className="saved-summary-clash">
                {" "}
                · {clashIds.size} run at the same time as another
              </span>
            )}
          </p>

          {clashIds.size > 0 && (
            <p className="sched-note sched-note-clash">
              You can't be in two halls at once. Drop one from each marked pair before the day
              starts, so your plan matches what you can actually do.
            </p>
          )}

          {groups.map((group) => (
            <section key={group.key} className="sched-day">
              <div className="sched-day-head">
                <h2 className="sched-day-date">{formatDayHeading(group.date)}</h2>
                <span className="sched-day-count">
                  {group.items.length} saved
                </span>
              </div>

              <ul className="sched-list">
                {group.items.map((bookmark) => {
                  const session = bookmark.session;
                  const isCancelled = session.status === "Cancelled";
                  const hasClash = clashIds.has(session._id);
                  const isRemoving = removingId === bookmark._id;

                  return (
                    <li
                      key={bookmark._id}
                      className="sess"
                      data-status={session.status}
                      data-clash={hasClash ? "true" : "false"}
                    >
                      <div className="sess-time">
                        <span className="sess-start">{session.startTime}</span>
                        <span className="sess-end">{session.endTime}</span>
                      </div>

                      <div className="sess-body">
                        {/* Saved list ek se zyada expo ki sessions rakh sakti
                            hai, is liye expo ka naam yahan zaroori hai —
                            Schedule page par nahi tha, kyunki wahan expo ooper
                            dropdown mein hi chuna hota hai. */}
                        <p className="saved-expo">{session.event?.title || "Expo removed"}</p>

                        <div className="sess-head">
                          <h3 className="sess-title">{session.title}</h3>
                          <span className="sess-tag">{session.type}</span>

                          <button
                            type="button"
                            className="saved-remove"
                            onClick={() => handleRemove(bookmark)}
                            disabled={isRemoving}
                          >
                            {isRemoving ? "..." : "Remove"}
                          </button>
                        </div>

                        {session.speaker && (
                          <p className="sess-speaker">
                            {session.speaker.name}
                            {session.speaker.designation && `, ${session.speaker.designation}`}
                            {session.speaker.company && ` · ${session.speaker.company}`}
                          </p>
                        )}

                        <p className="sess-meta">
                          {session.hall || "Hall to be announced"}
                        </p>

                        {/* Session save karne ke baad cancel bhi ho sakta hai —
                            server sirf naya save rokta hai, purane ko nahi
                            chherta. Is liye ye haalat yahan aa sakti hai. */}
                        {isCancelled && (
                          <p className="sess-flag">Cancelled by the organizer — safe to remove</p>
                        )}
                        {!isCancelled && hasClash && (
                          <p className="sess-flag sess-flag-clash">
                            Clashes with another saved session
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

export default Bookmarks;