const express = require("express");
const {
  getBooths, getBoothById, createBooth, updateBooth, deleteBooth, assignBooth,
} = require("../controllers/boothController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getBooths);
router.get("/:id", getBoothById);

router.post("/", protect, authorize("admin"), createBooth);
router.put("/:id", protect, authorize("admin"), updateBooth);
router.delete("/:id", protect, authorize("admin"), deleteBooth);
router.post("/:id/assign", protect, authorize("admin"), assignBooth);

module.exports = router;