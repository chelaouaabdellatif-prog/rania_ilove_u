import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Lock({ setup, onDone }) {
  const [pw, setPw] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [adminPw2, setAdminPw2] = useState('');
  const [raniaPw, setRaniaPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (setup) {
      if (adminPw.length < 4 || raniaPw.length < 4) return setErr('كل كلمة سر يجب أن تكون 4 أحرف على الأقل.');
      if (adminPw !== adminPw2) return setErr('كلمتا سر المشرف غير متطابقتين.');
    }
    setBusy(true);
    try {
      const res = setup
        ? await api('/setup', { method: 'POST', body: { adminPw, raniaPw } })
        : await api('/login', { method: 'POST', body: { password: pw } });
      setToken(res.token);
      await onDone(res.role);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="lockbox" onSubmit={submit} autoComplete="off">
        <div className="lock-heart" aria-hidden="true">♥</div>
        {setup ? (
          <>
            <h2>أول تشغيل: اختر كلمات السر</h2>
            <p className="muted">كلمة للمشرف (لتغيير الإعلان ومتابعة التقدم)، وكلمة لرانيا.</p>
            <label htmlFor="adm">كلمة سر المشرف</label>
            <input id="adm" type="password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} />
            <label htmlFor="adm2">أعد كتابة كلمة سر المشرف</label>
            <input id="adm2" type="password" value={adminPw2} onChange={(e) => setAdminPw2(e.target.value)} />
            <label htmlFor="ran">كلمة سر رانيا</label>
            <input id="ran" type="password" value={raniaPw} onChange={(e) => setRaniaPw(e.target.value)} />
          </>
        ) : (
          <>
            <h2>برنامج رانيا</h2>
            <p className="muted">أدخلي كلمة السر لفتح برنامج المراجعة.</p>
            <input id="pw" type="password" aria-label="كلمة السر" placeholder="كلمة السر" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
          </>
        )}
        <div className="err" role="alert">{err}</div>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'لحظة…' : setup ? 'حفظ والدخول' : 'دخول'}</button>
      </form>
    </div>
  );
}
