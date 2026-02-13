const msg = document.getElementById("msg");
const token = localStorage.getItem("token");
const favoritesMsgEl = document.getElementById("favoritesMsg");
const favoritesListEl = document.getElementById("favoritesList");

if (!token) window.location.href = "login.html";

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setFavoritesMsg(text, ok = false) {
  favoritesMsgEl.className = ok ? "small text-success mb-2" : "small rb-muted mb-2";
  favoritesMsgEl.textContent = text || "";
}

function renderFavorites(favorites) {
  if (!favorites.length) {
    favoritesListEl.innerHTML = `<div class="rb-muted small">No favorites yet.</div>`;
    return;
  }

  favoritesListEl.innerHTML = favorites
    .map((f) => {
      const recipe = f.recipeId || {};
      const id = typeof recipe === "string" ? recipe : (recipe._id || "");
      const title = typeof recipe === "string" ? "Recipe" : (recipe.title || "Untitled recipe");
      const author = recipe.userId?.username || "";
      const time = Number(recipe.cookTime || 0);

      return `
        <div class="rb-list-card py-2 px-3">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div style="min-width:0;">
              <div class="fw-semibold">${escapeHtml(title)}</div>
              <div class="rb-mini">${author ? `By: ${escapeHtml(author)} | ` : ""}${time} min</div>
            </div>
            ${id ? `<button class="btn btn-sm btn-outline-danger rb-btn" onclick="removeFavorite('${id}')">Remove</button>` : ""}
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadFavorites() {
  favoritesListEl.innerHTML = `<div class="rb-muted small">Loading favorites...</div>`;
  setFavoritesMsg("");

  try {
    const res = await fetch("/favorites", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      favoritesListEl.innerHTML = "";
      setFavoritesMsg(data.message || "Failed to load favorites");
      if (res.status === 401) window.location.href = "login.html";
      return;
    }

    renderFavorites(Array.isArray(data.favorites) ? data.favorites : []);
  } catch (e) {
    favoritesListEl.innerHTML = "";
    setFavoritesMsg("Network error");
  }
}

window.removeFavorite = async function removeFavorite(recipeId) {
  setFavoritesMsg("");
  try {
    const res = await fetch(`/favorites/${recipeId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      setFavoritesMsg(data.message || "Failed to remove favorite");
      return;
    }

    setFavoritesMsg("Removed from favorites", true);
    loadFavorites();
  } catch (e) {
    setFavoritesMsg("Network error");
  }
};

async function loadProfile() {
  msg.textContent = "";
  try {
    const res = await fetch("/users/profile", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || "Failed to load profile";
      if (res.status === 401) window.location.href = "login.html";
      return;
    }

    document.getElementById("username").value = data.user.username || "";
    document.getElementById("email").value = data.user.email || "";
  } catch (e) {
    msg.textContent = "Network error";
  }
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  msg.textContent = "";

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();

  try {
    const res = await fetch("/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ username, email }),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.className = "mt-3 small text-danger";
      msg.textContent = data.details ? data.details.join(", ") : (data.message || "Update failed");
      return;
    }

    msg.className = "mt-3 small text-success";
    msg.textContent = "Saved!";
  } catch (e) {
    msg.className = "mt-3 small text-danger";
    msg.textContent = "Network error";
  }
});

loadProfile();
loadFavorites();
