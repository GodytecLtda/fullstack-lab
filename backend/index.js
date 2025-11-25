const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Pool do Postgres
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Função para preparar o banco
async function initDb() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(query);
  console.log("Tabela users pronta ✅");
}

// ROTAS
app.get("/", (req, res) => {
  res.json({ message: "API do Adelmo rodando 😎" });
});

app.get("/api/health", async (req, res) => {
  try {
    const dbNow = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      db_time: dbNow.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name e email são obrigatórios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// BOOT: primeiro banco, depois servidor
(async () => {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`API ouvindo na porta ${port}`);
    });
  } catch (err) {
    console.error("Falha ao inicializar o banco:", err);
    process.exit(1);
  }
})();
app.get("/api/message", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) AS total FROM users");
    const total = Number(result.rows[0].total);

    res.json({
      from: "backend",
      text: `Fullstack Lab Online. Já temos ${total} usuário(s) no banco. 🐳`,
      totalUsers: total,
    });
  } catch (err) {
    console.error("Erro em /api/message:", err);
    res.status(500).json({ error: "Erro ao gerar mensagem" });
  }
});
