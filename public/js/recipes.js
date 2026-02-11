const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const listEl = document.getElementById("list");
const msgEl = document.getElementById("msg");

const formTitle = document.getElementById("formTitle");
const editIdEl = document.getElementById("editId");

const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const ingEl = document.getElementById("ingredients");
const stepsEl = document.getElementById("steps");
const cookTimeEl = document.getElementById("cookTime");
const isPublicEl = document.getElementById("isPublic");

const cancelBtn = document.getElementById("cancelEditBtn");

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

function resetForm() {
  editIdEl.value = "";
  formTitle.textContent = "Create Recipe";
  titleEl.value = "";
  descEl.value = "";
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
      const ing = (r.ingredients || []).slice(0, 4).join(", ");
      return `
        <div class="border rounded p-3 mb-3 bg-white">
          <div class="d-flex justify-content-between gap-2">
            <div>
              <h6 class="mb-1">${escapeHtml(r.title)}</h6>
              <div class="text-muted small">${escapeHtml(r.description || "")}</div>
              <div class="small mt-2"><b>Ingredients:</b> ${escapeHtml(ing)}${(r.ingredients||[]).length>4 ? "..." : ""}</div>
              <div class="small"><b>Cook time:</b> ${Number(r.cookTime || 0)} min</div>
            </div>
            <div class="d-flex flex-column gap-2">
              <button class="btn btn-sm btn-outline-primary" onclick="editRecipe('${r._id}')">Edit</button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteRecipe('${r._id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.getElementById("saveRecipeBtn").addEventListener("click", async () => {
  setMsg("");

  const payload = {
    title: titleEl.value.trim(),
    description: descEl.value.trim(),
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

resetForm();
loadRecipes();
