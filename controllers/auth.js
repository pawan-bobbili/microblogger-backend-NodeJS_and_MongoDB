const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const User = require("../models/user");
const keys = require("../apikeys");
const user = require("../models/user");

exports.signup = (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    const err = new Error("Validation Failed..");
    err.data = error.array();
    err.statusCode = 422;
    throw err;
  }
  bcryptjs
    .hash(req.body.password, 12)
    .then((hashedpass) => {
      const user = new User({
        email: req.body.email,
        password: hashedpass,
        name: req.body.name,
      });
      return user.save();
    })
    .then((userdata) => {
      res.status(201).json({
        userId: userdata._id,
      });
    })
    .catch((err) => next(err));
};

exports.login = (req, res, next) => {
  let loadeduser = null;
  return User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        const error = new Error("No Valid Account for this email");
        error.statusCode = 401;
        throw error;
      }
      loadeduser = user;
      return bcryptjs.compare(req.body.password, loadeduser.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong Password");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadeduser.email,
          userId: loadeduser._id.toString(),
        },
        keys.bcryptSecret,
        { expiresIn: "1h" }
      );
      res.status(200).json({ token: token, userId: loadeduser._id.toString() });
    })
    .catch((err) => next(err));
};

exports.getUserStatus = (req, res, next) => {
  return User.findById(req.userId)
    .then((userDoc) => {
      if (!userDoc) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ status: userDoc.status });
    })
    .catch((err) => next(err));
};

exports.updateUserStatus = (req, res, next) => {
  const updatedStatus = req.body.status;
  User.findById(req.userId)
    .then((userDoc) => {
      if (!userDoc) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }
      userDoc.status = updatedStatus;
      return userDoc.save();
    })
    .then((result) => res.status(200).json({ message: "Status updated" }))
    .catch((err) => next(err));
};
