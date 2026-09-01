const mongoose = require("mongoose");

// Baaqi tamaam models mein bohat se documents hote hain — bohat se events,
// bohat se booths. Ye model ulta hai: poori application ke liye settings ka
// sirf EK document hona chahiye. Isko singleton kehte hain, aur yahan wo
// neeche waale fixed `key` field se enforce ho raha hai.
const settingsSchema = new mongoose.Schema(
  {
    // Hamesha "global". Controller ka har read aur write { key: "global" }
    // dhoondta hai, aur unique index doosra settings document banna hi
    // namumkin kar deta hai — chahe koi future code galti se try kare.
    key: {
      type: String,
      default: "global",
      unique: true,
    },

    organizationName: {
      type: String,
      required: [true, "Organization name is required."],
      trim: true,
      default: "EventSphere",
    },

    // Contact details optional hain, isliye default khaali string hai — null
    // nahi, warna frontend ko har jagah null-check karna parta.
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },

    // false hote hi API nayi attendee registration lena band kar deti hai.
    // Ye asli switch hai, sirf label nahi — attendeeController.createAttendee
    // dekhein.
    registrationsOpen: {
      type: Boolean,
      default: true,
    },

    // Wahi baat public feedback form ke liye.
    feedbackOpen: {
      type: Boolean,
      default: true,
    },

    // Aakhri baar kis admin ne save kiya. Asli deployment mein jahan kai
    // admins hon, ye kaam aata hai — aur kharch sirf ek field ka hai.
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Settings parhta hai, aur sabse pehli baar par khud bana deta hai.
//
// Iske baghair har caller ko khaali database ke liye `null` handle karna
// parta, aur admin ko ek dafa save karne tak khaali page dikhta. `upsert: true`
// ka matlab hai "na mile to insert kar do", aur `$setOnInsert` sirf usi insert
// ke waqt likhta hai — is liye maujooda document kabhi defaults se overwrite
// nahi hota.
settingsSchema.statics.getSettings = function () {
  return this.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model("Settings", settingsSchema);