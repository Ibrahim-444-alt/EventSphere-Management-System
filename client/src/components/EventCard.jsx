import { Link } from "react-router-dom";
import EventCoverArt from "./EventCoverArt";
import { formatDate } from "../utils/formatDate";
import "./EventCard.css";

function EventCard({ event }) {
  return (
    <div className="event-card">
      <div className="event-cover-wrap">
        <EventCoverArt theme={event.theme} uid={event._id} image={event.image} title={event.title} />
        <span className={`status-badge status-${event.status.toLowerCase()}`}>
          {event.status}
        </span>
      </div>

      <div className="event-card-body">
        {/* theme model mein optional hai. Khaali tag ek soona sa faasla chhor
            deta, is liye na ho to poora element hi nahi banate. */}
        {event.theme && <p className="event-theme-tag">{event.theme}</p>}
        <h3>{event.title}</h3>
        <p className="event-meta">
          {formatDate(event.date)} · {event.location}
        </p>
        <p className="event-description">{event.description}</p>
        <Link to={`/events/${event._id}`} className="event-card-link">
          View Details <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

export default EventCard;