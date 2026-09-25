import { useEffect, useState } from 'react';
import { WEEK, key, sundayOf, toMin, bacSubjectFor, unitsProgress, totalSessions } from '../data.js';
import Session from './Session.jsx';

const dateFmt = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });

function Ring({ value }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 100 100" role="img" aria-label={`${value}% من مهام اليوم`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--sunk)" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 50 50)" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="ring-txt" fill="var(--ink)">{value}%</text>
    </svg>
  );
}

export default function Today({ data, setData }) {
  const [now, setNow] = useState(new Date());
  const [text, setText] = useState('');
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);

  const di = now.getDay();
  const day = WEEK[di];
  const sun = sundayOf(now);
  const wk = key(sun);
  const dk = key(now);
  const doneWeek = data.weeks[wk] || {};
  const tasks = data.tasks[dk] || [];
  const mins = now.getHours() * 60 + now.getMinutes();

  const total = day.s.length + tasks.length;
  const done = day.s.filter((_, j) => doneWeek[`${di}-${j}`]).length + tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const next = day.s.find((s, j) => !doneWeek[`${di}-${j}`] && toMin(s[1]) > mins);
  const weekDone = Object.keys(doneWeek).length;

  const toggleSession = (id) => setData((d) => {
    const w = { ...(d.weeks[wk] || {}) };
    if (w[id]) delete w[id]; else w[id] = 1;
    return { ...d, weeks: { ...d.weeks, [wk]: w } };
  });
  const setTasks = (fn) => setData((d) => ({ ...d, tasks: { ...d.tasks, [dk]: fn(d.tasks[dk] || []) } }));
  const add = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setTasks((l) => [...l, { id: Date.now().toString(36), text: t.slice(0, 200), done: false }]);
    setText('');
  };

  let message = 'يوم موفق يا رانيا، خطوة خطوة.';
  if (total && done === total) message = 'أنهيتِ كل مهام اليوم، أحسنتِ!';
  else if (pct >= 50) message = 'تجاوزتِ النصف، واصلي!';

  return (
    <section className="today">
      <div className="today-hero card">
        <Ring value={pct} />
        <div className="today-head">
          <div className="eyebrow">{dateFmt.format(now)}</div>
          <h2>مهام اليوم</h2>
          <p className="muted">{message}</p>
          {next && <p className="next">التالي: <b>{next[0]}</b> · {next[3]}</p>}
        </div>
        <div className="mini-stats">
          <div><b className="mono">{done}/{total}</b><small>اليوم</small></div>
          <div><b className="mono">{weekDone}/{totalSessions}</b><small>هذا الأسبوع</small></div>
          <div><b className="mono">{unitsProgress(data.units)}%</b><small>البرنامج</small></div>
        </div>
      </div>

      <div className="today-cols">
        <div className="card list">
          <h3>حصص البرنامج</h3>
          {day.work && <div className="block work">عمل <span className="mono">08:00–16:00</span></div>}
          {day.s.map((s, j) => (
            <Session key={j} s={s} done={!!doneWeek[`${di}-${j}`]} onToggle={() => toggleSession(`${di}-${j}`)}
              bacSubj={bacSubjectFor(sun)} now={toMin(s[0]) <= mins && mins < toMin(s[1])} />
          ))}
          {day.rest && <div className="block">{day.rest}: راحة</div>}
        </div>

        <div className="card list">
          <h3>مهامي الخاصة</h3>
          <form className="addrow" onSubmit={add}>
            <input id="newtask" value={text} onChange={(e) => setText(e.target.value)} placeholder="مثلا: حفظ 15 كلمة ألمانية" aria-label="مهمة جديدة" />
            <button className="btn" type="submit">إضافة</button>
          </form>
          {tasks.length === 0 && <p className="muted small">لا توجد مهام خاصة اليوم. أضيفي واجبا أو مراجعة.</p>}
          <ul className="tasks">
            {tasks.map((t) => (
              <li key={t.id} className={t.done ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={t.done} onChange={() => setTasks((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
                  <span>{t.text}</span>
                </label>
                <button className="del" aria-label="حذف المهمة" onClick={() => setTasks((l) => l.filter((x) => x.id !== t.id))}>×</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
