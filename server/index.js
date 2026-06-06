import express from 'express';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Ensure the storage table exists before serving requests, so a fresh database
// (e.g. first run on a new environment) doesn't return errors.
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS family_tree (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT single_row CHECK (id = 1)
    )
  `);
}

const app = express();
app.use(express.json({ limit: '5mb' }));

// Read the saved shared family tree. Falls back to the default first-node
// sample when nothing has been saved yet.
app.get('/api/tree', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM family_tree WHERE id = 1');
    if (result.rows.length > 0 && result.rows[0].data) {
      return res.json(result.rows[0].data);
    }
    const defaultPath = resolve(rootDir, 'examples/data/data-first-node.json');
    const fallback = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    return res.json(fallback);
  } catch (err) {
    console.error('GET /api/tree failed:', err);
    return res.status(500).json({ error: 'Failed to load family tree' });
  }
});

// Replace the saved shared family tree with the posted dataset.
app.put('/api/tree', async (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Expected an array of people' });
  }
  try {
    await pool.query(
      `INSERT INTO family_tree (id, data, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(data)]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/tree failed:', err);
    return res.status(500).json({ error: 'Failed to save family tree' });
  }
});

// In production, serve the built static site (dist/) alongside the API.
if (process.env.NODE_ENV === 'production') {
  const distDir = resolve(rootDir, 'dist');
  app.use(express.static(distDir));
}

const isProd = process.env.NODE_ENV === 'production';
const port = process.env.PORT || (isProd ? 5000 : 3001);
const host = isProd ? '0.0.0.0' : 'localhost';

initSchema()
  .then(() => {
    app.listen(port, host, () => {
      console.log(`API server listening on http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });
