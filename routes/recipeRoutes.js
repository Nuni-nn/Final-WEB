const express = require("express");
const Joi = require("joi");

const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const recipeCtrl = require("../controllers/recipeController");

const router = express.Router();

const recipeCreateSchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  description: Joi.string().allow("").max(2000).optional(),
  ingredients: Joi.array().items(Joi.string().min(1).max(200)).default([]),
  steps: Joi.array().items(Joi.string().min(1).max(500)).default([]),
  cookTime: Joi.number().integer().min(0).max(10000).optional(),
  isPublic: Joi.boolean().optional(),
});

const recipeUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(120).optional(),
  description: Joi.string().allow("").max(2000).optional(),
  ingredients: Joi.array().items(Joi.string().min(1).max(200)).optional(),
  steps: Joi.array().items(Joi.string().min(1).max(500)).optional(),
  cookTime: Joi.number().integer().min(0).max(10000).optional(),
  isPublic: Joi.boolean().optional(),
}).min(1);

router.post("/", auth, validate(recipeCreateSchema), recipeCtrl.createRecipe);
router.get("/", auth, recipeCtrl.getMyRecipes);
router.get("/:id", auth, recipeCtrl.getRecipeById);
router.put("/:id", auth, validate(recipeUpdateSchema), recipeCtrl.updateRecipe);
router.delete("/:id", auth, recipeCtrl.deleteRecipe);

module.exports = router;
