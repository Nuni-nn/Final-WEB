const express = require("express");
const Joi = require("joi");

const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");
const validateObjectId = require("../middleware/validateObjectId");
const recipeCtrl = require("../controllers/recipeController");

const router = express.Router();

const recipeCreateSchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  description: Joi.string().allow("").max(2000).optional(),
  ingredients: Joi.array().items(Joi.string().min(1).max(200)).default([]),
  steps: Joi.array().items(Joi.string().min(1).max(500)).default([]),
  cookTime: Joi.number().integer().min(0).max(10000).optional(),
  isPublic: Joi.boolean().optional(),
  categoryId: Joi.string().hex().length(24).allow(null).optional(),
  categoryName: Joi.string().trim().min(2).max(80).allow("", null).optional(),
});

const recipeUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(120).optional(),
  description: Joi.string().allow("").max(2000).optional(),
  ingredients: Joi.array().items(Joi.string().min(1).max(200)).optional(),
  steps: Joi.array().items(Joi.string().min(1).max(500)).optional(),
  cookTime: Joi.number().integer().min(0).max(10000).optional(),
  isPublic: Joi.boolean().optional(),
  categoryId: Joi.string().hex().length(24).allow(null).optional(),
  categoryName: Joi.string().trim().min(2).max(80).allow("", null).optional(),
}).min(1);

const adminRecipeCreateSchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  description: Joi.string().allow("").max(2000).optional(),
  ingredients: Joi.array().items(Joi.string().min(1).max(200)).default([]),
  steps: Joi.array().items(Joi.string().min(1).max(500)).default([]),
  cookTime: Joi.number().integer().min(0).max(10000).optional(),
  isPublic: Joi.boolean().optional(),
  categoryId: Joi.string().hex().length(24).allow(null).optional(),
  categoryName: Joi.string().trim().min(2).max(80).allow("", null).optional(),
  userId: Joi.string().hex().length(24).optional(),
});

const adminRecipeUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(120).optional(),
  description: Joi.string().allow("").max(2000).optional(),
  ingredients: Joi.array().items(Joi.string().min(1).max(200)).optional(),
  steps: Joi.array().items(Joi.string().min(1).max(500)).optional(),
  cookTime: Joi.number().integer().min(0).max(10000).optional(),
  isPublic: Joi.boolean().optional(),
  categoryId: Joi.string().hex().length(24).allow(null).optional(),
  categoryName: Joi.string().trim().min(2).max(80).allow("", null).optional(),
  userId: Joi.string().hex().length(24).optional(),
}).min(1);

router.post("/", auth, validate(recipeCreateSchema), recipeCtrl.createRecipe);
router.get("/", auth, recipeCtrl.getMyRecipes);
router.get("/public", recipeCtrl.getPublicRecipes);
router.get("/admin/all", auth, requireRole("admin"), recipeCtrl.adminGetAllRecipes);
router.get("/admin/:id", auth, requireRole("admin"), validateObjectId("id"), recipeCtrl.adminGetRecipeById);
router.post("/admin", auth, requireRole("admin"), validate(adminRecipeCreateSchema), recipeCtrl.adminCreateRecipe);
router.put("/admin/:id", auth, requireRole("admin"), validateObjectId("id"), validate(adminRecipeUpdateSchema), recipeCtrl.adminUpdateRecipe);
router.get("/:id", auth, validateObjectId("id"), recipeCtrl.getRecipeById);
router.put("/:id", auth, validateObjectId("id"), validate(recipeUpdateSchema), recipeCtrl.updateRecipe);
router.delete("/:id", auth, validateObjectId("id"), recipeCtrl.deleteRecipe);
router.delete("/:id/admin", auth, requireRole("admin"), validateObjectId("id"), recipeCtrl.adminDeleteRecipe);

module.exports = router;
