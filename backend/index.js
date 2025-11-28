// index.js — backend + API usando Postgres (pg)

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'dev-secret';

// =======================
// CONFIGURAÇÃO DO POSTGRES
// =======================

// IMPORTANTE: host = 'localhost' (NÃO 'db')
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'fs_user',
  password: 'fs_password',
  database: 'fs_db',
});

// =======================
// MIDDLEWARES
// =======================

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));


// =======================
// FUNÇÕES AUXILIARES
// =======================

async function initDb() {
  // Cria tabela de usuários se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Garante que existe pelo menos 1 admin
  const result = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1;`);
  if (result.rows.length === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await pool.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4);
      `,
      ['Admin', 'admin@example.com', hashed, 'admin']
    );
    console.log('Admin criado: admin@example.com / admin123');
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Token não encontrado' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { id, name, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso apenas para admin' });
  }
  next();
}
// =======================
// STATUS VISUAL DA API
// =======================

app.get('/api/status', async (req, res) => {
  const status = {
    server: 'online',
    database: 'offline',
    latency_ms: null,
    timestamp: new Date().toISOString(),
  };

  const start = Date.now();
  try {
    const db = await pool.query('SELECT NOW()');
    status.database = 'online';
    status.latency_ms = Date.now() - start;
  } catch (err) {
    status.database = 'offline';
    status.latency_ms = null;
  }

  res.json(status);
});

// =======================
// ROTAS DE AUTENTICAÇÃO
// =======================

app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user';

    const insert = await pool.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at;
      `,
      [name, email, hashed, userRole]
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: insert.rows[0],
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno ao registrar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1;`,
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '8h' });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: payload,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao fazer login' });
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// =======================
// CRUD USUÁRIOS (ADMIN)
// =======================

app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at FROM users ORDER BY id DESC;`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro interno ao listar usuários' });
  }
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Nome, email, senha e role são obrigatórios' });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
      `,
      [name, email, hashed, role]
    );

    res.status(201).json({
      message: 'Usuário criado pelo admin com sucesso',
      id: insert.rows[0].id,
    });
  } catch (err) {
    console.error('Erro ao criar usuário (admin):', err);
    res.status(500).json({ error: 'Erro interno ao criar usuário' });
  }
});

app.put('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Nome, email e role são obrigatórios' });
  }

  try {
    const emailCheck = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1;`,
      [email, id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Esse email já está em uso por outro usuário' });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET name = $1, email = $2, role = $3
      WHERE id = $4;
      `,
      [name, email, role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar usuário' });
  }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1;`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ error: 'Erro interno ao excluir usuário' });
  }
});

// =======================
// ROTAS: MEU PERFIL
// =======================

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1;`,
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro interno ao buscar perfil' });
  }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  }

  try {
    const emailCheck = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1;`,
      [email, req.user.id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Esse email já está em uso' });
    }

    await pool.query(
      `
      UPDATE users
      SET name = $1, email = $2
      WHERE id = $3;
      `,
      [name, email, req.user.id]
    );

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar perfil' });
  }
});

app.put('/api/profile/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }

  try {
    const result = await pool.query(
      `SELECT id, password FROM users WHERE id = $1 LIMIT 1;`,
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2;
      `,
      [hashed, req.user.id]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (err) {
    console.error('Erro ao trocar senha:', err);
    res.status(500).json({ error: 'Erro interno ao trocar senha' });
  }
});

app.delete('/api/profile', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM users WHERE id = $1;`,
      [req.user.id]
    );
    res.json({ message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    res.status(500).json({ error: 'Erro interno ao excluir conta' });
  }
});

// =======================
// ROTA RAIZ
// =======================

// ROTA RAIZ - Landing Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// =======================
// START DO SERVIDOR
// =======================

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`API rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('Erro ao inicializar o servidor:', err);
    process.exit(1);
  }
}

start();
