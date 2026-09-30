import { api } from './api.js';
import { b64u } from '../shared/webpush.js';

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

async function currentSub() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// { supported, permission, subscribed, prefs }
export async function pushStatus() {
  if (!pushSupported()) return { supported: false };
  const sub = await currentSub();
  const res = sub ? await api('/push/status', { method: 'POST', body: { endpoint: sub.endpoint } }) : { subscribed: false, prefs: null };
  return { supported: true, permission: Notification.permission, subscribed: !!sub && res.subscribed, prefs: res.prefs };
}

export async function enablePush(prefs) {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('لم يتم السماح بالتنبيهات. فعّليها من إعدادات المتصفح أو الهاتف لهذا الموقع.');
  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await api('/push/key');
  let sub = await reg.pushManager.getSubscription();
  // a subscription made with another key can't receive our messages
  if (sub && b64u.enc(sub.options?.applicationServerKey || new ArrayBuffer(0)) !== publicKey) { await sub.unsubscribe(); sub = null; }
  sub ||= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u.dec(publicKey) });
  return api('/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON(), prefs } });
}

export async function disablePush() {
  const sub = await currentSub();
  if (!sub) return;
  await api('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe();
}

export async function savePrefs(prefs) {
  const sub = await currentSub();
  return api('/push/prefs', { method: 'POST', body: { endpoint: sub.endpoint, prefs } });
}

export async function testPush() {
  const sub = await currentSub();
  return api('/push/test', { method: 'POST', body: { endpoint: sub.endpoint } });
}
