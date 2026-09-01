const jwt = require("jsonwebtoken");

// Creates a signed JWT containing the user's id. The frontend stores this
// token and sends it back on future requests (Authorization: Bearer <token>)
// so protected routes know who's asking, without needing a server-side
// session store.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;