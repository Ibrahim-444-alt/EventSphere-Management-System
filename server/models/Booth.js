const mongoose = require("mongoose");

const boothSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    boothNumber: { type: String, required: [true, "Booth number is required"], trim: true },
    size: { type: String, trim: true },
    category: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Occupied", "Pending", "Maintenance"],
      default: "Available",
    },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "Exhibitor", default: null },
  },
  { timestamps: true }
);

boothSchema.index({ event: 1, boothNumber: 1 }, { unique: true });

module.exports = mongoose.model("Booth", boothSchema);