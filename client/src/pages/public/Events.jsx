import { useState, useEffect } from "react";
import EventCard from "../../components/EventCard";
import { getEvents } from "../../services/eventService";
import "./Events.css";

// "Draft" is list mein jaan bujh kar nahi hai — server wo public ko bhejta hi
// nahi, to option rakhne se sirf hamesha khaali nateeja milta.
// "Cancelled" rakha hai: banda ko ye janna haq hai ke expo mansookh ho gaya.
const STATUS_OPTIONS = ["All", "Upcoming", "Ongoing", "Completed", "Cancelled"];

function Events() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  // Poori list ek hi baar mangwa rahe hain, phir search aur filter browser
  // mein. Server par filter karna bhi mumkin tha (?search=&status=), magar
  // phir har harf par naya request jata — search sust mehsoos hoti aur server
  // par bojh barhta. Expo ki list choti hoti hai, ek request kaafi hai.
  useEffect(() => {
    getEvents()
      .then((data) => setEvents(data))
      .catch((err) =>
        setError(err.response?.data?.message || "Couldn't load events. Please try again.")
      )
      .finally(() => setIsLoading(false));
  }, []);

  const filteredEvents = events.filter((event) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      event.title.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query);
    const matchesStatus = status === "All" || event.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="events-page">
      <section className="events-header">
        <span className="hero-glow hero-glow-violet" aria-hidden="true"></span>
        <span className="hero-glow hero-glow-teal" aria-hidden="true"></span>

        <div className="events-header-content">
          <p className="events-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true"></span>
            Events
          </p>
          <h1>Browse upcoming events</h1>
          <p className="events-sub">Find an expo by name, location, or status.</p>

          <div className="events-controls">
            <div className="events-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="events-search"
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search events"
              />
            </div>
            <select
              className="events-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="events-results">
        {isLoading ? (
          <p className="events-count">Loading events...</p>
        ) : error ? (
          <div className="events-empty">
            <p>{error}</p>
            <p className="events-empty-sub">Check that the server is running, then refresh the page.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          // Do alag khaali soortein, do alag mashware. "Kuch publish nahi hua"
          // aur "tumhare filter ko kuch nahi mila" ek jaisi baat nahi hai —
          // dono par ek hi jumla likhna banda ko ghalat jagah dhakel deta hai.
          <div className="events-empty">
            <p>{events.length === 0 ? "No events published yet." : "No events found."}</p>
            <p className="events-empty-sub">
              {events.length === 0
                ? "Check back soon — new expos are added regularly."
                : "Try a different search term or status filter."}
            </p>
          </div>
        ) : (
          <>
            <p className="events-count">
              Showing {filteredEvents.length} of {events.length} events
            </p>
            <div className="events-grid">
              {filteredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Events;