// backend/public/js/register.js

const form = document.getElementById("registerForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("errorBox");

// toggle de senha (se você tiver o botão com data-target)
document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  const targetId = button.getAttribute("data-target");
  const input = document.getElementById(targetId);

  button.addEventListener("click", () => {
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "🙈" : "👁";
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // impede o POST padrão pro /api/register

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    errorBox.style.display = "block";
    errorBox.textContent = "Nome, email e senha são obrigatórios.";
    return;
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      errorBox.style.display = "block";
      errorBox.textContent =
        (data && data.error) ||
        `Erro ao registrar (código ${response.status}).`;
      return;
    }

    // deu certo
    errorBox.style.display = "none";

    alert("Conta criada com sucesso! Faça login para entrar no laboratório.");
    window.location.href = "/html/login.html";
  } catch (err) {
    console.error(err);
    errorBox.style.display = "block";
    errorBox.textContent =
      "Erro: não foi possível conectar ao servidor para registrar.";
  }
});
