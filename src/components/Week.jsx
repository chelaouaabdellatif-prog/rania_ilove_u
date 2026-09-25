import { useState } from 'react';
import { WEEK, SUBJ, key, fmt, sundayOf, addDays, bacSubjectFor } from '../data.js';
import Session from './Session.jsx';

export default function Week({ data, setData }) {
  const [offset, setOffset] = useState(0);
  const sun = addDays(sundayOf(new Date()), offset * 7);
  const wk = key(sun);
  const done = data.weeks[wk] || {};
  const todayK = key(new Date());
  const bacSubj = bacSubjectFor(sun);

  const toggle = (id) => setData((d) => {
    const w = { ...(d.weeks[wk] || {}) };
    if (w[id]) delete w[id]; else w[id] = 1;
    return { ...d, weeks: { ...d.weeks, [wk]: w } };
  });

  return (
    <section className="stack">
      <div className="weekhead">
        <h2>أسبوع <span className="mono">{fmt(sun)} – {fmt(addDays(sun, 6))}</span></h2>
        <div className="nav2">
          <button className="btn ghost small" onClick={() => setOffset(offset - 1)}>→ السابق</button>
          <button className="btn ghost small" onClick={() => setOffset(0)}>هذا الأسبوع</button>
          <button className="btn ghost small" onClick={() => setOffset(offset + 1)}>التالي ←</button>
        </div>
      </div>
      <div className="legend">
        {['de', 'en', 'fr', 'ar', 'hg', 'is', 'bac'].map((k) => (
          <span key={k} style={{ '--c': `var(--${k})` }}><i />{SUBJ[k].n}{SUBJ[k].coef && <span className="mono"> ×{SUBJ[k].coef}</span>}</span>
        ))}
      </div>
      <div className="days">
        {WEEK.map((day, i) => {
          const d = addDays(sun, i);
          return (
            <div key={i} className={`day${key(d) === todayK ? ' today-col' : ''}`}>
              <h3>{day.n}<small className="mono">{fmt(d)}</small></h3>
              {day.work && <div className="block work">عمل <span className="mono">08:00–16:00</span></div>}
              {day.s.map((s, j) => (
                <Session key={j} s={s} done={!!done[`${i}-${j}`]} onToggle={() => toggle(`${i}-${j}`)} bacSubj={bacSubj} />
              ))}
              {day.rest && <div className="block">{day.rest}: راحة</div>}
            </div>
          );
        })}
      </div>
      <p className="muted small">اضغطي على أي حصة لتعليمها كمنجزة. أيام العمل (الأحد، الاثنين، الخميس) فيها حصتان مسائيتان فقط.</p>
    </section>
  );
}
