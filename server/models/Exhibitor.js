const mongoose = require("mongoose");

const exhibitorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    companyName: { type: String, required: [true, "Company name is required"], trim: true },
    companyLogo: { type: String, default: "" },
    description: { type: String, default: "" },
    contactPerson: { type: String, required: [true, "Contact person is required"], trim: true },
    email: { type: String, required: [true, "Contact email is required"], trim: true, lowercase: true },
    phone: { type: String, required: [true, "Phone number is required"], trim: true },
    website: { type: String, trim: true, default: "" },
    category: { type: String, trim: true },
    products: { type: [String], default: [] },
    services: { type: [String], default: [] },
    staff: { type: [String], default: [] },
    documents: { type: [String], default: [] },
    booth: { type: mongoose.Schema.Types.ObjectId, ref: "Booth", default: null },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Active", "Inactive"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

exhibitorSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Exhibitor", exhibitorSchema);