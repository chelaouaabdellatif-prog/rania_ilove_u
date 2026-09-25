import { UNITS, SUBJ } from '../data.js';

export default function Units({ data, setData, readOnly = false }) {
  const toggle = (id) => setData((d) => {
    const u = { ...d.units };
    if (u[id]) delete u[id]; else u[id] = 1;
    return { ...d, units: u };
  });

  return (
    <section className="subjects">
      {Object.entries(UNITS).map(([k, list]) => {
        const n = list.filter((_, i) => data.units[`${k}-${i}`]).length;
        return (
          <article key={k} className="subj" style={{ '--c': `var(--${k})` }}>
            <header>
              <h3>{SUBJ[k].n}</h3>
              <span className="muted small">المعامل <span className="mono">{SUBJ[k].coef}</span> · <span className="mono">{n}/{list.length}</span></span>
            </header>
            <div className="bar"><i style={{ width: `${(n / list.length) * 100}%` }} /></div>
            <ul className="units">
              {list.map((u, i) => (
                <li key={i}>
                  <label>
                    <input type="checkbox" id={`u-${k}-${i}`} disabled={readOnly} checked={!!data.units[`${k}-${i}`]} onChange={() => toggle(`${k}-${i}`)} />
                    <span>{u}</span>
                  </label>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
