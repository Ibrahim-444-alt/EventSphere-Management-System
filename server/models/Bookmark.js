const mongoose = require("mongoose");

// Ek attendee ne ek session save kiya — bas itna. Session ki tafseel (title,
// waqt, hall) yahan copy nahi hoti; sirf uski id rehti hai. Is liye organizer
// waqt badal de to saved list mein bhi naya waqt aata hai, purana nahi.
const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
  },
  { timestamps: true }
);

// Ek session do bar save nahi ho sakta. Ye rok database ki satah par hai — code
// mein bhoolne ki gunjaish hi nahi rehti. Sath hi "meri saved list" ki query
// isi index se tez chalti hai.
bookmarkSchema.index({ user: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);