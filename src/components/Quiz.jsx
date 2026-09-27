import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { key } from '../data.js';

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
            {!ok && <div className="review-a mine">جوابك: {mine >= 0 ? q.options[mine] : 'بدون جواب'}</div>}
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

  const load = (d) => {
    setErr(''); setData(null); setStep(-1); setAnswers([]);
    api(`/quiz?date=${d}`).then(setData).catch((e) => setErr(e.message));
  };
  useEffect(() => { load(date); }, [date]);

  async function submit() {
    setBusy(true);
    try {
      const res = await api('/quiz/submit', { method: 'POST', body: { date, answers } });
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
        {role === 'admin' && <p className="muted small">أنت المشرف: يمكنك تجربة الاختبار، ولن تُحفظ نتيجتك.</p>}
        <div><button className="btn" onClick={() => setStep(0)}>ابدئي الاختبار</button></div>
      </div>
    );
  } else if (step < n) {
    const q = quiz.questions[step];
    main = (
      <div className="card stack">
        <div className="row-between">
          <span className="muted small">السؤال <span className="mono">{step + 1}/{n}</span></span>
          <span className="chip">{QUIZ_SUBJECTS[quiz.subject] || 'عام'}</span>
        </div>
        <div className="bar"><i style={{ width: `${(step / n) * 100}%` }} /></div>
        <h2 className="quiz-q">{q.q}</h2>
        <div className="options" role="radiogroup" aria-label="الاقتراحات">
          {q.options.map((o, j) => (
            <button key={j} type="button" role="radio" aria-checked={answers[step] === j}
              className={`option${answers[step] === j ? ' picked' : ''}`}
              onClick={() => setAnswers((a) => { const c = [...a]; c[step] = j; return c; })}>
              <span className="letter">{LETTERS[j]}</span><span>{o}</span>
            </button>
          ))}
        </div>
        <div className="row-between">
          <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>→ السابق</button>
          <button className="btn" disabled={answers[step] === undefined} onClick={() => setStep(step + 1)}>
            {step === n - 1 ? 'إنهاء' : 'التالي ←'}
          </button>
        </div>
      </div>
    );
  } else {
    const missing = quiz.questions.filter((_, i) => answers[i] === undefined).length;
    main = (
      <div className="card stack quiz-intro">
        <h2>هل أنتِ متأكدة؟</h2>
        <p className="muted">{missing ? `بقي ${missing} بدون جواب.` : 'أجبتِ على كل الأسئلة.'} بعد التأكيد لا يمكن تغيير الأجوبة.</p>
        <div className="row-wrap">
          <button className="btn" disabled={busy} onClick={submit}>{busy ? 'لحظة…' : 'تأكيد وعرض النتيجة'}</button>
          <button className="btn ghost" onClick={() => setStep(0)}>مراجعة أجوبتي</button>
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
