import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getEvents } from "../../services/eventService";
import { getMyApplications, applyAsExhibitor } from "../../services/exhibitorService";
import "./RegisterExpo.css";

// Server par bhi bilkul yehi list check hoti hai. Dono jagah hone ki wajah:
// yahan se user ko faida hai (band event dikhta hi nahi), aur wahan se
// hifazat hai (dropbox se bypass kar ke bhi bheja to ruk jayega).
const OPEN_STATUSES = ["Upcoming", "Ongoing"];

const EMPTY_FORM = {
  event: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  category: "",
  website: "",
  description: "",
  products: "",
  services: "",
};

// "Sensor Kit, NovaHub , " → ["Sensor Kit", "NovaHub"]
//
// Model in dono ko [String] rakhta hai, magar form mein ek line likhna user ke
// liye zyada aasan hai. filter(Boolean) khaali tukde hata deta hai, jo aakhir
// mein laga comma ya do commas sath aane par bante hain.
const toList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function RegisterExpo() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [appliedEventIds, setAppliedEventIds] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    // Dono requests ek sath — ek doosre par munhasir nahi hain, to ek ke baad
    // ek intezaar karne ka koi faida nahi.
    Promise.all([getEvents(), getMyApplications()])
      .then(([eventList, applications]) => {
        if (ignore) return;

        setEvents(eventList.filter((event) => OPEN_STATUSES.includes(event.status)));

        // populate() ki wajah se `event` poora object hota hai, sirf id nahi —
        // is liye ._id nikalna parta hai. Bina iske comparison hamesha false
        // rehta aur pehle se ki hui applications pakri nahi jatin.
        setAppliedEventIds(
          applications.map((application) => application.event?._id).filter(Boolean)
        );
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Failed to load events.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Contact ke khaane pehle se bhar dena, taake exhibitor apna hi naam aur
  // email dobara na likhe. Ye sirf default hai — company ka contact person
  // koi doosra bhi ho sakta hai, is liye field badla ja sakta hai.
  //
  // `prev.contactPerson ||` ki shart is liye hai ke agar user ne pehle se kuch
  // likh liya ho to ye effect usay mita na de.
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        contactPerson: prev.contactPerson || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!form.event) {
      return setNotice({ text: "Please choose an expo.", isError: true });
    }
    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.phone.trim()) {
      return setNotice({
        text: "Company name, contact person, email and phone are all required.",
        isError: true,
      });
    }

    setIsSaving(true);
    try {
      await applyAsExhibitor({
        event: form.event,
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
        products: toList(form.products),
        services: toList(form.services),
      });

      // Dashboard par bhej rahe hain kyunki wahan nayi application apne
      // Pending badge ke sath nazar aati hai — ye kisi bhi success message se
      // zyada saaf saboot hai ke kaam ho gaya.
      navigate("/exhibitor");
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Failed to submit your application.",
        isError: true,
      });
      setIsSaving(false);
    }
  };

  const availableEvents = events.filter((event) => !appliedEventIds.includes(event._id));

  if (isLoading) {
    return (
      <div className="register-expo">
        <div className="admin-page-header">
          <h1>Register for Expo</h1>
        </div>
        <p className="admin-state-text">Loading expos...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="register-expo">
        <div className="admin-page-header">
          <h1>Register for Expo</h1>
        </div>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="register-expo">
      <div className="admin-page-header">
        <h1>Register for Expo</h1>
        <p>Apply to exhibit. The organizer reviews every application.</p>
      </div>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {availableEvents.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-empty">
            <p>No expos are open for applications right now.</p>
            <p className="admin-empty-sub">
              {events.length > 0
                ? "You've already applied to every open expo. Check your dashboard for their status."
                : "Once the organizer publishes an upcoming expo it will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="admin-panel">
            <h2>Which Expo?</h2>

            <label className="admin-form-field">
              <span>Expo</span>
              <select
                name="event"
                value={form.event}
                onChange={handleChange}
                className="admin-select"
              >
                <option value="">Choose an expo...</option>
                {availableEvents.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title} — {formatDate(event.date)} ({event.status})
                  </option>
                ))}
              </select>
              <span className="admin-form-hint">
                Expos you've already applied to aren't listed.
              </span>
            </label>
          </div>

          <div className="admin-panel">
            <h2>Company Details</h2>

            <div className="admin-form-grid">
              <label className="admin-form-field">
                <span>Company Name *</span>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="admin-search"
                />
              </label>

              <label className="admin-form-field">
                <span>Category</span>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="admin-search"
                />
                <span className="admin-form-hint">e.g. Technology, Food, Education</span>
              </label>

              <label className="admin-form-field">
                <span>Contact Person *</span>
                <input
                  type="text"
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  className="admin-search"
                />
              </label>

              <label className="admin-form-field">
                <span>Contact Email *</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="admin-search"
                />
              </label>

              <label className="admin-form-field">
                <span>Phone *</span>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="admin-search"
                />
              </label>

              <label className="admin-form-field">
                <span>Website</span>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="admin-search"
                />
              </label>

              <label className="admin-form-field admin-form-full">
                <span>About Your Company</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="admin-search"
                  rows={3}
                />
                <span className="admin-form-hint">
                  Shown to visitors browsing the exhibitor list.
                </span>
              </label>

              <label className="admin-form-field">
                <span>Products</span>
                <input
                  type="text"
                  name="products"
                  value={form.products}
                  onChange={handleChange}
                  className="admin-search"
                />
                <span className="admin-form-hint">Separate with commas.</span>
              </label>

              <label className="admin-form-field">
                <span>Services</span>
                <input
                  type="text"
                  name="services"
                  value={form.services}
                  onChange={handleChange}
                  className="admin-search"
                />
                <span className="admin-form-hint">Separate with commas.</span>
              </label>
            </div>
          </div>

          <div className="register-expo-actions">
            <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
              {isSaving ? "Submitting..." : "Submit Application"}
            </button>
            <span className="admin-table-muted">
              Your application starts as Pending until the organizer reviews it.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}

export default RegisterExpo;