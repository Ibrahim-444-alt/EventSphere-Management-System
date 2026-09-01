// Restricts a route to specific roles. Must run AFTER `protect`, since it
// depends on req.user already being set by that middleware.
//
// Usage: router.post("/events", protect, authorize("admin"), createEvent);
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user found on request." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = { authorize };