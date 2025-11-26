const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = "super-secreto-do-adelmo"; // depois movemos pra variável de ambiente

// Pool de conexão com Postgres
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "appsecret",
  database: process.env.DB_NAME || "appdb",
});

app.use(cors());
app.use(express.json());

// servir arquivos estáticos (login.html, index.html, etc.)
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

/* ───────────────────────── API BÁSICA ───────────────────────── */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API do fullstack-lab está viva 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/message", (req, res) => {
  res.json({
    message: "Olá, Adelmo! Esta é uma mensagem da API 🤖",
  });
});

/* ───────────────────── AUTENTICAÇÃO REAL ───────────────────── */
/*
  Vamos usar:
  - /api/login -> login com email + senha
  - /api/me    -> retorna dados do usuário logado (via token)
*/

// Login: o frontend manda { username, password }
// Vamos tratar "username" como email, pra não quebrar login.js
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const email = username; // label pode ser "Usuário", mas o valor é o email

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email e senha são obrigatórios." });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ ok: false, error: "Credenciais inválidas." });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      SECRET,
      { expiresIn: "2h" }
    );

    return res.json({ ok: true, token });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ ok: false, error: "Erro interno no login." });
  }
});

// Middleware simples para rotas que exigem token (se quiser usar depois)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token faltando." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido." });
    }
    req.user = payload;
    next();
  });
}

// /api/me -> retorna o usuário do token
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/* ─────────────────────── CRUD REAL DE USERS ─────────────────────── */
/*
  Tabela: users (id, name, email, password_hash, created_at)

  - POST   /api/users        -> Create
  - GET    /api/users        -> Read (todos)
  - GET    /api/users/:id    -> Read (um)
  - PUT    /api/users/:id    -> Update
  - DELETE /api/users/:id    -> Delete
*/

// CREATE - cria usuário com senha
app.post("/api/users", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Nome, e-mail e senha são obrigatórios." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao inserir usuário:", err);
    if (err.code === "23505") {
      // unique_violation
      return res
        .status(409)
        .json({ error: "E-mail já cadastrado." });
    }
    return res.status(500).json({ error: "Erro interno ao criar usuário." });
  }
});

// READ (todos)
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       ORDER BY id ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    return res.status(500).json({ error: "Erro interno ao listar usuários." });
  }
});

// READ (um)
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    return res.status(500).json({ error: "Erro interno ao buscar usuário." });
  }
});

// UPDATE (nome/email/senha)
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    return res.status(400).json({
      error: "Informe ao menos nome, e-mail ou senha para atualizar.",
    });
  }

  try {
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash)
       WHERE id = $4
       RETURNING id, name, email, created_at`,
      [name || null, email || null, passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }
    return res.status(500).json({ error: "Erro interno ao atualizar usuário." });
  }
});

// DELETE
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("Erro ao remover usuário:", err);
    return res.status(500).json({ error: "Erro interno ao remover usuário." });
  }
});

/* ───────────────────────── START SERVER ───────────────────────── */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API rodando na porta ${PORT}`);
});
