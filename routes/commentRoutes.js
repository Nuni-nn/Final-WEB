const express = require("express");
const Joi = require("joi");

const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const commentCtrl = require("../controllers/commentController");

const router = express.Router();

const createCommentSchema = Joi.object({
  recipeId: Joi.string().hex().length(24).required(),
  text: Joi.string().min(1).max(1000).required(),
  rating: Joi.number().integer().min(1).max(5).optional(),
});

const updateCommentSchema = Joi.object({
  text: Joi.string().min(1).max(1000).optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
}).min(1);

router.post("/", auth, validate(createCommentSchema), commentCtrl.createComment);
router.get("/recipe/:recipeId", auth, commentCtrl.getCommentsByRecipe);
router.put("/:id", auth, validate(updateCommentSchema), commentCtrl.updateComment);
router.delete("/:id", auth, commentCtrl.deleteComment);

module.exports = router;
