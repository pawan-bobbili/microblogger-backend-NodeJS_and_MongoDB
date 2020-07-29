const express = require("express");
const { body } = require("express-validator");
const multer = require("multer");
const path = require("path");

const feedController = require("../controllers/feed");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "images")); // No preceeding '/' , because then it will be considered as absolute path from C:drive
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + Date.now().toString() + "." + file.mimetype.split("/")[1]
    );
  },
});
const createPostDataHandler = multer({ storage: postStorage }).single("image");

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

//GET /feed/post
router.get("/post/:postId", isAuth, feedController.getPost);

// POST /feed/post
router.post(
  "/post",
  isAuth,
  createPostDataHandler,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

router.put(
  "/post/:postId",
  isAuth,
  createPostDataHandler,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.editPost
);

router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
