const express = require("express");
const {
  getFeedback,
  getPublicFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { optionalAuth } = require("../middleware/optionalAuth");

const router = express.Router();

// Submitting is public — visitors leave feedback without making an account.
// optionalAuth sirf ye karta hai ke logged-in attendee ki raye us ke naam par
// darj ho jaye. Kiosk par aaya mehmaan pehle ki tarah bina token de sakta hai.
router.post("/", optionalAuth, createFeedback);

// Ye line "/:id" se PEHLE honi laazmi hai. Express routes ko upar se neeche
// aazmata hai aur pehla milne wala jeet jata hai. Agar "/:id" pehle hota to
// "/feedback/public" us se match kar jata, req.params.id ban jata "public",
// protect chal parta, aur public page ko 401 milta — ek aisa bug jo dekh kar
// samajh hi nahi aata ke kahan se aaya.
router.get("/public", getPublicFeedback);

// Reading and moderating is admin only: feedback carries names, emails and
// people's honest complaints, same reasoning as the attendee list.
router.get("/", protect, authorize("admin"), getFeedback);
router.get("/:id", protect, authorize("admin"), getFeedbackById);
router.put("/:id/status", protect, authorize("admin"), updateFeedbackStatus);
router.delete("/:id", protect, authorize("admin"), deleteFeedback);

module.exports = router;