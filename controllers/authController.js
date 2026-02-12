const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: String(username || "").trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
    });

    res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const envAdminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envAdminPassword = String(process.env.ADMIN_PASSWORD || "");
    const isEnvAdminAttempt =
      !!envAdminEmail &&
      !!envAdminPassword &&
      normalizedEmail === envAdminEmail &&
      password === envAdminPassword;

    let user = await User.findOne({ email: normalizedEmail });

    if (!user && isEnvAdminAttempt) {
      const passwordHash = await bcrypt.hash(envAdminPassword, 10);
      user = await User.create({
        username: process.env.ADMIN_USERNAME || "Admin",
        email: envAdminEmail,
        passwordHash,
        role: "admin",
      });
    }

    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    let ok = await bcrypt.compare(password, user.passwordHash);

    // Recovery path: allow admin login from .env and sync DB password/role.
    if (!ok && isEnvAdminAttempt) {
      user.passwordHash = await bcrypt.hash(envAdminPassword, 10);
      if (user.role !== "admin") user.role = "admin";
      await user.save();
      ok = true;
    }

    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    next(err);
  }
};
