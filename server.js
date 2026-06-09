/**
 * capture-server.js
 * Receives JPEG frames from the browser client and saves them to ./captures/
 *
 * Install deps:  npm install express multer cors
 * Run:           node capture-server.js
 */

const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

// ─── CONFIG ────────────────────────────────────────────────────
const PORT        = 3000;
const SAVE_DIR    = path.join(__dirname, 'captures');
const MAX_FILE_MB = 5;
// ───────────────────────────────────────────────────────────────

// Make sure the save directory exists
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

const app = express();

// Allow requests from any origin (your browser client)
app.use(cors());

// Multer storage — keeps original filename sent by client
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SAVE_DIR),
  filename:    (_req, file,  cb) => cb(null, file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    cb(null, file.mimetype.startsWith('image/'));
  },
});

// ─── ROUTES ────────────────────────────────────────────────────

// POST /upload  — receives one image per request
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.warn('[WARN] Request received with no valid image file');
    return res.status(400).json({ error: 'No image received' });
  }

  const { originalname, size, path: savedPath } = req.file;
  console.log(`[SAVED] ${originalname}  (${(size / 1024).toFixed(1)} KB)  →  ${savedPath}`);

  res.json({ ok: true, file: originalname });
});

// GET /  — simple health check
app.get('/', (_req, res) => {
  const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.jpg'));
  res.json({ status: 'running', captured: files.length, saveDir: SAVE_DIR });
});

// ─── START ─────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📷  Capture server running`);
  console.log(`    Listening on  http://0.0.0.0:${PORT}`);
  console.log(`    Saving to     ${SAVE_DIR}\n`);
});