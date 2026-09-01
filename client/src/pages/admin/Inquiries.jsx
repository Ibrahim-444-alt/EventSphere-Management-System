import { useState, useEffect } from "react";
import {
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} from "../../services/contactService";
import { formatDateTime } from "../../utils/formatDate";
import "./Inquiries.css";

// Server/models/ContactMessage.js ke enums se milte hain. Agar wahan koi nayi
// value daalein to yahan bhi daalni paregi — warna wo paighaam kisi filter mein
// nazar nahi aayenge aur banda samjhega ke gum ho gaye.
const STATUS_FILTER_OPTIONS = ["All", "New", "Read", "Archived"];
const SUBJECTS = ["General Inquiry", "Booth Application", "Technical Support", "Partnership"];

function Inquiries() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");

  const [busyId, setBusyId] = useState(null);

  // Sab paighaam ek hi baar le aate hain aur chhanni browser mein lagti hai.
  // Server par `?status=` aur `?search=` mojood hain, magar unhein istemaal
  // karne ka matlab hota har harf par ek request. Inbox ka size sau-do sau se
  // ooper nahi jata, is liye ek request behtar sauda hai — aur search foran
  // chalta hai, bina intezaar.
  useEffect(() => {
    getContactMessages()
      .then((data) => setMessages(data))
      .catch(() => setError("Failed to load inquiries."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleStatusChange = async (item, status) => {
    setBusyId(item._id);
    try {
      const updated = await updateContactMessageStatus(item._id, status);

      // Poora object badal rahe hain, sirf status nahi. Ye is liye mehfooz hai
      // ke controller save() ke baad `user` ko dobara populate karta hai. Agar
      // wo populate na hota to `updated.user` khaali id hoti aur card se
      // account ka naam gayab ho jata — bilkul wohi bug jo MyRegistrations par
      // pakra tha.
      setMessages((prev) => prev.map((m) => (m._id === item._id ? updated : m)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update the inquiry.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete the message from ${item.name}? Archiving keeps the record — deleting doesn't.`
    );
    if (!confirmed) return;

    setBusyId(item._id);
    try {
      await deleteContactMessage(item._id);
      setMessages((prev) => prev.filter((m) => m._id !== item._id));
    } catch {
      alert("Failed to delete the inquiry. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // Ginti poori list par hoti hai, filter par nahi. Wajah: "3 New" ka maqsad
  // batana hai ke kitna kaam bacha hai. Agar ye filter ke sath sikurti, to
  // Archived filter lagate hi "0 New" dikhta aur banda samajhta ke kaam khatam.
  const newCount = messages.filter((m) => m.status === "New").length;
  const archivedCount = messages.filter((m) => m.status === "Archived").length;

  const filteredMessages = messages.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesSubject = subjectFilter === "All" || item.subject === subjectFilter;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  return (
    <div className="inquiries-page">
      <div className="admin-page-header">
        <h1>Inquiries</h1>
        <p>Messages sent through the public contact form.</p>
      </div>

      {!isLoading && !error && messages.length > 0 && (
        <div className="admin-stats-grid inquiries-summary">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{messages.length}</span>
            <span className="admin-stat-label">Total Messages</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{newCount}</span>
            <span className="admin-stat-label">Awaiting Reply</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{archivedCount}</span>
            <span className="admin-stat-label">Archived</span>
          </div>
        </div>
      )}

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search names, emails and messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All statuses" : option}
            </option>
          ))}
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="admin-select"
        >
          <option value="All">All subjects</option>
          {SUBJECTS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="admin-state-text">Loading inquiries...</p>
      ) : error ? (
        <p className="admin-state-text admin-state-error">{error}</p>
      ) : filteredMessages.length === 0 ? (
        <div className="admin-empty">
          <p>No inquiries found.</p>
          {/* Do bilkul mukhtalif soortein, do mukhtalif mashware. "Inbox khaali
              hai" aur "tumhare filter se kuch match nahi hua" — inhein ek
              jumle mein milana banda ko chakkar mein daal deta hai. */}
          <p className="admin-empty-sub">
            {messages.length === 0
              ? "When someone fills in the contact form, their message lands here."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="inquiries-list">
          {filteredMessages.map((item) => (
            <article
              key={item._id}
              className={`inquiry-card inquiry-card-${item.status.toLowerCase()}`}
            >
              <div className="inquiry-card-top">
                <div className="inquiry-who">
                  <span className="inquiry-name">{item.name}</span>
                  <a className="inquiry-email" href={`mailto:${item.email}`}>
                    {item.email}
                  </a>
                </div>

                <div className="inquiry-badges">
                  <span className="admin-badge inquiry-subject">{item.subject}</span>
                  {item.status === "New" && (
                    <span className="admin-badge inquiry-status-new">New</span>
                  )}
                  {item.status === "Archived" && (
                    <span className="admin-badge inquiry-status-archived">Archived</span>
                  )}
                </div>
              </div>

              <p className="inquiry-meta">
                {formatDateTime(item.createdAt)}
                {/* optionalAuth ka poora faida yahin nazar aata hai: admin ko
                    pata chal jata hai ke ye anjaan nahi, hamara registered
                    banda hai — aur kaun sa role hai. */}
                {item.user ? (
                  <span className="inquiry-account">
                    {" · "}account: {item.user.name} ({item.user.role})
                  </span>
                ) : (
                  <span className="inquiry-anon">{" · "}not logged in</span>
                )}
              </p>

              <p className="inquiry-message">{item.message}</p>

              <div className="inquiry-card-actions">
                {/* Reply sirf mail client kholta hai, aur status ko nahi
                    chhoota. Jaan-boojh kar: browser hamein bata hi nahi sakta
                    ke mail client khula ya nahi, ya paighaam gaya ya nahi. Us
                    par "Read" laga dena andaza hota — aur is poore feature ka
                    maqsad hi ye tha ke UI jhoot na bole. Read ka nishan admin
                    khud lagata hai. */}
                <a
                  className="admin-link"
                  href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`}
                >
                  Reply
                </a>

                {item.status === "New" && (
                  <button
                    type="button"
                    className="admin-link"
                    disabled={busyId === item._id}
                    onClick={() => handleStatusChange(item, "Read")}
                  >
                    Mark as read
                  </button>
                )}

                {item.status === "Read" && (
                  <button
                    type="button"
                    className="admin-link"
                    disabled={busyId === item._id}
                    onClick={() => handleStatusChange(item, "New")}
                  >
                    Mark as unread
                  </button>
                )}

                {item.status === "Archived" ? (
                  <button
                    type="button"
                    className="admin-link"
                    disabled={busyId === item._id}
                    onClick={() => handleStatusChange(item, "Read")}
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-link"
                    disabled={busyId === item._id}
                    onClick={() => handleStatusChange(item, "Archived")}
                  >
                    Archive
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
    </div>
  );
}

export default Inquiries;