const Settings = require("../models/Settings");

// Bohat narm check — sirf "email hi nahi hai" pakarne ke liye kaafi, magar
// asli duniya ke addresses ko rokta nahi.
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// JSON se jo aaya usko asli boolean banata hai. Checkbox agar string "false"
// ban kar aa jaye to JavaScript mein wo bhi truthy hai — aur bas yehi ek
// cheez toggle ko band karna namumkin bana deti hai.
const toBoolean = (value) => value === true || value === "true";

// @desc    Get the application settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to load settings.", error: error.message });
  }
};

// @desc    Get the few settings a visitor is allowed to see
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    // Poora document bhejne ke bajaye fields haath se chune gaye hain. Public
    // site ko organization ka naam, footer mein chhapne waale contact details,
    // aur do switches chahiye taake band form ko grey kar sake — usay ye jaanne
    // ki zaroorat nahi ke aakhri save kis admin ne kiya tha ya kab.
    res.json({
      organizationName: settings.organizationName,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      registrationsOpen: settings.registrationsOpen,
      feedbackOpen: settings.feedbackOpen,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load settings.", error: error.message });
  }
};

// @desc    Update the application settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    if (req.body.organizationName !== undefined) {
      if (!String(req.body.organizationName).trim()) {
        return res.status(400).json({ message: "Organization name cannot be empty." });
      }
      settings.organizationName = req.body.organizationName;
    }

    if (req.body.contactEmail !== undefined) {
      const email = String(req.body.contactEmail).trim();

      // Khaali chalta hai — contact email optional hai. Magar agar kuch likha
      // gaya hai to address jaisa lagna chahiye, warna footer aisa mailto:
      // link chhaap dega jo kahin nahi jata.
      if (email && !EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: "Please provide a valid contact email." });
      }
      settings.contactEmail = email;
    }

    if (req.body.contactPhone !== undefined) {
      settings.contactPhone = req.body.contactPhone;
    }

    if (req.body.registrationsOpen !== undefined) {
      settings.registrationsOpen = toBoolean(req.body.registrationsOpen);
    }

    if (req.body.feedbackOpen !== undefined) {
      settings.feedbackOpen = toBoolean(req.body.feedbackOpen);
    }

    // `key` is list par nahi hai. Wohi ek cheez single-document rule ko thaam
    // kar rakhti hai, is liye request body se kabhi nahi li jaati.
    settings.updatedBy = req.user._id;

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to save settings.", error: error.message });
  }
};

module.exports = { getSettings, getPublicSettings, updateSettings };