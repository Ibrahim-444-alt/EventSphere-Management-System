const mongoose = require("mongoose");

// A speaker belongs to one event, exactly like Booth and Exhibitor do.
// That keeps every admin list filterable by event in the same way, and a
// speaker who returns next year is simply a new record for that event.
const speakerSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Speaker name is required"],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Speaker lists are almost always scoped to a single event, so that's the
// field worth indexing.
speakerSchema.index({ event: 1 });

module.exports = mongoose.model("Speaker", speakerSchema);  