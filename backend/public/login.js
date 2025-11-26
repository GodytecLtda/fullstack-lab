const resultEl = document.getElementById("result");
const loginBtn = document.getElementById("login-btn");

const API_LOGIN_URL = "/api/login";

loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    resultEl.textContent = "Preencha usuário (e-mail) e senha.";
    return;
  }

  resultEl.textContent = "Verificando...";

  try {
    const response = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Resposta não OK:", response.status, text);
      resultEl.textContent = `Erro: servidor respondeu ${response.status}`;
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error("Erro ao fazer parse do JSON:", err);
      resultEl.textContent = "Erro ao interpretar resposta do servidor.";
      return;
    }

    if (!data.ok) {
      resultEl.textContent = "Erro: " + (data.error || "credenciais inválidas.");
      return;
    }

    // salva token
    localStorage.setItem("token", data.token);

    resultEl.textContent = "Login bem-sucedido! Redirecionando...";

    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 800);

  } catch (err) {
    console.error("Erro de rede no fetch:", err);
    resultEl.textContent = "Erro de conexão com o servidor.";
  }
});
