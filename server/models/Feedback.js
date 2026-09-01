const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },
    // Optional: feedback can be about the whole expo, or about one session.
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
    // Set only when a logged-in attendee submits it. A visitor leaving
    // feedback at a kiosk has no account, so this stays null.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    // Optional on purpose — useful feedback shouldn't be gated behind an
    // email address, and we never reply to it automatically.
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    // Lets the admin see *what* people liked, not just an overall number.
    category: {
      type: String,
      enum: ["Overall", "Venue", "Sessions", "Exhibitors", "Organization"],
      default: "Overall",
    },
    // Moderation. An abusive or spam comment gets hidden rather than deleted,
    // so there's still a record of what was submitted.
    status: {
      type: String,
      enum: ["Published", "Hidden"],
      default: "Published",
    },
  },
  { timestamps: true }
);

// The admin page always asks for "this event's feedback, newest first", so
// that's the index worth having.
feedbackSchema.index({ event: 1, createdAt: -1 });

// Ek user, ek event, ek session — ek hi raye. Ooper controller mein findOne se
// bhi check hota hai, magar asli rok yahan hai: do request ek hi waqt par aayen
// to findOne dono ko khaali dikhata hai aur index hi kaam aata hai.
//
// partialFilterExpression zaroori hai. Iske baghair kiosk waali tamaam entries
// (jinka user null hota hai) aapas mein "duplicate" ban jatin, aur doosra
// mehmaan raye hi na de sakta. Ye shart index ko sirf un rows par lagati hai
// jinka user asal mein mojood hai.
feedbackSchema.index(
  { event: 1, session: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);

module.exports = mongoose.model("Feedback", feedbackSchema);