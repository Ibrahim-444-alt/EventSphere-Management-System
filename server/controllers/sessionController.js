const Session = require("../models/Session");

// Two sessions overlap when each one starts before the other ends. A speaker
// can't be in two places at once, so we block that at create/update time.
// Times are zero-padded "HH:MM", so string comparison is safe.
const findSpeakerClash = async ({ speaker, date, startTime, endTime, excludeId }) => {
  if (!speaker) return null;

  const query = {
    speaker,
    date,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  // When updating, the session must not clash with itself.
  if (excludeId) query._id = { $ne: excludeId };

  return Session.findOne(query);
};

// @desc    Get sessions, optionally filtered by event, speaker or date
// @route   GET /api/sessions?event=&speaker=&date=
// @access  Public
const getSessions = async (req, res) => {
  try {
    const { event, speaker, date } = req.query;
    const query = {};
    if (event) query.event = event;
    if (speaker) query.speaker = speaker;
    if (date) query.date = date;

    // Unlike the other lists this one is chronological, not newest-first —
    // a schedule only makes sense read forwards in time.
    const sessions = await Session.find(query)
      .populate("event", "title")
      .populate("speaker", "name designation company")
      .sort({ date: 1, startTime: 1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sessions.", error: error.message });
  }
};

// @desc    Get a single session by id
// @route   GET /api/sessions/:id
// @access  Public
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("event", "title")
      .populate("speaker", "name designation company photo bio");

    if (!session) return res.status(404).json({ message: "Session not found." });
    res.json(session);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Session not found." });
    res.status(500).json({ message: "Failed to fetch session.", error: error.message });
  }
};

// @desc    Create a session
// @route   POST /api/sessions
// @access  Private/Admin
const createSession = async (req, res) => {
  try {
    const {
      event, title, description, speaker, date,
      startTime, endTime, hall, capacity, type, status,
    } = req.body;

    if (!event || !title || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Event, title, date, start time and end time are required.",
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    const clash = await findSpeakerClash({ speaker, date, startTime, endTime });
    if (clash) {
      return res.status(400).json({
        message: `That speaker is already booked for "${clash.title}" from ${clash.startTime} to ${clash.endTime}.`,
      });
    }

    const session = await Session.create({
      event,
      title: String(title).trim(),
      description,
      // An empty string from a "no speaker yet" dropdown would fail to cast
      // to an ObjectId, so it becomes an explicit null.
      speaker: speaker || null,
      date,
      startTime,
      endTime,
      hall,
      capacity,
      type,
      status,
    });

    res.status(201).json(session);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create session.", error: error.message });
  }
};

// @desc    Update a session
// @route   PUT /api/sessions/:id
// @access  Private/Admin
const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found." });

    // `event` is left off the whitelist on purpose — moving a session to a
    // different expo would strand its speaker, who belongs to one event.
    const editableFields = [
      "title", "description", "speaker", "date",
      "startTime", "endTime", "hall", "capacity", "type", "status",
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        session[field] = field === "speaker" ? req.body[field] || null : req.body[field];
      }
    });

    // Validate the session's *final* state, after the changes are applied but
    // before we save — so a partial update can't sneak past the checks.
    if (session.endTime <= session.startTime) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    const clash = await findSpeakerClash({
      speaker: session.speaker,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      excludeId: session._id,
    });
    if (clash) {
      return res.status(400).json({
        message: `That speaker is already booked for "${clash.title}" from ${clash.startTime} to ${clash.endTime}.`,
      });
    }

    const updatedSession = await session.save();
    res.json(updatedSession);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Session not found." });
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update session.", error: error.message });
  }
};

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private/Admin
const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found." });

    await session.deleteOne();
    res.json({ message: "Session deleted." });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Session not found." });
    res.status(500).json({ message: "Failed to delete session.", error: error.message });
  }
};

module.exports = {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
};