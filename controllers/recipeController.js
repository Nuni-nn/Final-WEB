const Recipe = require("../models/Recipe");

exports.createRecipe = async (req, res, next) => {
  try {
    const { title, description, ingredients, steps, cookTime, isPublic, categoryId } = req.body;

    const recipe = await Recipe.create({
      title,
      description: description || "",
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      steps: Array.isArray(steps) ? steps : [],
      cookTime: cookTime ?? 0,
      isPublic: !!isPublic,
      categoryId: categoryId || null,
      userId: req.user.id,
    });

    res.status(201).json({ message: "Recipe created", recipe });
  } catch (err) {
    next(err);
  }
};

exports.getMyRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("categoryId", "name");
    res.json({ recipes });
  } catch (err) {
    next(err);
  }
};

exports.getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate("categoryId", "name");
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (recipe.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Not your recipe" });
    }

    res.json({ recipe });
  } catch (err) {
    next(err);
  }
};

exports.updateRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (recipe.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Not your recipe" });
    }

    const { title, description, ingredients, steps, cookTime, isPublic, categoryId } = req.body;

    if (title !== undefined) recipe.title = title;
    if (description !== undefined) recipe.description = description;
    if (ingredients !== undefined) recipe.ingredients = ingredients;
    if (steps !== undefined) recipe.steps = steps;
    if (cookTime !== undefined) recipe.cookTime = cookTime;
    if (isPublic !== undefined) recipe.isPublic = isPublic;
    if (categoryId !== undefined) recipe.categoryId = categoryId;

    await recipe.save();

    res.json({ message: "Recipe updated", recipe });
  } catch (err) {
    next(err);
  }
};

exports.deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (recipe.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Not your recipe" });
    }

    await Recipe.deleteOne({ _id: recipe._id });
    res.json({ message: "Recipe deleted" });
  } catch (err) {
    next(err);
  }
};

exports.adminDeleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    await Recipe.deleteOne({ _id: recipe._id });
    res.json({ message: "Recipe deleted by admin" });
  } catch (err) {
    next(err);
  }
};
