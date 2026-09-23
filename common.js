/* ============================================================
   TextilePOS — Common Utilities & Firebase Init
   ============================================================ */

if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'AIzaSyDc8Ui4b7oXfjpngns6Vd7TFyCfkt1TJeQ') {
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;max-width:600px;margin:auto;line-height:1.8">
    <h1 style="color:#dc2626">⚠️ Firebase Config সেট করা হয়নি</h1>
    <p><b>firebase-config.js</b> ফাইলটি খুলে <b>FIREBASE_CONFIG</b> object এর মানগুলো পেস্ট করুন।</p>
    <p>বিস্তারিত: README.md দেখুন।</p></div>`;
  throw new Error('Firebase config missing');
}

if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();
const FV = firebase.firestore.FieldValue;

/* ---------- Utilities ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const BN = '০১২৩৪৫৬৭৮৯';
const bn = n => String(n ?? '').replace(/[0-9]/g, d => BN[+d]);
const money = n => {
  n = Number(n) || 0;
  return '৳' + bn(Number.isInteger(n) ? String(n) : n.toFixed(2));
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayKey = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
const fmtDate = iso => {
  if (!iso) return '';
  const d = iso.toDate ? iso.toDate() : new Date(iso);
  return bn(String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'));
};
const fmtDateOnly = iso => {
  if (!iso) return '';
  const d = iso.toDate ? iso.toDate() : new Date(iso);
  return bn(String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear());
};
const isToday = iso => {
  if (!iso) return false;
  const d = iso.toDate ? iso.toDate() : new Date(iso);
  return todayKey(d) === todayKey();
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const copyText = t => {
  if (navigator.clipboard) return navigator.clipboard.writeText(t);
  const el = document.createElement('textarea'); el.value = t; document.body.appendChild(el);
  el.select(); document.execCommand('copy'); el.remove();
  return Promise.resolve();
};

/* ---------- Phone & Shop ID ---------- */
function normalizePhone(raw) {
  let p = String(raw || '').replace(/\D/g, '');
  if (p.startsWith('880') && p.length === 13) p = '0' + p.slice(3);
  if (p.startsWith('88') && p.length === 12) p = '0' + p.slice(2);
  return p;
}
const isValidPhone = p => /^01[3-9]\d{8}$/.test(p);

function generateShopId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'SHOP-' + s;
}
const shopIdKey = id => String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const adminEmail    = sid => `a-${shopIdKey(sid)}@textilepos-user.app`;
const salesmanEmail = (sid, u) => `s-${shopIdKey(sid)}-${String(u||'').toLowerCase().replace(/[^a-z0-9]/g,'')}@textilepos-user.app`;

/* ---------- Toast ---------- */
function toast(msg, type = 'info') {
  let tc = document.getElementById('toastContainer');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;width:90%;max-width:380px;pointer-events:none';
    document.body.appendChild(tc);
  }
  const colors = { info: '#1f2937', success: '#16a34a', error: '#dc2626', warn: '#f59e0b' };
  const icons  = { info: 'ℹ️', success: '✓', error: '✕', warn: '⚠️' };
  const el = document.createElement('div');
  el.style.cssText = `background:${colors[type]};color:#fff;padding:12px 16px;border-radius:12px;
    box-shadow:0 10px 30px rgba(0,0,0,.3);display:flex;align-items:center;gap:8px;font-size:14px;
    font-weight:500;animation:tpToastIn .2s ease;font-family:'Noto Sans Bengali',sans-serif`;
  el.innerHTML = `<span>${icons[type]}</span><span>${esc(msg)}</span>`;
  tc.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 320);
  }, 2400);
}

/* ---------- Confirm ---------- */
let _confirmResolve = null;
function askConfirm(msg) {
  return new Promise(res => {
    _confirmResolve = res;
    let modal = document.getElementById('_tpConfirm');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = '_tpConfirm';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;display:none;align-items:center;justify-content:center;padding:16px;font-family:"Noto Sans Bengali",sans-serif';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:20px;max-width:380px;width:100%;padding:24px">
          <div style="text-align:center"><div style="font-size:40px;margin-bottom:8px">⚠️</div>
          <p id="_tpConfirmMsg" style="color:#374151;font-weight:500;margin-bottom:24px"></p></div>
          <div style="display:flex;gap:12px">
            <button id="_tpNo" style="flex:1;background:#f3f4f6;padding:12px;border-radius:12px;font-weight:600;font-family:inherit">না</button>
            <button id="_tpYes" style="flex:1;background:#dc2626;color:#fff;padding:12px;border-radius:12px;font-weight:600;font-family:inherit">হ্যাঁ</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('_tpNo').onclick = () => { modal.style.display = 'none'; _confirmResolve?.(false); };
      document.getElementById('_tpYes').onclick = () => { modal.style.display = 'none'; _confirmResolve?.(true); };
    }
    document.getElementById('_tpConfirmMsg').textContent = msg;
    modal.style.display = 'flex';
  });
}

/* ---------- Auth Guard ---------- */
async function requireAuth(requiredRole) {
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(async user => {
      unsub();
      if (!user) { location.href = 'login.html'; return; }
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) { await auth.signOut(); location.href = 'login.html'; return; }
        const userData = userDoc.data();
        const shopDoc = await db.collection('shops').doc(userData.shopId).get();
        if (!shopDoc.exists) { await auth.signOut(); location.href = 'login.html'; return; }
        const profile = {
          uid: user.uid,
          ...userData,
          shop: { shopId: userData.shopId, ...shopDoc.data() },
        };
        if (requiredRole === 'admin' && profile.role !== 'admin') { location.href = 'salesman.html'; return; }
        if (profile.mustChangePassword && location.pathname.indexOf('force-password') === -1) {
          // Handled by page-specific logic
        }
        resolve(profile);
      } catch (e) {
        console.error(e);
        location.href = 'login.html';
      }
    });
  });
}

/* ---------- Expose ---------- */
window.TP = { auth, db, FV, $, $$, bn, money, esc, todayKey, fmtDate, fmtDateOnly, isToday, uid, copyText,
              normalizePhone, isValidPhone, generateShopId, adminEmail, salesmanEmail,
              toast, askConfirm, requireAuth };
