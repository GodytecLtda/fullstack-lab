// login.js — versão simples e correta

// A API está no mesmo host e porta que servem o HTML (3000)
const API_BASE = window.location.origin; 
// ex: http://192.168.0.3:3000

async function handleLogin(event) {
  event.preventDefault(); // não deixa o form recarregar a página

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('error-message');

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  errorDiv.textContent = '';

  if (!email || !password) {
    errorDiv.textContent = 'Preencha email e senha.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Mostra a mensagem que veio da API se existir
      const msg = data.error || data.message || `Servidor respondeu ${res.status}`;
      throw new Error(msg);
    }

    // Salva token e usuário
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    // Redireciona para o dashboard
    window.location.href = '/dashboard.html';
  } catch (err) {
    console.error('Erro no login:', err);
    errorDiv.textContent = 'Erro: ' + err.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
});
