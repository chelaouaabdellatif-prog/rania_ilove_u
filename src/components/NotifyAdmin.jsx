import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { key } from '../data.js';
import { KINDS, whenText } from './HomeBoard.jsx';

const REMIND = [[1440, 'يوم قبل'], [60, 'ساعة قبل'], [15, '15 دقيقة قبل'], [0, 'في الموعد']];

export default function NotifyAdmin({ onExpired }) {
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [devices, setDevices] = useState([]);
  const [ev, setEv] = useState({ title: '', kind: 'exam', date: key(new Date()), time: '08:00', note: '', remind: [1440, 60] });
  const [nt, setNt] = useState({ text: '', pinned: true, push: true });
  const [msg, setMsg] = useState('');

  const fail = (e) => (e.status === 401 ? onExpired() : setMsg(e.message));
  const load = () => {
    api('/events').then((r) => setEvents(r.events)).catch(fail);
    api('/notices').then((r) => setNotices(r.notices)).catch(fail);
    api('/push/devices').then((r) => setDevices(r.devices)).catch(() => {});
  };
  useEffect(load, []);

  const call = async (fn, ok) => { setMsg(''); try { const r = await fn(); setMsg(typeof ok === 'function' ? ok(r) : ok); load(); return true; } catch (e) { fail(e); return false; } };

  const addEvent = async (e) => {
    e.preventDefault();
    if (await call(() => api('/events', { method: 'POST', body: ev }), 'تمت إضافة الموعد. ستصل التنبيهات في الأوقات المختارة.')) setEv({ ...ev, title: '', note: '' });
  };
  const addNotice = async (e) => {
    e.preventDefault();
    if (await call(() => api('/notices', { method: 'POST', body: nt }),
      (r) => (nt.push ? `تم النشر. أُرسل التنبيه إلى ${r.sent} ${r.sent === 1 ? 'جهاز' : 'أجهزة'}.` : 'تم النشر.'))) setNt({ ...nt, text: '' });
  };
  const toggleRemind = (m) => setEv({ ...ev, remind: ev.remind.includes(m) ? ev.remind.filter((x) => x !== m) : [...ev.remind, m] });

  const raniaDevices = devices.filter((d) => d.role === 'rania').length;
  const now = new Date();

  return (
    <div className="card stack">
      <div className="row-between">
        <h3>التنبيهات والمواعيد</h3>
        <span className={`status-pill ${raniaDevices ? 'on' : 'off'}`}>
          {raniaDevices ? `رانيا مشتركة على ${raniaDevices} ${raniaDevices === 1 ? 'جهاز' : 'أجهزة'}` : 'رانيا لم تفعّل التنبيهات بعد'}
        </span>
      </div>

      {/* pinned notice */}
      <form className="stack sub" onSubmit={addNotice}>
        <h4>📌 ملاحظة على الصفحة الرئيسية</h4>
        <textarea id="nt-text" rows={2} maxLength={500} placeholder="مثلا: غدا لا يوجد درس ألمانية، المراجعة في البيت." aria-label="نص الملاحظة"
          value={nt.text} onChange={(e) => setNt({ ...nt, text: e.target.value })} />
        <div className="row-wrap checks">
          <label><input type="checkbox" id="nt-pin" checked={nt.pinned} onChange={(e) => setNt({ ...nt, pinned: e.target.checked })} /> تثبيت في الصفحة الرئيسية</label>
          <label><input type="checkbox" id="nt-push" checked={nt.push} onChange={(e) => setNt({ ...nt, push: e.target.checked })} /> إرسال تنبيه لرانيا الآن</label>
          <span style={{ flex: 1 }} />
          <button className="btn" type="submit" disabled={!nt.text.trim()}>نشر</button>
        </div>
        {notices.length > 0 && (
          <ul className="adm-list">
            {notices.map((n) => (
              <li key={n.id}>
                <span className="t">{n.pinned ? '📌 ' : ''}{n.text}</span>
                <button type="button" className="btn ghost small" onClick={() => call(() => api(`/notices/${n.id}`, { method: 'PUT', body: { pinned: !n.pinned } }), n.pinned ? 'تم إلغاء التثبيت.' : 'تم التثبيت.')}>{n.pinned ? 'إلغاء التثبيت' : 'تثبيت'}</button>
                <button type="button" className="del" aria-label="حذف الملاحظة" onClick={() => call(() => api(`/notices/${n.id}`, { method: 'DELETE' }), 'تم الحذف.')}>×</button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* exams & appointments */}
      <form className="stack sub" onSubmit={addEvent}>
        <h4>📅 امتحان أو موعد</h4>
        <div className="row-wrap">
          <select id="ev-kind" aria-label="النوع" value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value })}>
            {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input id="ev-title" style={{ flex: 1, minWidth: 180 }} placeholder="مثلا: امتحان الفصل الأول – الألمانية" aria-label="العنوان"
            value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} />
        </div>
        <div className="row-wrap">
          <input id="ev-date" type="date" className="date-in" aria-label="التاريخ" value={ev.date} onChange={(e) => setEv({ ...ev, date: e.target.value })} />
          <input id="ev-time" type="time" className="date-in" aria-label="الساعة" value={ev.time} onChange={(e) => setEv({ ...ev, time: e.target.value })} />
          <input id="ev-note" style={{ flex: 1, minWidth: 160 }} placeholder="ملاحظة (اختياري): القاعة، الأدوات…" aria-label="ملاحظة"
            value={ev.note} onChange={(e) => setEv({ ...ev, note: e.target.value })} />
        </div>
        <div className="row-wrap checks">
          <span className="small">تنبيه:</span>
          {REMIND.map(([m, l]) => (
            <label key={m}><input type="checkbox" id={`ev-r-${m}`} checked={ev.remind.includes(m)} onChange={() => toggleRemind(m)} /> {l}</label>
          ))}
          <span style={{ flex: 1 }} />
          <button className="btn" type="submit" disabled={!ev.title.trim()}>إضافة</button>
        </div>
        {events.length > 0 && (
          <ul className="adm-list">
            {events.map((e) => (
              <li key={e.id} className={new Date(`${e.date}T${e.time}`) < now ? 'past' : ''}>
                <span className="chip">{KINDS[e.kind]}</span>
                <span className="t"><b>{e.title}</b> <span className="muted small mono">{e.date} {e.time}</span></span>
                <span className="muted small">{whenText(e, now)}</span>
                <button type="button" className="del" aria-label="حذف الموعد" onClick={() => call(() => api(`/events/${e.id}`, { method: 'DELETE' }), 'تم حذف الموعد.')}>×</button>
              </li>
            ))}
          </ul>
        )}
      </form>
      {msg && <p className="note-ok" role="status">{msg}</p>}
    </div>
  );
}
