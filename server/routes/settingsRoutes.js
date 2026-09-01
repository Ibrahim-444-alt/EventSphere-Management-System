const express = require("express");
const {
  getSettings,
  getPublicSettings,
  updateSettings,
} = require("../controllers/settingsController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public version ka apna alag URL hai, bajaye is ke ke wohi route dekhta rahe
// "poochne wala kaun hai". Ek URL, ek audience — controller ko kabhi guess
// nahi karna parta ke kitna data bhejna hai.
router.get("/public", getPublicSettings);

router.get("/", protect, authorize("admin"), getSettings);
router.put("/", protect, authorize("admin"), updateSettings);

module.exports = router;