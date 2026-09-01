import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/common/Modal";
import Pass, { printPass, formatDate, countdown, ticketCode } from "../../components/attendee/Pass";
import { getMyRegistrations, cancelMyRegistration } from "../../services/attendeeService";
import "./MyRegistrations.css";

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const railParts = (value) => {
  const date = new Date(value);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    year: date.getFullYear(),
  };
};

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);

  const [viewing, setViewing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let ignore = false;

    getMyRegistrations()
      .then((data) => {
        if (!ignore) setRegistrations(data);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Couldn't load your registrations.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      const updated = await cancelMyRegistration(confirming._id);

      setRegistrations((prev) =>
        prev.map((item) =>
          item._id === confirming._id
            ? // save() ka jawab populate nahi hota — us mein event sirf id hai.
              // Seedha spread karne se row ka title aur tareekh gayab ho jate,
              // is liye purana populated event wapas rakh dete hain.
              { ...item, ...updated, event: item.event }
            : item
        )
      );

      setNotice({ text: "Registration cancelled.", isError: false });
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Couldn't cancel this registration.",
        isError: true,
      });
    } finally {
      setIsCancelling(false);
      setConfirming(null);
    }
  };

  const today = startOfDay(new Date());

  // Do hisson mein baant kar jorte hain: aane wale pehle (qareeb tareen ooper),
  // guzre hue baad mein (naye tareen ooper). Ek hi sort() se ye nahi hota.
  const withEvent = registrations.filter((item) => item.event);
  const withoutEvent = registrations.filter((item) => !item.event);

  const ahead = withEvent
    .filter((item) => startOfDay(item.event.date) >= today)
    .sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

  const behind = withEvent
    .filter((item) => startOfDay(item.event.date) < today)
    .sort((a, b) => new Date(b.event.date) - new Date(a.event.date));

  const ordered = [...ahead, ...behind, ...withoutEvent];

  if (isLoading) {
    return (
      <div className="regs">
        <h1 className="attendee-title">Your registrations</h1>
        <p className="admin-state-text">Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="regs">
        <h1 className="attendee-title">Your registrations</h1>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="regs">
      <h1 className="attendee-title">Your registrations</h1>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {ordered.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-empty">
            <p>Nothing here yet.</p>
            <p className="admin-empty-sub">
              <Link to="/attendee/expos" className="admin-link">
                Browse expos
              </Link>{" "}
              to register for your first one.
            </p>
          </div>
        </div>
      ) : (
        <ul className="reg-list">
          {ordered.map((item) => {
            const isCancelled = item.status === "Cancelled";
            const isPast = item.event && startOfDay(item.event.date) < today;
            const rail = item.event ? railParts(item.event.date) : null;

            return (
              <li key={item._id} className="reg" data-state={item.status}>
                <div className="date-rail" aria-hidden="true">
                  <span className="date-rail-day">{rail ? rail.day : "—"}</span>
                  <span className="date-rail-month">{rail ? rail.month : ""}</span>
                  <span className="date-rail-year">{rail ? rail.year : ""}</span>
                </div>

                <div className="reg-body">
                  <span className="reg-state">
                    {isCancelled
                      ? "Cancelled"
                      : item.checkedIn
                        ? "Attended"
                        : item.event
                          ? countdown(item.event.date)
                          : "Expo removed"}
                  </span>
                  <h2 className="reg-title">
                    {item.event?.title || "Expo removed by organizer"}
                  </h2>
                  <p className="reg-sub">
                    {item.ticketType} · REG {ticketCode(item._id)}
                    {item.event && ` · ${formatDate(item.event.date)}`}
                  </p>
                </div>

                <div className="reg-actions">
                  {!isCancelled && item.event && (
                    <button
                      type="button"
                      className="admin-link"
                      onClick={() => setViewing(item)}
                    >
                      View pass
                    </button>
                  )}
                  {!isCancelled && !item.checkedIn && !isPast && (
                    <button
                      type="button"
                      className="admin-link admin-link-danger"
                      onClick={() => setConfirming(item)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pass modal ke andar hai, magar print CSS body ke har element ko chhupa
          kar sirf .pass ko dikhati hai — is liye overlay chhap nahi jata. */}
      <Modal
        isOpen={Boolean(viewing)}
        title={viewing?.event?.title || "Your pass"}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <>
            <Pass registration={viewing} />
            <div className="pass-actions">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => printPass(viewing)}
              >
                Print pass
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(confirming)}
        title="Cancel this registration?"
        onClose={() => setConfirming(null)}
      >
        {confirming && (
          <>
            <p className="reg-confirm">
              Your pass for <strong>{confirming.event?.title}</strong> stops working. You can
              register again later if seats are still open.
            </p>
            <div className="reg-confirm-actions">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Cancel registration"}
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() => setConfirming(null)}
                disabled={isCancelling}
              >
                Keep it
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default MyRegistrations;