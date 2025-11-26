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

// Servir frontend
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

/* ================================================================
   ROTAS BÁSICAS
================================================================ */

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

/* ================================================================
   MIDDLEWARES DE AUTENTICAÇÃO
================================================================ */

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Token faltando." });
  }

  const token = header.split(" ")[1];

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido." });
    }
    req.user = payload; // { id, name, email, role }
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso somente para admin." });
  }
  next();
}

/* ================================================================
   LOGIN REAL (email + senha hash)
================================================================ */

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const email = username;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email e senha são obrigatórios." });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, created_at
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
        role: user.role,
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

/* ================================================================
   /api/me → dados do usuário logado (via token)
================================================================ */

app.get("/api/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});



/* ================================================================
   REGISTRO PÚBLICO /api/register  (sempre cria role = 'user')
================================================================ */

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Nome, e-mail e senha são obrigatórios.",
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, name, email, role, created_at`,
      [name, email, hash]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }
    return res.status(500).json({ error: "Erro interno ao registrar usuário." });
  }
});


/* ================================================================
   CRUD REAL DE USUÁRIOS (APENAS ADMIN)
================================================================ */

// CREATE
app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Nome, e-mail e senha são obrigatórios.",
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, hash, role || "user"]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }
    return res.status(500).json({ error: "Erro interno ao criar usuário." });
  }
});

// READ ALL
app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY id ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    return res.status(500).json({ error: "Erro interno ao listar usuários." });
  }
});

// READ ONE
app.get("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno ao buscar usuário." });
  }
});

// UPDATE
app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    let hash = null;
    if (password) hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash),
           role = COALESCE($4, role)
       WHERE id = $5
       RETURNING id, name, email, role, created_at`,
      [name || null, email || null, hash, role || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    return res.status(500).json({ error: "Erro interno ao atualizar usuário." });
  }
});

// DELETE
app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("Erro ao remover usuário:", err);
    return res.status(500).json({ error: "Erro interno ao remover usuário." });
  }
});

/* ================================================================
   INICIAR SERVIDOR
================================================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API rodando na porta ${PORT}`);
});
