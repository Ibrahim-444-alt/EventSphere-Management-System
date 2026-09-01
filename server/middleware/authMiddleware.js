const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protects routes that require a logged-in user. Reads the JWT from the
// "Authorization: Bearer <token>" header, verifies it, and attaches the
// matching user to req.user so the next handler knows who's asking.
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // select:false on the schema already keeps the password hash out of
    // this by default, so no extra work is needed here.
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user no longer exists." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid or expired token." });
  }
};

module.exports = { protect };