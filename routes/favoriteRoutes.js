const express = require("express");

const auth = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const favoriteCtrl = require("../controllers/favoriteController");

const router = express.Router();

router.post("/:recipeId", auth, validateObjectId("recipeId"), favoriteCtrl.addFavorite);
router.get("/", auth, favoriteCtrl.getMyFavorites);
router.delete("/:recipeId", auth, validateObjectId("recipeId"), favoriteCtrl.removeFavorite);

module.exports = router;
