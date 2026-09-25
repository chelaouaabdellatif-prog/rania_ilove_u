import { useState } from 'react';
import { api } from '../api.js';
import { key, sundayOf, unitsProgress, totalSessions, UNITS, SUBJ } from '../data.js';
import Marquee from './Marquee.jsx';

export default function Admin({ ann, setAnn, data, onExpired }) {
  const [text, setText] = useState(ann?.text || '');
  const [active, setActive] = useState(!!ann?.active);
  const [speed, setSpeed] = useState(ann?.speed || 'normal');
  const [msg, setMsg] = useState('');
  const [pwA, setPwA] = useState('');
  const [pwR, setPwR] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  async function saveAnn(next) {
    setMsg('');
    try {
      const res = await api('/announcement', { method: 'PUT', body: next });
      setAnn(res);
      setActive(res.active);
      setMsg(res.active ? 'تم نشر الإعلان. يظهر عند رانيا خلال 30 ثانية.' : 'تم إيقاف الإعلان.');
    } catch (e) {
      if (e.status === 401) return onExpired();
      setMsg(e.message);
    }
  }

  async function savePw(e) {
    e.preventDefault();
    setPwMsg('');
    if (!pwA && !pwR) return setPwMsg('اكتب كلمة سر جديدة واحدة على الأقل.');
    try {
      await api('/passwords', { method: 'PUT', body: { adminPw: pwA || undefined, raniaPw: pwR || undefined } });
      setPwA(''); setPwR('');
      setPwMsg('تم تغيير كلمة السر.' + (pwR ? ' ستحتاج رانيا لإدخال الكلمة الجديدة.' : ''));
    } catch (e2) {
      if (e2.status === 401) return onExpired();
      setPwMsg(e2.message);
    }
  }

  const today = new Date();
  const wk = key(sundayOf(today));
  const weekDone = Object.keys(data.weeks[wk] || {}).length;
  const todayTasks = data.tasks[key(today)] || [];
  const draft = { text, active: true, speed };

  return (
    <section className="stack">
      <div className="card stack">
        <div className="row-between">
          <h3>الإعلان المتحرك</h3>
          <span className={`status-pill ${ann?.active ? 'on' : 'off'}`}>{ann?.active ? 'منشور' : 'متوقف'}</span>
        </div>
        <label htmlFor="ann-text">نص الإعلان (500 حرف كحد أقصى)</label>
        <textarea id="ann-text" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="مثلا: رانيا، لا تنسي موضوع بكالوريا الألمانية يوم السبت!" />
        <div className="row-wrap">
          <label htmlFor="ann-speed">السرعة</label>
          <select id="ann-speed" value={speed} onChange={(e) => setSpeed(e.target.value)}>
            <option value="slow">بطيئة</option>
            <option value="normal">عادية</option>
            <option value="fast">سريعة</option>
          </select>
        </div>
        {text.trim() && (
          <>
            <span className="muted small">معاينة:</span>
            <Marquee ann={draft} preview />
          </>
        )}
        <div className="row-wrap">
          <button className="btn" disabled={!text.trim()} onClick={() => saveAnn({ text, active: true, speed })}>
            {ann?.active ? 'تحديث الإعلان' : 'نشر الإعلان'}
          </button>
          <button className="btn ghost" disabled={!ann?.active} onClick={() => saveAnn({ text, active: false, speed })}>إيقاف الإعلان</button>
        </div>
        {msg && <p className="note-ok" role="status">{msg}</p>}
      </div>

      <div className="card stack">
        <h3>تقدم رانيا</h3>
        <div className="mini-stats wide">
          <div><b className="mono">{todayTasks.filter((t) => t.done).length}/{todayTasks.length}</b><small>مهامها الخاصة اليوم</small></div>
          <div><b className="mono">{weekDone}/{totalSessions}</b><small>حصص هذا الأسبوع</small></div>
          <div><b className="mono">{unitsProgress(data.units)}%</b><small>البرنامج (مرجّح)</small></div>
        </div>
        <ul className="admin-subj">
          {Object.entries(UNITS).map(([k, list]) => {
            const n = list.filter((_, i) => data.units[`${k}-${i}`]).length;
            return (
              <li key={k} style={{ '--c': `var(--${k})` }}>
                <span>{SUBJ[k].n}</span>
                <div className="bar"><i style={{ width: `${(n / list.length) * 100}%` }} /></div>
                <span className="mono">{n}/{list.length}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <form className="card stack" onSubmit={savePw} autoComplete="off">
        <h3>كلمات السر</h3>
        <p className="muted small">اترك الخانة فارغة إذا لا تريد تغييرها.</p>
        <label htmlFor="npa">كلمة سر المشرف الجديدة</label>
        <input id="npa" type="password" value={pwA} onChange={(e) => setPwA(e.target.value)} />
        <label htmlFor="npr">كلمة سر رانيا الجديدة</label>
        <input id="npr" type="password" value={pwR} onChange={(e) => setPwR(e.target.value)} />
        <div><button className="btn" type="submit">حفظ</button></div>
        {pwMsg && <p className="note-ok" role="status">{pwMsg}</p>}
      </form>
    </section>
  );
}
