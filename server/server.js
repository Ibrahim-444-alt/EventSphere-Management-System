
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://event-sphere-management-system-gamma.vercel.app"
    ],
    credentials: true
}));

app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/exhibitors", require("./routes/exhibitorRoutes"));
app.use("/api/booths", require("./routes/boothRoutes"));
app.use("/api/speakers", require("./routes/speakerRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));
app.use("/api/attendees", require("./routes/attendeeRoutes"));
app.use("/api/bookmarks", require("./routes/bookmarkRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "EventSphere API is running"
    });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;

