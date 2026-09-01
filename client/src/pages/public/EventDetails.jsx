import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import EventCoverArt from "../../components/EventCoverArt";
import StarRating from "../../components/StarRating";
import Button from "../../components/common/Button";
import { getEvent } from "../../services/eventService";
import { getPublicFeedback } from "../../services/feedbackService";
import { formatDate } from "../../utils/formatDate";
import "../../components/EventCard.css"; // reuses .status-badge / .status-upcoming etc.
import "./EventDetails.css";

// Khaali shakal ek jagah likhi hai. Iske baghair har jagah reviews?.feedback
// aur reviews?.totalCount likhna parta, aur ek jagah bhoolne par page safed
// ho jata.
const EMPTY_REVIEWS = { averageRating: 0, totalCount: 0, commentTotal: 0, feedback: [] };

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [reviews, setReviews] = useState(EMPTY_REVIEWS);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // `id` dependency mein hai: agar banda ek expo se doosre par jaye to URL
  // badalta hai magar component wohi rehta hai. Bina is dependency ke naya
  // data kabhi mangwaya hi na jata aur purana expo chipka reh jata.
  useEffect(() => {
    setIsLoading(true);
    getEvent(id)
      .then((data) => setEvent(data))
      .catch(() => setEvent(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Reviews ki apni alag request hai, jaan boojh kar. Agar dono ek hi effect
  // mein hoti aur feedback ki call fail ho jati, to poora expo hi gayab ho
  // jata — jabke expo ki maloomat bilkul theek aa chuki hoti. Reviews ek
  // izafi cheez hai; us ka toot'na page ko nahi le kar doob'na chahiye.
  useEffect(() => {
    setReviewsLoading(true);
    getPublicFeedback({ event: id })
      .then((data) => setReviews(data))
      .catch(() => setReviews(EMPTY_REVIEWS))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="event-details-page">
        <p className="event-details-loading">Loading event...</p>
      </div>
    );
  }

  // Ek hi screen teen soorton ko dhaanp rahi hai: id ghalat, expo delete ho
  // gaya, ya expo abhi Draft hai. Server teenon par 404 deta hai, aur hum bhi
  // farq nahi kar rahe — jaan bujh kar. "Ye expo abhi publish nahi hua" keh
  // dena admin ke adhoore kaam ki khabar bahar pahuncha dena hai.
  if (!event) {
    return (
      <div className="event-details-page">
        <div className="event-not-found">
          <h1>Event not found</h1>
          <p>We couldn't find an event at that link. It may have been removed or the URL is incorrect.</p>
          <Link to="/events" className="home-link">← Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="event-details-page">
      <Link to="/events" className="event-back-link">← Back to Events</Link>

      <div className="event-details-cover">
        <EventCoverArt theme={event.theme} uid={`detail-${event._id}`} image={event.image} title={event.title} />
        <span className={`status-badge status-${event.status.toLowerCase()}`}>
          {event.status}
        </span>
      </div>

      <div className="event-details-body">
        {event.theme && <p className="event-theme-tag">{event.theme}</p>}
        <h1>{event.title}</h1>

        {/* Purana sample data mein `about` naam ka ek lamba field tha jo asli
            Event model mein mojood hi nahi. Ek hi `description` hai, aur wohi
            sach hai — dobara koi field banane se behtar hai isi ko dikhana. */}
        <p className="event-details-about">{event.description}</p>

        <div className="event-info-card">
          <div className="event-info-row">
            <span className="event-info-label">Date</span>
            <span className="event-info-value">{formatDate(event.date)}</span>
          </div>
          <div className="event-info-row">
            <span className="event-info-label">Time</span>
            <span className="event-info-value">{event.startTime} – {event.endTime}</span>
          </div>
          <div className="event-info-row">
            <span className="event-info-label">Location</span>
            <span className="event-info-value">{event.location}</span>
          </div>
          <div className="event-info-row">
            <span className="event-info-label">Registration deadline</span>
            <span className="event-info-value">{formatDate(event.registrationDeadline)}</span>
          </div>
        </div>

        <div className="event-details-cta">
          <Button to="/register">Register for this Event</Button>
          <Button to="/events" variant="outline">Browse Other Events</Button>
        </div>

        <section className="event-reviews">
          <div className="event-reviews-head">
            <h2>What attendees said</h2>

            {reviews.totalCount > 0 && (
              <div className="event-reviews-score">
                <span className="event-reviews-average">{reviews.averageRating}</span>
                <span className="event-reviews-outof">/ 5</span>
                <StarRating
                  value={reviews.averageRating}
                  label={`Average rating ${reviews.averageRating} out of 5`}
                />
                <span className="event-reviews-count">
                  {reviews.totalCount} {reviews.totalCount === 1 ? "rating" : "ratings"}
                </span>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <p className="event-reviews-empty">Loading feedback...</p>
          ) : reviews.totalCount === 0 ? (
            <p className="event-reviews-empty">
              No feedback for this event yet. If you attended, we'd like to hear from you.
            </p>
          ) : reviews.feedback.length === 0 ? (
            // Ye teesri soorat hai aur ye likhna zaroori hai. Log ne sitare
            // diye magar likha kuch nahi. Bina is soorat ke page ooper
            // "3 ratings" dikhata aur neeche bilkul khaali hota — aur dekhne
            // wala samajhta ke site toot gayi hai.
            <p className="event-reviews-empty">
              {reviews.totalCount} {reviews.totalCount === 1 ? "person has" : "people have"} rated
              this event, but nobody has left a written review yet.
            </p>
          ) : (
            <div className="review-list">
              {reviews.feedback.map((item) => (
                <article key={item._id} className="review-card">
                  <div className="review-card-head">
                    <StarRating value={item.rating} />
                    {/* "Overall" default hai — use badge par likhna koi
                        maloomat nahi barhata, sirf shor barhata hai. */}
                    {item.category && item.category !== "Overall" && (
                      <span className="review-category">{item.category}</span>
                    )}
                  </div>
                  <p className="review-comment">{item.comment}</p>
                  <p className="review-meta">
                    {item.name} · {formatDate(item.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default EventDetails;