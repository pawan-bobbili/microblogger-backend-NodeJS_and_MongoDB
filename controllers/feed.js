const fs = require("fs");
const path = require("path");

const Post = require("../models/post");
const User = require("../models/user");
const io = require("../socket");

exports.getPosts = (req, res, next) => {
  const pageNumber = req.query.page;
  let totalItems = 0;
  const perPage = 2;
  return Post.countDocuments()
    .then((num) => {
      totalItems = num;
      return Post.find()
        .skip((pageNumber - 1) * perPage)
        .limit(perPage)
        .populate("creator")
        .then((posts) => {
          if (!posts || !posts.length) {
            const error = new Error("No Posts Found");
            error.statusCode = 404;
            throw error;
          }
          res.status(200).json({
            posts,
            totalItems: totalItems,
          });
        });
    })
    .catch((err) => {
      //console.log(err);
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  return Post.findById(postId)
    .populate("creator")
    .then((post) => {
      if (!post) {
        const error = new Error("No Posts Found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        post,
      });
    })
    .catch((err) => {
      //console.log(err);
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imageUrl: req.file.filename,
    creator: req.userId,
  });
  let creator;
  return post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post); // post will get _id attribute after .save() aned now mongoose will automatically select _id from given document
      return user.save();
    })
    .then((result) => {
      io.getIO().emit("posts", {
        action: "create",
        post: { ...post, creator: { _id: req.userId, name: creator.name } },
      });
      res.status(201).json({
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.editPost = (req, res, next) => {
  const postId = req.params.postId;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.filename;
  }
  if (!imageUrl) {
    const error = new Error("No Image Found");
    error.statusCode = 422;
    throw error;
  }
  return Post.findById(postId).then((post) => {
    if (!post) {
      const error = new Error("No Post Found to edit");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Authorization failed");
      error.statusCode = 403;
      throw error;
    }
    if (post.imageUrl !== imageUrl) {
      deleteImage(post.imageUrl);
      post.imageUrl = imageUrl;
    }
    post.title = req.body.title;
    post.content = req.body.content;
    return post
      .save()
      .then((post) => {
        res.status(200).json({ post });
      })
      .catch((err) => {
        //console.log(err);
        next(err);
      });
  });
};

exports.deletePost = (req, res, next) => {
  let deletedPost;
  return Post.findById(req.params.postId)
    .then((post) => {
      if (!post) {
        const error = new Error("No Post Found to delete");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Authorization failed");
        error.statusCode = 403;
        throw error;
      }
      deleteImage(post.imageUrl);
      return Post.findByIdAndRemove(req.params.postId);
    })
    .then((result) => {
      deletedPost = result;
      return User.findById(req.userId);
    })
    .then((userD) => {
      userD.posts.pull(req.params.postId);
      return userD.save();
    })
    .then((result) => {
      res.status(201).json({ post: deletedPost });
    })
    .catch((err) => {
      //console.log(err);
      next(err);
    });
};

const deleteImage = (filename) => {
  fs.unlink(path.join(__dirname, "..", "images", filename), () => {
    console.log(path.join(__dirname, "..", "images", filename) + "deleted");
  });
};
