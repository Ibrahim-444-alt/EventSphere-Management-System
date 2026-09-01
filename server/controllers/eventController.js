const Event = require("../models/Event");

const getEvents = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    // Draft ek adhoora expo hai — admin use banata hai, sanwarta hai, aur
    // tayyar hone par "Upcoming" kar deta hai. Public ko wo dikhna hi nahi
    // chahiye. Magar admin ko dikhna zaroori hai, warna wo apna hi draft
    // dhoond nahi payega. Is liye faisla dekhne wale ke role par rakha hai.
    const isAdmin = req.user && req.user.role === "admin";

    if (status) {
      // Kisi ne khud "Draft" maanga? Sirf admin ko milega. Baqi sab ko khaali
      // list — inkaar nahi, kyunki inkaar khud batata hai ke kuch chhupa hai.
      if (status === "Draft" && !isAdmin) return res.json([]);
      query.status = status;
    } else if (!isAdmin) {
      query.status = { $ne: "Draft" };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch events.", error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    // Draft ka seedha link bhi kaam nahi karna chahiye. 404 de rahe hain,
    // 403 nahi — 403 keh deta hai "yahan kuch hai magar tumhare liye nahi",
    // aur hum draft ke mojood hone ki khabar bhi nahi dena chahte.
    const isAdmin = req.user && req.user.role === "admin";
    if (event.status === "Draft" && !isAdmin) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.json(event);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Event not found." });
    }
    res.status(500).json({ message: "Failed to fetch event.", error: error.message });
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
        
        const { title, description, date, startTime, endTime, location, theme, status, registrationDeadline, image } = req.body;

    if (!title || !description || !date || !startTime || !endTime || !location) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const event = await Event.create({
      title, description, date, startTime, endTime, location, theme, status, registrationDeadline, image,
      organizer: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create event.", error: error.message });
  }
};

// @desc    Update an existing event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

        const editableFields = ["title", "description", "date", "startTime", "endTime", "location", "theme", "status", "registrationDeadline", "image"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Event not found." });
    }
     if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update event.", error: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    await event.deleteOne();
    res.json({ message: "Event deleted." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Event not found." });
    }
    res.status(500).json({ message: "Failed to delete event.", error: error.message });
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };