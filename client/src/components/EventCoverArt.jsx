import { useState } from "react";
import { fileUrl } from "../utils/fileUrl";
// Small hand-drawn SVG "cover" for each event card — a gradient (built from
// the site's existing accent/status colors) plus a simple line icon matched
// to the event's theme. No external images, so nothing to break or license.

const THEME_STYLES = {
  Technology: { gradient: ["#aa3bff", "#1e8e6c"], icon: "technology" },
  Sustainability: { gradient: ["#1e8e6c", "#145f49"], icon: "sustainability" },
  "Food & Beverage": { gradient: ["#b8720a", "#aa3bff"], icon: "food" },
  Healthcare: { gradient: ["#1e8e6c", "#52566a"], icon: "healthcare" },
  Automotive: { gradient: ["#52566a", "#aa3bff"], icon: "automotive" },
  Education: { gradient: ["#aa3bff", "#b8720a"], icon: "education" },
};

const ICONS = {
  technology: (
    <>
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="12" cy="17" r="2" />
      <line x1="7.7" y1="8.2" x2="10.5" y2="15.3" />
      <line x1="16.3" y1="8.2" x2="13.5" y2="15.3" />
      <line x1="8" y1="7" x2="16" y2="7" />
    </>
  ),
  sustainability: (
    <>
      <path d="M4 20C4 12 9 5 20 4C19 15 12 20 4 20Z" />
      <path d="M4 20C8 15 12 11 18 6" />
    </>
  ),
  food: (
    <>
      <path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <line x1="8" y1="4" x2="8" y2="6" />
      <line x1="11" y1="3.5" x2="11" y2="6" />
    </>
  ),
  healthcare: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  automotive: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.2" />
      <line x1="12" y1="4" x2="12" y2="8.5" />
      <line x1="12" y1="15.5" x2="12" y2="20" />
      <line x1="4" y1="12" x2="8.5" y2="12" />
      <line x1="15.5" y1="12" x2="20" y2="12" />
    </>
  ),
  education: (
    <>
      <path d="M4 5.5C6 4.5 9 4.5 12 6C15 4.5 18 4.5 20 5.5V18C18 17 15 17 12 18.5C9 17 6 17 4 18Z" />
      <line x1="12" y1="6" x2="12" y2="18.5" />
    </>
  ),
};

function EventCoverArt({ theme, uid, image, title }) {
  // Image URL haath se type hoti hai, is liye kuch toot'ti bhi hain — 404,
  // spelling ki ghalti, ya website jo ab mojood nahi. Jo URL toot jaye use
  // yaad rakh lete hain aur us ke liye wapas apni SVG art par aa jate hain.
  // Yehi tareeqa SpeakerManagement mein bhi hai (wahan initials par girta hai).
  //
  // Boolean ke bajaye URL yaad rakh rahe hain, aur ye jaan bujh kar hai. Sochein
  // Details page par banda ek expo se doosre par jata hai: component wohi rehta
  // hai, sirf props badalte hain. Boolean hota to pehle expo ki tooti image ka
  // nishan doosre expo par bhi chipka reh jata aur us ki sahi image kabhi na
  // dikhti. URL yaad rakhne se moqabla khud ba khud sahi ho jata hai.
  const [brokenUrl, setBrokenUrl] = useState("");

  if (image && brokenUrl !== image) {
    return (
      <img
        className="event-cover"
        src={fileUrl(image)}
        alt={title ? `${title} cover` : "Event cover image"}
        loading="lazy"
        onError={() => setBrokenUrl(image)}
      />
    );
  }

  const style = THEME_STYLES[theme] || THEME_STYLES.Technology;
  const gradientId = `cover-${uid}`;

  return (
    <svg
      className="event-cover"
      viewBox="0 0 320 140"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={theme ? `${theme} event` : "Event cover image"}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={style.gradient[0]} />
          <stop offset="100%" stopColor={style.gradient[1]} />
        </linearGradient>
      </defs>
      <rect width="320" height="140" fill={`url(#${gradientId})`} />
      <g
        transform="translate(160,70) scale(2.4) translate(-12,-12)"
        stroke="#fff"
        strokeOpacity="0.9"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[style.icon]}
      </g>
    </svg>
  );
}

export default EventCoverArt;