import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import { sendContactMessage } from "../../services/contactService";
import "./Auth.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      // Ghaur karein: hum ye check **nahi** kar rahe ke ye email account
      // rakhta hai ya nahi.
      //
      // Ye kanjoosi nahi, hifazat hai. Agar page kehta "is email ka koi
      // account nahi", to koi bhi is form par email daal daal kar pata kar
      // sakta ke tumhare paas kaun kaun registered hai — us ke baad us list
      // par password guess karne ka kaam shuru hota hai. Isi ko user
      // enumeration kehte hain. Har mazboot forgot-password page har email par
      // bilkul ek jaisa jawab deta hai.
      await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: "Technical Support",
        message: `Password reset request for ${form.email.trim()}. This person can't log in and is asking for their password to be reset.`,
      });
      setIsSubmitted(true);
    } catch (error) {
      setApiError(error.response?.data?.message || "Couldn't send your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <span className="auth-glow" aria-hidden="true"></span>
      <Link to="/" className="auth-brand">EventSphere</Link>

      <div className="auth-card">
        {isSubmitted ? (
          <>
            <h1>Request received</h1>
            {/* Ye jumla naap kar likha gaya hai. "Check your email" nahi likha,
                kyunke koi email nahi jata — jaata hai admin ki Inquiries inbox
                mein. Jo waada poora na ho sake, wo likhna hi nahi chahiye. */}
            <p className="auth-subtitle">
              Your reset request is with the organising team. They'll get in touch
              at <strong>{form.email.trim()}</strong> to verify who you are and
              set a new password.
            </p>

            <div className="auth-notice">
              Nothing has changed on your account yet — your old password still
              works if you remember it.
            </div>

            <p className="auth-switch">
              <Link to="/login">Back to log in</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Forgot password</h1>
            <p className="auth-subtitle">
              Tell us who you are and we'll help you get back in.
            </p>

            <div className="auth-notice">
              Automatic reset emails aren't switched on yet, so this goes to the
              organising team as a support request instead of an instant link.
            </div>

            {apiError && <div className="auth-error">{apiError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className={errors.name ? "has-error" : ""}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>

              <div className="form-row">
                <label htmlFor="email">Account email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? "has-error" : ""}
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Request Reset"}
              </Button>
            </form>

            <p className="auth-switch">
              Remembered it? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;