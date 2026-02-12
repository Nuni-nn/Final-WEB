const Favorite = require("../models/Favorite");
const Recipe = require("../models/Recipe");

exports.addFavorite = async (req, res, next) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const existing = await Favorite.findOne({ userId: req.user.id, recipeId });
    if (existing) return res.status(400).json({ message: "Recipe already in favorites" });

    const favorite = await Favorite.create({
      userId: req.user.id,
      recipeId,
    });

    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (err) {
    next(err);
  }
};

exports.getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("recipeId");

    res.json({ favorites });
  } catch (err) {
    next(err);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    const favorite = await Favorite.findOne({ userId: req.user.id, recipeId });
    if (!favorite) return res.status(404).json({ message: "Favorite not found" });

    await Favorite.deleteOne({ _id: favorite._id });
    res.json({ message: "Removed from favorites" });
  } catch (err) {
    next(err);
  }
};
