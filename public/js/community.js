const listEl = document.getElementById("communityList");
const msgEl = document.getElementById("communityMsg");
const token = localStorage.getItem("token");
let communityRecipes = [];
let activeRecipeId = null;
const favoriteRecipeIds = new Set();
let favoritesLoaded = false;
let favoriteActionInProgress = false;

const commentsMsgEl = document.getElementById("communityCommentsMsg");
const commentsListEl = document.getElementById("communityCommentsList");
const commentFormEl = document.getElementById("communityCommentForm");
const commentTextEl = document.getElementById("communityCommentText");
const commentRatingEl = document.getElementById("communityCommentRating");
const favoriteBtnEl = document.getElementById("communityFavoriteBtn");

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMsg(text, ok = false) {
  msgEl.className = ok ? "small mb-3 text-success" : "small mb-3 text-warning";
  msgEl.textContent = text || "";
}

function setCommentsMsg(text, ok = false) {
  commentsMsgEl.className = ok ? "small mb-2 text-success" : "small mb-2 rb-muted";
  commentsMsgEl.textContent = text || "";
}

function normalizeUserId(recipe) {
  if (!recipe || !recipe.userId) return null;
  return typeof recipe.userId === "string" ? recipe.userId : recipe.userId._id || null;
}

async function getCurrentUserId() {
  if (!token) return null;

  try {
    const res = await fetch("/users/profile", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user?._id || null;
  } catch (err) {
    return null;
  }
}

function renderList(recipes) {
  if (!recipes.length) {
    listEl.innerHTML = `<div class="rb-muted">No public recipes from other users yet.</div>`;
    return;
  }

  listEl.innerHTML = recipes
    .map((r) => {
      const author = r.userId?.username ? r.userId.username : "Unknown user";
      const description = (r.description || "").trim() || "No description.";
      const ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];
      const steps = Array.isArray(r.steps) ? r.steps : [];
      const ingPreview = ingredients.slice(0, 6).join(", ");
      const ingText = ingPreview ? ingPreview + (ingredients.length > 6 ? "..." : "") : "No ingredients listed.";
      const isFavorite = favoriteRecipeIds.has(r._id);

      return `
        <div class="rb-list-card">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h6 class="rb-list-title m-0">${escapeHtml(r.title || "Untitled recipe")}</h6>
            <span class="rb-chip">${Number(r.cookTime || 0)} min</span>
          </div>

          <div class="rb-mini mt-1">By: ${escapeHtml(author)}</div>
          <p class="rb-list-desc mt-2">${escapeHtml(description)}</p>

          <div class="rb-mini mt-2">
            <b>Ingredients:</b> ${escapeHtml(ingText)}
            | <b>Steps:</b> ${steps.length}
            ${isFavorite ? '| <b>Favorite</b>' : ""}
          </div>

          <div class="mt-3 d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-light rb-btn" onclick="viewCommunityRecipe('${r._id}')">View</button>
            ${token ? `<button class="btn btn-sm ${isFavorite ? "btn-outline-danger" : "btn-outline-primary"} rb-btn" onclick="toggleFavoriteFromList('${r._id}')">${isFavorite ? "Remove favorite" : "Add favorite"}</button>` : ""}
          </div>
        </div>
      `;
    })
    .join("");
}

function formatCommentDate(value) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString();
}

function renderComments(comments) {
  if (!Array.isArray(comments) || !comments.length) {
    commentsListEl.innerHTML = `<div class="rb-muted">No comments yet.</div>`;
    return;
  }

  commentsListEl.innerHTML = comments
    .map((c) => {
      const author = c.userId?.username ? c.userId.username : "Unknown user";
      const rating = c.rating !== undefined && c.rating !== null ? ` | Rating: ${Number(c.rating)}/5` : "";
      const createdAt = formatCommentDate(c.createdAt);

      return `
        <div class="rb-list-card mb-2">
          <div class="rb-mini">
            <b>${escapeHtml(author)}</b>${escapeHtml(rating)}
            ${createdAt ? ` | ${escapeHtml(createdAt)}` : ""}
          </div>
          <div class="mt-1">${escapeHtml(c.text || "")}</div>
        </div>
      `;
    })
    .join("");
}

async function loadComments(recipeId) {
  commentsListEl.innerHTML = "Loading comments...";
  setCommentsMsg("");

  if (!token) {
    commentsListEl.innerHTML = `<div class="rb-muted">Login to view and post comments.</div>`;
    if (commentFormEl) commentFormEl.style.display = "none";
    return;
  }

  if (commentFormEl) commentFormEl.style.display = "";

  try {
    const res = await fetch(`/comments/recipe/${recipeId}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      commentsListEl.innerHTML = "";
      if (res.status === 401) {
        setCommentsMsg("Session expired. Login again.");
        if (commentFormEl) commentFormEl.style.display = "none";
      } else {
        setCommentsMsg(data.message || "Failed to load comments");
      }
      return;
    }

    renderComments(data.comments || []);
  } catch (err) {
    commentsListEl.innerHTML = "";
    setCommentsMsg("Network error");
  }
}

function normalizeFavoriteRecipeId(favorite) {
  if (!favorite || !favorite.recipeId) return null;
  return typeof favorite.recipeId === "string" ? favorite.recipeId : favorite.recipeId._id || null;
}

function updateFavoriteButtonState(recipeId) {
  if (!favoriteBtnEl) return;

  if (!token) {
    favoriteBtnEl.style.display = "none";
    return;
  }

  favoriteBtnEl.style.display = "";
  const isFavorite = favoriteRecipeIds.has(recipeId);
  favoriteBtnEl.textContent = isFavorite ? "Remove from favorites" : "Add to favorites";
  favoriteBtnEl.className = `btn rb-btn ${isFavorite ? "btn-outline-danger" : "btn-outline-primary"}`;
  favoriteBtnEl.disabled = favoriteActionInProgress;
}

async function loadFavorites() {
  favoriteRecipeIds.clear();
  favoritesLoaded = false;

  if (!token) return;

  try {
    const res = await fetch("/favorites", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) return;

    const favorites = Array.isArray(data.favorites) ? data.favorites : [];
    favorites.forEach((f) => {
      const recipeId = normalizeFavoriteRecipeId(f);
      if (recipeId) favoriteRecipeIds.add(recipeId);
    });
    favoritesLoaded = true;
  } catch (err) {
    favoritesLoaded = false;
  }
}

async function toggleFavorite(recipeId) {
  if (!token || !recipeId || favoriteActionInProgress) return;

  favoriteActionInProgress = true;
  updateFavoriteButtonState(recipeId);

  const isFavorite = favoriteRecipeIds.has(recipeId);
  try {
    const res = await fetch(`/favorites/${recipeId}`, {
      method: isFavorite ? "DELETE" : "POST",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      setMsg(data.message || "Favorite action failed");
      return;
    }

    if (isFavorite) favoriteRecipeIds.delete(recipeId);
    else favoriteRecipeIds.add(recipeId);

    renderList(communityRecipes);
    if (activeRecipeId === recipeId) updateFavoriteButtonState(recipeId);
  } catch (err) {
    setMsg("Network error");
  } finally {
    favoriteActionInProgress = false;
    updateFavoriteButtonState(recipeId);
  }
}

window.toggleFavoriteFromList = function toggleFavoriteFromList(recipeId) {
  toggleFavorite(recipeId);
};

window.viewCommunityRecipe = function viewCommunityRecipe(id) {
  const recipe = communityRecipes.find((x) => x._id === id);
  if (!recipe) return;
  activeRecipeId = id;

  const author = recipe.userId?.username ? recipe.userId.username : "Unknown user";
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  document.getElementById("communityViewTitle").textContent = recipe.title || "Recipe";
  document.getElementById("communityViewTime").textContent = `${Number(recipe.cookTime || 0)} min`;
  document.getElementById("communityViewAuthor").textContent = `By: ${author}`;
  document.getElementById("communityViewDesc").textContent =
    (recipe.description && recipe.description.trim()) ? recipe.description : "No description.";

  const ingUl = document.getElementById("communityViewIngredients");
  ingUl.innerHTML = ingredients.length
    ? ingredients.map((x) => `<li>${escapeHtml(x)}</li>`).join("")
    : `<li class="rb-muted">No ingredients.</li>`;

  const stepsOl = document.getElementById("communityViewSteps");
  stepsOl.innerHTML = steps.length
    ? steps.map((x) => `<li>${escapeHtml(x)}</li>`).join("")
    : `<li class="rb-muted">No steps.</li>`;

  const modal = new bootstrap.Modal(document.getElementById("communityViewModal"));
  modal.show();
  loadComments(id);
  updateFavoriteButtonState(id);
};

if (favoriteBtnEl) {
  favoriteBtnEl.addEventListener("click", async () => {
    if (!activeRecipeId) return;
    await toggleFavorite(activeRecipeId);
  });
}

if (commentFormEl) {
  commentFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!activeRecipeId) return;
    if (!token) {
      setCommentsMsg("Login required to post comments.");
      return;
    }

    const text = commentTextEl.value.trim();
    const ratingValue = commentRatingEl.value;

    if (!text) {
      setCommentsMsg("Comment text is required.");
      return;
    }

    const payload = { recipeId: activeRecipeId, text };
    if (ratingValue) payload.rating = Number(ratingValue);

    try {
      const res = await fetch("/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setCommentsMsg(data.details ? data.details.join(", ") : (data.message || "Failed to post comment"));
        return;
      }

      commentTextEl.value = "";
      commentRatingEl.value = "";
      setCommentsMsg("Comment posted.", true);
      loadComments(activeRecipeId);
    } catch (err) {
      setCommentsMsg("Network error");
    }
  });
}

async function loadCommunityRecipes() {
  listEl.innerHTML = "Loading...";
  setMsg("");

  try {
    const [publicRes, myId] = await Promise.all([
      fetch("/recipes/public"),
      getCurrentUserId(),
    ]);

    const data = await publicRes.json();
    if (!publicRes.ok) {
      listEl.innerHTML = "";
      setMsg(data.message || "Failed to load public recipes");
      return;
    }

    const all = Array.isArray(data.recipes) ? data.recipes : [];
    const filtered = myId ? all.filter((r) => normalizeUserId(r) !== myId) : all;
    communityRecipes = filtered;
    await loadFavorites();

    renderList(filtered);
    if (token && !favoritesLoaded) {
      setMsg("Favorites are temporarily unavailable.");
    }
  } catch (err) {
    listEl.innerHTML = "";
    setMsg("Network error");
  }
}

loadCommunityRecipes();
