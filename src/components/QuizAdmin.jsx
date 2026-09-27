import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { key } from '../data.js';
import { QUIZ_SUBJECTS, Review } from './Quiz.jsx';

const blankQ = () => ({ q: '', options: ['', ''], answer: -1 });
const blank = () => ({ title: '', subject: 'de', questions: [blankQ()] });

export default function QuizAdmin({ onExpired }) {
  const [all, setAll] = useState({ quizzes: {}, results: {} });
  const [date, setDate] = useState(key(new Date()));
  const [form, setForm] = useState(blank());
  const [msg, setMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const fail = (e) => (e.status === 401 ? onExpired() : setMsg(e.message));
  const refresh = () => api('/quizzes').then(setAll).catch(fail);
  useEffect(() => { refresh(); }, []);

  // load the chosen date into the form
  useEffect(() => {
    const q = all.quizzes[date];
    setForm(q ? JSON.parse(JSON.stringify({ title: q.title, subject: q.subject, questions: q.questions })) : blank());
    setConfirmDel(false);
  }, [date, all]);

  const setQ = (i, patch) => setForm((f) => ({ ...f, questions: f.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));
  const setOpt = (i, k, v) => setQ(i, { options: form.questions[i].options.map((o, j) => (j === k ? v : o)) });
  const removeOpt = (i, k) => {
    const q = form.questions[i];
    const answer = q.answer === k ? -1 : q.answer > k ? q.answer - 1 : q.answer;
    setQ(i, { options: q.options.filter((_, j) => j !== k), answer });
  };

  async function save(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api(`/quizzes/${date}`, { method: 'PUT', body: form });
      setMsg(all.quizzes[date] ? 'تم تحديث الاختبار.' : 'تم نشر الاختبار. سيظهر عند رانيا في هذا اليوم.');
      refresh();
    } catch (e2) { fail(e2); }
  }
  async function del(kind) {
    setMsg('');
    try {
      await api(`/${kind}/${date}`, { method: 'DELETE' });
      setMsg(kind === 'quizzes' ? 'تم حذف الاختبار.' : 'تم مسح النتيجة. يمكن لرانيا إعادة الاختبار.');
      setConfirmDel(false);
      refresh();
    } catch (e2) { fail(e2); }
  }

  const exists = !!all.quizzes[date];
  const result = all.results[date];
  const dates = Object.keys(all.quizzes).sort().reverse();

  return (
    <div className="card stack">
      <div className="row-between">
        <h3>الاختبارات اليومية</h3>
        <span className={`status-pill ${exists ? 'on' : 'off'}`}>{exists ? (result ? 'تمت الإجابة' : 'منشور') : 'غير موجود'}</span>
      </div>

      <div className="row-wrap">
        <label htmlFor="qz-date">اليوم</label>
        <input id="qz-date" type="date" className="date-in" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        {dates.length > 0 && (
          <select aria-label="اختبارات موجودة" value={exists ? date : ''} onChange={(e) => e.target.value && setDate(e.target.value)}>
            <option value="">اختبارات موجودة…</option>
            {dates.map((d) => <option key={d} value={d}>{d} · {all.quizzes[d].title || QUIZ_SUBJECTS[all.quizzes[d].subject]}{all.results[d] ? ` (${all.results[d].score}/${all.results[d].total})` : ''}</option>)}
          </select>
        )}
      </div>

      {result && (
        <div className="result-box stack">
          <div className="row-between">
            <b>نتيجة رانيا: <span className="mono">{result.score}/{result.total}</span></b>
            <button className="btn ghost small" onClick={() => del('results')}>السماح بإعادة الاختبار</button>
          </div>
          <Review quiz={all.quizzes[date]} result={result} />
        </div>
      )}

      <form className="stack" onSubmit={save}>
        <div className="row-wrap">
          <input id="qz-title" style={{ flex: 1, minWidth: 180 }} placeholder="عنوان الاختبار (مثلا: Passiv)" aria-label="عنوان الاختبار"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select id="qz-subj" aria-label="المادة" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
            {Object.entries(QUIZ_SUBJECTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {form.questions.map((q, i) => (
          <fieldset key={i} className="qedit">
            <legend>السؤال {i + 1}</legend>
            <textarea id={`qz-q-${i}`} rows={2} placeholder="نص السؤال" aria-label={`نص السؤال ${i + 1}`} value={q.q} onChange={(e) => setQ(i, { q: e.target.value })} />
            <p className="muted small">اكتب الاقتراحات واختر الجواب الصحيح بالدائرة.</p>
            {q.options.map((o, k) => (
              <div key={k} className="optedit">
                <input type="radio" name={`ans-${i}`} id={`qz-a-${i}-${k}`} checked={q.answer === k} onChange={() => setQ(i, { answer: k })} aria-label={`الاقتراح ${k + 1} هو الصحيح`} />
                <input id={`qz-o-${i}-${k}`} placeholder={`الاقتراح ${k + 1}`} value={o} onChange={(e) => setOpt(i, k, e.target.value)} aria-label={`الاقتراح ${k + 1}`} />
                {q.options.length > 2 && <button type="button" className="del" aria-label="حذف الاقتراح" onClick={() => removeOpt(i, k)}>×</button>}
              </div>
            ))}
            <div className="row-wrap">
              {q.options.length < 4 && <button type="button" className="btn ghost small" onClick={() => setQ(i, { options: [...q.options, ''] })}>+ اقتراح</button>}
              {form.questions.length > 1 && <button type="button" className="btn ghost small" onClick={() => setForm({ ...form, questions: form.questions.filter((_, j) => j !== i) })}>حذف السؤال</button>}
            </div>
          </fieldset>
        ))}

        <div className="row-wrap">
          <button type="button" className="btn ghost" onClick={() => setForm({ ...form, questions: [...form.questions, blankQ()] })}>+ سؤال جديد</button>
          <span className="sp" style={{ flex: 1 }} />
          <button type="submit" className="btn">{exists ? 'حفظ التعديلات' : 'نشر الاختبار'}</button>
        </div>
        {exists && result && <p className="muted small">إذا صححت جوابا خاطئا، تُعاد حساب نتيجة رانيا تلقائيا.</p>}
      </form>

      {exists && (
        <div className="row-wrap">
          {!confirmDel
            ? <button className="btn ghost small" onClick={() => setConfirmDel(true)}>حذف هذا الاختبار</button>
            : <>
                <span className="small">حذف الاختبار ونتيجته نهائيا؟</span>
                <button className="btn small danger" onClick={() => del('quizzes')}>نعم، احذف</button>
                <button className="btn ghost small" onClick={() => setConfirmDel(false)}>إلغاء</button>
              </>}
        </div>
      )}
      {msg && <p className="note-ok" role="status">{msg}</p>}
    </div>
  );
}
