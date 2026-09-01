const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

const users = [
  {
    name: "System Admin",
    email: "admin@eventsphere.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Default Exhibitor",
    email: "exhibitor@eventsphere.com",
    password: "Exhibitor@123",
    role: "exhibitor",
  },
  {
    name: "Default Attendee",
    email: "attendee@eventsphere.com",
    password: "Attendee@123",
    role: "attendee",
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    for (const userData of users) {
      const existingUser = await User.findOne({
        email: userData.email,
      });

      if (existingUser) {
        console.log("Already exists: " + userData.email);
        continue;
      }

      await User.create(userData);

      console.log("Created: " + userData.email);
    }

    console.log("User seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedUsers();