// profile.js

function getToken() {
  return localStorage.getItem('token');
}

function ensureAuthenticated() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const res = await fetch(path, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => '');

  if (!res.ok) {
    const message = data?.error || data?.message || 'Erro ao comunicar com o servidor';
    throw new Error(message);
  }

  return data;
}

function decodeToken() {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch (err) {
    console.error('Erro ao decodificar token:', err);
    return null;
  }
}

async function loadProfile() {
  const profileStatus = document.getElementById('profileStatus');

  try {
    const data = await apiRequest('/api/profile', { method: 'GET' });

    document.getElementById('name').value = data.name || '';
    document.getElementById('email').value = data.email || '';

    profileStatus.textContent = '';
    profileStatus.className = 'status';
  } catch (err) {
    console.error(err);
    profileStatus.textContent = err.message;
    profileStatus.className = 'status error';
  }
}

function renderTokenInfo() {
  const tokenInfoDiv = document.getElementById('tokenInfo');
  const token = getToken();

  if (!token) {
    tokenInfoDiv.textContent = 'Nenhum token encontrado no localStorage.';
    return;
  }

  const decoded = decodeToken();
  if (!decoded) {
    tokenInfoDiv.textContent = 'Falha ao decodificar o token.';
    return;
  }

  tokenInfoDiv.textContent = JSON.stringify(decoded, null, 2);
}

async function setupForms() {
  const profileForm = document.getElementById('profileForm');
  const passwordForm = document.getElementById('passwordForm');
  const deleteBtn = document.getElementById('deleteAccountBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const profileStatus = document.getElementById('profileStatus');
  const passwordStatus = document.getElementById('passwordStatus');
  const deleteStatus = document.getElementById('deleteStatus');

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    profileStatus.textContent = 'Salvando...';
    profileStatus.className = 'status';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    try {
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email })
      });
      profileStatus.textContent = 'Perfil atualizado com sucesso.';
      profileStatus.className = 'status success';
    } catch (err) {
      profileStatus.textContent = err.message;
      profileStatus.className = 'status error';
    }
  });

  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordStatus.textContent = 'Atualizando senha...';
    passwordStatus.className = 'status';

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
      await apiRequest('/api/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      passwordStatus.textContent = 'Senha atualizada com sucesso.';
      passwordStatus.className = 'status success';

      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
    } catch (err) {
      passwordStatus.textContent = err.message;
      passwordStatus.className = 'status error';
    }
  });

  deleteBtn.addEventListener('click', async () => {
    const sure = confirm('Tem certeza que deseja excluir sua conta? Esta ação é permanente.');
    if (!sure) return;

    deleteStatus.textContent = 'Excluindo conta...';
    deleteStatus.className = 'status';

    try {
      await apiRequest('/api/profile', { method: 'DELETE' });

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      deleteStatus.textContent = 'Conta excluída. Redirecionando para o login...';
      deleteStatus.className = 'status success';

      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    } catch (err) {
      deleteStatus.textContent = err.message;
      deleteStatus.className = 'status error';
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  ensureAuthenticated();
  renderTokenInfo();
  await loadProfile();
  await setupForms();
});
