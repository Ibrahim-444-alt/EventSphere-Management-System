import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";
import "./Auth.css";
import { roleHome } from "../../utils/roleHome";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!EMAIL_PATTERN.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.password) newErrors.password = "Please enter your password.";
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
      const loggedIn = await login({ email: form.email, password: form.password });
      navigate(roleHome(loggedIn.role), { replace: true });
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
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to manage your events, booths, or registrations.</p>

        {apiError && <div className="auth-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={errors.email ? "has-error" : ""} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-row">
            <div className="form-row-header">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="auth-inline-link">Forgot password?</Link>
            </div>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} className={errors.password ? "has-error" : ""} />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;