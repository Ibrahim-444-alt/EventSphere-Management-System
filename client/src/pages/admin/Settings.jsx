import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "../../services/settingsService";
import "./Settings.css";

const EMPTY_FORM = {
  organizationName: "",
  contactEmail: "",
  contactPhone: "",
  registrationsOpen: true,
  feedbackOpen: true,
};

// Sirf wo fields jo ye form chalata hai. API `key`, `updatedAt` aur `updatedBy`
// bhi bhejti hai, magar wo edit nahi hote — is liye unhen us comparison se
// bahar rakha gaya hai jo Save button ko on/off karta hai.
const FORM_FIELDS = Object.keys(EMPTY_FORM);

const pickFormFields = (settings) => {
  const form = {};
  FORM_FIELDS.forEach((field) => {
    // ?? istemal hua hai, || nahi. || khaali string aur false ko bhi "missing"
    // samajh kar default laga deta — aur registrationsOpen: false to bilkul
    // jaiz value hai.
    form[field] = settings[field] ?? EMPTY_FORM[field];
  });
  return form;
};

function Settings() {
  const [form, setForm] = useState(EMPTY_FORM);

  // Server ke paas is waqt jo hai uska snapshot. Jab tak form is se mukhtalif
  // na ho Save band rehta hai, aur har kaamyab save ke baad ye refresh hota hai.
  const [baseline, setBaseline] = useState(EMPTY_FORM);

  const [updatedAt, setUpdatedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    getSettings()
      .then((data) => {
        if (ignore) return;
        setForm(pickFormFields(data));
        setBaseline(pickFormFields(data));
        setUpdatedAt(data.updatedAt || null);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.response?.data?.message || "Failed to load settings.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;

    // Checkbox apni value `checked` mein rakhta hai, `value` mein nahi — us par
    // `value` parhne se hamesha string "on" milti hai, chahe wo on ho ya off.
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!form.organizationName.trim()) {
      return setNotice({ text: "Organization name cannot be empty.", isError: true });
    }

    setIsSaving(true);
    try {
      const updated = await updateSettings({
        organizationName: form.organizationName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        registrationsOpen: form.registrationsOpen,
        feedbackOpen: form.feedbackOpen,
      });

      // Form ko response se dobara bhara ja raha hai, `form` se nahi — taake
      // screen par bilkul wohi ho jo database mein gaya. Server email ko
      // lowercase karta hai aur spaces trim karta hai, aur ye tabdeeliyan
      // isi tarah nazar aati hain.
      setForm(pickFormFields(updated));
      setBaseline(pickFormFields(updated));
      setUpdatedAt(updated.updatedAt || null);
      setNotice({ text: "Settings saved.", isError: false });
    } catch (err) {
      setNotice({
        text: err.response?.data?.message || "Failed to save settings.",
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = FORM_FIELDS.some((field) => form[field] !== baseline[field]);

  if (isLoading) {
    return (
      <div className="settings">
        <div className="admin-page-header">
          <h1>Settings</h1>
        </div>
        <p className="admin-state-text">Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings">
        <div className="admin-page-header">
          <h1>Settings</h1>
        </div>
        <p className="admin-state-text admin-state-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="admin-page-header">
        <h1>Settings</h1>
        <p>Organization details and what the public can do right now.</p>
      </div>

      {notice && (
        <p className={`admin-notice${notice.isError ? " admin-notice-error" : ""}`}>
          {notice.text}
        </p>
      )}

      {/* Ye warnings `baseline` par chalte hain, `form` par nahi. Baseline wo
          hai jo database mein waqai maujood hai, aur ek warning ka maqsad asli
          haalat batana hai — un tabdeeliyon ki nahi jo abhi save hi nahi hui. */}
      {!baseline.registrationsOpen && (
        <p className="admin-notice admin-notice-error">
          Registrations are closed. Nobody can be added on the Attendees page,
          including walk-ins at the desk, until this is switched back on.
        </p>
      )}

      {!baseline.feedbackOpen && (
        <p className="admin-notice admin-notice-error">
          Feedback is closed. The public feedback form will be refused.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="settings-panels">
          <div className="admin-panel">
            <h2>Organization</h2>

            <label className="settings-field">
              <span>Organization Name</span>
              <input
                type="text"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                className="admin-search"
              />
              <span className="settings-hint">Shown across the public site.</span>
            </label>

            <label className="settings-field">
              <span>Contact Email</span>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                className="admin-search"
              />
              <span className="settings-hint">Optional. Leave empty to hide it.</span>
            </label>

            <label className="settings-field">
              <span>Contact Phone</span>
              <input
                type="text"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="admin-search"
              />
              <span className="settings-hint">Optional.</span>
            </label>
          </div>

          <div className="admin-panel">
            <h2>Access Controls</h2>

            <label className="settings-toggle">
              <input
                type="checkbox"
                name="registrationsOpen"
                checked={form.registrationsOpen}
                onChange={handleChange}
              />
              <span className="settings-toggle-body">
                <span className="settings-toggle-label">Registrations open</span>
                <span className="settings-hint">
                  Turn off after the expo fills up. The API itself refuses new
                  registrations — not just the form.
                </span>
              </span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                name="feedbackOpen"
                checked={form.feedbackOpen}
                onChange={handleChange}
              />
              <span className="settings-toggle-body">
                <span className="settings-toggle-label">Feedback open</span>
                <span className="settings-hint">
                  Turn off once the event is over. Feedback already collected
                  stays exactly where it is.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={isSaving || !isDirty}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>

          {!isDirty && <span className="admin-table-muted">No changes yet.</span>}

          {updatedAt && (
            <span className="admin-table-muted">
              Last saved {new Date(updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default Settings;