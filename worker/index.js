// Cloudflare Worker: same API as server.js, data stored in KV (binding: DB).
// Static files (dist/) are served by the assets binding.

const SESSION_DAYS = 30;
const enc = new TextEncoder();

const empty = () => ({
  auth: null,
  announcement: { text: '', active: false, speed: 'normal', updatedAt: null },
  state: { units: {}, weeks: {}, tasks: {} },
});

async function load(env) {
  const d = await env.DB.get('db', 'json');
  return { ...empty(), ...(d || {}) };
}
const save = (env, db) => env.DB.put('db', JSON.stringify(db));

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)));

async function pbkdf2(pw, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
}
async function hash(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return hex(salt) + ':' + hex(await pbkdf2(pw, salt));
}
async function verify(pw, stored) {
  if (!stored) return false;
  const [salt, h] = stored.split(':');
  const a = new Uint8Array(await pbkdf2(pw, unhex(salt)));
  const b = unhex(h);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function newSession(env, role) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.put(`session:${token}`, role, { expirationTtl: SESSION_DAYS * 86400 });
  return token;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const err = (status, error) => json({ error }, status);
const validPw = (p) => typeof p === 'string' && p.length >= 4 && p.length <= 100;
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

async function session(req, env) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
  if (!token) return null;
  const role = await env.DB.get(`session:${token}`);
  return role ? { role, token } : null;
}

async function api(req, env, path) {
  const method = req.method;
  const body = method === 'GET' ? {} : await req.json().catch(() => ({}));
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';

  if (path === '/api/status' && method === 'GET') {
    const db = await load(env);
    return json({ setup: !db.auth });
  }

  if (path === '/api/setup' && method === 'POST') {
    const db = await load(env);
    if (db.auth) return err(409, 'كلمات السر محددة من قبل.');
    const { adminPw, raniaPw } = body;
    if (!validPw(adminPw) || !validPw(raniaPw)) return err(400, 'كل كلمة سر يجب أن تكون 4 أحرف على الأقل.');
    if (adminPw === raniaPw) return err(400, 'كلمة سر المشرف يجب أن تختلف عن كلمة سر رانيا.');
    db.auth = { admin: await hash(adminPw), rania: await hash(raniaPw) };
    await save(env, db);
    return json({ token: await newSession(env, 'admin'), role: 'admin' });
  }

  if (path === '/api/login' && method === 'POST') {
    const failKey = `fail:${ip}`;
    const fails = Number(await env.DB.get(failKey)) || 0;
    if (fails >= 5) return err(429, 'محاولات كثيرة. انتظر 10 دقائق ثم أعد المحاولة.');
    const db = await load(env);
    const pw = String(body.password || '');
    const role = (await verify(pw, db.auth?.admin)) ? 'admin' : (await verify(pw, db.auth?.rania)) ? 'rania' : null;
    if (!role) {
      await env.DB.put(failKey, String(fails + 1), { expirationTtl: 600 });
      return err(401, 'كلمة السر غير صحيحة.');
    }
    await env.DB.delete(failKey);
    return json({ token: await newSession(env, role), role });
  }

  const s = await session(req, env);
  if (!s) return err(401, 'انتهت الجلسة، سجّل الدخول من جديد.');
  const adminOnly = () => (s.role === 'admin' ? null : err(403, 'هذه العملية للمشرف فقط.'));

  if (path === '/api/logout' && method === 'POST') {
    await env.DB.delete(`session:${s.token}`);
    return json({ ok: true });
  }
  if (path === '/api/me' && method === 'GET') return json({ role: s.role });

  if (path === '/api/announcement') {
    const db = await load(env);
    if (method === 'GET') return json(db.announcement);
    if (method === 'PUT') {
      const denied = adminOnly();
      if (denied) return denied;
      db.announcement = {
        text: String(body.text ?? '').slice(0, 500),
        active: !!body.active,
        speed: ['slow', 'normal', 'fast'].includes(body.speed) ? body.speed : 'normal',
        updatedAt: new Date().toISOString(),
      };
      await save(env, db);
      return json(db.announcement);
    }
  }

  if (path === '/api/state') {
    const db = await load(env);
    if (method === 'GET') return json(db.state);
    if (method === 'PUT') {
      db.state = { units: obj(body.units), weeks: obj(body.weeks), tasks: obj(body.tasks) };
      await save(env, db);
      return json({ ok: true });
    }
  }

  if (path === '/api/passwords' && method === 'PUT') {
    const denied = adminOnly();
    if (denied) return denied;
    const { adminPw, raniaPw } = body;
    if (adminPw && !validPw(adminPw)) return err(400, 'كلمة سر المشرف قصيرة: 4 أحرف على الأقل.');
    if (raniaPw && !validPw(raniaPw)) return err(400, 'كلمة سر رانيا قصيرة: 4 أحرف على الأقل.');
    if (adminPw && raniaPw && adminPw === raniaPw) return err(400, 'الكلمتان يجب أن تختلفا.');
    const db = await load(env);
    if (adminPw) db.auth.admin = await hash(adminPw);
    if (raniaPw) db.auth.rania = await hash(raniaPw);
    await save(env, db);
    return json({ ok: true });
  }

  return err(404, 'غير موجود');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      if (!env.DB) return err(500, 'قاعدة البيانات (KV) غير مربوطة بالـ Worker.');
      try {
        return await api(req, env, url.pathname);
      } catch (e) {
        return err(500, 'خطأ في الخادم: ' + (e && e.message));
      }
    }
    return env.ASSETS.fetch(req);
  },
};
