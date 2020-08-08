const { bcryptSecret } = require("../apikeys");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let decodedToken, token;
  token = req.get("Authorization");
  if (!token) {
    const err = new Error("Not Authenticated..");
    err.statusCode = 401;
    throw err;
  }
  token = token.split(" ")[1];
  try {
    decodedToken = jwt.verify(token, bcryptSecret);
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const err = new Error("Not Authenticated..");
    err.statusCode = 401;
    throw err;
  }
  req.userId = decodedToken.userId;
  next();
};
