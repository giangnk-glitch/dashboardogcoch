/**
 * OEG Cyber Hub — API Connector
 * File này nhúng vào TẤT CẢ các dashboard HTML (M1–M6)
 * Thay thế data mẫu bằng data thật từ Google Sheets qua Apps Script
 *
 * Cách dùng:
 *   1. Paste <script src="oeg-api.js"></script> vào <head> mỗi dashboard
 *   2. Gọi OEG.init() sau khi Google Sign-In xong
 *   3. Dùng await OEG.get(module, options) thay vì dùng data mẫu
 */

const OEG = (() => {
  // ── CẤU HÌNH — thay 2 dòng này sau khi deploy Apps Script ──
  const API_URL     = 'https://script.google.com/macros/s/AKfycbw5VPCXnn8ae1upCDb5DbkaDRyaKjJmUvVqqL-gphL2srZ8_mblqmDniCn2EuNSrDkfPg/exec';
  const GOOGLE_CLIENT_ID = '273176228434-pj8aoucadhehrqj638o5da5e0l36e4t6.apps.googleusercontent.com';
  // ────────────────────────────────────────────────────────────

  let _token  = null;
  let _user   = null;
  let _cache  = {};
  const CACHE_TTL = 5 * 60 * 1000; // 5 phút

  // ── AUTH ────────────────────────────────────────────────────

  /** Khởi tạo Google Sign-In và render nút đăng nhập */
  async function init(onLogin) {
    return new Promise((resolve) => {
      // Load Google GSI script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            _token = response.credential;
            _user  = parseJwt(_token);
            _cache = {}; // clear cache on login
            if (onLogin) await onLogin(_user);
            resolve(_user);
          },
          auto_select: true,
        });
        google.accounts.id.prompt(); // auto sign-in nếu đã đăng nhập trước
      };
      document.head.appendChild(script);
    });
  }

  /** Render nút Sign In vào element id='g_signin' */
  function renderSignInButton(elementId = 'g_signin') {
    const el = document.getElementById(elementId);
    if (!el) return;
    google.accounts.id.renderButton(el, {
      theme: 'filled_black', size: 'large',
      text: 'signin_with', shape: 'rectangular',
    });
  }

  function signOut() {
    _token = null; _user = null; _cache = {};
    google.accounts.id.disableAutoSelect();
    window.location.reload();
  }

  function getUser() { return _user; }
  function isLoggedIn() { return !!_token; }

  // ── API CALLS ────────────────────────────────────────────────

  /**
   * Đọc data từ Apps Script
   * @param {string} module  'm1'|'m2'|'m3'|'m4'|'m5'|'m6'
   * @param {object} options { branch, period, action }
   */
  async function get(module, options = {}) {
    if (!_token) throw new Error('Chưa đăng nhập');
    const { branch = 'all', period = 'week', action = 'getData' } = options;

    const cacheKey = `${module}_${branch}_${period}`;
    const cached   = _cache[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

    const url = `${API_URL}?action=${action}&module=${module}&branch=${encodeURIComponent(branch)}&period=${period}&token=${_token}`;
    const res  = await fetch(url);
    const json = await res.json();

    if (!json.ok) throw new Error(json.error || 'API error');

    _cache[cacheKey] = { data: json.data, ts: Date.now() };
    return json.data;
  }

  /**
   * Ghi data vào Apps Script (POST)
   * @param {string} action  'submitRevenue'|'submitHR'|'submitPC'|'submitPL'|'submitIncident'
   * @param {object} payload  dữ liệu cần ghi
   */
  async function post(action, payload) {
    if (!_token) throw new Error('Chưa đăng nhập');
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token: _token, ...payload }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Submit error');
    // Xóa cache sau khi ghi để force refresh
    _cache = {};
    return json.data;
  }

  /** Lấy KPI targets */
  async function getKPI(branch = 'all') {
    return get('kpi', { action: 'getKPI', branch });
  }

  /** Submit form nhập liệu ngày */
  async function submitDailyRevenue(formData) {
    return post('submitRevenue', formData);
  }

  /** Submit form nhập liệu nhân sự */
  async function submitHR(formData) {
    return post('submitHR', formData);
  }

  /** Submit form nhập liệu phòng máy */
  async function submitPC(formData) {
    return post('submitPC', formData);
  }

  /** Submit P&L tuần/tháng */
  async function submitPL(formData) {
    return post('submitPL', formData);
  }

  /** Ghi incident */
  async function submitIncident(formData) {
    return post('submitIncident', formData);
  }

  /** Invalidate cache để force reload */
  function clearCache() { _cache = {}; }

  // ── UI HELPERS ───────────────────────────────────────────────

  /**
   * Wrapper với loading state + error toast
   * Dùng thay thế await OEG.get() để tự quản lý loading/error
   */
  async function withLoading(fn, options = {}) {
    const { loadingEl, errorEl } = options;
    try {
      if (loadingEl) loadingEl.style.display = 'block';
      return await fn();
    } catch (err) {
      console.error('[OEG API]', err.message);
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
      }
      showToast(err.message, 'error');
      throw err;
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  /** Toast notification */
  function showToast(message, type = 'info') {
    const existing = document.getElementById('oeg-toast');
    if (existing) existing.remove();

    const colors = { info:'#388bfd', error:'#F85149', success:'#3fb950', warn:'#d29922' };
    const toast  = document.createElement('div');
    toast.id = 'oeg-toast';
    toast.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:9999;
      background:#21262d;border:1px solid ${colors[type]||colors.info};
      border-radius:10px;padding:12px 16px;
      display:flex;align-items:center;gap:10px;
      font-family:'Be Vietnam Pro',sans-serif;font-size:13px;color:#e6edf3;
      box-shadow:0 4px 20px rgba(0,0,0,0.4);
      animation:oegSlideIn .2s ease;max-width:360px;
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes oegSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
    document.head.appendChild(style);
    toast.innerHTML = `<span style="color:${colors[type]};font-size:15px">${type==='error'?'✕':type==='success'?'✓':'ℹ'}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), type==='error'?5000:3000);
  }

  /** Render auth guard — ẩn content, hiện màn hình login nếu chưa đăng nhập */
  function authGuard(contentId = 'main-content') {
    const content = document.getElementById(contentId);
    if (!content) return;

    if (!isLoggedIn()) {
      content.style.display = 'none';

      const loginScreen = document.createElement('div');
      loginScreen.id = 'oeg-login';
      loginScreen.style.cssText = `
        min-height:100vh;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        background:#0d1117;font-family:'Be Vietnam Pro',sans-serif;
      `;
      loginScreen.innerHTML = `
        <div style="text-align:center;margin-bottom:32px">
          <div style="width:52px;height:52px;background:#e8324a;border-radius:12px;
            display:flex;align-items:center;justify-content:center;
            font-weight:700;font-size:18px;color:#fff;margin:0 auto 16px">OCH</div>
          <div style="font-size:22px;font-weight:700;color:#e6edf3">OEG Cyber Hub</div>
          <div style="font-size:14px;color:#8b949e;margin-top:6px">Chain Dashboard · Đăng nhập để tiếp tục</div>
        </div>
        <div id="g_signin"></div>
        <div style="font-size:12px;color:#484f58;margin-top:24px">
          Chỉ tài khoản nội bộ OEG mới có quyền truy cập
        </div>`;
      document.body.appendChild(loginScreen);
      renderSignInButton('g_signin');
    } else {
      content.style.display = '';
      const loginScreen = document.getElementById('oeg-login');
      if (loginScreen) loginScreen.remove();

      // Hiển thị role badge trên sidebar
      injectUserInfo();
    }
  }

  /** Inject tên + role vào sidebar user chip */
  function injectUserInfo() {
    if (!_user) return;
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');
    if (nameEl) nameEl.textContent = _user.name || _user.email;
    if (roleEl) roleEl.textContent = _user.role || 'User';
  }

  // ── UTILS ────────────────────────────────────────────────────

  function parseJwt(token) {
    try {
      const base64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      return JSON.parse(atob(base64));
    } catch { return {}; }
  }

  // ── PUBLIC API ───────────────────────────────────────────────
  return {
    init, renderSignInButton, signOut,
    getUser, isLoggedIn, authGuard,
    get, post, getKPI, clearCache,
    submitDailyRevenue, submitHR, submitPC, submitPL, submitIncident,
    withLoading, showToast,
  };
})();
