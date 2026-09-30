import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { key } from '../data.js';
import { questionTime } from '../../shared/quiz.js';

// Progress of an unfinished quiz, kept so a page reload doesn't restart the timer.
const progressKey = (d) => `rania-quiz-${d}`;
const readProgress = (d) => { try { return JSON.parse(localStorage.getItem(progressKey(d))); } catch { return null; } };
const writeProgress = (d, v) => { try { v ? localStorage.setItem(progressKey(d), JSON.stringify(v)) : localStorage.removeItem(progressKey(d)); } catch { /* private mode */ } };

function Timer({ left, total }) {
  const r = 20, c = 2 * Math.PI * r, low = left <= 5;
  return (
    <div className={`timer${low ? ' low' : ''}`} role="timer" aria-label={`${left} ثانية متبقية`}>
      <svg viewBox="0 0 50 50" aria-hidden="true">
        <circle cx="25" cy="25" r={r} fill="none" stroke="var(--sunk)" strokeWidth="5" />
        <circle cx="25" cy="25" r={r} fill="none" stroke={low ? 'var(--bad)' : 'var(--accent)'} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} transform="rotate(-90 25 25)" />
      </svg>
      <b className="mono">{left}</b>
    </div>
  );
}

export const QUIZ_SUBJECTS = {
  de: 'الألمانية', en: 'الإنجليزية', fr: 'الفرنسية', ar: 'العربية', hg: 'تاريخ وجغرافيا', is: 'التربية الإسلامية', other: 'عام',
};
const LETTERS = ['أ', 'ب', 'ج', 'د'];
const dateFmt = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
const toDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };

function scoreMsg(score, total) {
  const p = score / total;
  if (p === 1) return 'علامة كاملة! ممتازة يا رانيا ♥';
  if (p >= 0.75) return 'نتيجة رائعة، واصلي هكذا!';
  if (p >= 0.5) return 'جيد، راجعي الأخطاء وستتحسنين.';
  return 'لا بأس، الأهم أن تفهمي الأخطاء. راجعي التصحيح بهدوء.';
}

export function Review({ quiz, result }) {
  return (
    <ol className="review">
      {quiz.questions.map((q, i) => {
        const mine = result.answers[i];
        const ok = mine === q.answer;
        return (
          <li key={i} className={ok ? 'ok' : 'ko'}>
            <div className="review-q"><span className="mark" aria-label={ok ? 'صحيح' : 'خطأ'}>{ok ? '✓' : '✗'}</span>{q.q}</div>
            {!ok && <div className="review-a mine">جوابك: {mine >= 0 ? q.options[mine] : quiz.timed ? 'انتهى الوقت دون جواب' : 'بدون جواب'}</div>}
            <div className="review-a right">الجواب الصحيح: {q.options[q.answer]}</div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Quiz({ role, onDone }) {
  const [date, setDate] = useState(key(new Date()));
  const [data, setData] = useState(null); // { quiz, result, history }
  const [err, setErr] = useState('');
  const [step, setStep] = useState(-1); // -1 intro, 0..n-1 questions, n = confirm
  const [answers, setAnswers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [deadline, setDeadline] = useState(null); // ms timestamp, timed quizzes only
  const [now, setNow] = useState(Date.now());
  const answersRef = useRef(answers); // always the latest answers, also inside the timer
  answersRef.current = answers;

  const load = (d) => {
    setErr(''); setData(null); setStep(-1); setAnswers([]); setDeadline(null);
    api(`/quiz?date=${d}`).then((res) => {
      setData(res);
      const saved = res.quiz && !res.result && readProgress(d);
      if (saved && saved.step >= 0) { setStep(saved.step); setAnswers(saved.answers || []); setDeadline(saved.deadline || null); }
      if (res.result) writeProgress(d, null);
    }).catch((e) => setErr(e.message));
  };
  useEffect(() => { load(date); }, [date]);

  const quizObj = data?.quiz;
  const timed = !!quizObj?.timed && !data?.result;
  const count = quizObj?.questions.length || 0;

  // move to a question (starting its timer) or to the end
  function goTo(next, ans = answersRef.current) {
    const dl = timed && next >= 0 && next < count ? Date.now() + questionTime(quizObj.questions[next]) * 1000 : null;
    setStep(next); setDeadline(dl); setNow(Date.now());
    writeProgress(date, { step: next, answers: ans, deadline: dl });
    if (timed && next >= count) submit(ans);
  }
  function pick(j) {
    const a = [...answers]; a[step] = j;
    setAnswers(a);
    answersRef.current = a;
    writeProgress(date, { step, answers: a, deadline });
  }

  // countdown: when time is up, go to the next question
  useEffect(() => {
    if (!timed || deadline === null || step < 0 || step >= count) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline) { clearInterval(id); goTo(step + 1); }
    }, 250);
    return () => clearInterval(id);
  }, [timed, deadline, step, count]);

  async function submit(ans = answersRef.current) {
    setBusy(true);
    try {
      const res = await api('/quiz/submit', { method: 'POST', body: { date, answers: ans } });
      writeProgress(date, null);
      setData((d) => ({ ...d, quiz: res.quiz, result: res.result, preview: role === 'admin' }));
      onDone?.();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  if (err) return <div className="card"><p className="err">{err}</p></div>;
  if (!data) return <div className="card muted">جارٍ التحميل…</div>;

  const { quiz, result } = data;
  const isToday = date === key(new Date());
  const n = quiz?.questions.length || 0;

  let main;
  if (!quiz) {
    main = (
      <div className="card quiz-empty">
        <div className="lock-heart" aria-hidden="true">?</div>
        <h2>{isToday ? 'لا يوجد اختبار اليوم بعد' : 'لا يوجد اختبار في هذا اليوم'}</h2>
        <p className="muted">{isToday ? 'سيظهر اختبار اليوم هنا عندما ينشره المشرف.' : 'اختاري يوما آخر من القائمة.'}</p>
      </div>
    );
  } else if (result) {
    main = (
      <div className="card stack">
        <div className="quiz-score">
          <b className="mono">{result.score}/{result.total}</b>
          <div>
            <h2>{quiz.title || 'اختبار'}</h2>
            <p>{scoreMsg(result.score, result.total)}</p>
            {data.preview && <p className="muted small">وضع المعاينة: لم تُحفظ هذه النتيجة.</p>}
          </div>
        </div>
        <h3>التصحيح</h3>
        <Review quiz={quiz} result={result} />
      </div>
    );
  } else if (step === -1) {
    main = (
      <div className="card quiz-intro">
        <span className="chip">{QUIZ_SUBJECTS[quiz.subject] || 'عام'}</span>
        <h2>{quiz.title || 'اختبار اليوم'}</h2>
        <p className="muted"><span className="mono">{n}</span> {n === 1 ? 'سؤال' : 'أسئلة'}. أجيبي على كل الأسئلة، والنتيجة والتصحيح يظهران في النهاية. لديك محاولة واحدة فقط.</p>
        {quiz.timed && <p className="timed-note">⏱ اختبار بالوقت: لكل سؤال وقت محدد، وعند انتهائه تنتقلين تلقائيا إلى السؤال التالي. لا يمكن الرجوع إلى سؤال سابق.</p>}
        {role === 'admin' && <p className="muted small">أنت المشرف: يمكنك تجربة الاختبار، ولن تُحفظ نتيجتك.</p>}
        <div><button className="btn" onClick={() => goTo(0)}>ابدئي الاختبار</button></div>
      </div>
    );
  } else if (step < n) {
    const q = quiz.questions[step];
    main = (
      <div className="card stack">
        <div className="row-between">
          <span className="muted small">السؤال <span className="mono">{step + 1}/{n}</span></span>
          {timed && deadline
            ? <Timer left={Math.max(0, Math.ceil((deadline - now) / 1000))} total={questionTime(q)} />
            : <span className="chip">{QUIZ_SUBJECTS[quiz.subject] || 'عام'}</span>}
        </div>
        <div className="bar"><i style={{ width: `${(step / n) * 100}%` }} /></div>
        <h2 className="quiz-q">{q.q}</h2>
        <div className="options" role="radiogroup" aria-label="الاقتراحات">
          {q.options.map((o, j) => (
            <button key={j} type="button" role="radio" aria-checked={answers[step] === j}
              className={`option${answers[step] === j ? ' picked' : ''}`}
              onClick={() => pick(j)}>
              <span className="letter">{LETTERS[j]}</span><span>{o}</span>
            </button>
          ))}
        </div>
        <div className="row-between">
          {timed
            ? <span className="muted small">عند انتهاء الوقت تنتقلين تلقائيا.</span>
            : <button className="btn ghost" disabled={step === 0} onClick={() => goTo(step - 1)}>→ السابق</button>}
          <button className="btn" disabled={answers[step] === undefined} onClick={() => goTo(step + 1)}>
            {step === n - 1 ? 'إنهاء' : 'التالي ←'}
          </button>
        </div>
      </div>
    );
  } else if (timed) {
    main = (
      <div className="card quiz-intro">
        <h2>انتهى الاختبار</h2>
        <p className="muted">{busy ? 'جارٍ حساب النتيجة…' : 'تعذّر إرسال الأجوبة.'}</p>
        {!busy && <div><button className="btn" onClick={() => submit()}>عرض النتيجة</button></div>}
      </div>
    );
  } else {
    const missing = quiz.questions.filter((_, i) => answers[i] === undefined).length;
    main = (
      <div className="card stack quiz-intro">
        <h2>هل أنتِ متأكدة؟</h2>
        <p className="muted">{missing ? `بقي ${missing} بدون جواب.` : 'أجبتِ على كل الأسئلة.'} بعد التأكيد لا يمكن تغيير الأجوبة.</p>
        <div className="row-wrap">
          <button className="btn" disabled={busy} onClick={() => submit()}>{busy ? 'لحظة…' : 'تأكيد وعرض النتيجة'}</button>
          <button className="btn ghost" onClick={() => goTo(0)}>مراجعة أجوبتي</button>
        </div>
      </div>
    );
  }

  const hist = (data.history || []).filter((h) => h.date <= key(new Date()));
  return (
    <section className="quiz-layout">
      <div className="stack">
        <div className="row-between">
          <h2>{isToday ? 'اختبار اليوم' : 'اختبار'} <span className="muted small">{dateFmt.format(toDate(date))}</span></h2>
          {!isToday && <button className="btn ghost small" onClick={() => setDate(key(new Date()))}>اختبار اليوم</button>}
        </div>
        {main}
      </div>
      <aside className="card stack">
        <h3>كل الاختبارات</h3>
        {hist.length === 0 && <p className="muted small">لا توجد اختبارات بعد.</p>}
        <ul className="quiz-hist">
          {hist.map((h) => (
            <li key={h.date}>
              <button type="button" className={h.date === date ? 'cur' : ''} onClick={() => setDate(h.date)}>
                <span className="mono small">{h.date.slice(5).split('-').reverse().join('/')}</span>
                <span className="t">{h.title || QUIZ_SUBJECTS[h.subject]}</span>
                {h.score === null
                  ? <span className="pill-todo">لم يُحل</span>
                  : <span className={`pill-score ${h.score / h.total >= 0.5 ? 'good' : 'low'} mono`}>{h.score}/{h.total}</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
