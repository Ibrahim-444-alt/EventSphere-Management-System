const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must look like 09:30 (24-hour)."],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "End time must look like 17:30 (24-hour)."],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    theme: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Draft", "Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Draft",
    },
    registrationDeadline: {
      type: Date,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Ye check kisi ek controller mein nahi, model par hai — aur ye jaan boojh kar
// hai. createEvent, updateEvent, aur aage jo bhi code events banaye (seeder,
// koi script), sab isi model se guzarte hain. Controller mein rakhta to do
// jagah likhna parta aur teesri jagah bhoolne ka poora imkaan tha.
//
// `invalidate()` bilkul waisi hi ValidationError banata hai jaisi `required`
// banati hai, is liye controller ko koi nayi soorat nahi sambhalni parti.
eventSchema.pre("validate", function (next) {
  // Agar shakal hi ghalat hai to `match` apna error pehle hi de raha hai.
  // Waisi soorat mein kachre ka moqabla karke doosra ulta-pulta message
  // barhana banday ko sirf uljhata hai.
  if (
    TIME_PATTERN.test(this.startTime || "") &&
    TIME_PATTERN.test(this.endTime || "") &&
    this.endTime <= this.startTime
  ) {
    // Barabar waqt bhi reject ho raha hai (`<=`), kyunke sifar minute ka expo
    // koi expo nahi.
    //
    // Ye "20:00 se 01:00" jaisa raat bhar chalne wala expo bhi reject kar dega.
    // Ye qeemat jaan boojh kar ada ki hai: har event ke saath ek hi `date` hai,
    // is liye aadhi raat ke baad ka hissa asal mein agli tareekh ka event hai.
    // Agar aage aise events chahiye hon to model mein endDate add karna paregi.
    this.invalidate("endTime", "End time must be after start time.");
  }
  next();
});

module.exports = mongoose.model("Event", eventSchema);