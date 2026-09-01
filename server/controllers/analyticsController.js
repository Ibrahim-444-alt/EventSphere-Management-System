const mongoose = require("mongoose");
const Event = require("../models/Event");
const Exhibitor = require("../models/Exhibitor");
const Booth = require("../models/Booth");
const Session = require("../models/Session");
const Speaker = require("../models/Speaker");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");

// Copied from the schema enums. Listed here so the response always contains
// every possible value, in a fixed order, even the ones sitting at zero.
const EXHIBITOR_STATUSES = ["Pending", "Approved", "Rejected", "Active", "Inactive"];
const BOOTH_STATUSES = ["Available", "Reserved", "Occupied", "Pending", "Maintenance"];
const TICKET_TYPES = ["General", "Student", "VIP", "Press"];
const SESSION_TYPES = ["Talk", "Workshop", "Panel", "Keynote", "Demo"];
const FEEDBACK_CATEGORIES = ["Overall", "Venue", "Sessions", "Exhibitors", "Organization"];
const RATING_VALUES = [5, 4, 3, 2, 1];

// Groups a collection by one field and returns [{ label, count }].
//
// MongoDB only reports the values that actually occur, so if nobody bought a
// VIP ticket, "VIP" is simply missing from the result. A chart with a missing
// bar looks broken, so we fill the gaps against the known enum here — the
// browser shouldn't have to know the schema.
const countByField = async (Model, field, filter, expectedValues) => {
  const rows = await Model.aggregate([
    { $match: filter },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);

  const counts = {};
  rows.forEach((row) => {
    counts[row._id] = row.count;
  });

  return expectedValues.map((value) => ({
    label: value,
    count: counts[value] || 0,
  }));
};

// Ye ALAG function hai, aur ye jaan boojh kar hai. Neeche wala getOverview
// kaarobari maloomat deta hai — kis expo mein kitne log ne cancel kiya, kaun sa
// expo sab se bhara, kitne booths khaali pare hain. Ye cheezein mukablay walon
// ke liye qeemti hain aur bahar nahi jani chahiye.
//
// Ek hi route audience ke hisaab se andaza nahi lagata. Jo public hai, wo apna
// chhota, alag, sirf-ginti wala route rakhta hai — bilkul wohi soch jo
// /api/feedback/public aur /api/settings/public ke peeche hai.
//
// @desc    Four public counters for the home page
// @route   GET /api/analytics/public
// @access  Public
const getPublicStats = async (req, res) => {
  try {
    // Draft bahar hai kyunke wo abhi kisi ko nazar hi nahi aata — jo cheez
    // public site par mojood nahi, us ko public ginti mein daalna ghalat hai.
    // Cancelled bahar hai kyunke wo hua hi nahi.
    const eventFilter = { status: { $in: ["Upcoming", "Ongoing", "Completed"] } };

    // Chaaron ginti ek doosre se bilkul azaad hain, is liye ek saath chal rahi
    // hain — ek ke baad ek nahi. (Wohi tareeqa jo getOverview mein hai.)
    const [events, exhibitors, attendees, locations] = await Promise.all([
      Event.countDocuments(eventFilter),

      // Pending aur Rejected shamil nahi. Jis company ki darkhwast abhi manzoor
      // hui hi nahi, us ko "hamare exhibitors" mein ginna ek jhoot hai — aur
      // Rejected ko ginna to sarahatan jhoot hai.
      Exhibitor.countDocuments({ status: { $in: ["Approved", "Active"] } }),

      // Cancelled registration ek khaali kursi hai. Us ko attendee kehna wohi
      // purani marketing wali chaalaki hai jo hum is page se nikaal rahe hain.
      Registration.countDocuments({ status: "Registered" }),

      // distinct() ek jaisi jagahon ko khud jor deta hai, magar sirf bilkul
      // harf-ba-harf match par. Us ke liye "Expo Centre Karachi" aur
      // "expo centre karachi " do alag jagahen hain — is liye neeche Set ke
      // zariye chhote harf aur trim kar ke dobara ginte hain.
      Event.distinct("location", eventFilter),
    ]);

    const venues = new Set(locations.map((place) => place.trim().toLowerCase())).size;

    res.json({ events, exhibitors, attendees, venues });
  } catch (error) {
    res.status(500).json({ message: "Failed to load stats.", error: error.message });
  }
};

// @desc    Dashboard/analytics numbers, optionally for a single event
// @route   GET /api/analytics/overview
// @access  Private/Admin
const getOverview = async (req, res) => {
  try {
    const eventId = req.query.event;

    // A malformed id would blow up inside the aggregation pipeline with an
    // ugly 500, so it gets caught up front as a clean 400.
    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id." });
    }

    // IMPORTANT: find() quietly casts a string id into an ObjectId for you,
    // but aggregate() does NOT — the pipeline is passed straight to MongoDB,
    // where the string "68f2..." does not equal ObjectId("68f2..."). Without
    // this cast every $match below would silently match zero documents and
    // the whole page would show honest-looking zeros.
    const scope = eventId ? { event: new mongoose.Types.ObjectId(eventId) } : {};
    const registeredScope = { ...scope, status: "Registered" };
    const publishedScope = { ...scope, status: "Published" };

    // All of these are independent, so they run at the same time instead of
    // one after another.
    const [
      totalEvents,
      totalExhibitors,
      totalBooths,
      totalSessions,
      totalSpeakers,
      totalRegistrations,
      totalFeedback,
      registeredCount,
      cancelledCount,
      checkedInCount,
      exhibitorsByStatus,
      boothsByStatus,
      registrationsByTicketType,
      sessionsByType,
      feedbackByRating,
      feedbackByCategory,
      feedbackAverageRows,
      topEventRows,
    ] = await Promise.all([
      // Scoping to one event means the event count is, by definition, 1.
      eventId ? 1 : Event.countDocuments(),
      Exhibitor.countDocuments(scope),
      Booth.countDocuments(scope),
      Session.countDocuments(scope),
      Speaker.countDocuments(scope),
      Registration.countDocuments(scope),
      Feedback.countDocuments(scope),

      Registration.countDocuments(registeredScope),
      Registration.countDocuments({ ...scope, status: "Cancelled" }),
      Registration.countDocuments({ ...scope, checkedIn: true }),

      countByField(Exhibitor, "status", scope, EXHIBITOR_STATUSES),
      countByField(Booth, "status", scope, BOOTH_STATUSES),
      // Cancelled registrations are excluded — a ticket-type split should
      // describe who is actually coming.
      countByField(Registration, "ticketType", registeredScope, TICKET_TYPES),
      countByField(Session, "type", scope, SESSION_TYPES),
      // Hidden feedback is left out for the same reason the Feedback page
      // leaves it out of the average: it's spam, not an opinion.
      countByField(Feedback, "rating", publishedScope, RATING_VALUES),
      countByField(Feedback, "category", publishedScope, FEEDBACK_CATEGORIES),

      Feedback.aggregate([
        { $match: publishedScope },
        { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
      ]),

      // Busiest events by head count. Deliberately NOT scoped — the whole
      // point is to compare events against each other.
      Registration.aggregate([
        { $match: { status: "Registered" } },
        { $group: { _id: "$event", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // $group with _id:null returns either one row or an empty array (when
    // there's no published feedback at all), so it needs a fallback.
    const averageRow = feedbackAverageRows[0];
    const averageRating = averageRow ? Number(averageRow.average.toFixed(1)) : 0;

    const boothCount = (label) =>
      boothsByStatus.find((row) => row.label === label)?.count || 0;

    const occupiedBooths = boothCount("Occupied");

    res.json({
      totals: {
        events: totalEvents,
        exhibitors: totalExhibitors,
        booths: totalBooths,
        sessions: totalSessions,
        speakers: totalSpeakers,
        registrations: totalRegistrations,
        feedback: totalFeedback,
      },
      registrations: {
        registered: registeredCount,
        cancelled: cancelledCount,
        checkedIn: checkedInCount,
        // What share of registered people actually turned up — the number
        // that tells you whether registration is worth anything.
        turnoutRate: registeredCount
          ? Math.round((checkedInCount / registeredCount) * 100)
          : 0,
        byTicketType: registrationsByTicketType,
      },
      booths: {
        occupied: occupiedBooths,
        available: boothCount("Available"),
        occupancyRate: totalBooths ? Math.round((occupiedBooths / totalBooths) * 100) : 0,
        byStatus: boothsByStatus,
      },
      exhibitors: {
        byStatus: exhibitorsByStatus,
      },
      sessions: {
        byType: sessionsByType,
      },
      feedback: {
        published: averageRow ? averageRow.count : 0,
        averageRating,
        byRating: feedbackByRating,
        byCategory: feedbackByCategory,
      },
      // Just ids and counts. The client already has the event list, so it can
      // attach the titles itself — no $lookup needed.
      topEvents: topEventRows.map((row) => ({ event: row._id, count: row.count })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to build the analytics.", error: error.message });
  }
};

// @desc    Newest attendee registrations and exhibitor applications, mixed
// @route   GET /api/analytics/recent
// @access  Private/Admin
const getRecentActivity = async (req, res) => {
  try {
    const eventId = req.query.event;

    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id." });
    }

    // find(), not aggregate() — so the plain string id is cast for us here.
    const scope = eventId ? { event: eventId } : {};
    const limit = 5;

    // Each collection returns only its own newest few. Fetching both lists in
    // full and sorting them in the browser would mean downloading thousands
    // of rows in order to display five.
    const [registrations, exhibitors] = await Promise.all([
      Registration.find(scope)
        .populate("event", "title")
        .sort({ createdAt: -1 })
        .limit(limit),
      Exhibitor.find(scope)
        .populate("event", "title")
        .sort({ createdAt: -1 })
        .limit(limit),
    ]);

    // Both kinds of record are flattened into one shape so the dashboard can
    // show them in a single table without caring where each row came from.
    const activity = [
      ...registrations.map((item) => ({
        id: item._id,
        name: item.name,
        type: "Attendee",
        event: item.event?.title || "Unknown event",
        date: item.createdAt,
      })),
      ...exhibitors.map((item) => ({
        id: item._id,
        name: item.companyName,
        type: "Exhibitor",
        event: item.event?.title || "Unknown event",
        date: item.createdAt,
      })),
    ]
      // Two individually-sorted lists are not sorted once you concatenate
      // them, so the merged array is sorted again before being trimmed.
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: "Failed to load recent activity.", error: error.message });
  }
};

module.exports = { getOverview, getRecentActivity, getPublicStats };