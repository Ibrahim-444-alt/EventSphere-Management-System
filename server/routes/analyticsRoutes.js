const express = require("express");
const {
  getOverview,
  getRecentActivity,
  getPublicStats,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Sirf chaar gintiyan, Home page ke hero ke neeche ke liye. Bina taala.
//
// Ghaur karein: feedbackRoutes waali tarteeb ki majboori yahan NAHI hai. Wahan
// /feedback/public ko /feedback/:id se PEHLE rakhna parta tha, kyunke :id har
// cheez se match kar leta hai aur /public bhi us ke jaal mein aa jata. Yahan
// teenon raste poore likhe hue naam hain, koi :param nahi — is liye tarteeb se
// asal mein koi farq nahi parta. Phir bhi public ko ooper rakha hai, sirf
// parhne wale ki khatir: pehli nazar mein pata chal jaye ke is file mein ek
// route khula hua hai.
router.get("/public", getPublicStats);

// Baaqi dono poore expo ki andar ki tafseel dete hain. Admin only.
router.get("/overview", protect, authorize("admin"), getOverview);
router.get("/recent", protect, authorize("admin"), getRecentActivity);

module.exports = router;