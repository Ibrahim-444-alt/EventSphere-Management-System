import "./Pass.css";
// Print rules pass hi ka hissa hain. Yahan import karne se jahan bhi pass
// render hoga wahan print theek chalega — har page mein alag import nahi.
import "../../styles/print.css";

// Aaj ki tareekh raat 12 baje par — waqt sifar kar dena zaroori hai, warna
// "aaj shaam 6 baje" wala event kal ka lagne lagta hai.
const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Ye teen formatter pass ki apni zubaan hain — tareekh ki shakl, ginti ka
// jumla, aur chhapne wala code. Isi liye pass ke sath rehte hain, kisi aam
// utils file mein nahi.
export const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const countdown = (eventDate) => {
  const days = Math.round((startOfDay(eventDate) - startOfDay(new Date())) / DAY_MS);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  if (days === -1) return "Yesterday";
  return "Ended";
};

// MongoDB ki id ke aakhri 8 harf. Har registration ke liye alag, hamesha wohi
// rehta hai, aur database mein alag field rakhne ki zaroorat nahi parti.
export const ticketCode = (id) => String(id).slice(-8).toUpperCase();

export const printPass = (registration) => {
  const previousTitle = document.title;

  // Browser "Save as PDF" ki file ka naam page ke title se banata hai.
  document.title = `EventSphere-pass-${ticketCode(registration._id)}`;

  // Chrome mein print() dialog band hone tak ruka rehta hai, magar har browser
  // mein nahi — is liye title wapas karne ka kaam afterprint par hai. Listener
  // ek dafa chal kar khud hat jata hai.
  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);

  window.print();
};

function Pass({ registration }) {
  // Organizer expo delete kar de to populate() null deta hai — us record ka
  // pass banane ka koi matlab nahi.
  if (!registration?.event) return null;

  const { name, organization, ticketType, checkedIn, event, _id } = registration;

  return (
    <article className="pass" data-checked={checkedIn ? "true" : "false"}>
      <div className="pass-top">
        <span className="pass-hole" aria-hidden="true" />
        <span className="pass-brand">EventSphere</span>
        <span className="pass-tier">{ticketType}</span>
      </div>

      <p className="pass-label">Attendee</p>
      <p className="pass-name">{name}</p>
      {organization && <p className="pass-org">{organization}</p>}

      <div className="pass-tear" aria-hidden="true" />

      <p className="pass-label">Admits one to</p>
      <p className="pass-event">{event.title}</p>

      <dl className="pass-meta">
        <div>
          <dt>Date</dt>
          <dd>{formatDate(event.date)}</dd>
        </div>
        <div>
          <dt>Doors</dt>
          <dd>
            {event.startTime}&ndash;{event.endTime}
          </dd>
        </div>
        <div>
          <dt>Venue</dt>
          <dd>{event.location}</dd>
        </div>
      </dl>

      <div className="pass-foot">
        <span className="pass-code">REG · {ticketCode(_id)}</span>
        <span className="pass-when">{countdown(event.date)}</span>
      </div>

      {/* Check-in ka nishan muhr ki tarah — darwaze par yehi hota hai. */}
      {checkedIn && <span className="pass-stamp">Checked in</span>}
    </article>
  );
}

export default Pass;