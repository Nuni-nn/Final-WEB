const msg = document.getElementById("msg");

document.getElementById("btnRegister").addEventListener("click", async () => {
  msg.textContent = "";

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.details ? data.details.join(", ") : data.message;
      return;
    }

    window.location.href = "login.html";
  } catch (e) {
    msg.textContent = "Network error";
  }
});
