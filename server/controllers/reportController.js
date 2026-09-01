const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Exhibitor = require("../models/Exhibitor");
const Booth = require("../models/Booth");
const Session = require("../models/Session");
const Feedback = require("../models/Feedback");

// Excel and Sheets read a field as-is unless it's quoted. So any value
// containing a comma, a quote or a line break has to be wrapped in quotes,
// and inner quotes doubled. Skipping this is how one comment like
// "Good, but crowded" silently pushes every column after it one to the right.
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const toCsv = (columns, rows) => {
  const header = columns.map((col) => escapeCsvValue(col.header)).join(",");
  const body = rows.map((row) =>
    columns.map((col) => escapeCsvValue(col.value(row))).join(",")
  );

  // \r\n rather than \n — that's the line ending Excel expects.
  return [header, ...body].join("\r\n");
};

// ISO slices, not toLocaleString(): a report gets opened on someone else's
// machine, and "10/09/2026" is a different date in Karachi than in New York.
const formatDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const formatDateTime = (value) =>
  value ? new Date(value).toISOString().slice(0, 16).replace("T", " ") : "";

// One entry per downloadable report. Adding a new report means adding a key
// here — the route, the CSV building and the file download all stay untouched.
const REPORTS = {
  attendees: {
    filename: "attendees",
    fetch: (scope) =>
      Registration.find(scope).populate("event", "title").sort({ createdAt: -1 }),
    columns: [
      { header: "Name", value: (r) => r.name },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: "Organization", value: (r) => r.organization },
      { header: "Event", value: (r) => r.event?.title },
      { header: "Ticket Type", value: (r) => r.ticketType },
      { header: "Status", value: (r) => r.status },
      { header: "Checked In", value: (r) => (r.checkedIn ? "Yes" : "No") },
      { header: "Check-in Time", value: (r) => formatDateTime(r.checkInAt) },
      { header: "Registered On", value: (r) => formatDate(r.createdAt) },
    ],
  },

  exhibitors: {
    filename: "exhibitors",
    fetch: (scope) =>
      Exhibitor.find(scope)
        .populate("event", "title")
        .populate("booth", "boothNumber")
        .sort({ createdAt: -1 }),
    columns: [
      { header: "Company", value: (r) => r.companyName },
      { header: "Contact Person", value: (r) => r.contactPerson },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: "Category", value: (r) => r.category },
      { header: "Website", value: (r) => r.website },
      { header: "Event", value: (r) => r.event?.title },
      { header: "Booth", value: (r) => r.booth?.boothNumber },
      { header: "Status", value: (r) => r.status },
      { header: "Applied On", value: (r) => formatDate(r.createdAt) },
    ],
  },

  booths: {
    filename: "booths",
    fetch: (scope) =>
      Booth.find(scope)
        .populate("event", "title")
        .populate("exhibitor", "companyName")
        .sort({ boothNumber: 1 }),
    columns: [
      { header: "Booth Number", value: (r) => r.boothNumber },
      { header: "Event", value: (r) => r.event?.title },
      { header: "Size", value: (r) => r.size },
      { header: "Category", value: (r) => r.category },
      { header: "Status", value: (r) => r.status },
      { header: "Exhibitor", value: (r) => r.exhibitor?.companyName },
    ],
  },

  sessions: {
    filename: "sessions",
    fetch: (scope) =>
      Session.find(scope)
        .populate("event", "title")
        .populate("speaker", "name company")
        .sort({ date: 1, startTime: 1 }),
    columns: [
      { header: "Title", value: (r) => r.title },
      { header: "Event", value: (r) => r.event?.title },
      { header: "Date", value: (r) => formatDate(r.date) },
      { header: "Start", value: (r) => r.startTime },
      { header: "End", value: (r) => r.endTime },
      { header: "Hall", value: (r) => r.hall },
      { header: "Type", value: (r) => r.type },
      { header: "Speaker", value: (r) => r.speaker?.name },
      { header: "Speaker Company", value: (r) => r.speaker?.company },
      { header: "Capacity", value: (r) => r.capacity },
      { header: "Status", value: (r) => r.status },
    ],
  },

  feedback: {
    filename: "feedback",
    fetch: (scope) =>
      Feedback.find(scope)
        .populate("event", "title")
        .populate("session", "title")
        .sort({ createdAt: -1 }),
    columns: [
      { header: "Name", value: (r) => r.name },
      { header: "Email", value: (r) => r.email },
      { header: "Event", value: (r) => r.event?.title },
      { header: "Session", value: (r) => r.session?.title },
      { header: "Rating", value: (r) => r.rating },
      { header: "Category", value: (r) => r.category },
      { header: "Status", value: (r) => r.status },
      { header: "Comment", value: (r) => r.comment },
      { header: "Submitted On", value: (r) => formatDate(r.createdAt) },
    ],
  },
};

// @desc    Download a report as CSV
// @route   GET /api/reports/:type
// @access  Private/Admin
const downloadReport = async (req, res) => {
  try {
    const report = REPORTS[req.params.type];

    if (!report) {
      return res.status(404).json({
        message: "Unknown report type.",
        available: Object.keys(REPORTS),
      });
    }

    const eventId = req.query.event;

    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id." });
    }

    // No ObjectId cast needed here, unlike the analytics controller — these
    // are find() queries, and find() casts the string for you. It's only
    // aggregate() that hands the value to MongoDB untouched.
    const scope = eventId ? { event: eventId } : {};

    const rows = await report.fetch(scope);
    const csv = toCsv(report.columns, rows);

    const stamp = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    // This header is what makes the browser save a file instead of printing
    // the text on screen.
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.filename}-${stamp}.csv"`
    );

    // The \uFEFF is a byte-order mark. Excel assumes a CSV is in the local
    // Windows encoding unless it sees this, which is what turns names with
    // accents or Urdu characters into garbage.
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    res.status(500).json({ message: "Failed to build the report.", error: error.message });
  }
};

module.exports = { downloadReport };