import { PHASES, MONTHS, BAC, YEAR_START } from '../data.js';

export default function Year() {
  const now = new Date();
  const yp = Math.max(0, Math.min(100, Math.round(((now - YEAR_START) / (BAC - YEAR_START)) * 100)));
  return (
    <section className="stack">
      <div className="card">
        <div className="row-between"><h3>مرور السنة الدراسية</h3><b className="mono">{yp}%</b></div>
        <div className="bar"><i style={{ width: `${yp}%` }} /></div>
        <div className="months">
          {MONTHS.map(([n, y, m]) => {
            const past = now.getFullYear() > y || (now.getFullYear() === y && now.getMonth() > m);
            const cur = now.getFullYear() === y && now.getMonth() === m;
            return <div key={n} className={cur ? 'cur' : past ? 'past' : ''}><i />{n}</div>;
          })}
        </div>
      </div>
      {now < PHASES[0].a && <p className="muted small">قبل أكتوبر: ابدئي بالبرنامج الأسبوعي مباشرة وحضّري الدفاتر والبطاقات.</p>}
      {PHASES.map((p) => {
        const cur = now >= p.a && now <= p.b;
        return (
          <div key={p.t} className={`phase card${cur ? ' now' : ''}`}>
            <div className="when">{p.m}{cur && <span className="pill">الآن</span>}</div>
            <div>
              <h3>{p.t}</h3>
              <ul>{p.l.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
        );
      })}
      <div className="card">
        <h3>قواعد ثابتة طوال السنة</h3>
        <ul>
          <li>الألمانية معاملها 6: أول ما تبدئين به في كل يوم فراغ.</li>
          <li>دفتر أخطاء لكل لغة: كل خطأ يُكتب مع تصحيحه، ويُراجع يوم الخميس.</li>
          <li>مفردات يومية: 10 إلى 20 كلمة على بطاقات، مع مراجعة متباعدة.</li>
          <li>من جانفي: موضوع بكالوريا كامل كل سبت بالتوقيت الرسمي، ثم التصحيح.</li>
          <li>الجمعة والسبت مساءً راحة. النوم قبل منتصف الليل في أيام العمل.</li>
        </ul>
      </div>
    </section>
  );
}
