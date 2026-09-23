/* ============================================================
   TextilePOS — Common Utilities
   + Barcode + QR Code + Camera Scanner + Remote Scanner Session
   ============================================================ */

if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'PASTE_YOUR_API_KEY_HERE') {
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;max-width:600px;margin:auto;line-height:1.8">
    <h1 style="color:#dc2626">⚠️ Firebase Config সেট করা হয়নি</h1>
    <p><b>firebase-config.js</b> ফাইলটি খুলে <b>FIREBASE_CONFIG</b> object এর মানগুলো পেস্ট করুন।</p>
  </div>`;
  throw new Error('Firebase config missing');
}

if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();
const FV = firebase.firestore.FieldValue;

/* ── Utilities ── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const BN = '০১২৩৪৫৬৭৮৯';
const bn = n => String(n ?? '').replace(/[0-9]/g, d => BN[+d]);
const money = n => { n = Number(n) || 0; return '৳' + bn(Number.isInteger(n) ? String(n) : n.toFixed(2)); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayKey = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
const fmtDate = iso => {
  if (!iso) return '';
  const d = iso.toDate ? iso.toDate() : new Date(iso);
  return bn(String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'));
};
const isToday = iso => { if (!iso) return false; const d = iso.toDate ? iso.toDate() : new Date(iso); return todayKey(d) === todayKey(); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const copyText = t => {
  if (navigator.clipboard) return navigator.clipboard.writeText(t);
  const el = document.createElement('textarea'); el.value = t; document.body.appendChild(el);
  el.select(); document.execCommand('copy'); el.remove();
  return Promise.resolve();
};

/* ── Barcode Generator ── */
function generateBarcode() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return yy + mm + dd + rand;
}

/* ═══════════════════════════════════════════════
   QR CODE — Generate / Download / Modal
   ═══════════════════════════════════════════════ */
async function generateQRDataURL(text, size = 500) {
  if (typeof QRCode === 'undefined') throw new Error('QR library লোড হয়নি');
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(String(text), {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000ff', light: '#ffffffff' },
    }, (err, url) => err ? reject(err) : resolve(url));
  });
}

function downloadDataURL(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download.png';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 150);
}

async function showQRModal(text, title, filename) {
  const old = document.getElementById('_tpQRModal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = '_tpQRModal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Noto Sans Bengali',sans-serif`;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:22px;max-width:420px;width:100%;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)">
      <h3 style="font-weight:800;font-size:18px;margin:0 0 4px">${esc(title)}</h3>
      <p style="color:#6b7280;font-size:12px;margin:0 0 16px">স্ক্যান করুন বা ডাউনলোড করুন</p>
      <div id="_qrLoading" style="padding:40px;color:#6b7280">QR তৈরি হচ্ছে...</div>
      <div id="_qrWrap" style="display:none">
        <div style="background:#fff;padding:12px;border-radius:14px;display:inline-block;box-shadow:0 2px 14px rgba(0,0,0,.1);border:1px solid #e5e7eb">
          <img id="_qrImg" style="width:260px;height:260px;display:block">
        </div>
        <div style="margin-top:10px;font-size:11px;color:#9ca3af;font-family:monospace;word-break:break-all;line-height:1.5">${esc(text)}</div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px">
        <button id="_qrDownload" style="flex:1;background:#2563eb;color:#fff;padding:13px;border:none;border-radius:12px;font-weight:700;font-family:inherit;font-size:14px;cursor:pointer">📥 ডাউনলোড PNG</button>
        <button id="_qrClose" style="flex:1;background:#f3f4f6;color:#374151;padding:13px;border:none;border-radius:12px;font-weight:700;font-family:inherit;font-size:14px;cursor:pointer">বন্ধ</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  try {
    const dataURL = await generateQRDataURL(text, 500);
    document.getElementById('_qrLoading').style.display = 'none';
    document.getElementById('_qrWrap').style.display = '';
    document.getElementById('_qrImg').src = dataURL;
    document.getElementById('_qrDownload').onclick = () => downloadDataURL(dataURL, filename || 'qr.png');
  } catch (err) {
    console.error(err);
    document.getElementById('_qrLoading').textContent = '⚠️ QR তৈরি করা যায়নি';
  }

  document.getElementById('_qrClose').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

/* ═══════════════════════════════════════════════
   CAMERA QR SCANNER (Html5Qrcode)
   ═══════════════════════════════════════════════ */
let _activeScanner = null;
function openQRScanner(onScan) {
  if (_activeScanner) return;
  if (typeof Html5Qrcode === 'undefined') {
    toast('QR স্ক্যানার লোড হয়নি — ইন্টারনেট চেক করুন', 'error');
    return;
  }

  const old = document.getElementById('_tpQRScan');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = '_tpQRScan';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:9999;display:flex;flex-direction:column;font-family:'Noto Sans Bengali',sans-serif`;
  modal.innerHTML = `
    <div style="padding:14px;display:flex;align-items:center;gap:10px;color:#fff">
      <div style="flex:1;font-weight:800;font-size:16px">📷 QR কোড স্ক্যান করুন</div>
      <button id="_qrScanClose" style="background:#dc2626;color:#fff;border:none;width:42px;height:42px;border-radius:12px;font-size:22px;font-weight:800;cursor:pointer;line-height:1">×</button>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:16px">
      <div id="qrReader" style="width:100%;max-width:440px;background:#111;border-radius:18px;overflow:hidden;border:2px solid #22c55e"></div>
    </div>
    <div style="padding:16px;text-align:center;color:#e5e7eb;font-size:13px;line-height:1.6">
      📱 QR কোড ফ্রেমের ভিতরে ধরুন<br>
      <span style="font-size:11px;color:#9ca3af">স্ক্যান হলে স্বয়ংক্রিয়ভাবে বন্ধ হবে</span>
    </div>`;
  document.body.appendChild(modal);

  const qr = new Html5Qrcode("qrReader", { verbose: false });
  _activeScanner = qr;

  qr.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
    (decoded) => {
      try { navigator.vibrate && navigator.vibrate(100); } catch {}
      qr.stop().then(() => {
        _activeScanner = null;
        modal.remove();
        onScan(decoded);
      }).catch(() => {
        _activeScanner = null;
        modal.remove();
        onScan(decoded);
      });
    },
    () => {}
  ).catch(err => {
    console.error('Scanner error:', err);
    _activeScanner = null;
    modal.remove();
    toast('ক্যামেরা চালু করা যায়নি — পারমিশন দিন', 'error');
  });

  document.getElementById('_qrScanClose').onclick = () => {
    if (_activeScanner) {
      _activeScanner.stop().finally(() => { _activeScanner = null; modal.remove(); });
    } else modal.remove();
  };
}

/* ── Email ── */
function normalizeEmail(raw) { return String(raw || '').trim().toLowerCase(); }
function isValidGmail(email) { return /^[a-z0-9][a-z0-9._%+-]{2,}@gmail\.com$/i.test(String(email || '').trim()); }

/* ── Phone ── */
function normalizePhone(raw) {
  let p = String(raw || '').replace(/\D/g, '');
  if (p.startsWith('880') && p.length === 13) p = '0' + p.slice(3);
  if (p.startsWith('88') && p.length === 12) p = '0' + p.slice(2);
  if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  return p;
}
function isValidPhone(p) {
  if (!p) return false;
  if (/^01[3-9]\d{8}$/.test(p)) return true;
  if (/^[6-9]\d{9}$/.test(p)) return true;
  if (/^\d{10,13}$/.test(p)) return true;
  return false;
}

/* ── Shop ID ── */
function generateShopId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'SHOP-' + s;
}
const shopIdKey = id => String(id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const salesmanEmail = (sid, u) => `s-${shopIdKey(sid)}-${String(u||'').toLowerCase().replace(/[^a-z0-9]/g,'')}@textilepos-user.app`;

/* ═══════════════════════════════════════════════
   SCANNER SESSION — Remote scanner pairing
   ═══════════════════════════════════════════════ */
function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint8Array(24);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 24; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  let s = '';
  for (let i = 0; i < 24; i++) s += chars[arr[i] % chars.length];
  return s;
}

function buildScannerURL(sessionId) {
  const url = new URL('scanner.html', location.href);
  url.searchParams.set('s', sessionId);
  return url.href;
}

async function createScannerSession(shopId, salesmanId, salesmanName, shopName) {
  const sessionId = generateSessionId();
  await db.collection('scannerSessions').doc(sessionId).set({
    sessionId,
    shopId,
    shopName: shopName || '',
    salesmanId,
    salesmanName: salesmanName || '',
    scannerConnected: false,
    createdAt: FV.serverTimestamp(),
    lastPing: FV.serverTimestamp(),
  });
  return sessionId;
}

async function deleteScannerSession(sessionId) {
  if (!sessionId) return;
  try {
    const ref = db.collection('scannerSessions').doc(sessionId);
    const scans = await ref.collection('scans').get();
    const batch = db.batch();
    scans.docs.forEach(d => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();
  } catch (e) { console.error('deleteScannerSession:', e); }
}

/* ── Toast ── */
function toast(msg, type = 'info') {
  let tc = document.getElementById('toastContainer');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;gap:8px;width:90%;max-width:380px;pointer-events:none';
    document.body.appendChild(tc);
  }
  const colors = { info: '#1f2937', success: '#16a34a', error: '#dc2626', warn: '#f59e0b' };
  const icons  = { info: 'ℹ️', success: '✓', error: '✕', warn: '⚠️' };
  const el = document.createElement('div');
  el.style.cssText = `background:${colors[type]};color:#fff;padding:12px 16px;border-radius:12px;
    box-shadow:0 10px 30px rgba(0,0,0,.3);display:flex;align-items:center;gap:8px;font-size:14px;
    font-weight:500;font-family:'Noto Sans Bengali',sans-serif`;
  el.innerHTML = `<span>${icons[type]}</span><span>${esc(msg)}</span>`;
  tc.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0'; el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 320);
  }, 2400);
}

/* ── Confirm ── */
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

/* ── Auth Guard ── */
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
          uid: user.uid, email: user.email, ...userData,
          shop: { shopId: userData.shopId, ...shopDoc.data() },
        };
        if (requiredRole === 'admin' && profile.role !== 'admin') { location.href = 'salesman.html'; return; }
        resolve(profile);
      } catch (e) { console.error(e); location.href = 'login.html'; }
    });
  });
}

/* ── Expose ── */
window.TP = {
  // Core
  auth, db, FV, $, $$,
  // Format
  bn, money, esc, todayKey, fmtDate, isToday, uid, copyText,
  // Barcode / QR / Scanner
  generateBarcode, generateQRDataURL, downloadDataURL, showQRModal, openQRScanner,
  // Validation
  normalizeEmail, isValidGmail, normalizePhone, isValidPhone,
  // Shop
  generateShopId, salesmanEmail,
  // Remote Scanner Session
  generateSessionId, buildScannerURL, createScannerSession, deleteScannerSession,
  // UI
  toast, askConfirm,
  // Auth
  requireAuth,
};
