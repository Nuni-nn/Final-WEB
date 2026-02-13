const Recipe = require("../models/Recipe");
const Category = require("../models/Category");

function normalizeCategoryName(categoryName) {
  const name = typeof categoryName === "string" ? categoryName.trim() : "";
  return name || null;
}

async function resolveCategoryId({ categoryId, categoryName, createdBy }) {
  const normalizedName = normalizeCategoryName(categoryName);

  if (normalizedName) {
    const escapedName = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingCategory = await Category.findOne({
      name: { $regex: `^${escapedName}$`, $options: "i" },
    });
    if (existingCategory) return existingCategory._id;

    try {
      const createdCategory = await Category.create({
        name: normalizedName,
        description: "",
        createdBy,
      });
      return createdCategory._id;
    } catch (err) {
      if (err?.code === 11000) {
        const duplicate = await Category.findOne({ name: normalizedName });
        if (duplicate) return duplicate._id;
      }
      throw err;
    }
  }

  if (categoryId !== undefined) return categoryId || null;
  return undefined;
}

exports.createRecipe = async (req, res, next) => {
  try {
    const { title, description, ingredients, steps, cookTime, isPublic, categoryId, categoryName } = req.body;
    const resolvedCategoryId = await resolveCategoryId({
      categoryId,
      categoryName,
      createdBy: req.user.id,
    });

    const recipe = await Recipe.create({
      title,
      description: description || "",
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      steps: Array.isArray(steps) ? steps : [],
      cookTime: cookTime ?? 0,
      isPublic: !!isPublic,
      categoryId: resolvedCategoryId ?? null,
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

exports.getPublicRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .populate("categoryId", "name")
      .populate("userId", "username");

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

    const { title, description, ingredients, steps, cookTime, isPublic, categoryId, categoryName } = req.body;

    if (title !== undefined) recipe.title = title;
    if (description !== undefined) recipe.description = description;
    if (ingredients !== undefined) recipe.ingredients = ingredients;
    if (steps !== undefined) recipe.steps = steps;
    if (cookTime !== undefined) recipe.cookTime = cookTime;
    if (isPublic !== undefined) recipe.isPublic = isPublic;

    if (categoryId !== undefined || categoryName !== undefined) {
      const resolvedCategoryId = await resolveCategoryId({
        categoryId,
        categoryName,
        createdBy: req.user.id,
      });
      if (resolvedCategoryId !== undefined) recipe.categoryId = resolvedCategoryId;
    }

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

exports.adminGetAllRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.find({})
      .sort({ createdAt: -1 })
      .populate("categoryId", "name")
      .populate("userId", "username email");

    res.json({ recipes });
  } catch (err) {
    next(err);
  }
};

exports.adminGetRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("categoryId", "name")
      .populate("userId", "username email");
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    res.json({ recipe });
  } catch (err) {
    next(err);
  }
};

exports.adminCreateRecipe = async (req, res, next) => {
  try {
    const { title, description, ingredients, steps, cookTime, isPublic, categoryId, categoryName, userId } = req.body;
    const resolvedCategoryId = await resolveCategoryId({
      categoryId,
      categoryName,
      createdBy: req.user.id,
    });

    const recipe = await Recipe.create({
      title,
      description: description || "",
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      steps: Array.isArray(steps) ? steps : [],
      cookTime: cookTime ?? 0,
      isPublic: !!isPublic,
      categoryId: resolvedCategoryId ?? null,
      userId: userId || req.user.id,
    });

    res.status(201).json({ message: "Recipe created by admin", recipe });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const { title, description, ingredients, steps, cookTime, isPublic, categoryId, categoryName, userId } = req.body;

    if (title !== undefined) recipe.title = title;
    if (description !== undefined) recipe.description = description;
    if (ingredients !== undefined) recipe.ingredients = ingredients;
    if (steps !== undefined) recipe.steps = steps;
    if (cookTime !== undefined) recipe.cookTime = cookTime;
    if (isPublic !== undefined) recipe.isPublic = isPublic;

    if (categoryId !== undefined || categoryName !== undefined) {
      const resolvedCategoryId = await resolveCategoryId({
        categoryId,
        categoryName,
        createdBy: req.user.id,
      });
      if (resolvedCategoryId !== undefined) recipe.categoryId = resolvedCategoryId;
    }

    if (userId !== undefined) recipe.userId = userId;

    await recipe.save();

    res.json({ message: "Recipe updated by admin", recipe });
  } catch (err) {
    next(err);
  }
};
