const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const listEl = document.getElementById("list");
const msgEl = document.getElementById("msg");

const formTitle = document.getElementById("formTitle");
const editIdEl = document.getElementById("editId");

const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const categoryEl = document.getElementById("categoryId");
const categoryNameEl = document.getElementById("categoryName");
const ingEl = document.getElementById("ingredients");
const stepsEl = document.getElementById("steps");
const cookTimeEl = document.getElementById("cookTime");
const isPublicEl = document.getElementById("isPublic");

const cancelBtn = document.getElementById("cancelEditBtn");
let categories = [];

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

function linesToArray(text) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function setMsg(text, ok = false) {
  msgEl.className = ok ? "mt-3 small text-success" : "mt-3 small text-danger";
  msgEl.textContent = text || "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCategoryOptions() {
  const options = categories
    .map((c) => `<option value="${c._id}">${escapeHtml(c.name || "Unnamed")}</option>`)
    .join("");
  categoryEl.innerHTML = `<option value="">No category</option>${options}`;
}

async function loadCategories() {
  try {
    const res = await fetch("/categories", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) {
      categories = [];
      renderCategoryOptions();
      return;
    }
    categories = Array.isArray(data.categories) ? data.categories : [];
    renderCategoryOptions();
  } catch (e) {
    categories = [];
    renderCategoryOptions();
  }
}

function resetForm() {
  editIdEl.value = "";
  formTitle.textContent = "Create Recipe";
  titleEl.value = "";
  descEl.value = "";
  categoryEl.value = "";
  categoryNameEl.value = "";
  ingEl.value = "";
  stepsEl.value = "";
  cookTimeEl.value = 0;
  isPublicEl.checked = false;
  cancelBtn.style.display = "none";
}

cancelBtn.addEventListener("click", () => {
  resetForm();
  setMsg("");
});

async function loadRecipes() {
  listEl.innerHTML = "Loading...";
  try {
    const res = await fetch("/recipes", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      listEl.innerHTML = "";
      setMsg(data.message || "Failed to load");
      if (res.status === 401) window.location.href = "login.html";
      return;
    }

    renderList(data.recipes || []);
  } catch (e) {
    listEl.innerHTML = "";
    setMsg("Network error");
  }
}

function renderList(recipes) {
  if (!recipes.length) {
    listEl.innerHTML = `<div class="text-muted">No recipes yet.</div>`;
    return;
  }

  listEl.innerHTML = recipes
    .map((r) => {
      const desc = (r.description || "").trim();
      const shortDesc = desc ? desc : "No description yet.";
      const ingPreview = (r.ingredients || []).slice(0, 5).join(", ");
      const ingText = ingPreview ? ingPreview + ((r.ingredients || []).length > 5 ? "..." : "") : "No ingredients listed.";
      const stepsCount = (r.steps || []).length;
      const categoryName = r.categoryId?.name || "No category";

      return `
        <div class="rb-list-card" role="button" onclick="viewRecipe('${r._id}')">
          <div class="d-flex justify-content-between gap-3">
            <div style="min-width:0;">
              <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
                <h6 class="rb-list-title">${escapeHtml(r.title)}</h6>
                <span class="rb-chip">${Number(r.cookTime || 0)} min</span>
                <span class="rb-chip">${r.isPublic ? "Public" : "Private"}</span>
              </div>

              <p class="rb-list-desc">${escapeHtml(shortDesc)}</p>

              <div class="rb-mini mt-2">
                <b>Ingredients:</b> ${escapeHtml(ingText)}
                | <b>Steps:</b> ${stepsCount}
                | <b>Category:</b> ${escapeHtml(categoryName)}
              </div>
            </div>

            <div class="d-flex flex-column gap-2" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-outline-light rb-btn" onclick="viewRecipe('${r._id}')">View</button>
              <button class="btn btn-sm btn-outline-primary rb-btn" onclick="editRecipe('${r._id}')">Edit</button>
              <button class="btn btn-sm btn-outline-danger rb-btn" onclick="deleteRecipe('${r._id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

document.getElementById("saveRecipeBtn").addEventListener("click", async () => {
  setMsg("");

  const payload = {
    title: titleEl.value.trim(),
    description: descEl.value.trim(),
    categoryId: categoryEl.value || null,
    categoryName: categoryNameEl.value.trim() || null,
    ingredients: linesToArray(ingEl.value),
    steps: linesToArray(stepsEl.value),
    cookTime: Number(cookTimeEl.value || 0),
    isPublic: isPublicEl.checked,
  };

  const editId = editIdEl.value;

  try {
    const res = await fetch(editId ? `/recipes/${editId}` : "/recipes", {
      method: editId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.details ? data.details.join(", ") : (data.message || "Save failed"));
      return;
    }

    setMsg(editId ? "Updated!" : "Created!", true);
    resetForm();
    await loadCategories();
    loadRecipes();
  } catch (e) {
    setMsg("Network error");
  }
});

window.deleteRecipe = async function deleteRecipe(id) {
  if (!confirm("Delete this recipe?")) return;
  setMsg("");

  try {
    const res = await fetch(`/recipes/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      setMsg(data.message || "Delete failed");
      return;
    }

    setMsg("Deleted!", true);
    loadRecipes();
  } catch (e) {
    setMsg("Network error");
  }
};

window.editRecipe = async function editRecipe(id) {
  setMsg("");

  try {
    const res = await fetch(`/recipes/${id}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      setMsg(data.message || "Failed to load recipe");
      return;
    }

    const r = data.recipe;
    editIdEl.value = r._id;
    formTitle.textContent = "Edit Recipe";
    titleEl.value = r.title || "";
    descEl.value = r.description || "";
    categoryEl.value = r.categoryId?._id || r.categoryId || "";
    categoryNameEl.value = "";
    ingEl.value = (r.ingredients || []).join("\n");
    stepsEl.value = (r.steps || []).join("\n");
    cookTimeEl.value = Number(r.cookTime || 0);
    isPublicEl.checked = !!r.isPublic;

    cancelBtn.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    setMsg("Network error");
  }
};

categoryNameEl.addEventListener("input", () => {
  if (categoryNameEl.value.trim()) categoryEl.value = "";
});

categoryEl.addEventListener("change", () => {
  if (categoryEl.value) categoryNameEl.value = "";
});

window.viewRecipe = async function viewRecipe(id) {
  setMsg("");

  try {
    const res = await fetch(`/recipes/${id}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      setMsg(data.message || "Failed to load recipe");
      return;
    }

    const r = data.recipe;

    document.getElementById("viewTitle").textContent = r.title || "Recipe";
    document.getElementById("viewTime").textContent = `${Number(r.cookTime || 0)} min`;
    document.getElementById("viewPublic").textContent = r.isPublic ? "Public" : "Private";
    document.getElementById("viewCategory").textContent = `Category: ${r.categoryId?.name || "No category"}`;
    document.getElementById("viewDesc").textContent =
      (r.description && r.description.trim()) ? r.description : "No description.";

    const ingUl = document.getElementById("viewIngredients");
    ingUl.innerHTML = (r.ingredients || []).length
      ? (r.ingredients || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")
      : `<li class="rb-muted">No ingredients.</li>`;

    const stepsOl = document.getElementById("viewSteps");
    stepsOl.innerHTML = (r.steps || []).length
      ? (r.steps || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")
      : `<li class="rb-muted">No steps.</li>`;

    const editBtn = document.getElementById("viewEditBtn");
    editBtn.onclick = () => {
      const modalEl = document.getElementById("viewModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      editRecipe(id);
    };

    const modal = new bootstrap.Modal(document.getElementById("viewModal"));
    modal.show();
  } catch (e) {
    setMsg("Network error");
  }
};

(async function init() {
  resetForm();
  await loadCategories();
  await loadRecipes();
})();
