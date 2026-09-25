import { SUBJ } from '../data.js';

export default function Session({ s, done, onToggle, bacSubj, now }) {
  const [from, to, c, what, lesson] = s;
  return (
    <button type="button" className={`ses${done ? ' done' : ''}${lesson ? ' lesson' : ''}${now ? ' now' : ''}`}
      style={{ '--c': `var(--${c})` }} aria-pressed={done} onClick={onToggle}>
      <span className="box">{done ? '✓' : ''}</span>
      <span className="t mono">{from}–{to}{now && <span className="now-tag">الآن</span>}</span>
      <span className="s">
        {SUBJ[c].n}
        {lesson && <span className="tag">درس خصوصي</span>}
        {c === 'bac' && bacSubj && <span className="tag" style={{ '--c': `var(--${bacSubj})` }}>{SUBJ[bacSubj].n}</span>}
      </span>
      <span className="d">{what}</span>
    </button>
  );
}
