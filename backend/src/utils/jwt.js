const jwt = require("jsonwebtoken");

function signToken(user) {
  const secret = process.env.JWT_SECRET || "change_this_secret";
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    { expiresIn: "1d" }
  );
}

module.exports = { signToken };
