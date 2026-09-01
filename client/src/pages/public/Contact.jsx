import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import { getPublicSettings } from "../../services/settingsService";
import { sendContactMessage } from "../../services/contactService";
import "./Contact.css";

const SUBJECT_OPTIONS = ["General Inquiry", "Booth Application", "Technical Support", "Partnership"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECT_OPTIONS[0], message: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [settings, setSettings] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(false);

  // Contact details ab admin ke Settings page se aati hain, code se nahi.
  //
  // `/settings/public` istemaal kar rahe hain, `/settings` nahi. Farq ahem
  // hai: public wala sirf paanch bezar fields bhejta hai. Admin wala poora
  // document bhejta hai — jis mein `updatedBy` bhi hai, yani kis admin ki id.
  // Wo baat kisi anjaan visitor ke browser mein pahunchni hi nahi chahiye.
  useEffect(() => {
    getPublicSettings()
      .then((data) => setSettings(data))
      .catch(() => setSettingsError(true))
      .finally(() => setIsLoadingSettings(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Purana server error foran hata dete hain. Warna banda kuch theek karta
    // hai aur purana laal message wahin para rehta hai — lagta hai naya
    // inkaar aaya hai.
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Please enter your name.";
    if (!form.email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!EMAIL_PATTERN.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) {
      newErrors.message = "Please enter a message.";
    } else if (form.message.trim().length < 10) {
      newErrors.message = "Message should be at least 10 characters.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setApiError("");
    setIsSubmitting(true);
    try {
      await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setIsSubmitted(true);
    } catch (error) {
      setApiError(error.response?.data?.message || "Couldn't send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ name: "", email: "", subject: SUBJECT_OPTIONS[0], message: "" });
    setErrors({});
    setApiError("");
    setIsSubmitted(false);
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <span className="hero-glow hero-glow-violet" aria-hidden="true"></span>
        <span className="hero-glow hero-glow-teal" aria-hidden="true"></span>

        <div className="contact-hero-content">
          <p className="contact-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true"></span>
            Contact
          </p>
          <h1>Get in <span className="text-gradient">touch</span></h1>
          <p className="contact-hero-sub">
            Questions about hosting an event, exhibiting, or attending? Send us a message.
          </p>
        </div>
      </section>

      <section className="contact-body">
        <div className="contact-grid">
          <div className="contact-form-card">
            {isSubmitted ? (
              <div className="contact-success">
                <span className="contact-success-icon" aria-hidden="true">✓</span>
                <h2>Message sent</h2>
                {/* Ye jumla ab sach hai. Paighaam database mein mehfooz hai
                    aur admin ke Inquiries page par nazar aayega. Pehle yahan
                    ek setTimeout tha jo 700ms ruk kar yehi likh deta tha aur
                    paighaam hawa mein gum ho jata tha. */}
                <p>
                  Thanks for reaching out. Your message is with the team, and we'll
                  reply to <strong>{form.email.trim()}</strong> as soon as we can.
                </p>
                <Button variant="outline" onClick={handleReset}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {apiError && <div className="contact-error">{apiError}</div>}

                <div className="form-row">
                  <label htmlFor="name">Name</label>
                  <input id="name" name="name" type="text" value={form.name} onChange={handleChange} className={errors.name ? "has-error" : ""} />
                  {errors.name && <p className="field-error">{errors.name}</p>}
                </div>

                <div className="form-row">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={errors.email ? "has-error" : ""} />
                  {errors.email && <p className="field-error">{errors.email}</p>}
                </div>

                <div className="form-row">
                  <label htmlFor="subject">Subject</label>
                  <select id="subject" name="subject" value={form.subject} onChange={handleChange}>
                    {SUBJECT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" value={form.message} onChange={handleChange} className={errors.message ? "has-error" : ""} />
                  {errors.message && <p className="field-error">{errors.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>

          <div className="contact-info-card">
            <h2>Other ways to reach us</h2>

            {isLoadingSettings ? (
              <p className="contact-info-note">Loading contact details...</p>
            ) : settingsError ? (
              <p className="contact-info-note">
                We couldn't load our contact details right now. The form on the left still works.
              </p>
            ) : (
              <>
                {settings?.organizationName && (
                  <div className="contact-info-row">
                    <span className="contact-info-label">Organisation</span>
                    <span className="contact-info-value">{settings.organizationName}</span>
                  </div>
                )}

                {settings?.contactEmail && (
                  <div className="contact-info-row">
                    <span className="contact-info-label">Email</span>
                    <a className="contact-info-value contact-info-link" href={`mailto:${settings.contactEmail}`}>
                      {settings.contactEmail}
                    </a>
                  </div>
                )}

                {settings?.contactPhone && (
                  // tel: se pehle spaces hata rahe hain. "+92 21 1234 5678"
                  // parhne mein behtar hai, magar phone app ko saaf number
                  // chahiye — spaces ke sath kai phone kuch dial hi nahi karte.
                  <div className="contact-info-row">
                    <span className="contact-info-label">Phone</span>
                    <a className="contact-info-value contact-info-link" href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}>
                      {settings.contactPhone}
                    </a>
                  </div>
                )}

                {/* Dono khaali? To khaali card dikhane ke bajaye banda ko form
                    ki taraf bhej dete hain. Settings mein ye fields optional
                    hain, is liye ye soorat asal mein mumkin hai. */}
                {!settings?.contactEmail && !settings?.contactPhone && (
                  <p className="contact-info-note">
                    We haven't published a public email or phone number yet — please use the form.
                  </p>
                )}
              </>
            )}

            <div className="contact-links">
              <p>Looking to exhibit? <Link to="/events">Browse events</Link></p>
              <p>Already have an account? <Link to="/login">Log in</Link></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;