import { useState, useEffect } from "react";
import { getExhibitors, approveExhibitor, rejectExhibitor } from "../../services/exhibitorService";
import "./ExhibitorManagement.css";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected", "Active", "Inactive"];

function ExhibitorManagement() {
  const [exhibitors, setExhibitors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    getExhibitors()
      .then((data) => setExhibitors(data))
      .catch(() => setError("Failed to load exhibitors."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      const updated = await approveExhibitor(id);
      setExhibitors((prev) => prev.map((ex) => (ex._id === id ? { ...ex, status: updated.status } : ex)));
    } catch {
      alert("Failed to approve. Please try again.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    const confirmed = window.confirm("Reject this application?");
    if (!confirmed) return;

    setActioningId(id);
    try {
      const updated = await rejectExhibitor(id);
      setExhibitors((prev) => prev.map((ex) => (ex._id === id ? { ...ex, status: updated.status } : ex)));
    } catch {
      alert("Failed to reject. Please try again.");
    } finally {
      setActioningId(null);
    }
  };

  const filteredExhibitors = exhibitors.filter((ex) => {
    const query = search.toLowerCase();
    const matchesSearch = ex.companyName.toLowerCase().includes(query);
    const matchesStatus = status === "All" || ex.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="exhibitor-management">
      <div className="admin-page-header">
        <h1>Exhibitors</h1>
        <p>Review applications and manage exhibitor status.</p>
      </div>

      <div className="admin-filters">
        <input type="text" placeholder="Search by company name..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-search" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading exhibitors...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : filteredExhibitors.length === 0 ? (
        <div className="admin-empty">
          <p>No exhibitors found.</p>
          <p className="admin-empty-sub">{exhibitors.length === 0 ? "Applications will show up here once exhibitors apply." : "Try a different search or filter."}</p>
        </div>
      ) : (
        <div className="admin-panel">
          <table className="admin-table">
            <thead><tr><th>Company</th><th>Contact</th><th>Event</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredExhibitors.map((ex) => (
                <tr key={ex._id}>
                  <td>{ex.companyName}</td>
                  <td>{ex.contactPerson}</td>
                  <td>{ex.event?.title || "—"}</td>
                  <td><span className={`admin-badge admin-status-${ex.status.toLowerCase()}`}>{ex.status}</span></td>
                  <td className="admin-table-actions">
                    {ex.status === "Pending" ? (
                      <>
                        <button type="button" className="admin-approve-btn" disabled={actioningId === ex._id} onClick={() => handleApprove(ex._id)}>Approve</button>
                        <button type="button" className="admin-reject-btn" disabled={actioningId === ex._id} onClick={() => handleReject(ex._id)}>Reject</button>
                      </>
                    ) : (
                      <span className="admin-table-muted">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExhibitorManagement;