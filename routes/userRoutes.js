const express = require("express");
const Joi = require("joi");

const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const userCtrl = require("../controllers/userController");

const router = express.Router();

const updateProfileSchema = Joi.object({
  username: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
}).min(1);

router.get("/profile", auth, userCtrl.getProfile);
router.put("/profile", auth, validate(updateProfileSchema), userCtrl.updateProfile);

module.exports = router;
