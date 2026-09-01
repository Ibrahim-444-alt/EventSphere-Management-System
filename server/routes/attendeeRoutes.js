const express = require("express");
const {
  getAttendees, getAttendeeById, createAttendee,
  updateAttendee, checkInAttendee, deleteAttendee,
  registerForEvent, getMyRegistrations, cancelMyRegistration,
} = require("../controllers/attendeeController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Self-service routes sab se upar. /me ka /:id se pehle aana lazmi hai — warna
// Express "me" ko id samajh kar findById("me") chalata hai, CastError aata hai,
// aur user ko galat-fehmi wala 404 milta hai. Yehi ghalti exhibitor routes mein
// pakri gayi thi.
router.get("/me", protect, getMyRegistrations);
router.post("/register", protect, authorize("attendee"), registerForEvent);
// Sirf protect — malikana ka faisla controller khud karta hai, taake attendee
// apni registration cancel kar sake aur admin kisi ki bhi.
router.put("/:id/cancel", protect, cancelMyRegistration);

// Baqi sab admin only, reads bhi. Attendee list zaati maloomat hai (naam, email,
// phone) — speaker ya session list ki tarah public content nahi.
router.get("/", protect, authorize("admin"), getAttendees);
router.get("/:id", protect, authorize("admin"), getAttendeeById);
router.post("/", protect, authorize("admin"), createAttendee);
router.put("/:id", protect, authorize("admin"), updateAttendee);
router.put("/:id/check-in", protect, authorize("admin"), checkInAttendee);
router.delete("/:id", protect, authorize("admin"), deleteAttendee);

module.exports = router;