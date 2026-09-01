const mongoose = require("mongoose");

// Public contact form ka paighaam.
//
// Ye Feedback se milta julta lagta hai magar hai nahi. Feedback kisi expo ke
// baare mein raye hai — event se bandhi hui, rating ke sath, aur us ka status
// ka matlab "public ko dikhani hai ya nahi". Ye ek sawal hai jis ka jawab dena
// hai — kisi expo se bandha nahi, aur is ka status ka matlab "kaam hua ya
// nahi". Do mukhtalif cheezein ek model mein thoosna dono ko kharab karta.
const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
    },

    // enum server par bhi lagaya hai, sirf frontend ke dropdown par bharosa
    // nahi kiya. Dropdown mehez UI hai — Postman se koi bhi kuch bhi bhej
    // sakta hai, aur phir admin ke page par "Subject: kachra" chamakta hai.
    subject: {
      type: String,
      enum: ["General Inquiry", "Booth Application", "Technical Support", "Partnership"],
      default: "General Inquiry",
    },

    message: {
      type: String,
      required: [true, "Message is required."],
      trim: true,
    },

    // "Read" ka faisla admin karta hai, khud ba khud nahi hota. Faida ye hai
    // ke ek admin ne dekh liya to doosre ko bhi pata chal jata hai — do log
    // ek hi sawal ka do baar jawab nahi dete.
    status: {
      type: String,
      enum: ["New", "Read", "Archived"],
      default: "New",
    },

    // Logged-in banda ho to us ka account bhi jor dete hain. Zaroori nahi,
    // form public hai. Magar jab mojood ho to admin ko pata chal jata hai ke
    // ye koi anjaan nahi — hamara registered attendee hai.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Admin ka page hamesha "naye pehle" chahta hai, aur aksar status se chhaan
// kar. Index bilkul isi tarteeb par bana hai.
contactMessageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);