const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned by default in queries/responses
    },
    role: {
      type: String,
      enum: ["admin", "exhibitor", "attendee"],
      default: "attendee",
    },
    // Used later for the "forgot password" flow (still Phase 3, just not
    // built yet). Defined now so we don't have to migrate the schema later.
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash the password before saving — but only if it was actually changed,
// so updating unrelated fields (like `name`) doesn't re-hash an
// already-hashed password.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compares a plain-text password (typed into a login form) against the
// stored hash. Used by the Login API (next step).
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);