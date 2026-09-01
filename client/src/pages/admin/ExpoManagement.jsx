import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, deleteEvent } from "../../services/eventService";
import "./ExpoManagement.css";

const STATUS_OPTIONS = ["All", "Draft", "Upcoming", "Ongoing", "Completed", "Cancelled"];

function ExpoManagement() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(data))
      .catch(() => setError("Failed to load events."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Delete "${title}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((event) => event._id !== id));
    } catch {
      alert("Failed to delete the event. Please try again.");
    }
  };

  const filteredEvents = events.filter((event) => {
    const query = search.toLowerCase();
    const matchesSearch = event.title.toLowerCase().includes(query) || event.location.toLowerCase().includes(query);
    const matchesStatus = status === "All" || event.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="expo-management">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <h1>Events</h1>
          <p>Create and manage every expo on the platform.</p>
        </div>
        <Link to="/admin/events/create" className="admin-btn admin-btn-primary">+ Create Event</Link>
      </div>

      <div className="admin-filters">
        <input type="text" placeholder="Search by name or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-search" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading events...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : filteredEvents.length === 0 ? (
        <div className="admin-empty">
          <p>No events found.</p>
          <p className="admin-empty-sub">{events.length === 0 ? "Create your first event to get started." : "Try a different search or filter."}</p>
        </div>
      ) : (
        <div className="admin-panel">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{new Date(event.date).toLocaleDateString()}</td>
                  <td>{event.location}</td>
                  <td><span className={`admin-badge admin-status-${event.status.toLowerCase()}`}>{event.status}</span></td>
                  <td className="admin-table-actions">
                    <Link to={`/admin/events/edit/${event._id}`} className="admin-link">Edit</Link>
                    <button type="button" className="admin-link admin-link-danger" onClick={() => handleDelete(event._id, event.title)}>Delete</button>
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

export default ExpoManagement;