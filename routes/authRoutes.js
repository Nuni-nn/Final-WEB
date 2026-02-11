const express = require("express");
const Joi = require("joi");

const validate = require("../middleware/validate");
const authCtrl = require("../controllers/authController");

const router = express.Router();

const registerSchema = Joi.object({
  username: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
});

router.post("/register", validate(registerSchema), authCtrl.register);
router.post("/login", validate(loginSchema), authCtrl.login);

module.exports = router;
