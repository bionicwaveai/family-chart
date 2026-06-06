import express from 'express';
import pg from 'pg';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- Object storage (Replit App Storage) for profile photo uploads ---
// Files are uploaded directly to the bucket via a short-lived presigned URL,
// then served back through our own /api/objects route. All photos are public,
// matching the app's single-shared-tree, no-auth model.
const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';
const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR || '';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const objectStorageClient = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: 'external_account',
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: 'json', subject_token_field_name: 'access_token' },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
});

function parseObjectPath(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  const parts = path.split('/');
  if (parts.length < 3) throw new Error('Invalid object path');
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') };
}

async function signObjectURL({ bucketName, objectName, method, ttlSec }) {
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to sign object URL (status ${response.status})`);
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

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

// Request a short-lived presigned URL to upload a single profile photo.
// The browser uploads the file bytes directly to storage with this URL; the
// server never receives the file. Returns the path to serve it back from.
app.post('/api/uploads/request-url', async (req, res) => {
  if (!PRIVATE_OBJECT_DIR) {
    return res.status(500).json({ error: 'Object storage is not configured' });
  }
  const { contentType, size } = req.body || {};
  if (!contentType || !String(contentType).startsWith('image/')) {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }
  if (size && Number(size) > MAX_UPLOAD_BYTES) {
    return res.status(400).json({ error: 'Image is too large (max 10MB)' });
  }
  try {
    const objectId = randomUUID();
    const fullPath = `${PRIVATE_OBJECT_DIR}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const uploadURL = await signObjectURL({
      bucketName,
      objectName,
      method: 'PUT',
      ttlSec: 900,
    });
    // Path the browser stores in the person's `avatar` field and loads later.
    return res.json({ uploadURL, objectPath: `/api/objects/uploads/${objectId}` });
  } catch (err) {
    console.error('POST /api/uploads/request-url failed:', err);
    return res.status(500).json({ error: 'Failed to prepare upload' });
  }
});

// Serve an uploaded photo back to the browser. Only the uploads/<uuid> space is
// reachable, so this cannot be used to read arbitrary objects.
app.get('/api/objects/uploads/:id', async (req, res) => {
  if (!PRIVATE_OBJECT_DIR) {
    return res.status(500).json({ error: 'Object storage is not configured' });
  }
  const { id } = req.params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid object id' });
  }
  try {
    const fullPath = `${PRIVATE_OBJECT_DIR}/uploads/${id}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    const [metadata] = await file.getMetadata();
    // Defense-in-depth: the upload PUT's content-type is client-controlled, so an
    // uploaded file could claim to be text/html and be used to host arbitrary
    // content (e.g. stored XSS) under our origin. Only ever serve a stored
    // content-type that is actually an image; anything else is served as an inert
    // download. `nosniff` stops the browser from MIME-sniffing it back to HTML.
    const storedType = String(metadata.contentType || '');
    const safeType = storedType.startsWith('image/') ? storedType : 'application/octet-stream';
    res.set({
      'Content-Type': safeType,
      'Content-Length': metadata.size,
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    });
    file.createReadStream()
      .on('error', (err) => {
        console.error('Error streaming object:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (err) {
    console.error('GET /api/objects/uploads/:id failed:', err);
    return res.status(500).json({ error: 'Failed to load photo' });
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
