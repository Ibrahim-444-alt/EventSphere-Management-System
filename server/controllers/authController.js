const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    // Security: public registration can only ever create attendee or
    // exhibitor accounts. This is enforced here on the server, not just in
    // the frontend form, since anyone could otherwise call this API
    // directly (e.g. with Postman or curl) and try to pass role: "admin".
    const allowedRoles = ["attendee", "exhibitor"];
    const safeRole = allowedRoles.includes(role) ? role : "attendee";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password, role: safeRole });

    // Only send back safe, public fields — never the password, even
    // though select:false already keeps it out of normal queries.
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong while registering.", error: error.message });
  }
};

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    // Password has select:false on the schema, so it's excluded from every
    // query by default — it has to be explicitly requested here.
    const user = await User.findOne({ email }).select("+password");

    // Same generic message whether the email doesn't exist or the password
    // is wrong. Two different messages would let someone use the login
    // form to figure out which emails are registered.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong while logging in.", error: error.message });
  }
};

// @desc    Get the currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  // req.user was already set by the `protect` middleware after verifying
  // the JWT — no extra database lookup needed here.
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};

// @desc    Update the logged-in user's own name and email
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Please provide both a name and an email." });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Email is unique across every account, so a change has to be checked
    // against everyone else — but explicitly NOT against yourself. Without
    // the _id: { $ne } part, saving the form without touching the email would
    // find your own account and reject it as a duplicate.
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }
    }

    user.name = name.trim();
    user.email = normalizedEmail;

    // `role` is deliberately not read from req.body. This route is for the
    // logged-in person editing their own account, so honouring a role here
    // would let any attendee make themselves an admin with a single request.
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update the profile.", error: error.message });
  }
};

// @desc    Change the logged-in user's password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide your current and new password." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ message: "The new password must be different from your current one." });
    }

    // The schema hides the password from every query, so the hash has to be
    // asked for explicitly before it can be compared.
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Asking for the current password matters even though the request is
    // already authenticated. If someone walks up to an unlocked laptop, this
    // is what stops them from locking the real admin out of their own account.
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: "Your current password is incorrect." });
    }

    // Assigned in plain text on purpose — the pre-save hook on the User
    // schema does the hashing. Hashing it here would hash it twice, and then
    // the password would never match at login again.
    user.password = newPassword;
    await user.save();

    // No new token is issued: the JWT is signed with the user's id, not their
    // password, so the existing one stays valid.
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to change the password.", error: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, updateProfile, changePassword };