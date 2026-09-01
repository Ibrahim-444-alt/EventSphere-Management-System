const express = require("express");
const {
  getSpeakers, getSpeakerById, createSpeaker, updateSpeaker, deleteSpeaker,
} = require("../controllers/speakerController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Reading is public — the event website will list speakers to visitors.
router.get("/", getSpeakers);
router.get("/:id", getSpeakerById);

// Writing is admin only.
router.post("/", protect, authorize("admin"), createSpeaker);
router.put("/:id", protect, authorize("admin"), updateSpeaker);
router.delete("/:id", protect, authorize("admin"), deleteSpeaker);

module.exports = router;