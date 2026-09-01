const express = require("express");
const {
  getMyBookmarks, addBookmark, removeBookmark,
} = require("../controllers/bookmarkController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Teenon raaste sirf attendee ke hain. Yahan koi admin wala list-sab-kuch
// endpoint nahi — kis ne kya save kiya, ye us ki apni cheez hai, aur report
// mein bhi is ki koi zaroorat nahi.
router.get("/", protect, authorize("attendee"), getMyBookmarks);
router.post("/", protect, authorize("attendee"), addBookmark);
router.delete("/:sessionId", protect, authorize("attendee"), removeBookmark);

module.exports = router;