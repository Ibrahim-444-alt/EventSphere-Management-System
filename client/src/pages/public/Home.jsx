import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import EventCard from "../../components/EventCard";
import RoleIcon from "../../components/RoleIcon";
import { getEvents } from "../../services/eventService";
import StarRating from "../../components/StarRating";
import { getPublicFeedback } from "../../services/feedbackService";
import { getPublicStats } from "../../services/analyticsService";

import "./Home.css";


// Is array mein ab sirf wo cheezein hain jo server nahi de sakta: icon ki shakal
// aur label ka English. Asli ginti `key` ke zariye server ke jawab se milti hai.
//
// Pehle yahan "120+", "3,400+", "85,000+" aur "12" likha hua tha. Wo kisi
// database se nahi aaye thay — hum ne khud likh diye thay.
const STAT_CARDS = [
  {
    key: "events",
    // "Events hosted" nahi likha, kyunke ginti mein Upcoming expos bhi hain jo
    // abhi hue hi nahi. Label ko us se zyada dawa nahi karna chahiye jitna
    // query asal mein ginti hai.
    label: "Expos listed",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
      </>
    ),
  },
  {
    key: "exhibitors",
    label: "Exhibitors",
    icon: (
      <>
        <path d="M4 9l1.4-5h13.2L20 9" />
        <path d="M4 9v10h16V9" />
        <path d="M9.5 19v-6h5v6" />
      </>
    ),
  },
  {
    key: "attendees",
    label: "Attendees registered",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" />
        <circle cx="17.5" cy="8.5" r="2.3" />
        <path d="M16 19c.2-2.2 1.7-4 3.6-4.6" />
      </>
    ),
  },
  {
    key: "venues",
    // "Cities" nahi. Event model mein `location` shehar nahi, jagah ka naam
    // rakhta hai ("Expo Centre Karachi"). Un ko shehar keh kar ginna ek naya
    // banaya hua number hota — yaani wohi kaam jo hum yahan se hata rahe hain.
    label: "Venues",
    icon: (
      <>
        <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.4" />
      </>
    ),
  },
];

const STEPS = [
  { number: "01", title: "Create your event", text: "Organizers set the dates, define booths, and open exhibitor applications." },
  { number: "02", title: "Exhibitors get booths", text: "Companies apply, get approved, and reserve their space on the floor plan." },
  { number: "03", title: "Attendees explore", text: "Visitors browse the event, bookmark sessions, and find exhibitors by category." },
];

const EXHIBITORS = ["NovaWorks", "Ferrotech Industries", "BrightLeaf Foods", "Solstice Energy", "Meridian Robotics", "Cobalt Health"];

const BENEFITS = [
  { role: "Organizers", title: "Run the whole expo from one dashboard", text: "Booths, schedules, approvals, and analytics, without switching tools." },
  { role: "Exhibitors", title: "Get discovered on the floor", text: "Apply, reserve a booth, and manage your listing without emailing anyone." },
  { role: "Attendees", title: "Never miss a session", text: "Browse exhibitors, bookmark talks, and find your way around the floor plan." },
];



const FLOOR_CELLS = [
  { id: "A1", status: "occupied" }, { id: "A2", status: "available" },
  { id: "A3", status: "reserved" }, { id: "A4", status: "available" },
  { id: "B1", status: "reserved" }, { id: "B2", status: "occupied" },
  { id: "B3", status: "available" }, { id: "B4", status: "available" },
];

function Home() {
  const [upcoming, setUpcoming] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);

  // Filter server par karwa rahe hain (status=Upcoming), poori list mangwa kar
  // browser mein chhaanne ke bajaye — Home par teen cards se zyada jagah hi
  // nahi, to baqi data laana fizool network kharch hai.
  //
  // catch khaali hai, jaan bujh kar. Home ka asal maqsad EventSphere ka
  // taaruf hai. Events na aa sakein to poora page error se bhar dena ghalat
  // hoga — bas ye section chup chaap ghayab ho jayega.
  useEffect(() => {
    getEvents({ status: "Upcoming" })
      .then((data) => setUpcoming(data.slice(0, 3)))
      .catch(() => setUpcoming([]));
  }, []);

  useEffect(() => {
    getPublicStats()
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

   const showStat = (key) =>
    typeof stats?.[key] === "number" ? stats[key].toLocaleString("en-US") : "—";

  useEffect(() => {
    getPublicFeedback({ limit: 3 })
      // `|| []` zaroori hai. Agar kabhi API ki shakal badle aur `feedback`
      // undefined aaye, to neeche .map() poora page gira deta.
      .then((data) => setReviews(data.feedback || []))
      .catch(() => setReviews([]));
  }, []);

  return (
    <div className="home">
      <section className="home-hero">
        <span className="hero-glow hero-glow-violet" aria-hidden="true"></span>
        <span className="hero-glow hero-glow-teal" aria-hidden="true"></span>

        <div className="hero-content">
          <p className="home-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true"></span>
            Event &amp; Expo Management
          </p>
          <h1>
            Run your next expo <span className="text-gradient">without the spreadsheets</span>.
          </h1>
          <p className="home-hero-sub">
            EventSphere brings organizers, exhibitors, and attendees onto one
            platform, from booth applications to session bookmarks.
          </p>
          <div className="home-hero-cta">
            <Button to="/events" variant="outline">Browse Events</Button>
            <Button to="/register">Get Started</Button>
          </div>

          <div className="floor-preview">
            <div className="mockup-card">
              <div className="mockup-header">
                <span className="mockup-dot"></span>
                <span className="mockup-dot"></span>
                <span className="mockup-dot"></span>
                <span className="mockup-title">Floor Plan — Hall A</span>
              </div>
              <div className="mockup-body">
                <div className="floor-grid">
                  {FLOOR_CELLS.map((cell) => (
                    <div key={cell.id} className={`floor-cell floor-cell-${cell.status}`}>
                      {cell.id}
                    </div>
                  ))}
                </div>
                <div className="floor-legend">
                  <span><i className="dot dot-available"></i>Available</span>
                  <span><i className="dot dot-reserved"></i>Reserved</span>
                  <span><i className="dot dot-occupied"></i>Occupied</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

            <section className="home-stats">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="stat-item">
            <span className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {card.icon}
              </svg>
            </span>
            <span className="stat-value">{showStat(card.key)}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </section>

      <section className="home-section">
        <h2>How EventSphere works</h2>
        <div className="steps">
          {STEPS.map((step) => (
            <div key={step.number} className="step">
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

            {upcoming.length > 0 && (
        <section className="home-section">
          <h2>Upcoming events</h2>
          <div className="event-cards">
            {upcoming.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
          <Link to="/events" className="home-link">View all events →</Link>
        </section>
      )}

      <section className="home-section">
        <h2>Featured exhibitors</h2>
        <div className="exhibitor-grid">
          {EXHIBITORS.map((name) => (
            <div key={name} className="exhibitor-badge">
              <span className="exhibitor-initial">{name.charAt(0)}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Built for everyone on the floor</h2>
        <div className="benefit-cards">
          {BENEFITS.map((benefit) => (
            <div key={benefit.role} className="benefit-card">
              <RoleIcon role={benefit.role} />
              <p className="benefit-role">{benefit.role}</p>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>

            {/* Ye section ab shart ke peeche hai, bilkul "Upcoming events" ki tarah.
          Pehle yahan teen farzi jumle chipke hue thay jo hamesha nazar aate
          thay. Ab jab tak kisi ne asal mein kuch likha na ho, section mojood hi
          nahi hota — khaali headings se behtar hai koi heading na ho. */}
      {reviews.length > 0 && (
        <section className="home-section">
          <h2>What people are saying</h2>
          <div className="testimonials">
            {reviews.map((item) => (
              <div key={item._id} className="testimonial-card">
                <div className="testimonial-card-top">
                  <span className="testimonial-quote-mark" aria-hidden="true">“</span>
                  <StarRating value={item.rating} />
                </div>
                <p className="testimonial-quote">{item.comment}</p>
                <div className="testimonial-footer">
                  <span className="testimonial-avatar">
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="testimonial-name">{item.name}</p>
                   
                    <p className="testimonial-role">{item.event?.title || "EventSphere"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="home-cta">
        <span className="hero-glow hero-glow-violet" aria-hidden="true"></span>
        <div className="home-cta-content">
          <h2>Ready to run your next expo?</h2>
          <p>It only takes a few minutes to get your event set up.</p>
          <div className="home-hero-cta">
            <Button to="/events" variant="outline">Browse Events</Button>
            <Button to="/register">Get Started</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;