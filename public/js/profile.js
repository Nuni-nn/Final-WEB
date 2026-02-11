const msg = document.getElementById("msg");
const token = localStorage.getItem("token");

if (!token) window.location.href = "login.html";

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

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
