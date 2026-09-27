import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { daysLeft, fmt, BAC } from './data.js';
import Lock from './components/Lock.jsx';
import Marquee from './components/Marquee.jsx';
import Today from './components/Today.jsx';
import Week from './components/Week.jsx';
import Units from './components/Units.jsx';
import Year from './components/Year.jsx';
import Admin from './components/Admin.jsx';
import Quiz from './components/Quiz.jsx';
import { key } from './data.js';

const TABS = [
  ['today', 'مهام اليوم'],
  ['quiz', 'اختبار اليوم'],
  ['week', 'البرنامج الأسبوعي'],
  ['units', 'المنهج والتقدم'],
  ['year', 'خطة السنة'],
];
const EMPTY = { units: {}, weeks: {}, tasks: {} };

export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | setup | login | app
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState('today');
  const [data, setData] = useState(EMPTY);
  const [ann, setAnn] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [quizPending, setQuizPending] = useState(false);
  const loaded = useRef(false);

  const logout = useCallback(async (callServer = true) => {
    if (callServer) await api('/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    loaded.current = false;
    setRole(null);
    setData(EMPTY);
    setTab('today');
    setPhase('login');
  }, []);

  const enter = useCallback(async (r) => {
    const [st, a] = await Promise.all([api('/state'), api('/announcement')]);
    setData({ ...EMPTY, ...st });
    setAnn(a);
    setRole(r);
    setPhase('app');
    setTimeout(() => { loaded.current = true; }, 0);
  }, []);

  // first load
  useEffect(() => {
    (async () => {
      try {
        const { setup } = await api('/status');
        if (setup) return setPhase('setup');
        if (!getToken()) return setPhase('login');
        const { role: r } = await api('/me');
        await enter(r);
      } catch (e) {
        if (e.status === 401) setToken(null);
        setPhase('login');
      }
    })();
  }, [enter]);

  // save progress (debounced)
  useEffect(() => {
    if (!loaded.current) return;
    setSaveMsg('جارٍ الحفظ…');
    const t = setTimeout(() => {
      api('/state', { method: 'PUT', body: data })
        .then(() => setSaveMsg('تم الحفظ'))
        .catch((e) => (e.status === 401 ? logout(false) : setSaveMsg('تعذّر الحفظ')));
    }, 600);
    return () => clearTimeout(t);
  }, [data, logout]);

  // is there a quiz today that Rania hasn't answered?
  const checkQuiz = useCallback(() => {
    api(`/quiz?date=${key(new Date())}`).then((d) => setQuizPending(!!d.quiz && !d.result)).catch(() => {});
  }, []);

  // refresh the announcement and today's quiz every 30 s
  useEffect(() => {
    if (phase !== 'app') return;
    checkQuiz();
    const id = setInterval(() => { api('/announcement').then(setAnn).catch(() => {}); checkQuiz(); }, 30000);
    return () => clearInterval(id);
  }, [phase, checkQuiz]);

  if (phase === 'loading') return <div className="center muted">جارٍ التحميل…</div>;
  if (phase === 'setup' || phase === 'login')
    return <Lock setup={phase === 'setup'} onDone={async (r) => { await enter(r); if (r === 'admin' && phase === 'setup') setTab('admin'); }} />;

  const tabs = role === 'admin' ? [...TABS, ['admin', 'لوحة المشرف']] : TABS;

  return (
    <>
      <Marquee ann={ann} />
      <main className="wrap">
        <header className="top">
          <div>
            <div className="eyebrow">شعبة لغات أجنبية · الألمانية · السنة الثالثة ثانوي 2026–2027</div>
            <h1>{role === 'admin' ? 'متابعة رانيا' : 'مرحبا رانيا'} <span className="heart" aria-hidden="true">♥</span></h1>
          </div>
          <div className="count">
            <b className="mono">{daysLeft()}</b>
            <small>يوم على البكالوريا<br />(تقديري: {fmt(BAC)}/2027)</small>
          </div>
        </header>

        <nav className="tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}{id === 'quiz' && quizPending && role !== 'admin' && <span className="dot" aria-label="اختبار جديد" />}
            </button>
          ))}
          <span className="sp" />
          <span className="save">{saveMsg}</span>
          <button className="btn ghost small" onClick={() => logout()}>خروج</button>
        </nav>

        {tab === 'today' && <Today data={data} setData={setData} quizPending={quizPending && role !== 'admin'} openQuiz={() => setTab('quiz')} />}
        {tab === 'quiz' && <Quiz role={role} onDone={checkQuiz} />}
        {tab === 'week' && <Week data={data} setData={setData} />}
        {tab === 'units' && <Units data={data} setData={setData} />}
        {tab === 'year' && <Year />}
        {tab === 'admin' && role === 'admin' && <Admin ann={ann} setAnn={setAnn} data={data} onExpired={() => logout(false)} />}
      </main>
    </>
  );
}
