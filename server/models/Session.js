const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Only the speaker's id lives here. Their name, company and photo stay
    // in one place in the Speaker collection, so editing them once updates
    // every session they appear in.
    speaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Speaker",
      default: null,
    },
    date: {
      type: Date,
      required: [true, "Session date is required"],
    },
    // Stored as "HH:MM" strings to match the Event model and the browser's
    // <input type="time">. They're zero-padded, so "09:30" < "10:00" is true
    // as plain strings — which is what makes sorting and the overlap check
    // below work without any date maths.
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    hall: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    type: {
      type: String,
      enum: ["Talk", "Workshop", "Panel", "Keynote", "Demo"],
      default: "Talk",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

// A schedule is always read as "everything in this event, in time order".
sessionSchema.index({ event: 1, date: 1, startTime: 1 });

module.exports = mongoose.model("Session", sessionSchema);