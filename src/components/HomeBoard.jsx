import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { key } from '../data.js';

export const KINDS = { exam: 'امتحان', course: 'درس', other: 'موعد' };
const dFmt = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
const toDate = (d, t = '00:00') => { const [y, m, dd] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number); return new Date(y, m - 1, dd, h, mi); };

export function whenText(ev, now = new Date()) {
  const start = toDate(ev.date, ev.time);
  const days = Math.round((toDate(ev.date) - toDate(key(now))) / 864e5);
  const mins = Math.round((start - now) / 60000);
  if (mins <= -120) return 'انتهى';
  if (mins < 0) return 'جارٍ الآن';
  if (days === 0) return mins < 60 ? `بعد ${mins} دقيقة` : `اليوم ${ev.time}`;
  if (days === 1) return `غدا ${ev.time}`;
  return `بعد ${days} أيام`;
}

// Pinned notices + upcoming exams/appointments, shown at the top of the home page.
export default function HomeBoard() {
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = () => {
      api('/notices').then((r) => setNotices(r.notices.filter((n) => n.pinned))).catch(() => {});
      api('/events').then((r) => setEvents(r.events)).catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const upcoming = events.filter((e) => toDate(e.date, e.time) > new Date(now - 2 * 3600e3)).slice(0, 4);
  if (!notices.length && !upcoming.length) return null;

  return (
    <div className="board">
      {notices.map((n) => (
        <div key={n.id} className="notice">
          <span className="pin" aria-label="مثبتة">📌</span>
          <p>{n.text}</p>
        </div>
      ))}
      {upcoming.length > 0 && (
        <div className="card events">
          <h3>المواعيد القادمة</h3>
          <ul>
            {upcoming.map((e) => (
              <li key={e.id} className={`ev ${e.kind}`}>
                <span className="ev-kind">{KINDS[e.kind]}</span>
                <span className="ev-main"><b>{e.title}</b><small className="muted">{dFmt.format(toDate(e.date))} · <span className="mono">{e.time}</span>{e.note ? ` · ${e.note}` : ''}</small></span>
                <span className="ev-when">{whenText(e, now)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
