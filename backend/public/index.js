const healthResult = document.getElementById("health-result");
const messageResult = document.getElementById("message-result");
const usersResult = document.getElementById("users-result");

document.getElementById("btn-health").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    healthResult.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    healthResult.textContent = "Erro: " + err.message;
  }
});

document.getElementById("btn-message").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/message");
    const data = await res.json();
    messageResult.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    messageResult.textContent = "Erro: " + err.message;
  }
});

document.getElementById("btn-create-user").addEventListener("click", async () => {
  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();

  if (!name || !email) {
    usersResult.textContent = "Preencha nome e e-mail.";
    return;
  }

  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (!res.ok) {
      const text = await res.text();
      usersResult.textContent = `Erro ${res.status}: ${text}`;
      return;
    }

    const data = await res.json();
    usersResult.textContent = "Usuário criado: " + JSON.stringify(data, null, 2);
  } catch (err) {
    usersResult.textContent = "Erro: " + err.message;
  }
});

document.getElementById("btn-load-users").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/users");
    const data = await res.json();
    usersResult.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    usersResult.textContent = "Erro: " + err.message;
  }
});
