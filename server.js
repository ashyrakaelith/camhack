const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const PORT        = 5000;
const SAVE_DIR    = path.join(__dirname, 'captures');
const MAX_FILE_MB = 5;

if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

const app = express();

app.use(cors());

app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SAVE_DIR),
  filename:    (_req, file,  cb) => cb(null, file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.warn('[WARN] Request received with no valid image file');
    return res.status(400).json({ error: 'No image received' });
  }

  const { originalname, size, path: savedPath } = req.file;
  console.log(`[SAVED] ${originalname}  (${(size / 1024).toFixed(1)} KB)  →  ${savedPath}`);

  res.json({ ok: true, file: originalname });
});

app.get('/status', (_req, res) => {
  const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.jpg'));
  res.json({ status: 'running', captured: files.length, saveDir: SAVE_DIR });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📷  Capture server running`);
  console.log(`    Listening on  http://0.0.0.0:${PORT}`);
  console.log(`    Saving to     ${SAVE_DIR}\n`);
});
