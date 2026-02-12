const express = require("express");

const auth = require("../middleware/authMiddleware");
const favoriteCtrl = require("../controllers/favoriteController");

const router = express.Router();

router.post("/:recipeId", auth, favoriteCtrl.addFavorite);
router.get("/", auth, favoriteCtrl.getMyFavorites);
router.delete("/:recipeId", auth, favoriteCtrl.removeFavorite);

module.exports = router;
