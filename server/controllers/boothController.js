const Booth = require("../models/Booth");
const Exhibitor = require("../models/Exhibitor");

// @desc    Get all booths, optionally filtered by event/status
// @route   GET /api/booths?event=&status=
// @access  Public
const getBooths = async (req, res) => {
  try {
    const { event, status } = req.query;
    const query = {};
    if (event) query.event = event;
    if (status) query.status = status;

    const booths = await Booth.find(query)
      .populate("event", "title")
      .populate("exhibitor", "companyName")
      .sort({ boothNumber: 1 });

    res.json(booths);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booths.", error: error.message });
  }
};

// @desc    Get a single booth by id
// @route   GET /api/booths/:id
// @access  Public
const getBoothById = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id)
      .populate("event", "title")
      .populate("exhibitor", "companyName contactPerson");

    if (!booth) return res.status(404).json({ message: "Booth not found." });
    res.json(booth);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Booth not found." });
    res.status(500).json({ message: "Failed to fetch booth.", error: error.message });
  }
};

// @desc    Create a new booth
// @route   POST /api/booths
// @access  Private/Admin
const createBooth = async (req, res) => {
  try {
    const { event, boothNumber, size, category, status } = req.body;
    if (!event || !boothNumber) {
      return res.status(400).json({ message: "Event and booth number are required." });
    }

    const trimmedNumber = String(boothNumber).trim();

    // Duplicates are scoped to ONE event. The same booth number in a
    // different event is perfectly valid, so both fields go in the query.
    const existing = await Booth.findOne({ event, boothNumber: trimmedNumber });
    if (existing) {
      return res.status(400).json({
        message: "This booth number already exists for this event.",
      });
    }

    const booth = await Booth.create({
      event,
      boothNumber: trimmedNumber,
      size,
      category,
      status,
    });
    res.status(201).json(booth);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "This booth number already exists for this event.",
      });
    }
    res.status(500).json({ message: "Failed to create booth.", error: error.message });
  }
};

// @desc    Update a booth's own details (number, size, category, status)
// @route   PUT /api/booths/:id
// @access  Private/Admin
const updateBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);
    if (!booth) return res.status(404).json({ message: "Booth not found." });

    // If the booth number is changing, it only has to be unique within
    // THIS booth's event — and we exclude the booth itself from the check.
    if (req.body.boothNumber !== undefined) {
      const trimmedNumber = String(req.body.boothNumber).trim();

      const clash = await Booth.findOne({
        event: booth.event,
        boothNumber: trimmedNumber,
        _id: { $ne: booth._id },
      });
      if (clash) {
        return res.status(400).json({
          message: "This booth number already exists for this event.",
        });
      }

      req.body.boothNumber = trimmedNumber;
    }

    const editableFields = ["boothNumber", "size", "category", "status"];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) booth[field] = req.body[field];
    });

    const updatedBooth = await booth.save();
    res.json(updatedBooth);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Booth not found." });
    if (error.code === 11000) {
      return res.status(400).json({
        message: "This booth number already exists for this event.",
      });
    }
    res.status(500).json({ message: "Failed to update booth.", error: error.message });
  }
};

// @desc    Delete a booth
// @route   DELETE /api/booths/:id
// @access  Private/Admin
const deleteBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);
    if (!booth) return res.status(404).json({ message: "Booth not found." });

    if (booth.exhibitor) {
      await Exhibitor.findByIdAndUpdate(booth.exhibitor, { booth: null });
    }

    await booth.deleteOne();
    res.json({ message: "Booth deleted." });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Booth not found." });
    res.status(500).json({ message: "Failed to delete booth.", error: error.message });
  }
};

// @desc    Assign, reassign, or release a booth
// @route   POST /api/booths/:id/assign
// @access  Private/Admin
// Body: { exhibitorId } — pass a real id to assign/reassign, omit or send
// null to release the booth back to Available.
const assignBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);
    if (!booth) return res.status(404).json({ message: "Booth not found." });

    const { exhibitorId } = req.body;

    // Whoever was sitting in THIS booth loses their claim on it.
    if (booth.exhibitor && booth.exhibitor.toString() !== exhibitorId) {
      await Exhibitor.findByIdAndUpdate(booth.exhibitor, { booth: null });
    }

    if (!exhibitorId) {
      booth.exhibitor = null;
      booth.status = "Available";
      const released = await booth.save();
      return res.json(released);
    }

    const exhibitor = await Exhibitor.findById(exhibitorId);
    if (!exhibitor) return res.status(404).json({ message: "Exhibitor not found." });

    // An exhibitor can only hold one booth. If they're already in a
    // different booth, free that one up before moving them here —
    // otherwise the old booth stays marked Occupied forever.
    if (exhibitor.booth && exhibitor.booth.toString() !== booth._id.toString()) {
      await Booth.findByIdAndUpdate(exhibitor.booth, {
        exhibitor: null,
        status: "Available",
      });
    }

    booth.exhibitor = exhibitorId;
    booth.status = "Occupied";
    const updatedBooth = await booth.save();

    exhibitor.booth = booth._id;
    await exhibitor.save();

    res.json(updatedBooth);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Booth or exhibitor not found." });
    }
    res.status(500).json({ message: "Failed to assign booth.", error: error.message });
  }
};

module.exports = { getBooths, getBoothById, createBooth, updateBooth, deleteBooth, assignBooth };