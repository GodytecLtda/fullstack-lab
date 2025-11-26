const resultEl = document.getElementById("result");
const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    resultEl.textContent = "Preencha usuário e senha.";
    return;
  }

  resultEl.textContent = "Verificando...";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!data.ok) {
      resultEl.textContent = "Erro: " + data.error;
      return;
    }

    localStorage.setItem("token", data.token);
    resultEl.textContent = "Login bem-sucedido! Redirecionando...";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);

  } catch (err) {
    resultEl.textContent = "Erro de conexão com o servidor.";
  }
});
