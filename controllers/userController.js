const User = require("../models/User");

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
