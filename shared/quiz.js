// Quiz logic shared by server.js (local) and worker/index.js (Cloudflare).
// db.quizzes[date] = { title, subject, questions: [{ q, options: [..], answer: index }] }
// db.results[date] = { answers: [..], score, total, at }

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SUBJECTS = ['de', 'en', 'fr', 'ar', 'hg', 'is', 'other'];
export const MIN_TIME = 5;
export const MAX_TIME = 600;

// Automatic time for a question: 15 s + reading time of the question and its options,
// rounded up to 5 s, between 15 s and 120 s.
export function autoTime(q, options = []) {
  const chars = String(q || '').length + options.reduce((n, o) => n + String(o || '').length, 0);
  return Math.min(120, Math.max(15, Math.ceil((15 + chars / 12) / 5) * 5));
}
// Seconds for a question: its own time if set, otherwise the automatic one.
export const questionTime = (q) => (q.time ? q.time : autoTime(q.q, q.options));

export function validateQuiz(body) {
  const b = body || {};
  const title = String(b.title || '').trim().slice(0, 120);
  const subject = SUBJECTS.includes(b.subject) ? b.subject : 'other';
  const timed = !!b.timed;
  if (!Array.isArray(b.questions) || b.questions.length === 0) return { error: 'أضف سؤالا واحدا على الأقل.' };
  if (b.questions.length > 30) return { error: '30 سؤالا كحد أقصى.' };
  const questions = [];
  for (const [i, raw] of b.questions.entries()) {
    const q = String(raw?.q || '').trim().slice(0, 500);
    const options = (Array.isArray(raw?.options) ? raw.options : []).map((o) => String(o || '').trim().slice(0, 200));
    const n = i + 1;
    if (!q) return { error: `السؤال ${n}: اكتب نص السؤال.` };
    if (options.length < 2 || options.length > 4 || options.some((o) => !o)) return { error: `السؤال ${n}: يلزم من 2 إلى 4 اقتراحات غير فارغة.` };
    const answer = Number(raw.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return { error: `السؤال ${n}: اختر الجواب الصحيح.` };
    let time = raw.time === null || raw.time === undefined || raw.time === '' ? null : Number(raw.time);
    if (time !== null && (!Number.isInteger(time) || time < MIN_TIME || time > MAX_TIME)) return { error: `السؤال ${n}: الوقت بين ${MIN_TIME} و${MAX_TIME} ثانية، أو اتركه فارغا للوقت التلقائي.` };
    questions.push({ q, options, answer, time });
  }
  return { quiz: { title, subject, timed, questions, updatedAt: new Date().toISOString() } };
}

// What Rania sees before answering: no correct answers.
export function publicQuiz(quiz) {
  return {
    title: quiz.title, subject: quiz.subject, timed: !!quiz.timed,
    questions: quiz.questions.map((x) => ({ q: x.q, options: x.options, ...(quiz.timed ? { time: questionTime(x) } : {}) })),
  };
}

export function grade(quiz, answers) {
  const a = quiz.questions.map((_, i) => {
    const v = Array.isArray(answers) ? Number(answers[i]) : NaN;
    return Number.isInteger(v) ? v : -1;
  });
  const score = quiz.questions.reduce((s, q, i) => s + (a[i] === q.answer ? 1 : 0), 0);
  return { answers: a, score, total: quiz.questions.length, at: new Date().toISOString() };
}

export function history(db) {
  const results = db.results || {};
  return Object.entries(db.quizzes || {})
    .map(([date, q]) => ({ date, title: q.title, subject: q.subject, total: q.questions.length, score: results[date]?.score ?? null }))
    .sort((x, y) => (x.date < y.date ? 1 : -1));
}

// Routes shared by both servers. `db` is loaded, `save()` persists it.
// Returns { status, body } or null when the path isn't a quiz route.
export async function quizRoute({ method, path, query, body, role, db, save }) {
  const isAdmin = role === 'admin';
  const forbid = { status: 403, body: { error: 'هذه العملية للمشرف فقط.' } };
  db.quizzes ||= {};
  db.results ||= {};

  // Rania: today's quiz (without answers until she submits)
  if (path === '/api/quiz' && method === 'GET') {
    const date = DATE_RE.test(query.date || '') ? query.date : null;
    if (!date) return { status: 400, body: { error: 'تاريخ غير صالح.' } };
    const quiz = db.quizzes[date];
    const result = db.results[date] || null;
    return {
      status: 200,
      body: { date, quiz: quiz ? (result || isAdmin ? quiz : publicQuiz(quiz)) : null, result, history: history(db) },
    };
  }

  if (path === '/api/quiz/submit' && method === 'POST') {
    const date = body?.date;
    const quiz = DATE_RE.test(date || '') && db.quizzes[date];
    if (!quiz) return { status: 404, body: { error: 'لا يوجد اختبار في هذا التاريخ.' } };
    if (db.results[date]) return { status: 409, body: { error: 'أجبتِ على هذا الاختبار من قبل.', result: db.results[date], quiz } };
    const result = grade(quiz, body.answers);
    if (!isAdmin) { // the admin can try the quiz without saving a result
      db.results[date] = result;
      await save();
    }
    return { status: 200, body: { result, quiz } };
  }

  // Admin: list, create/edit, delete, reset a result
  if (path === '/api/quizzes' && method === 'GET') {
    if (!isAdmin) return forbid;
    return { status: 200, body: { quizzes: db.quizzes, results: db.results } };
  }

  const m = path.match(/^\/api\/(quizzes|results)\/(\d{4}-\d{2}-\d{2})$/);
  if (m) {
    if (!isAdmin) return forbid;
    const [, kind, date] = m;
    if (kind === 'quizzes' && method === 'PUT') {
      const { quiz, error } = validateQuiz(body);
      if (error) return { status: 400, body: { error } };
      db.quizzes[date] = quiz;
      const old = db.results[date];
      if (old) db.results[date] = { ...grade(quiz, old.answers), at: old.at }; // re-grade after a correction
      await save();
      return { status: 200, body: { ok: true } };
    }
    if (method === 'DELETE') {
      if (kind === 'quizzes') delete db.quizzes[date];
      delete db.results[date];
      await save();
      return { status: 200, body: { ok: true } };
    }
  }
  return null;
}
