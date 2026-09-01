const Exhibitor = require("../models/Exhibitor");
const Event = require("../models/Event");
// @desc    Get all exhibitors, optionally filtered by event/status/search
// @route   GET /api/exhibitors?event=&status=&search=
// @access  Public
const getExhibitors = async (req, res) => {
  try {
    const { event, status, search } = req.query;
    const query = {};
    if (event) query.event = event;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const exhibitors = await Exhibitor.find(query)
      .populate("event", "title")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(exhibitors);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch exhibitors.", error: error.message });
  }
};

// @desc    Get a single exhibitor by id
// @route   GET /api/exhibitors/:id
// @access  Public
const getExhibitorById = async (req, res) => {
  try {
    const exhibitor = await Exhibitor.findById(req.params.id)
      .populate("event", "title date location")
      .populate("user", "name email");

    if (!exhibitor) return res.status(404).json({ message: "Exhibitor not found." });
    res.json(exhibitor);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Exhibitor not found." });
    res.status(500).json({ message: "Failed to fetch exhibitor.", error: error.message });
  }
};

// @desc    Apply to exhibit at an event
// @route   POST /api/exhibitors/apply
// @access  Private/Exhibitor
const applyAsExhibitor = async (req, res) => {
  try {
    const { event, companyName, contactPerson, email, phone, description, website, category, products, services } = req.body;

    if (!event || !companyName || !contactPerson || !email || !phone) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

        const eventExists = await Event.findById(event);
    if (!eventExists) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Sirf in do haalaton mein application lena maani rakhta hai. Draft ka
    // matlab hai event abhi publish hua hi nahi, aur Completed/Cancelled ka
    // waqt guzar chuka. Frontend in events ko dropdown mein dikhata bhi nahi,
    // magar wo sirf soorat ki baat hai — rok yahan honi chahiye.
    if (!["Upcoming", "Ongoing"].includes(eventExists.status)) {
      return res.status(400).json({
        message: "This event isn't accepting exhibitor applications.",
      });
    }

    // user aur event dono query mein hain — usi banda usi event par dobara
    // apply nahi kar sakta, magar kisi doosre event par bilkul kar sakta hai.
    const existingApplication = await Exhibitor.findOne({ user: req.user._id, event });
    if (existingApplication) {
      return res.status(400).json({ message: "You've already applied to this event." });
    }

    const exhibitor = await Exhibitor.create({
      // Token se liya gaya, req.body se nahi — warna koi bhi exhibitor kisi
      // doosre ke naam par application jama kar sakta tha.
      user: req.user._id,
      event, companyName, contactPerson, email, phone, description, website, category, products, services,
    });

    res.status(201).json(exhibitor);
  } catch (error) {
    // Do requests ek hi lamhe mein aa jayen to upar waala findOne check
    // dono ke liye khaali nikal sakta hai, aur asal rok phir database ka
    // unique index banta hai — 11000 wohi hai.
    if (error.code === 11000) {
      return res.status(400).json({ message: "You've already applied to this event." });
    }
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Event not found." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to submit application.", error: error.message });
  }
};

// @desc    Get the logged-in exhibitor's own applications
// @route   GET /api/exhibitors/me
// @access  Private/Exhibitor
const getMyApplications = async (req, res) => {
  try {
    // Filter token se aa raha hai, query string se nahi. Agar ye
    // ?user= hota to koi bhi apni id badal kar doosre ki applications
    // parh leta — is liye ye value client ke haath mein hi nahi di jaati.
    const applications = await Exhibitor.find({ user: req.user._id })
      .populate("event", "title date location status")
      .populate("booth", "boothNumber size category status")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your applications.", error: error.message });
  }
};

// @desc    Update an exhibitor profile
// @route   PUT /api/exhibitors/:id
// @access  Private (the exhibitor themself, or an admin)
const updateExhibitor = async (req, res) => {
  try {
    const exhibitor = await Exhibitor.findById(req.params.id);
    if (!exhibitor) return res.status(404).json({ message: "Exhibitor not found." });

    const isOwner = exhibitor.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this exhibitor." });
    }

    const editableFields = ["companyName","companyLogo","description","contactPerson","email","phone","website","category","products","services","staff"];
    if (req.user.role === "admin") {
      editableFields.push("status", "booth");
    }

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) exhibitor[field] = req.body[field];
    });

    const updatedExhibitor = await exhibitor.save();
    res.json(updatedExhibitor);
  } catch (error) {
       if (error.name === "CastError") return res.status(404).json({ message: "Exhibitor not found." });
    // Model mein companyName/contactPerson/email/phone required hain. Agar
    // koi unhein khaali kar de to save() ValidationError phenkta hai — ye
    // user ki ghalti hai, server ki nahi, to 400 chahiye 500 nahi.
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update exhibitor.", error: error.message });
  }
};

// @desc    Approve an exhibitor application
// @route   PUT /api/exhibitors/:id/approve
// @access  Private/Admin
const approveExhibitor = async (req, res) => {
  try {
    const exhibitor = await Exhibitor.findById(req.params.id);
    if (!exhibitor) return res.status(404).json({ message: "Exhibitor not found." });
    exhibitor.status = "Approved";
    const updated = await exhibitor.save();
    res.json(updated);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Exhibitor not found." });
    res.status(500).json({ message: "Failed to approve exhibitor.", error: error.message });
  }
};

// @desc    Reject an exhibitor application
// @route   PUT /api/exhibitors/:id/reject
// @access  Private/Admin
const rejectExhibitor = async (req, res) => {
  try {
    const exhibitor = await Exhibitor.findById(req.params.id);
    if (!exhibitor) return res.status(404).json({ message: "Exhibitor not found." });
    exhibitor.status = "Rejected";
    const updated = await exhibitor.save();
    res.json(updated);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Exhibitor not found." });
    res.status(500).json({ message: "Failed to reject exhibitor.", error: error.message });
  }
};

module.exports = {
  getExhibitors,
  getExhibitorById,
  getMyApplications,
  applyAsExhibitor,
  updateExhibitor,
  approveExhibitor,
  rejectExhibitor,
};