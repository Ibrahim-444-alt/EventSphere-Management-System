const express = require("express");
const { downloadReport } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// One route serves every report — the :type parameter picks which one. Admin
// only: a single request here hands over every attendee's email and phone
// number in a spreadsheet, which is the most sensitive thing in the app.
router.get("/:type", protect, authorize("admin"), downloadReport);

module.exports = router;