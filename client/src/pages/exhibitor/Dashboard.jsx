import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMyApplications } from "../../services/exhibitorService";
import "./Dashboard.css";

// Status ko rang se jorne ke liye. Approved aur Active dono hara hain —
// Active ka matlab hai expo chal raha hai aur ye exhibitor floor par maujood
// hai, yani Approved se aage ka marhala, ulta nahi.
const STATUS_TONES = {
  Pending: "exhibitor-badge-pending",
  Approved: "exhibitor-badge-approved",
  Active: "exhibitor-badge-approved",
  Rejected: "exhibitor-badge-rejected",
  Inactive: "exhibitor-badge-muted",
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getMyApplications()
      .then((data) => {
        if (!ignore) setApplications(data);
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.response?.data?.message || "Failed to load your applications.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const approvedCount = applications.filter(
    (application) => application.status === "Approved" || application.status === "Active"
  ).length;

  const boothCount = applications.filter((application) => application.booth).length;

  return (
    <div className="exhibitor-dashboard">
      <div className="admin-page-header">
        <h1>My Dashboard</h1>
        <p>Your expo applications and booth assignments.</p>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading your applications...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-value">{applications.length}</p>
              <p className="admin-stat-label">Applications</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-value">{approvedCount}</p>
              <p className="admin-stat-label">Approved</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-value">{boothCount}</p>
              <p className="admin-stat-label">Booths Assigned</p>
            </div>
          </div>

          <div className="admin-panel">
            <h2>My Applications</h2>

            {applications.length === 0 ? (
              <div className="admin-empty">
                <p>You haven't applied to any expo yet.</p>
                                <p className="admin-empty-sub">
                  <Link to="/exhibitor/register-expo" className="admin-link">
                    Register for an expo
                  </Link>{" "}
                  to get started.
                </p>
              </div>
            ) : (
              <div className="exhibitor-app-list">
                {applications.map((application) => (
                  <div key={application._id} className="exhibitor-app-card">
                    <div className="exhibitor-app-head">
                      <div>
                        {/* Optional chaining zaroori hai: admin event delete kar
                            de to ye application reh jati hai aur populate()
                            null bhejta hai. Uske baghair yahan poora page
                            crash karta. */}
                        <h3>{application.event?.title || "This event was removed"}</h3>
                        <p className="admin-table-muted">
                          {formatDate(application.event?.date)} ·{" "}
                          {application.event?.location || "—"}
                        </p>
                      </div>
                      <span
                        className={`admin-badge ${
                          STATUS_TONES[application.status] || "exhibitor-badge-muted"
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>

                    <dl className="exhibitor-app-meta">
                      <div>
                        <dt>Company</dt>
                        <dd>{application.companyName}</dd>
                      </div>
                      <div>
                        <dt>Booth</dt>
                        <dd>
                          {application.booth
                            ? `${application.booth.boothNumber}${
                                application.booth.size ? ` · ${application.booth.size}` : ""
                              }`
                            : "Not assigned yet"}
                        </dd>
                      </div>
                      <div>
                        <dt>Applied</dt>
                        <dd>{formatDate(application.createdAt)}</dd>
                      </div>
                    </dl>

                    {application.status === "Pending" && (
                      <p className="exhibitor-app-note">
                        Waiting for the organizer to review your application.
                      </p>
                    )}

                    {application.status === "Rejected" && (
                      <p className="exhibitor-app-note exhibitor-app-note-danger">
                        This application was not accepted for this expo.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;