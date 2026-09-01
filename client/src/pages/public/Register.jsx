import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import "./Auth.css";
import { roleHome } from "../../utils/roleHome";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = [
  { value: "attendee", label: "Attendee", text: "Browse events, register for sessions" },
  { value: "exhibitor", label: "Exhibitor", text: "Apply for booths, showcase your company" },
];

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", role: "attendee" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (value) => setForm((prev) => ({ ...prev, role: value }));

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Please enter your full name.";
    if (!form.email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!EMAIL_PATTERN.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.password) {
      newErrors.password = "Please choose a password.";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (form.confirmPassword !== form.password) newErrors.confirmPassword = "Passwords don't match.";
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
      const created = await register({ name: form.fullName, email: form.email, password: form.password, role: form.role });
      navigate(roleHome(created.role), { replace: true });
    } catch (error) {
      setApiError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <span className="auth-glow" aria-hidden="true"></span>
      <Link to="/" className="auth-brand">EventSphere</Link>

      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Join as an attendee or apply as an exhibitor.</p>

        {apiError && <div className="auth-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label>I'm registering as</label>
            <div className="role-toggle">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={form.role === r.value ? "role-option role-option-active" : "role-option"}
                  onClick={() => handleRoleSelect(r.value)}
                >
                  <span className="role-option-label">{r.label}</span>
                  <span className="role-option-text">{r.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange} className={errors.fullName ? "has-error" : ""} />
            {errors.fullName && <p className="field-error">{errors.fullName}</p>}
          </div>

          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={errors.email ? "has-error" : ""} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} className={errors.password ? "has-error" : ""} />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="form-row">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? "has-error" : ""} />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;