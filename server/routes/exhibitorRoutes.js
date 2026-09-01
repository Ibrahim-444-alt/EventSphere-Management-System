const express = require("express");
const {
  getExhibitors,
  getExhibitorById,
  getMyApplications,
  applyAsExhibitor,
  updateExhibitor,
  approveExhibitor,
  rejectExhibitor,
} = require("../controllers/exhibitorController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// ⚠️ Ye line "/:id" se PEHLE honi zaroori hai.
//
// Express routes ko upar se neeche match karta hai aur pehla match jeet jata
// hai. Agar "/:id" pehle hota to "/me" bhi usi par match kar jata, id = "me"
// ban jati, aur findById("me") CastError de kar 404 "Exhibitor not found."
// bhej deta — jo sabse confusing qism ka bug hai, kyunki code bilkul theek
// dikhta hai.
router.get("/me", protect, authorize("exhibitor"), getMyApplications);
router.post("/apply", protect, authorize("exhibitor"), applyAsExhibitor);

router.get("/", getExhibitors);
router.get("/:id", getExhibitorById);

// Yahan sirf protect hai, authorize nahi — controller ke andar khud faisla
// hota hai ke ye banda is record ka owner hai ya admin.
router.put("/:id", protect, updateExhibitor);
router.put("/:id/approve", protect, authorize("admin"), approveExhibitor);
router.put("/:id/reject", protect, authorize("admin"), rejectExhibitor);

module.exports = router;