const express = require("express");
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { optionalAuth } = require("../middleware/optionalAuth");
const router = express.Router();

// optionalAuth: token ho to pehchan lo, na ho to bhi aage jane do. Route
// public rehta hai (bina account koi bhi expos dekh sakta hai), magar admin
// ka token aaye to controller ko pata chal jata hai ke ye admin hai — aur
// wohi ek shakhs Draft dekh sakta hai.
router.get("/", optionalAuth, getEvents);
router.get("/:id", optionalAuth, getEventById);

router.post("/", protect, authorize("admin"), createEvent);
router.put("/:id", protect, authorize("admin"), updateEvent);
router.delete("/:id", protect, authorize("admin"), deleteEvent);

module.exports = router;