const express = require("express");
const {
  createContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { optionalAuth } = require("../middleware/optionalAuth");

const router = express.Router();

// Bhejna public hai — bina account koi bhi sawal poochh sakta hai. optionalAuth
// sirf itna karta hai ke logged-in banda ho to us ka account bhi jur jaye.
router.post("/", optionalAuth, createContactMessage);

// Parhna aur mitana sirf admin ka kaam. In paighamon mein logon ke naam, email
// aur zaati sawalat hote hain — wohi wajah jo attendee list aur feedback ke
// liye thi.
router.get("/", protect, authorize("admin"), getContactMessages);
router.put("/:id/status", protect, authorize("admin"), updateContactMessageStatus);
router.delete("/:id", protect, authorize("admin"), deleteContactMessage);

module.exports = router;