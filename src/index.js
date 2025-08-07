const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;

// Neon connection string
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_MUtzEhy9LNa3@ep-quiet-fire-adqwc6mq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Database connected: ${result.rows[0].now}`);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Database connection failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
