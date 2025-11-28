const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("errorBox");

// Toggle de visibilidade da senha
document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  const targetId = button.getAttribute("data-target");
  const input = document.getElementById(targetId);

  button.addEventListener("click", () => {
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.querySelector("span").textContent = isPassword ? "🙈" : "👁";
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    errorBox.style.display = "block";
    errorBox.textContent = "Preencha email e senha para continuar.";
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      errorBox.style.display = "block";
      if (response.status === 400 || response.status === 401) {
        errorBox.textContent = "Email ou senha inválidos.";
      } else {
        errorBox.textContent = `Erro ao fazer login (código ${response.status}).`;
      }
      return;
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    window.location.href = "/dashboard.html";
  } catch (err) {
    console.error(err);
    errorBox.style.display = "block";
    errorBox.textContent = "Erro: não foi possível conectar ao servidor.";
  }
});
