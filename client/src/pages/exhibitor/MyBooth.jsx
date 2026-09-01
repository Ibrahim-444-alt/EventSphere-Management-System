import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "../../services/exhibitorService";
import { getBooths } from "../../services/boothService";
import "./MyBooth.css";

const APPLICATION_TONES = {
  Pending: "amber",
  Approved: "green",
  Active: "green",
  Rejected: "red",
  Inactive: "muted",
};

// Booth ke apne status ke rang. Ye admin ke Floor Plan waale hi hain, taake
// exhibitor aur organizer ek hi zubaan mein baat karein.
const BOOTH_STATUSES = ["Available", "Reserved", "Occupied", "Pending", "Maintenance"];

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function MyBooth() {
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [booths, setBooths] = useState([]);
  const [isBoothsLoading, setIsBoothsLoading] = useState(false);
  const [boothsError, setBoothsError] = useState("");

  useEffect(() => {
    let ignore = false;

    getMyApplications()
      .then((data) => {
        if (ignore) return;
        setApplications(data);
        if (data.length > 0) setSelectedId(data[0]._id);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Failed to load your applications.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selected = applications.find((application) => application._id === selectedId);
  // Dependency ke taur par poora object dena theek nahi — har render par naya
  // reference banta aur effect baar baar chalta. Sirf id par nazar rakhte hain.
  const eventId = selected?.event?._id || "";

  useEffect(() => {
    if (!eventId) {
      setBooths([]);
      return;
    }

    let ignore = false;
    setIsBoothsLoading(true);
    setBoothsError("");

    getBooths({ event: eventId })
      .then((data) => {
        if (!ignore) setBooths(data);
      })
      .catch(() => {
        if (!ignore) setBoothsError("Couldn't load the floor for this expo.");
      })
      .finally(() => {
        if (!ignore) setIsBoothsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [eventId]);

  // Rishta dono taraf likha jata hai: booth.exhibitor aur exhibitor.booth.
  // assignBooth dono ko sath badalta hai, magar agar kabhi ek taraf reh jaye to
  // ye OR page ko khali dikhne se bacha leta hai.
  const isMine = (booth) =>
    Boolean(selected) &&
    (booth.exhibitor?._id === selected._id || booth._id === selected.booth?._id);

  // Pehli tarjeeh application ke apne populated booth ko, kyunki wo foran
  // mil jata hai. Floor ki list baad mein aati hai — wo sirf sahara hai.
  const myBooth = selected?.booth || booths.find(isMine) || null;

  if (isLoading) {
    return (
      <div className="mybooth">
        <div className="admin-page-header">
          <h1>My Booth</h1>
        </div>
        <p className="admin-state-text">Loading your booth...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mybooth">
        <div className="admin-page-header">
          <h1>My Booth</h1>
        </div>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="mybooth">
        <div className="admin-page-header">
          <h1>My Booth</h1>
        </div>
        <div className="admin-panel">
          <div className="admin-empty">
            <p>No booth yet — you haven't applied to an expo.</p>
            <p className="admin-empty-sub">
              <Link to="/exhibitor/register-expo" className="admin-link">
                Register for an expo
              </Link>{" "}
              first. Booths are assigned by the organizer after approval.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mybooth">
      <div className="admin-page-header">
        <h1>My Booth</h1>
        <p>Booths are assigned by the organizer once your application is approved.</p>
      </div>

      {applications.length > 1 && (
        <div className="admin-panel">
          <label className="admin-form-field">
            <span>Expo</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="admin-select"
            >
              {applications.map((application) => (
                <option key={application._id} value={application._id}>
                  {application.event?.title || "Removed event"}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {selected && (
        <>
          <div className="admin-panel">
            <div className="mybooth-head">
              <div>
                <h2>{selected.event?.title || "This event was removed"}</h2>
                <p className="admin-table-muted">
                  {selected.event
                    ? `${formatDate(selected.event.date)} · ${selected.event.location}`
                    : "The organizer deleted this event."}
                </p>
              </div>
              <span
                className="mybooth-status"
                data-tone={APPLICATION_TONES[selected.status] || "muted"}
              >
                Application: {selected.status}
              </span>
            </div>
          </div>

          <div className="admin-panel">
            <h2>Booth Assignment</h2>

            {myBooth ? (
              <>
                <div className="mybooth-number">{myBooth.boothNumber}</div>
                <div className="mybooth-detail-grid">
                  <div className="mybooth-detail">
                    <span className="mybooth-label">Size</span>
                    <span className="mybooth-value">{myBooth.size || "Not specified"}</span>
                  </div>
                  <div className="mybooth-detail">
                    <span className="mybooth-label">Category</span>
                    <span className="mybooth-value">{myBooth.category || "Not specified"}</span>
                  </div>
                  <div className="mybooth-detail">
                    <span className="mybooth-label">Booth Status</span>
                    <span className="mybooth-value">{myBooth.status}</span>
                  </div>
                </div>
                <p className="admin-table-muted mybooth-note">
                  Need a different booth? Ask the organizer — only they can reassign it.
                </p>
              </>
            ) : (
              <div className="admin-empty">
                <p>No booth assigned yet.</p>
                <p className="admin-empty-sub">
                  {selected.status === "Pending" &&
                    "Your application is still under review. Booths are assigned after approval."}
                  {(selected.status === "Approved" || selected.status === "Active") &&
                    "You're approved — the organizer will assign your booth shortly."}
                  {selected.status === "Rejected" &&
                    "This application was rejected, so no booth will be assigned."}
                  {selected.status === "Inactive" &&
                    "This application is inactive. Contact the organizer if that's unexpected."}
                </p>
              </div>
            )}
          </div>

          <div className="admin-panel">
            <h2>Floor at a Glance</h2>

            {isBoothsLoading && <p className="admin-state-text">Loading floor...</p>}
            {boothsError && <p className="admin-state-text admin-state-error">{boothsError}</p>}

            {!isBoothsLoading && !boothsError && booths.length === 0 && (
              <p className="admin-table-muted">
                The organizer hasn't set up booths for this expo yet.
              </p>
            )}

            {!isBoothsLoading && !boothsError && booths.length > 0 && (
              <>
                <div className="mybooth-floor">
                  {booths.map((booth) => (
                    <div
                      key={booth._id}
                      className="mybooth-tile"
                      data-status={booth.status}
                      data-mine={isMine(booth) ? "true" : "false"}
                      // Doosre exhibitors ka naam sirf title mein — tiles par
                      // likhne se floor parhne ke qabil nahi rehta.
                      title={
                        isMine(booth)
                          ? "Your booth"
                          : `${booth.status}${booth.exhibitor ? ` · ${booth.exhibitor.companyName}` : ""}`
                      }
                    >
                      <span className="mybooth-tile-number">{booth.boothNumber}</span>
                      {isMine(booth) && <span className="mybooth-tile-tag">You</span>}
                    </div>
                  ))}
                </div>

                <div className="mybooth-legend">
                  {BOOTH_STATUSES.map((status) => (
                    <span key={status} className="mybooth-legend-item">
                      <span className="mybooth-dot" data-status={status} />
                      {status}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MyBooth;