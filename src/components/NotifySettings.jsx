import { useEffect, useState } from 'react';
import { pushStatus, enablePush, disablePush, savePrefs, testPush, isIOS, isStandalone, pushSupported } from '../push.js';

export default function NotifySettings({ role }) {
  const [st, setSt] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => pushStatus().then((s) => { setSt(s); if (s.prefs) setPrefs(s.prefs); }).catch((e) => setMsg(e.message));
  useEffect(() => { refresh(); }, []);

  const run = async (fn, okMsg) => {
    setBusy(true); setMsg('');
    try { await fn(); if (okMsg) setMsg(okMsg); await refresh(); } catch (e) { setMsg(e.message); }
    setBusy(false);
  };
  const change = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    if (st?.subscribed) run(() => savePrefs(next), 'تم حفظ الإعدادات.');
  };

  // iPhone: notifications only work from the app added to the home screen
  if (isIOS() && !isStandalone()) {
    return (
      <div className="card stack notify">
        <h3>🔔 التنبيهات</h3>
        <p className="small">على الآيفون، التنبيهات تعمل فقط من التطبيق المثبت على الشاشة الرئيسية:</p>
        <ol className="small steps">
          <li>في Safari اضغطي على زر المشاركة <b>⬆︎</b></li>
          <li>اختاري <b>«إضافة إلى الشاشة الرئيسية»</b></li>
          <li>افتحي التطبيق من أيقونة القلب ♥ ثم فعّلي التنبيهات من هنا.</li>
        </ol>
      </div>
    );
  }
  if (!pushSupported() || st?.supported === false) {
    return (
      <div className="card stack notify">
        <h3>🔔 التنبيهات</h3>
        <p className="muted small">هذا المتصفح لا يدعم التنبيهات. استعملي Chrome على أندرويد أو التطبيق المثبت على الآيفون.</p>
      </div>
    );
  }
  if (!st || !prefs) return <div className="card notify muted small">🔔 جارٍ تحميل التنبيهات…</div>;

  return (
    <div className="card stack notify">
      <div className="row-between">
        <h3>🔔 التنبيهات على هذا الجهاز</h3>
        <span className={`status-pill ${st.subscribed ? 'on' : 'off'}`}>{st.subscribed ? 'مفعّلة' : 'غير مفعّلة'}</span>
      </div>

      <div className="prefs">
        <label htmlFor="np-sessions">حصص البرنامج</label>
        <select id="np-sessions" value={prefs.sessions} onChange={(e) => change({ sessions: e.target.value })}>
          <option value="all">كل الحصص</option>
          <option value="lessons">الدروس الخصوصية فقط</option>
          <option value="none">بدون</option>
        </select>
        <label htmlFor="np-lead">قبل الحصة بـ</label>
        <select id="np-lead" value={prefs.lead} onChange={(e) => change({ lead: Number(e.target.value) })}>
          {[5, 10, 15, 30, 60].map((m) => <option key={m} value={m}>{m === 60 ? 'ساعة' : `${m} دقائق`}</option>)}
        </select>
      </div>
      <div className="row-wrap checks">
        <label><input type="checkbox" id="np-lessons" checked={!!prefs.lessons} onChange={(e) => change({ lessons: e.target.checked })} /> الدروس والمراجعات</label>
        <label><input type="checkbox" id="np-events" checked={prefs.events} onChange={(e) => change({ events: e.target.checked })} /> الامتحانات والمواعيد</label>
        <label><input type="checkbox" id="np-quiz" checked={prefs.quiz} onChange={(e) => change({ quiz: e.target.checked })} /> {role === 'admin' ? 'نتائج اختبارات رانيا' : 'اختبار اليوم'}</label>
        {role !== 'admin' && <label><input type="checkbox" id="np-notices" checked={prefs.notices} onChange={(e) => change({ notices: e.target.checked })} /> الملاحظات الجديدة</label>}
      </div>

      <div className="row-wrap">
        {!st.subscribed
          ? <button className="btn" disabled={busy} onClick={() => run(() => enablePush(prefs), 'تم تفعيل التنبيهات ♥')}>تفعيل التنبيهات</button>
          : <>
              <button className="btn ghost small" disabled={busy} onClick={() => run(testPush, 'تم إرسال تنبيه تجريبي.')}>إرسال تنبيه تجريبي</button>
              <button className="btn ghost small" disabled={busy} onClick={() => run(disablePush, 'تم إيقاف التنبيهات على هذا الجهاز.')}>إيقاف</button>
            </>}
      </div>
      {st.permission === 'denied' && <p className="err small">التنبيهات محظورة لهذا الموقع. فعّليها من إعدادات المتصفح ثم أعيدي المحاولة.</p>}
      {msg && <p className="note-ok small" role="status">{msg}</p>}
    </div>
  );
}
