const User = require("../models/User");
const Recipe = require("../models/Recipe");
const Comment = require("../models/Comment");
const Favorite = require("../models/Favorite");
const Category = require("../models/Category");

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("username email role createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body;
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : undefined;

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ message: "Email already in use" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(username ? { username: String(username).trim() } : {}),
        ...(email ? { email } : {}),
      },
      { new: true, runValidators: true }
    ).select("username email role createdAt");

    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    next(err);
  }
};

exports.adminGetUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("username email role createdAt")
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.adminDeleteUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({ message: "Admin cannot delete their own account" });
    }

    const user = await User.findById(targetId).select("_id");
    if (!user) return res.status(404).json({ message: "User not found" });

    await Promise.all([
      Recipe.deleteMany({ userId: targetId }),
      Comment.deleteMany({ userId: targetId }),
      Favorite.deleteMany({ userId: targetId }),
      Category.deleteMany({ createdBy: targetId }),
      User.deleteOne({ _id: targetId }),
    ]);

    res.json({ message: "User deleted by admin" });
  } catch (err) {
    next(err);
  }
};
