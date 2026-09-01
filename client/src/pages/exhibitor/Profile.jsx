import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyApplications, updateExhibitor } from "../../services/exhibitorService";
import "./Profile.css";

const STATUS_TONES = {
  Pending: "amber",
  Approved: "green",
  Active: "green",
  Rejected: "red",
  Inactive: "muted",
};

const EMPTY_FORM = {
  companyName: "",
  category: "",
  contactPerson: "",
  email: "",
  phone: "",
  website: "",
  description: "",
  products: "",
  services: "",
  staff: "",
};

const FORM_FIELDS = Object.keys(EMPTY_FORM);

// Model in teen ko [String] rakhta hai, magar form mein ek line likhna aasan
// hai. Is liye aate waqt join, jaate waqt split.
const LIST_FIELDS = ["products", "services", "staff"];

const toList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// Server ka document → form ke khaane. Har field ke liye `|| ""` zaroori hai:
// undefined value dene se React input "uncontrolled" ban jata hai aur console
// mein warning aati hai.
const toForm = (application) => {
  const form = {};

  FORM_FIELDS.forEach((field) => {
    form[field] = LIST_FIELDS.includes(field)
      ? (application[field] || []).join(", ")
      : application[field] || "";
  });

  return form;
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function Profile() {
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  // Server par jo mehfooz hai uski copy. Isi se muqabla kar ke pata chalta hai
  // ke kuch badla bhi hai ya user ne sirf page khola hai.
  const [baseline, setBaseline] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    getMyApplications()
      .then((data) => {
        if (ignore) return;
        setApplications(data);

        // Sab se nayi application khud hi chun li jati hai — aksar aadmi ki
        // ek hi hoti hai, to dropdown chhune ki zaroorat nahi parti.
        if (data.length > 0) {
          setSelectedId(data[0]._id);
          setForm(toForm(data[0]));
          setBaseline(toForm(data[0]));
        }
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.response?.data?.message || "Failed to load your applications.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selected = applications.find((application) => application._id === selectedId);

  const handleSelect = (e) => {
    const nextId = e.target.value;
    const nextApplication = applications.find((application) => application._id === nextId);

    setSelectedId(nextId);
    setNotice(null);

    if (nextApplication) {
      setForm(toForm(nextApplication));
      setBaseline(toForm(nextApplication));
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setNotice(null);
  };

  const handleReset = () => {
    setForm(baseline);
    setNotice(null);
  };

  const isDirty = FORM_FIELDS.some((field) => form[field] !== baseline[field]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.phone.trim()) {
      return setNotice({
        text: "Company name, contact person, email and phone can't be empty.",
        isError: true,
      });
    }

    setIsSaving(true);
    try {
      const updated = await updateExhibitor(selectedId, {
        companyName: form.companyName.trim(),
        category: form.category.trim(),
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
        products: toList(form.products),
        services: toList(form.services),
        staff: toList(form.staff),
      });

      // Form ko server ke jawab se dobara bharte hain, apne form se nahi —
      // is tarah trim aur email ka lowercase aankhon se nazar aa jata hai.
      setForm(toForm(updated));
      setBaseline(toForm(updated));

      setApplications((prev) =>
        prev.map((application) =>
          application._id === selectedId
            ? {
                ...application,
                ...updated,
                // updateExhibitor ka jawab save() se aata hai, populate() se
                // nahi — is mein event aur booth sirf id hain, poore object
                // nahi. Seedha spread karne se event.title gayab ho jata aur
                // upar wala heading khaali ho jata. Is liye purane populated
                // objects wapas rakh dete hain.
                event: application.event,
                booth: application.booth,
              }
            : application
        )
      );

      setNotice({ text: "Company profile saved.", isError: false });
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Failed to save your company profile.",
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="exhibitor-profile">
        <div className="admin-page-header">
          <h1>Company Profile</h1>
        </div>
        <p className="admin-state-text">Loading your details...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="exhibitor-profile">
        <div className="admin-page-header">
          <h1>Company Profile</h1>
        </div>
        <p className="admin-state-text admin-state-error">{loadError}</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="exhibitor-profile">
        <div className="admin-page-header">
          <h1>Company Profile</h1>
        </div>
        <div className="admin-panel">
          <div className="admin-empty">
            <p>You haven't applied to any expo yet.</p>
            <p className="admin-empty-sub">
              <Link to="/exhibitor/register-expo" className="admin-link">
                Register for an expo
              </Link>{" "}
              — your company details are saved with that application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exhibitor-profile">
      <div className="admin-page-header">
        <h1>Company Profile</h1>
        <p>Your details are stored per expo, so each application can differ.</p>
      </div>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {/* Ek se zyada applications hon tab hi chunne ka faida hai. */}
      {applications.length > 1 && (
        <div className="admin-panel">
          <label className="admin-form-field">
            <span>Editing profile for</span>
            <select value={selectedId} onChange={handleSelect} className="admin-select">
              {applications.map((application) => (
                <option key={application._id} value={application._id}>
                  {application.event?.title || "Removed event"} — {application.companyName}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {selected && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="admin-panel">
            <div className="exhibitor-profile-head">
              <div>
                <h2>{selected.event?.title || "This event was removed"}</h2>
                <p className="admin-table-muted">
                  {selected.event
                    ? `${formatDate(selected.event.date)} · ${selected.event.location}`
                    : "The organizer deleted this event, but your application record remains."}
                </p>
              </div>
              <span
                className="exhibitor-profile-status"
                data-tone={STATUS_TONES[selected.status] || "muted"}
              >
                {selected.status}
              </span>
            </div>

            {selected.status === "Pending" && (
              <p className="admin-table-muted exhibitor-profile-note">
                Still under review — edits you make here will be part of what the organizer sees.
              </p>
            )}
            {selected.status === "Rejected" && (
              <p className="admin-table-muted exhibitor-profile-note">
                This application was rejected. Editing it won't reopen it — apply to another expo instead.
              </p>
            )}
            {(selected.status === "Approved" || selected.status === "Active") && (
              <p className="admin-table-muted exhibitor-profile-note">
                You're approved — anything you save here shows on the public exhibitor listing.
              </p>
            )}
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

              <label className="admin-form-field">
                <span>Staff at the Booth</span>
                <input
                  type="text"
                  name="staff"
                  value={form.staff}
                  onChange={handleChange}
                  className="admin-search"
                />
                <span className="admin-form-hint">Names, separated with commas.</span>
              </label>
            </div>
          </div>

          <div className="exhibitor-profile-actions">
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isSaving || !isDirty}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {isDirty && (
              <button type="button" className="admin-btn" onClick={handleReset} disabled={isSaving}>
                Discard
              </button>
            )}
            {!isDirty && <span className="admin-table-muted">No changes yet.</span>}
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;