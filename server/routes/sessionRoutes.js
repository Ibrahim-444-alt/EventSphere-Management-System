const express = require("express");
const {
  getSessions, getSessionById, createSession, updateSession, deleteSession,
} = require("../controllers/sessionController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// The public site shows the schedule to visitors, so reads stay open.
router.get("/", getSessions);
router.get("/:id", getSessionById);

router.post("/", protect, authorize("admin"), createSession);
router.put("/:id", protect, authorize("admin"), updateSession);
router.delete("/:id", protect, authorize("admin"), deleteSession);

module.exports = router;