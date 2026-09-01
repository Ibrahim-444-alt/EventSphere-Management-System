import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile, changePassword } from "../../services/authService";
import "./Profile.css";

const EMPTY_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function Profile() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileNotice, setProfileNotice] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // The user arrives from /api/auth/me a moment after this page mounts, so
  // the form is filled in when it lands rather than on the first render.
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || "", email: user.email || "" });
    }
  }, [user]);

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

      // Push the saved values into the auth context so anywhere the app shows
      // your name picks them up straight away.
      updateUser({ name: updated.name, email: updated.email });

      setProfileNotice({ text: "Profile updated.", isError: false });
    } catch (err) {
      setProfileNotice({
        text: err.response?.data?.message || "Failed to update your profile.",
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
      return setPasswordNotice({ text: "Please enter your current password.", isError: true });
    }
    if (passwordForm.newPassword.length < 8) {
      return setPasswordNotice({
        text: "New password must be at least 8 characters.",
        isError: true,
      });
    }
    // Checked here and never sent anywhere — the server has no use for a
    // confirmation field, it only exists to catch a typo before you're locked
    // out by a password you can't reproduce.
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordNotice({ text: "The two new passwords don't match.", isError: true });
    }

    setIsSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // Cleared immediately — leaving passwords sitting in form state after a
      // successful save serves no purpose.
      setPasswordForm(EMPTY_PASSWORD_FORM);

      setPasswordNotice({
        text: "Password updated. You'll use the new one next time you log in.",
        isError: false,
      });
    } catch (err) {
      setPasswordNotice({
        text: err.response?.data?.message || "Failed to change your password.",
        isError: true,
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Nothing to save until something actually changed — the email comparison
  // is lower-cased because the server stores it that way.
  const isProfileDirty =
    Boolean(user) &&
    (profileForm.name.trim() !== user.name ||
      profileForm.email.trim().toLowerCase() !== user.email);

  if (!user) {
    return (
      <div className="profile">
        <div className="admin-page-header">
          <h1>Profile</h1>
        </div>
        <p className="admin-state-text">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="admin-page-header">
        <h1>Profile</h1>
        <p>Your account details and password.</p>
      </div>

      <div className="profile-panels">
        <div className="admin-panel">
          <h2>Account Details</h2>

          {profileNotice && (
            <p className={`admin-notice${profileNotice.isError ? " admin-notice-error" : ""}`}>
              {profileNotice.text}
            </p>
          )}

          <form onSubmit={handleProfileSubmit} noValidate>
            <label className="profile-field">
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="admin-search"
              />
            </label>

            <label className="profile-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="admin-search"
              />
            </label>

            <div className="profile-field">
              <span>Role</span>
              <p className="profile-readonly">
                <span className={`admin-badge profile-role profile-role-${user.role}`}>
                  {user.role}
                </span>
              </p>
              {/* Read-only by design. The update API ignores `role` in the
                  request body, so showing an editable dropdown here would be
                  a control that silently does nothing. */}
              <span className="profile-hint">
                Only another admin can change an account's role.
              </span>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSavingProfile || !isProfileDirty}
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
              {!isProfileDirty && <span className="admin-table-muted">No changes yet.</span>}
            </div>
          </form>
        </div>

        <div className="admin-panel">
          <h2>Change Password</h2>

          {passwordNotice && (
            <p className={`admin-notice${passwordNotice.isError ? " admin-notice-error" : ""}`}>
              {passwordNotice.text}
            </p>
          )}

          <form onSubmit={handlePasswordSubmit} noValidate>
            <label className="profile-field">
              <span>Current Password</span>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                className="admin-search"
              />
            </label>

            <label className="profile-field">
              <span>New Password</span>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className="admin-search"
              />
              <span className="profile-hint">At least 8 characters.</span>
            </label>

            <label className="profile-field">
              <span>Confirm New Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className="admin-search"
              />
            </label>

            <div className="profile-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;