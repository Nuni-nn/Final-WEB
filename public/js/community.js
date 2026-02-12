const listEl = document.getElementById("communityList");
const msgEl = document.getElementById("communityMsg");
const token = localStorage.getItem("token");
let communityRecipes = [];

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
          </div>

          <div class="mt-3">
            <button class="btn btn-sm btn-outline-light rb-btn" onclick="viewCommunityRecipe('${r._id}')">View</button>
          </div>
        </div>
      `;
    })
    .join("");
}

window.viewCommunityRecipe = function viewCommunityRecipe(id) {
  const recipe = communityRecipes.find((x) => x._id === id);
  if (!recipe) return;

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
};

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

    renderList(filtered);
  } catch (err) {
    listEl.innerHTML = "";
    setMsg("Network error");
  }
}

loadCommunityRecipes();
