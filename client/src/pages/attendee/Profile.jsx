import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile, changePassword } from "../../services/authService";
import { getMyRegistrations } from "../../services/attendeeService";
import { getMyBookmarks } from "../../services/bookmarkService";
import "./Profile.css";

const EMPTY_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

function Profile() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileNotice, setProfileNotice] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [stats, setStats] = useState(null);

  // User /api/auth/me se page mount hone ke thori der baad aata hai, is liye
  // form pehle render par nahi — jab user pohanche tab bharta hai.
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || "", email: user.email || "" });
    }
  }, [user]);

  // Khulasa alag effect mein hai kyunki forms ka is par koi inhesaar nahi. Ye
  // na aaye to bhi page poora kaam karta rehta hai — is liye yahan error dikhane
  // ki bhi zaroorat nahi.
  useEffect(() => {
    let ignore = false;

    Promise.all([getMyRegistrations(), getMyBookmarks()])
      .then(([registrations, bookmarks]) => {
        if (ignore) return;

        const today = startOfDay(new Date());
        const live = registrations.filter((item) => item.status === "Registered" && item.event);

        setStats({
          expos: live.length,
          upcoming: live.filter((item) => startOfDay(item.event.date) >= today).length,
          saved: bookmarks.length,
        });
      })
      .catch(() => {
        if (!ignore) setStats(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileNotice(null);
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordNotice(null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileNotice(null);

    if (!profileForm.name.trim()) {
      return setProfileNotice({ text: "Name is required.", isError: true });
    }
    if (!profileForm.email.trim()) {
      return setProfileNotice({ text: "Email is required.", isError: true });
    }

    setIsSavingProfile(true);

    try {
      const updated = await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });

      // Auth context mein daalna zaroori hai — sidebar ka naam wahin se aata
      // hai, aur bina iske save hone ke baad bhi purana naam dikhta rehta.
      updateUser({ name: updated.name, email: updated.email });

      setProfileNotice({ text: "Profile updated.", isError: false });
    } catch (err) {
      setProfileNotice({
        text: err.response?.data?.message || "Couldn't update your profile.",
        isError: true,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!passwordForm.currentPassword) {
      return setPasswordNotice({ text: "Enter your current password.", isError: true });
    }
    if (passwordForm.newPassword.length < 8) {
      return setPasswordNotice({
        text: "New password must be at least 8 characters.",
        isError: true,
      });
    }
    // Ye check yahin rehta hai, server ko kabhi nahi jata — server ko confirm
    // field ki koi zaroorat nahi. Iska ek hi kaam hai: typo pakarna, us se
    // pehle ke aap aisa password rakh len jo dobara likh na saken.
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordNotice({ text: "The two new passwords don't match.", isError: true });
    }

    setIsSavingPassword(true);

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // Kaamyabi ke baad password form state mein rakhne ka koi faida nahi.
      setPasswordForm(EMPTY_PASSWORD_FORM);

      setPasswordNotice({
        text: "Password updated. Use the new one next time you log in.",
        isError: false,
      });
    } catch (err) {
      setPasswordNotice({
        text: err.response?.data?.message || "Couldn't change your password.",
        isError: true,
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Kuch badla hi nahi to Save dabane ka matlab nahi. Email lowercase mein
  // compare hoti hai kyunki server usay isi tarah store karta hai.
  const isProfileDirty =
    Boolean(user) &&
    (profileForm.name.trim() !== user.name ||
      profileForm.email.trim().toLowerCase() !== user.email);

  if (!user) {
    return (
      <div className="acct">
        <h1 className="attendee-title">Your account</h1>
        <p className="admin-state-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="acct">
      <h1 className="attendee-title">Your account</h1>

      {stats && (
        <div className="admin-stats-grid acct-stats">
          <div className="admin-stat-card">
            <p className="admin-stat-value">{stats.expos}</p>
            <p className="admin-stat-label">Expos registered</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">{stats.upcoming}</p>
            <p className="admin-stat-label">Still to come</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">{stats.saved}</p>
            <p className="admin-stat-label">Saved sessions</p>
          </div>
        </div>
      )}

      <div className="acct-panels">
        <div className="admin-panel">
          <h2>Details</h2>

          {profileNotice && (
            <p className={`admin-notice${profileNotice.isError ? " admin-notice-error" : ""}`}>
              {profileNotice.text}
            </p>
          )}

          {/* noValidate: browser ka apna "please fill this field" bubble hamare
              messages se takrata hai, aur usay style bhi nahi kiya ja sakta. */}
          <form onSubmit={handleProfileSubmit} noValidate>
            <div className="admin-form-grid">
              <label className="admin-form-field">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="admin-search"
                />
                <span className="admin-form-hint">
                  This is the name printed on your pass.
                </span>
              </label>

              <label className="admin-form-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="admin-search"
                />
              </label>
            </div>

            <div className="acct-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSavingProfile || !isProfileDirty}
              >
                {isSavingProfile ? "Saving..." : "Save changes"}
              </button>
              {!isProfileDirty && <span className="admin-table-muted">No changes yet.</span>}
            </div>
          </form>

          {/* Email badalne ka ek asar hai jo nazar nahi aata, is liye likh dena
              zaroori hai: registration desk par walk-in rows email par jurti
              hain, user id par nahi. */}
          <p className="acct-note">
            Your registrations are matched by email, so changing it means passes
            issued at the desk under your old address won't show up in{" "}
            <Link to="/attendee/registrations" className="admin-link">
              My Registrations
            </Link>
            .
          </p>
        </div>

        <div className="admin-panel">
          <h2>Password</h2>

          {passwordNotice && (
            <p className={`admin-notice${passwordNotice.isError ? " admin-notice-error" : ""}`}>
              {passwordNotice.text}
            </p>
          )}

          <form onSubmit={handlePasswordSubmit} noValidate>
            <div className="admin-form-grid">
              <label className="admin-form-field admin-form-full">
                <span>Current password</span>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  className="admin-search"
                />
              </label>

              <label className="admin-form-field">
                <span>New password</span>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="admin-search"
                />
                <span className="admin-form-hint">At least 8 characters.</span>
              </label>

              <label className="admin-form-field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="admin-search"
                />
              </label>
            </div>

            <div className="acct-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;