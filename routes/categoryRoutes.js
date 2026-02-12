const express = require("express");
const Joi = require("joi");

const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");
const validateObjectId = require("../middleware/validateObjectId");
const categoryCtrl = require("../controllers/categoryController");

const router = express.Router();

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  description: Joi.string().allow("").max(500).optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(80).optional(),
  description: Joi.string().allow("").max(500).optional(),
}).min(1);

router.post("/", auth, requireRole("admin"), validate(createCategorySchema), categoryCtrl.createCategory);
router.get("/", auth, categoryCtrl.getCategories);
router.get("/:id", auth, validateObjectId("id"), categoryCtrl.getCategoryById);
router.put("/:id", auth, requireRole("admin"), validateObjectId("id"), validate(updateCategorySchema), categoryCtrl.updateCategory);
router.delete("/:id", auth, requireRole("admin"), validateObjectId("id"), categoryCtrl.deleteCategory);

module.exports = router;
