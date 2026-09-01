import Button from "../../components/common/Button";
import RoleIcon from "../../components/RoleIcon";
import "./About.css";

const PROBLEMS = [
  { before: "Attendees register on paper forms or scattered spreadsheets.", after: "Attendees and exhibitors register online in one place." },
  { before: "Booth allocation happens over email, with no live view of what's free.", after: "A visual floor plan shows booth availability in real time." },
  { before: "Organizers, exhibitors, and attendees communicate through separate channels.", after: "Everyone works from the same platform, not scattered group chats." },
  { before: "Reports are stitched together by hand after the event ends.", after: "Registration, booth, and session data roll up automatically." },
];

const ROLES = [
  { role: "Organizers", capabilities: ["Create and manage events", "Approve or reject exhibitor applications", "Assign and track booths", "Build the session schedule", "View analytics and reports"] },
  { role: "Exhibitors", capabilities: ["Apply to expos and upload documents", "Select or request a booth", "Manage a company profile and products", "Add staff to the booth", "Message organizers directly"] },
  { role: "Attendees", capabilities: ["Browse events and exhibitors", "Register for events and sessions", "Search exhibitors by category", "Bookmark sessions", "Leave feedback after the event"] },
];

function About() {
  return (
    <div className="about">
      <section className="about-hero">
        <span className="hero-glow hero-glow-violet" aria-hidden="true"></span>
        <span className="hero-glow hero-glow-teal" aria-hidden="true"></span>

        <div className="about-hero-content">
          <p className="about-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true"></span>
            About EventSphere
          </p>
          <h1>
            Expo management shouldn't run on <span className="text-gradient">spreadsheets and group chats</span>.
          </h1>
          <p className="about-hero-sub">
            EventSphere replaces the shared spreadsheets, scattered emails, and
            last-minute booth swaps with one platform for organizers,
            exhibitors, and attendees.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>What changes with EventSphere</h2>
        <div className="problem-list">
          {PROBLEMS.map((item) => (
            <div key={item.after} className="problem-row">
              <div className="problem-side problem-before">
                <span className="problem-badge problem-badge-before" aria-hidden="true">✕</span>
                <p>{item.before}</p>
              </div>
              <span className="problem-arrow" aria-hidden="true">→</span>
              <div className="problem-side problem-after">
                <span className="problem-badge problem-badge-after" aria-hidden="true">✓</span>
                <p>{item.after}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2>Built for three kinds of users</h2>
        <div className="role-cards">
          {ROLES.map((r) => (
            <div key={r.role} className="role-card">
              <RoleIcon role={r.role} />
              <h3>{r.role}</h3>
              <ul>
                {r.capabilities.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <span className="hero-glow hero-glow-violet" aria-hidden="true"></span>
        <div className="about-cta-content">
          <h2>Ready to see it in action?</h2>
          <p>Browse a live event or create your account to get started.</p>
          <div className="about-cta-buttons">
            <Button to="/events" variant="outline">Browse Events</Button>
            <Button to="/register">Get Started</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;