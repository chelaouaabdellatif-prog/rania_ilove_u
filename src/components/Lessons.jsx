import { useMemo, useState } from 'react';
import { LESSONS, REVIEW_TASKS, lessonSteps } from '../../shared/lessons.js';
import { key } from '../data.js';

const SUBJ_AR = { en: 'الإنجليزية', de: 'الألمانية', fr: 'الفرنسية' };
const dFmt = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
const toDate = (d) => new Date(`${d}T12:00:00`);
const stepName = (n) => (n === 0 ? 'دراسة الدرس' : `مراجعة ${n}/4`);
const stepTask = (n, l) => (n === 0 ? `${l.duration} دقيقة: الملخص، الكلمات الصعبة، ثم التمارين` : REVIEW_TASKS[n - 1]);

export const lessonDone = (data, id) => data.lessons?.[id] || {};

// Steps due today or late (not done), across all lessons — used by the home page too.
export function stepsForToday(data, today = key(new Date())) {
  const out = [];
  for (const l of LESSONS) {
    const done = lessonDone(data, l.id);
    for (const st of lessonSteps(l)) {
      if (st.date === today || (st.date < today && !done[st.n])) out.push({ l, st, done: !!done[st.n], late: st.date < today });
    }
  }
  return out.sort((a, b) => (a.st.date + a.st.time < b.st.date + b.st.time ? -1 : 1));
}

export function useToggleStep(setData) {
  return (id, n) => setData((d) => {
    const cur = { ...(d.lessons?.[id] || {}) };
    if (cur[n]) delete cur[n]; else cur[n] = 1;
    return { ...d, lessons: { ...(d.lessons || {}), [id]: cur } };
  });
}

function Flashcards({ vocab }) {
  const [dir, setDir] = useState('en'); // en -> ar, or ar -> en
  const [order, setOrder] = useState(() => vocab.map((_, i) => i));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [score, setScore] = useState({ ok: 0, ko: 0 });
  const [en, ar] = vocab[order[i]];
  const front = dir === 'en' ? en : ar, back = dir === 'en' ? ar : en;
  const next = (ok) => {
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), ko: s.ko + (ok ? 0 : 1) }));
    setShown(false);
    setI((x) => (x + 1) % order.length);
  };
  const shuffle = () => { setOrder([...order].sort(() => Math.random() - 0.5)); setI(0); setShown(false); setScore({ ok: 0, ko: 0 }); };

  return (
    <div className="flash stack">
      <div className="row-wrap">
        <button className={`btn small ${dir === 'en' ? '' : 'ghost'}`} onClick={() => { setDir('en'); setShown(false); }}>إنجليزي ← عربي</button>
        <button className={`btn small ${dir === 'ar' ? '' : 'ghost'}`} onClick={() => { setDir('ar'); setShown(false); }}>عربي ← إنجليزي</button>
        <button className="btn ghost small" onClick={shuffle}>خلط البطاقات</button>
        <span className="muted small mono">{i + 1}/{order.length} · ✓{score.ok} ✗{score.ko}</span>
      </div>
      <button type="button" className={`card-flip${shown ? ' shown' : ''}`} onClick={() => setShown(true)} aria-live="polite">
        <span className="front" dir={dir === 'en' ? 'ltr' : 'rtl'}>{front}</span>
        {shown ? <span className="back" dir={dir === 'en' ? 'rtl' : 'ltr'}>{back}</span> : <span className="hint">اضغطي لرؤية الترجمة</span>}
      </button>
      {shown && (
        <div className="row-wrap">
          <button className="btn small" onClick={() => next(true)}>عرفتها ✓</button>
          <button className="btn ghost small" onClick={() => next(false)}>لم أعرفها ✗</button>
        </div>
      )}
    </div>
  );
}

function Section({ s }) {
  return (
    <div className="lsec">
      <h4>{s.h}</h4>
      {s.type === 'p' && <><p dir="ltr" className="en">{s.text}</p>{s.ar && <p className="ar">{s.ar}</p>}</>}
      {s.type === 'list' && <ul dir="ltr" className="en">{s.items.map((x) => <li key={x}>{x}</li>)}</ul>}
      {s.type === 'table' && (
        <div className="tbl-wrap">
          <table dir="ltr"><thead><tr>{s.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{s.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>
        </div>
      )}
    </div>
  );
}

function Exercise({ ex, i }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <p dir="ltr" className="en">{ex.q}</p>
      {open ? <p dir="ltr" className="answer">✓ {ex.a}</p> : <button className="btn ghost small" onClick={() => setOpen(true)}>عرض الجواب</button>}
    </li>
  );
}

function Plan({ l, done, toggle, openQuiz }) {
  const today = key(new Date());
  return (
    <ol className="plan">
      {lessonSteps(l).map((st) => {
        const d = !!done[st.n];
        const state = d ? 'done' : st.date < today ? 'late' : st.date === today ? 'today' : '';
        return (
          <li key={st.n} className={state}>
            <button type="button" className="plan-check" aria-pressed={d} onClick={() => toggle(l.id, st.n)} aria-label={`${stepName(st.n)} منجزة`}>{d ? '✓' : ''}</button>
            <div>
              <b>{stepName(st.n)}</b> <span className="muted small">{dFmt.format(toDate(st.date))} · <span className="mono">{st.time}</span></span>
              {state === 'late' && <span className="tag-late">متأخرة</span>}
              {state === 'today' && <span className="tag-today">اليوم</span>}
              <div className="small">{stepTask(st.n, l)}</div>
              {st.n === 4 && <button className="linkbtn small" onClick={() => openQuiz(l.quizDate)}>فتح الاختبار النهائي ←</button>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Lessons({ data, setData, lessonId, setLessonId, openQuiz }) {
  const toggle = useToggleStep(setData);
  const [tab, setTab] = useState('summary');
  const l = useMemo(() => LESSONS.find((x) => x.id === lessonId), [lessonId]);

  if (!l) {
    return (
      <section className="stack">
        <div className="row-between"><h2>الدروس</h2><span className="muted small">كل درس: دراسة + 4 مراجعات خلال 7 أيام</span></div>
        <div className="lessons-grid">
          {LESSONS.map((x, i) => {
            const done = lessonDone(data, x.id);
            const steps = lessonSteps(x);
            const n = steps.filter((s) => done[s.n]).length;
            const next = steps.find((s) => !done[s.n]);
            return (
              <button key={x.id} type="button" className="lesson-card" onClick={() => { setLessonId(x.id); setTab('summary'); }}>
                <span className="row-between"><span className="chip">{SUBJ_AR[x.subject]} · الدرس {i + 1}</span>{n === 5 && <span className="tag-today">تم الإتقان ♥</span>}</span>
                <b className="ltitle">{x.titleAr}</b>
                <span className="muted small" dir="ltr">{x.title}</span>
                <span className="dots" aria-label={`${n} من 5`}>{steps.map((s) => <i key={s.n} className={done[s.n] ? 'on' : ''} />)}</span>
                <span className="small">{next ? <>التالي: {stepName(next.n)} · {dFmt.format(toDate(next.date))}</> : 'أنهيتِ كل المراجعات'}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const done = lessonDone(data, l.id);
  return (
    <section className="stack lesson">
      <div className="row-wrap">
        <button className="btn ghost small" onClick={() => setLessonId(null)}>→ كل الدروس</button>
        <span className="chip">{SUBJ_AR[l.subject]}</span>
        <span className="muted small" dir="ltr">{l.unit}</span>
      </div>
      <div className="card lesson-head">
        <h2>{l.titleAr}</h2>
        <p dir="ltr" className="en ltitle-en">{l.title}</p>
        <p className="small"><b>الهدف:</b> {l.objectiveAr}</p>
        <p dir="ltr" className="en small muted">{l.objective}</p>
      </div>

      <div className="lesson-cols">
        <div className="stack">
          <nav className="tabs sub-tabs" role="tablist">
            {[['summary', 'الملخص'], ['vocab', `الكلمات الصعبة (${l.vocab.length})`], ['cards', 'بطاقات المراجعة'], ['ex', 'التمارين']].map(([id, t]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{t}</button>
            ))}
          </nav>
          <div className="card stack">
            {tab === 'summary' && l.sections.map((s) => <Section key={s.h} s={s} />)}
            {tab === 'vocab' && (
              <div className="tbl-wrap">
                <table className="vocab"><thead><tr><th>English</th><th>العربية</th></tr></thead>
                  <tbody>{l.vocab.map(([en, ar]) => <tr key={en}><td dir="ltr">{en}</td><td>{ar}</td></tr>)}</tbody></table>
              </div>
            )}
            {tab === 'cards' && <Flashcards key={l.id} vocab={l.vocab} />}
            {tab === 'ex' && <ol className="exercises">{l.exercises.map((ex, i) => <Exercise key={i} ex={ex} i={i} />)}</ol>}
          </div>
        </div>
        <aside className="card stack">
          <h3>خطة الحفظ (7 أيام)</h3>
          <Plan l={l} done={done} toggle={toggle} openQuiz={openQuiz} />
        </aside>
      </div>
    </section>
  );
}
