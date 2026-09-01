const ContactMessage = require("../models/ContactMessage");

const SUBJECTS = ["General Inquiry", "Booth Application", "Technical Support", "Partnership"];
const INQUIRY_STATUSES = ["New", "Read", "Archived"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LENGTH = 10;

// @desc    Send a message from the public contact form
// @route   POST /api/contact
// @access  Public
const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Wohi teen checks jo Contact.jsx bhi karta hai. Dohrana fizool nahi:
    // frontend ki validation banda ki madad ke liye hai, server ki hifazat ke
    // liye. curl aur Postman frontend ko chhoote hi nahi.
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Please enter your name." });
    }
    if (!email || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (!message || message.trim().length < MIN_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message should be at least ${MIN_MESSAGE_LENGTH} characters.` });
    }
    if (subject && !SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: "That subject isn't one of the available options." });
    }

    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
      user: req.user ? req.user._id : null,
    });

    // Poora document wapas nahi bhej rahe. Bhejne wale ko `status`, `user` ya
    // database id ki koi zaroorat nahi — aur jitna kam bahar jaye, utna behtar.
    res.status(201).json({
      message: "Thanks — your message has been received.",
      subject: contactMessage.subject,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    res.status(500).json({ message: "Failed to send your message.", error: error.message });
  }
};

// @desc    Get all contact messages, with optional filters
// @route   GET /api/contact?status=&subject=&search=
// @access  Private/Admin
const getContactMessages = async (req, res) => {
  try {
    const { status, subject, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const messages = await ContactMessage.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages.", error: error.message });
  }
};

// @desc    Change a message's status
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
const updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${INQUIRY_STATUSES.join(", ")}.` });
    }

    const contactMessage = await ContactMessage.findById(req.params.id);
    if (!contactMessage) return res.status(404).json({ message: "Message not found." });

    contactMessage.status = status;
    await contactMessage.save();

    // save() ka jawab populate nahi hota — `user` waapis khaali id ban jata
    // hai. Frontend ko populated shakal ki aadat par chhorna khatarnak hai
    // (Phase 6 mein MyRegistrations par bilkul yehi bug pakra tha), is liye
    // bhejne se pehle khud dobara populate kar dete hain.
    await contactMessage.populate("user", "name email role");

    res.json(contactMessage);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Message not found." });
    }
    res.status(500).json({ message: "Failed to update the message.", error: error.message });
  }
};

// @desc    Delete a contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContactMessage = async (req, res) => {
  try {
    const contactMessage = await ContactMessage.findById(req.params.id);
    if (!contactMessage) return res.status(404).json({ message: "Message not found." });

    await contactMessage.deleteOne();
    res.json({ message: "Message deleted." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Message not found." });
    }
    res.status(500).json({ message: "Failed to delete the message.", error: error.message });
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
};