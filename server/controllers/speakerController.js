const Speaker = require("../models/Speaker");
const Session = require("../models/Session");

// @desc    Get all speakers, optionally filtered by event, with search
// @route   GET /api/speakers?event=&search=
// @access  Public
const getSpeakers = async (req, res) => {
  try {
    const { event, search } = req.query;
    const query = {};
    if (event) query.event = event;

    // Case-insensitive partial match on name or company, so the admin
    // search box behaves like the one on the exhibitors page.
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const speakers = await Speaker.find(query)
      .populate("event", "title")
      .sort({ createdAt: -1 });

    res.json(speakers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch speakers.", error: error.message });
  }
};

// @desc    Get a single speaker by id
// @route   GET /api/speakers/:id
// @access  Public
const getSpeakerById = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id).populate("event", "title");
    if (!speaker) return res.status(404).json({ message: "Speaker not found." });
    res.json(speaker);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Speaker not found." });
    res.status(500).json({ message: "Failed to fetch speaker.", error: error.message });
  }
};

// @desc    Create a new speaker
// @route   POST /api/speakers
// @access  Private/Admin
const createSpeaker = async (req, res) => {
  try {
    const { event, name, designation, company, email, bio, photo } = req.body;

    if (!event || !name) {
      return res.status(400).json({ message: "Event and speaker name are required." });
    }

    const speaker = await Speaker.create({
      event,
      name: String(name).trim(),
      designation,
      company,
      email,
      bio,
      photo,
    });

    res.status(201).json(speaker);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create speaker.", error: error.message });
  }
};

// @desc    Update a speaker
// @route   PUT /api/speakers/:id
// @access  Private/Admin
const updateSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (!speaker) return res.status(404).json({ message: "Speaker not found." });

    // Whitelist rather than Object.assign, so a stray field in the request
    // body can never overwrite something we didn't intend — like `event`,
    // which would silently move the speaker to a different expo.
    const editableFields = ["name", "designation", "company", "email", "bio", "photo"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) speaker[field] = req.body[field];
    });

    const updatedSpeaker = await speaker.save();
    res.json(updatedSpeaker);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Speaker not found." });
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update speaker.", error: error.message });
  }
};

// @desc    Delete a speaker
// @route   DELETE /api/speakers/:id
// @access  Private/Admin
const deleteSpeaker = async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (!speaker) return res.status(404).json({ message: "Speaker not found." });

        // Sessions hold this speaker's id. Clear it instead of leaving them
    // pointing at a document that no longer exists — populate() would just
    // return null and the schedule would show a blank speaker.
    await Session.updateMany({ speaker: speaker._id }, { speaker: null });

    await speaker.deleteOne();
    res.json({ message: "Speaker deleted." });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Speaker not found." });
    res.status(500).json({ message: "Failed to delete speaker.", error: error.message });
  }
};

module.exports = {
  getSpeakers,
  getSpeakerById,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
};