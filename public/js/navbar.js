function renderNavbar() {
  const token = localStorage.getItem("token");

  const guestLinks = document.getElementById("nav-guest");
  const authLinks = document.getElementById("nav-auth");
  const logoutBtn = document.getElementById("logoutBtn");

  if (token) {
    if (guestLinks) guestLinks.classList.add("d-none");
    if (authLinks) authLinks.classList.remove("d-none");
  } else {
    if (authLinks) authLinks.classList.add("d-none");
    if (guestLinks) guestLinks.classList.remove("d-none");
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  document.querySelectorAll("[data-admin-only]").forEach((el) => {
    el.classList.add("d-none");
  });

  if (token) {
    fetch("/users/profile", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role === "admin") {
          document.querySelectorAll("[data-admin-only]").forEach((el) => {
            el.classList.remove("d-none");
          });
        }
      })
      .catch(() => {});
  }

  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link, .btn").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && href.includes(current)) a.classList.add("active");
  });
}

document.addEventListener("DOMContentLoaded", renderNavbar);
