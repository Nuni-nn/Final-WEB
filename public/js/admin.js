const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const listEl = document.getElementById("adminList");
const msgEl = document.getElementById("msg");
const formTitleEl = document.getElementById("adminFormTitle");
const editIdEl = document.getElementById("adminEditId");
const ownerUserIdEl = document.getElementById("ownerUserId");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const ingEl = document.getElementById("ingredients");
const stepsEl = document.getElementById("steps");
const cookTimeEl = document.getElementById("cookTime");
const isPublicEl = document.getElementById("isPublic");
const cancelBtn = document.getElementById("cancelBtn");

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linesToArray(text) {
  return text.split("\n").map((x) => x.trim()).filter(Boolean);
}

function setMsg(text, ok = false) {
  msgEl.className = ok ? "mt-3 small text-success" : "mt-3 small text-danger";
  msgEl.textContent = text || "";
}

function resetForm() {
  editIdEl.value = "";
  ownerUserIdEl.value = "";
  titleEl.value = "";
  descEl.value = "";
  ingEl.value = "";
  stepsEl.value = "";
  cookTimeEl.value = 0;
  isPublicEl.checked = false;
  formTitleEl.textContent = "Create Recipe";
  cancelBtn.style.display = "none";
}

async function ensureAdmin() {
  try {
    const res = await fetch("/users/profile", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok || data?.user?.role !== "admin") {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  } catch (err) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

async function loadAllRecipes() {
  listEl.innerHTML = "Loading...";
  try {
    const res = await fetch("/recipes/admin/all", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) {
      listEl.innerHTML = "";
      setMsg(data.message || "Failed to load recipes");
      return;
    }
    renderList(data.recipes || []);
  } catch (err) {
    listEl.innerHTML = "";
    setMsg("Network error");
  }
}

function renderList(recipes) {
  if (!recipes.length) {
    listEl.innerHTML = `<div class="rb-muted">No recipes found.</div>`;
    return;
  }

  listEl.innerHTML = recipes.map((r) => {
    const owner = r.userId?.username ? `${r.userId.username} (${r.userId.email || "no-email"})` : "Unknown";
    return `
      <div class="rb-list-card">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div style="min-width:0;">
            <h6 class="rb-list-title">${escapeHtml(r.title || "Untitled")}</h6>
            <div class="rb-mini">Owner: ${escapeHtml(owner)}</div>
            <div class="rb-mini">Time: ${Number(r.cookTime || 0)} min | ${r.isPublic ? "Public" : "Private"}</div>
            <p class="rb-list-desc mt-2">${escapeHtml((r.description || "").trim() || "No description.")}</p>
          </div>
          <div class="d-flex flex-column gap-2">
            <button class="btn btn-sm btn-outline-primary rb-btn" onclick="adminEditRecipe('${r._id}')">Edit</button>
            <button class="btn btn-sm btn-outline-danger rb-btn" onclick="adminDeleteRecipe('${r._id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

window.adminEditRecipe = async function adminEditRecipe(id) {
  setMsg("");
  try {
    const res = await fetch(`/recipes/admin/${id}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Failed to load recipe");
      return;
    }

    const r = data.recipe;
    editIdEl.value = r._id;
    ownerUserIdEl.value = typeof r.userId === "string" ? r.userId : (r.userId?._id || "");
    titleEl.value = r.title || "";
    descEl.value = r.description || "";
    ingEl.value = (r.ingredients || []).join("\n");
    stepsEl.value = (r.steps || []).join("\n");
    cookTimeEl.value = Number(r.cookTime || 0);
    isPublicEl.checked = !!r.isPublic;
    formTitleEl.textContent = "Edit Recipe";
    cancelBtn.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    setMsg("Network error");
  }
};

window.adminDeleteRecipe = async function adminDeleteRecipe(id) {
  if (!confirm("Delete this recipe?")) return;
  setMsg("");
  try {
    const res = await fetch(`/recipes/${id}/admin`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Delete failed");
      return;
    }
    setMsg("Deleted", true);
    loadAllRecipes();
  } catch (err) {
    setMsg("Network error");
  }
};

document.getElementById("saveBtn").addEventListener("click", async () => {
  setMsg("");
  const payload = {
    title: titleEl.value.trim(),
    description: descEl.value.trim(),
    ingredients: linesToArray(ingEl.value),
    steps: linesToArray(stepsEl.value),
    cookTime: Number(cookTimeEl.value || 0),
    isPublic: isPublicEl.checked,
  };

  const ownerId = ownerUserIdEl.value.trim();
  if (ownerId) payload.userId = ownerId;

  const editId = editIdEl.value.trim();
  const url = editId ? `/recipes/admin/${editId}` : "/recipes/admin";
  const method = editId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
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
    setMsg(editId ? "Updated" : "Created", true);
    resetForm();
    loadAllRecipes();
  } catch (err) {
    setMsg("Network error");
  }
});

cancelBtn.addEventListener("click", () => {
  resetForm();
  setMsg("");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

(async function init() {
  await ensureAdmin();
  resetForm();
  loadAllRecipes();
})();
