const jwt = require("jsonwebtoken");
const User = require("../models/User");

// `protect` ka narm bhai. Farq sirf itna: token na ho ya kharab ho to ye 401
// nahi deta, chupke se aage guzar jata hai.
//
// Zaroorat kyun pari? Feedback ka route public rehna chahiye — expo ke kiosk
// par khara mehmaan bina account raye de sakta hai. Magar agar attendee logged
// in hai to us ki raye us ke naam par darj honi chahiye. `protect` lagate to
// kiosk band ho jata; kuch na lagate to logged-in banda bhi gumnaam rehta.
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Mehmaan. req.user set nahi hoga, aur controller usay null samjhega.
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch (error) {
    // Token purana ya kharab tha. Ye route public hai, is liye darwaza band
    // karne ki koi wajah nahi — banda mehmaan ban kar andar aa jata hai.
  }

  next();
};

module.exports = { optionalAuth };