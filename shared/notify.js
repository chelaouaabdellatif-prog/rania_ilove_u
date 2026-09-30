// Notifications: push subscriptions, exams/appointments, pinned notices, reminder scheduler.
// Shared by server.js (local) and worker/index.js (Cloudflare).
//
// ctx = {
//   db, saveDb()            -> db.events [], db.notices [], db.quizzes, db.results
//   push, savePush()        -> push.vapid, push.subs {id: {sub, role, prefs, at}}, push.sent {key: ms}
//   subject                 -> VAPID contact (mailto: or https: URL)
// }

import { WEEK, SUBJ } from '../src/data.js';
import { generateVapid, sendPush } from './webpush.js';

const TZ = 60; // Algeria: UTC+1, no daylight saving
const WINDOW = 3 * 60e3; // a reminder fires if its time is within the last 3 minutes
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const PUSH_HOSTS = ['googleapis.com', 'mozilla.com', 'mozaws.net', 'push.apple.com', 'notify.windows.com'];

export const KINDS = { exam: 'امتحان', course: 'درس', other: 'موعد' };
export const REMIND_OPTIONS = [0, 15, 60, 1440]; // minutes before
export const defaultPrefs = (role) => ({ lead: 10, sessions: role === 'admin' ? 'none' : 'all', events: true, quiz: true, notices: true });

// ---------- time helpers (Algeria local time) ----------
const pad = (n) => String(n).padStart(2, '0');
export function algParts(ms = Date.now()) {
  const d = new Date(ms + TZ * 60e3);
  return { date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, day: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
export function algToMs(date, hhmm) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, mi) - TZ * 60e3;
}
const dayOf = (date) => new Date(algToMs(date, '12:00')).getUTCDay();
function beforeText(min, time) {
  if (min === 0) return 'الآن';
  if (min < 60) return `بعد ${min} دقيقة`;
  if (min < 1440) return `بعد ${min / 60 === 1 ? 'ساعة' : `${min / 60} ساعات`}`;
  return `غدا على الساعة ${time}`;
}

// ---------- sending ----------
async function subId(endpoint) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(h)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function vapid(ctx) {
  if (!ctx.push.vapid) {
    ctx.push.vapid = await generateVapid();
    await ctx.savePush();
  }
  return ctx.push.vapid;
}
// Send to every subscription matching filter(record). Removes expired ones.
export async function sendTo(ctx, filter, data) {
  const keys = await vapid(ctx);
  let removed = false, sent = 0;
  for (const [id, rec] of Object.entries(ctx.push.subs || {})) {
    if (!filter(rec)) continue;
    const r = await sendPush(rec.sub, { url: '/', ...data }, keys, ctx.subject);
    if (r === 'gone') { delete ctx.push.subs[id]; removed = true; }
    if (r === 'ok') sent++;
  }
  if (removed) await ctx.savePush();
  return sent;
}

// ---------- scheduler: call every minute ----------
export async function tick(ctx, now = Date.now()) {
  const { push, db } = ctx;
  push.subs ||= {};
  push.sent ||= {};
  if (!Object.keys(push.subs).length) return 0;
  const due = []; // { id, key, data }
  const inWindow = (t) => t <= now && t > now - WINDOW;
  const today = algParts(now);

  for (const [id, rec] of Object.entries(push.subs)) {
    const p = { ...defaultPrefs(rec.role), ...rec.prefs };

    // sessions of the schedule, `lead` minutes before
    if (p.sessions !== 'none') {
      const dates = new Set([today.date, algParts(now + p.lead * 60e3).date]);
      for (const date of dates) {
        const di = dayOf(date);
        WEEK[di].s.forEach((s, j) => {
          if (p.sessions === 'lessons' && !s[4]) return;
          if (!inWindow(algToMs(date, s[0]) - p.lead * 60e3)) return;
          const name = s[2] === 'bac' ? 'موضوع بكالوريا' : SUBJ[s[2]].n;
          due.push({ id, key: `${id}|s|${date}|${di}-${j}`, data: {
            title: `${s[4] ? 'درس خصوصي' : 'حصة'} ${name} بعد ${p.lead} دقائق`,
            body: `${s[0]}–${s[1]} · ${s[3]}`, tag: `s-${date}-${di}-${j}`,
          } });
        });
      }
    }

    // exams and appointments
    if (p.events) {
      for (const ev of db.events || []) {
        for (const r of ev.remind || []) {
          if (!inWindow(algToMs(ev.date, ev.time) - r * 60e3)) continue;
          due.push({ id, key: `${id}|e|${ev.id}|${r}`, data: {
            title: `${KINDS[ev.kind] || 'موعد'}: ${ev.title}`,
            body: `${beforeText(r, ev.time)}${r ? ` (${ev.time})` : ''}${ev.note ? ` · ${ev.note}` : ''}`, tag: `e-${ev.id}`,
          } });
        }
      }
    }

    // today's quiz, from 08:00, once (Rania only)
    if (p.quiz && rec.role === 'rania' && today.min >= 8 * 60) {
      const q = db.quizzes?.[today.date];
      if (q && !db.results?.[today.date]) {
        due.push({ id, key: `${id}|q|${today.date}`, data: {
          title: 'اختبار اليوم جاهز ♥', body: `${q.title || 'اختبار'} · ${q.questions.length} أسئلة`, tag: `q-${today.date}`, url: '/?tab=quiz',
        } });
      }
    }
  }

  const todo = due.filter((d) => !push.sent[d.key]);
  if (!todo.length) return 0;
  const keys = await vapid(ctx);
  for (const d of todo) {
    const rec = push.subs[d.id];
    if (!rec) continue;
    const r = await sendPush(rec.sub, { url: '/', ...d.data }, keys, ctx.subject);
    if (r === 'gone') delete push.subs[d.id];
    push.sent[d.key] = now;
  }
  for (const [k, t] of Object.entries(push.sent)) if (t < now - 3 * 864e5) delete push.sent[k];
  await ctx.savePush();
  return todo.length;
}

// ---------- validation ----------
function validSub(s) {
  try {
    const u = new URL(s.endpoint);
    return u.protocol === 'https:' && PUSH_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h))
      && typeof s.keys?.p256dh === 'string' && typeof s.keys?.auth === 'string';
  } catch { return false; }
}
function cleanPrefs(p, role) {
  const d = defaultPrefs(role), x = p || {};
  return {
    lead: [5, 10, 15, 30, 60].includes(Number(x.lead)) ? Number(x.lead) : d.lead,
    sessions: ['all', 'lessons', 'none'].includes(x.sessions) ? x.sessions : d.sessions,
    events: x.events === undefined ? d.events : !!x.events,
    quiz: x.quiz === undefined ? d.quiz : !!x.quiz,
    notices: x.notices === undefined ? d.notices : !!x.notices,
  };
}
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- routes ----------
export async function notifyRoute({ method, path, body = {}, role, ctx }) {
  const { db, push } = ctx;
  const isAdmin = role === 'admin';
  const ok = (b = { ok: true }) => ({ status: 200, body: b });
  const bad = (error, status = 400) => ({ status, body: { error } });
  const forbid = () => bad('هذه العملية للمشرف فقط.', 403);
  push.subs ||= {};
  db.events ||= [];
  db.notices ||= [];

  // --- push subscriptions (each device) ---
  if (path === '/api/push/key' && method === 'GET') return ok({ publicKey: (await vapid(ctx)).publicKey });

  if (path === '/api/push/subscribe' && method === 'POST') {
    if (!validSub(body.subscription || {})) return bad('اشتراك غير صالح.');
    const id = await subId(body.subscription.endpoint);
    const old = push.subs[id];
    push.subs[id] = {
      sub: { endpoint: body.subscription.endpoint, keys: { p256dh: body.subscription.keys.p256dh, auth: body.subscription.keys.auth } },
      role, prefs: cleanPrefs(body.prefs || old?.prefs, role), at: new Date().toISOString(),
    };
    await ctx.savePush();
    return ok({ prefs: push.subs[id].prefs });
  }
  if (path === '/api/push/status' && method === 'POST') {
    const rec = body.endpoint && push.subs[await subId(body.endpoint)];
    return ok({ subscribed: !!rec, prefs: rec ? rec.prefs : defaultPrefs(role) });
  }
  if (path === '/api/push/prefs' && method === 'POST') {
    const id = body.endpoint && await subId(body.endpoint);
    if (!push.subs[id]) return bad('هذا الجهاز غير مشترك في التنبيهات.', 404);
    push.subs[id].prefs = cleanPrefs(body.prefs, role);
    await ctx.savePush();
    return ok({ prefs: push.subs[id].prefs });
  }
  if (path === '/api/push/unsubscribe' && method === 'POST') {
    const id = body.endpoint && await subId(body.endpoint);
    if (push.subs[id]) { delete push.subs[id]; await ctx.savePush(); }
    return ok();
  }
  if (path === '/api/push/test' && method === 'POST') {
    const id = body.endpoint && await subId(body.endpoint);
    if (!push.subs[id]) return bad('هذا الجهاز غير مشترك في التنبيهات.', 404);
    const n = await sendTo(ctx, (r) => r === push.subs[id], { title: 'تنبيه تجريبي ♥', body: 'التنبيهات تعمل على هذا الجهاز.', tag: 'test' });
    return n ? ok() : bad('تعذّر إرسال التنبيه. أعد تفعيل التنبيهات على هذا الجهاز.', 502);
  }
  if (path === '/api/push/devices' && method === 'GET') {
    if (!isAdmin) return forbid();
    return ok({ devices: Object.values(push.subs).map((r) => ({ role: r.role, at: r.at, host: new URL(r.sub.endpoint).hostname })) });
  }

  // --- exams & appointments ---
  if (path === '/api/events' && method === 'GET') {
    return ok({ events: [...db.events].sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)) });
  }
  if (path === '/api/events' && method === 'POST') {
    if (!isAdmin) return forbid();
    const title = String(body.title || '').trim().slice(0, 120);
    const note = String(body.note || '').trim().slice(0, 200);
    if (!title) return bad('اكتب عنوان الموعد.');
    if (!DATE_RE.test(body.date || '') || !TIME_RE.test(body.time || '')) return bad('اختر التاريخ والساعة.');
    const remind = [...new Set((body.remind || []).map(Number))].filter((r) => REMIND_OPTIONS.includes(r));
    const cutoff = algParts(Date.now() - 30 * 864e5).date;
    db.events = db.events.filter((e) => e.date >= cutoff).slice(-199);
    db.events.push({ id: rid(), title, note, kind: KINDS[body.kind] ? body.kind : 'other', date: body.date, time: body.time, remind });
    await ctx.saveDb();
    return ok();
  }
  let m = path.match(/^\/api\/events\/([\w-]+)$/);
  if (m && method === 'DELETE') {
    if (!isAdmin) return forbid();
    db.events = db.events.filter((e) => e.id !== m[1]);
    await ctx.saveDb();
    return ok();
  }

  // --- notices pinned on the home page ---
  if (path === '/api/notices' && method === 'GET') return ok({ notices: db.notices });
  if (path === '/api/notices' && method === 'POST') {
    if (!isAdmin) return forbid();
    const text = String(body.text || '').trim().slice(0, 500);
    if (!text) return bad('اكتب نص الملاحظة.');
    db.notices = [{ id: rid(), text, pinned: body.pinned !== false, at: new Date().toISOString() }, ...db.notices].slice(0, 50);
    await ctx.saveDb();
    let sent = 0;
    if (body.push) {
      sent = await sendTo(ctx, (r) => r.role === 'rania' && ({ ...defaultPrefs(r.role), ...r.prefs }).notices,
        { title: 'ملاحظة جديدة 📌', body: text.slice(0, 180), tag: 'notice' });
    }
    return ok({ sent });
  }
  m = path.match(/^\/api\/notices\/([\w-]+)$/);
  if (m && (method === 'PUT' || method === 'DELETE')) {
    if (!isAdmin) return forbid();
    if (method === 'DELETE') db.notices = db.notices.filter((n) => n.id !== m[1]);
    else db.notices = db.notices.map((n) => (n.id === m[1] ? { ...n, pinned: !!body.pinned } : n));
    await ctx.saveDb();
    return ok();
  }
  return null;
}

// Tell the admin's devices when Rania finishes a quiz.
export const quizDoneNotice = (ctx, quiz, result) =>
  sendTo(ctx, (r) => r.role === 'admin' && ({ ...defaultPrefs(r.role), ...r.prefs }).quiz,
    { title: `رانيا أنهت الاختبار: ${result.score}/${result.total}`, body: quiz.title || 'اختبار اليوم', tag: 'quiz-done' });
