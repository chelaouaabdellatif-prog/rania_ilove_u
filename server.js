import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV = process.argv.includes('--dev');
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const SESSION_DAYS = 30;

// ---------- storage ----------
const empty = () => ({
  auth: null, // { admin: hash, rania: hash }
  sessions: {},
  announcement: { text: '', active: false, speed: 'normal', updatedAt: null },
  state: { units: {}, weeks: {}, tasks: {} },
});

function load() {
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
  } catch {
    return empty();
  }
}
let db = load();

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// ---------- passwords & sessions ----------
function hash(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
}
function verify(pw, stored) {
  if (!stored) return false;
  const [salt, hex] = stored.split(':');
  const a = crypto.scryptSync(pw, salt, 32);
  const b = Buffer.from(hex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function newSession(role) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = { role, expires: Date.now() + SESSION_DAYS * 864e5 };
  for (const [t, s] of Object.entries(db.sessions)) if (s.expires < Date.now()) delete db.sessions[t];
  save();
  return token;
}

const failures = new Map(); // ip -> { n, until }
function blocked(ip) {
  const f = failures.get(ip);
  return f && f.n >= 5 && f.until > Date.now();
}
function fail(ip) {
  const f = failures.get(ip);
  const n = f && f.until > Date.now() ? f.n + 1 : 1;
  failures.set(ip, { n, until: Date.now() + 10 * 60e3 });
}

function auth(...roles) {
  return (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const s = db.sessions[token];
    if (!s || s.expires < Date.now()) return res.status(401).json({ error: 'انتهت الجلسة، سجّل الدخول من جديد.' });
    if (roles.length && !roles.includes(s.role)) return res.status(403).json({ error: 'هذه العملية للمشرف فقط.' });
    req.role = s.role;
    req.token = token;
    next();
  };
}

const validPw = (p) => typeof p === 'string' && p.length >= 4 && p.length <= 100;

// ---------- api ----------
const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/status', (req, res) => res.json({ setup: !db.auth }));

app.post('/api/setup', (req, res) => {
  if (db.auth) return res.status(409).json({ error: 'كلمات السر محددة من قبل.' });
  const { adminPw, raniaPw } = req.body || {};
  if (!validPw(adminPw) || !validPw(raniaPw)) return res.status(400).json({ error: 'كل كلمة سر يجب أن تكون 4 أحرف على الأقل.' });
  if (adminPw === raniaPw) return res.status(400).json({ error: 'كلمة سر المشرف يجب أن تختلف عن كلمة سر رانيا.' });
  db.auth = { admin: hash(adminPw), rania: hash(raniaPw) };
  res.json({ token: newSession('admin'), role: 'admin' });
});

app.post('/api/login', (req, res) => {
  const ip = req.ip;
  if (blocked(ip)) return res.status(429).json({ error: 'محاولات كثيرة. انتظر 10 دقائق ثم أعد المحاولة.' });
  const pw = String((req.body || {}).password || '');
  const role = verify(pw, db.auth?.admin) ? 'admin' : verify(pw, db.auth?.rania) ? 'rania' : null;
  if (!role) {
    fail(ip);
    return res.status(401).json({ error: 'كلمة السر غير صحيحة.' });
  }
  failures.delete(ip);
  res.json({ token: newSession(role), role });
});

app.post('/api/logout', auth(), (req, res) => {
  delete db.sessions[req.token];
  save();
  res.json({ ok: true });
});

app.get('/api/me', auth(), (req, res) => res.json({ role: req.role }));

app.get('/api/announcement', auth(), (req, res) => res.json(db.announcement));

app.put('/api/announcement', auth('admin'), (req, res) => {
  const { text, active, speed } = req.body || {};
  db.announcement = {
    text: String(text ?? '').slice(0, 500),
    active: !!active,
    speed: ['slow', 'normal', 'fast'].includes(speed) ? speed : 'normal',
    updatedAt: new Date().toISOString(),
  };
  save();
  res.json(db.announcement);
});

app.get('/api/state', auth(), (req, res) => res.json(db.state));

app.put('/api/state', auth(), (req, res) => {
  const { units, weeks, tasks } = req.body || {};
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  db.state = { units: obj(units), weeks: obj(weeks), tasks: obj(tasks) };
  save();
  res.json({ ok: true });
});

app.put('/api/passwords', auth('admin'), (req, res) => {
  const { adminPw, raniaPw } = req.body || {};
  if (adminPw && !validPw(adminPw)) return res.status(400).json({ error: 'كلمة سر المشرف قصيرة: 4 أحرف على الأقل.' });
  if (raniaPw && !validPw(raniaPw)) return res.status(400).json({ error: 'كلمة سر رانيا قصيرة: 4 أحرف على الأقل.' });
  if (adminPw && raniaPw && adminPw === raniaPw) return res.status(400).json({ error: 'الكلمتان يجب أن تختلفا.' });
  if (adminPw) db.auth.admin = hash(adminPw);
  if (raniaPw) {
    db.auth.rania = hash(raniaPw);
    for (const [t, s] of Object.entries(db.sessions)) if (s.role === 'rania') delete db.sessions[t];
  }
  save();
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'غير موجود' }));

// ---------- front-end ----------
if (DEV) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  const dist = path.join(__dirname, 'dist');
  if (!fs.existsSync(dist)) {
    console.error('المجلد dist غير موجود. شغّل أولاً: npm run build');
    process.exit(1);
  }
  app.use(express.static(dist));
  app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`\n  رانيا · بكالوريا 2027  (${DEV ? 'تطوير' : 'تشغيل'})`);
  console.log(`  على هذا الجهاز:   http://localhost:${PORT}`);
  for (const nets of Object.values(os.networkInterfaces()))
    for (const n of nets || [])
      if (n.family === 'IPv4' && !n.internal) console.log(`  من الهاتف (نفس الشبكة): http://${n.address}:${PORT}`);
  console.log('');
});
