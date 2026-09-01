const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // Set when a logged-in attendee registers themselves (Phase 6). Walk-ins
    // added at the registration desk have no account, so this stays null and
    // the name/email below are the source of truth.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Attendee name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    ticketType: {
      type: String,
      enum: ["General", "Student", "VIP", "Press"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["Registered", "Cancelled"],
      default: "Registered",
    },
    // Whether they physically showed up. Kept as a boolean plus a timestamp
    // rather than another status value, so "registered" and "arrived" stay
    // two independent facts.
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkInAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One registration per email PER EVENT. The event is part of the key on
// purpose: the same person attending next year's expo is a separate, valid
// registration. A unique index on `email` alone would let someone attend
// exactly one event ever — the same trap the booth index fell into.
registrationSchema.index({ event: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);