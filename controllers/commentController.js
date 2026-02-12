const Comment = require("../models/Comment");
const Recipe = require("../models/Recipe");

exports.createComment = async (req, res, next) => {
  try {
    const { recipeId, text, rating } = req.body;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const comment = await Comment.create({
      recipeId,
      userId: req.user.id,
      text,
      ...(rating !== undefined ? { rating } : {}),
    });

    res.status(201).json({ message: "Comment created", comment });
  } catch (err) {
    next(err);
  }
};

exports.getCommentsByRecipe = async (req, res, next) => {
  try {
    const comments = await Comment.find({ recipeId: req.params.recipeId })
      .sort({ createdAt: -1 })
      .populate("userId", "username");

    res.json({ comments });
  } catch (err) {
    next(err);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = comment.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden: not allowed" });

    const { text, rating } = req.body;
    if (text !== undefined) comment.text = text;
    if (rating !== undefined) comment.rating = rating;

    await comment.save();
    res.json({ message: "Comment updated", comment });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = comment.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden: not allowed" });

    await Comment.deleteOne({ _id: comment._id });
    res.json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
};
