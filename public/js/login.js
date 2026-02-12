const msg = document.getElementById("msg");

document.getElementById("btnLogin").addEventListener("click", async () => {
  msg.textContent = "";

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.message || "Login failed";
      return;
    }

    localStorage.setItem("token", data.token);
    try {
      const profileRes = await fetch("/users/profile", {
        headers: { Authorization: "Bearer " + data.token },
      });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData?.user?.role === "admin") {
        window.location.href = "admin.html";
        return;
      }
    } catch (err) {}

    window.location.href = "recipes.html";
  } catch (e) {
    msg.textContent = "Network error";
  }
});
