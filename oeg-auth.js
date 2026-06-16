(function () {
  const CONFIG = window.OEG_AUTH_CONFIG || {};
  const SESSION_KEY = 'oeg_auth_session_v1';
  const LOGIN_PAGE = 'OEG_Login.html';
  const currentFile = (location.pathname.split('/').pop() || 'index.html');
  const isLoginPage = currentFile.toLowerCase() === LOGIN_PAGE.toLowerCase();

  const MODULE_BY_FILE = {
    'index.html': 'home',
    'OEG_M1_Dashboard.html': 'm1',
    'OEG_M2_Fnet.html': 'm2',
    'OEG_M3_FnB_Mart.html': 'm3',
    'OEG_M4_NhanSu.html': 'm4',
    'OEG_M5_PhongMay.html': 'm5',
    'OEG_M6_PL.html': 'm6',
    'OEG_Wiki_SOP.html': 'wiki'
  };

  const ROLE_PERMISSIONS = {
    admin:       { modules: ['home','m1','m2','m3','m4','m5','m6','wiki'], actions: ['view','input','kpi','settings','copy','export'] },
    manager:     { modules: ['home','m1','m2','m3','m4','m5','m6','wiki'], actions: ['view','input','copy','export'] },
    finance:     { modules: ['home','m1','m3','m6','wiki'], actions: ['view','copy','export'] },
    hr:          { modules: ['home','m4','wiki'], actions: ['view','copy'] },
    branch_lead: { modules: ['home','m1','m2','m3','m5','wiki'], actions: ['view','input','copy'] },
    viewer:      { modules: ['home','m1','m2','m3','m4','m5','wiki'], actions: ['view','copy'] }
  };

  function safeJsonParse(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  function getSession() {
    const session = safeJsonParse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || '');
    if (!session || !session.user || !session.token) return null;
    if (session.exp && Date.now() > session.exp * 1000) {
      clearSession();
      return null;
    }
    return session;
  }

  function setSession(session, remember) {
    const target = remember ? localStorage : sessionStorage;
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    target.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function parseJwt(token) {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(json);
    } catch (e) {
      return {};
    }
  }

  function domainAllowed(email) {
    const allowed = CONFIG.allowedDomains || [];
    if (!allowed.length) return true;
    const domain = String(email || '').split('@')[1] || '';
    return allowed.map(d => d.toLowerCase()).includes(domain.toLowerCase());
  }

  function resolveUser(profile) {
    const email = String(profile.email || '').toLowerCase();
    const users = CONFIG.users || [];
    const record = users.find(u => String(u.email || '').toLowerCase() === email);

    if (!email || !domainAllowed(email)) {
      return { ok: false, reason: 'Email không thuộc domain được phép.' };
    }
    if (record && record.active === false) {
      return { ok: false, reason: 'Tài khoản đã bị vô hiệu hóa.' };
    }
    if (!record && CONFIG.requireKnownUser) {
      return { ok: false, reason: 'Email chưa được cấp quyền trong OEG_AUTH_CONFIG.users.' };
    }

    const role = record?.role || CONFIG.defaultRole || 'viewer';
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
    return {
      ok: true,
      user: {
        email,
        name: record?.name || profile.name || email,
        picture: profile.picture || '',
        role,
        branch: record?.branch || 'all',
        modules: permissions.modules,
        actions: permissions.actions
      }
    };
  }

  function canAccess(moduleId, action = 'view') {
    const session = getSession();
    if (!session) return false;
    const user = session.user || {};
    return (user.modules || []).includes(moduleId) && (user.actions || []).includes(action);
  }

  function canAction(action) {
    const session = getSession();
    return !!session && (session.user.actions || []).includes(action);
  }

  function loginUrl() {
    return LOGIN_PAGE + '?return=' + encodeURIComponent(location.href);
  }

  function returnUrl() {
    const params = new URLSearchParams(location.search);
    return params.get('return') || 'index.html';
  }

  function redirectToLogin() {
    location.href = loginUrl();
  }

  function renderForbidden(moduleId) {
    document.body.innerHTML =
      '<main class="oeg-auth-screen">' +
        '<section class="oeg-auth-card">' +
          '<div class="oeg-auth-mark">OCH</div>' +
          '<h1>Không có quyền truy cập</h1>' +
          '<p>Tài khoản của anh/chị chưa được cấp quyền xem module <strong>' + moduleId.toUpperCase() + '</strong>.</p>' +
          '<div class="oeg-auth-actions">' +
            '<a class="oeg-auth-btn primary" href="index.html">Về trang tổng hợp</a>' +
            '<button class="oeg-auth-btn" onclick="OEGAuth.signOut()">Đăng xuất</button>' +
          '</div>' +
        '</section>' +
      '</main>';
  }

  function applyUserUi() {
    const session = getSession();
    if (!session) return;
    const user = session.user;

    document.documentElement.dataset.oegRole = user.role;
    document.documentElement.dataset.oegBranch = user.branch || 'all';

    const nameEls = document.querySelectorAll('.user-name');
    const roleEls = document.querySelectorAll('.user-role');
    nameEls.forEach(el => { el.textContent = user.name || user.email; });
    roleEls.forEach(el => { el.textContent = roleLabel(user.role) + ' · ' + (user.branch || 'all'); });

    document.querySelectorAll('a[href]').forEach(link => {
      const file = (link.getAttribute('href') || '').split('#')[0];
      const moduleId = MODULE_BY_FILE[file];
      if (moduleId && moduleId !== 'home' && !canAccess(moduleId)) {
        link.classList.add('oeg-denied-link');
        link.setAttribute('aria-disabled', 'true');
        link.title = 'Role hiện tại không có quyền xem module này';
        link.addEventListener('click', function (e) {
          e.preventDefault();
          showToast('Không có quyền xem module này', 'warn');
        });
      }
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes('cài đặt kpi') && !canAction('kpi')) item.classList.add('oeg-hidden-by-role');
      if (text.includes('nhập liệu') && !canAction('input')) item.classList.add('oeg-hidden-by-role');
    });

    document.querySelectorAll('[onclick*="openForm"], [onclick*="submitForm"]').forEach(el => {
      if (!canAction('input')) {
        el.classList.add('oeg-hidden-by-role');
        el.setAttribute('aria-disabled', 'true');
      }
    });

    injectAuthBadge(user);
  }

  function injectAuthBadge(user) {
    const topbarRight = document.querySelector('.topbar-right') || document.querySelector('.top-actions');
    if (!topbarRight || document.querySelector('.oeg-auth-chip')) return;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'oeg-auth-chip';
    chip.title = 'Đăng xuất';
    chip.innerHTML = '<span>' + escapeHtml(user.name || user.email) + '</span><strong>' + roleLabel(user.role) + '</strong>';
    chip.addEventListener('click', signOut);
    topbarRight.appendChild(chip);
  }

  function roleLabel(role) {
    return ({
      admin: 'Admin',
      manager: 'Manager',
      finance: 'Finance',
      hr: 'HR',
      branch_lead: 'Branch Lead',
      viewer: 'Viewer'
    })[role] || role || 'User';
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function showToast(message, type = 'info') {
    if (window.OEG && OEG.showToast) return OEG.showToast(message, type);
    const toast = document.createElement('div');
    toast.className = 'oeg-auth-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.remove(), 2800);
  }

  function guardPage() {
    if (isLoginPage) return;
    const moduleId = MODULE_BY_FILE[currentFile] || 'home';
    const session = getSession();
    if (!session) {
      redirectToLogin();
      return;
    }
    if (!canAccess(moduleId)) {
      document.addEventListener('DOMContentLoaded', () => renderForbidden(moduleId));
      return;
    }
    document.addEventListener('DOMContentLoaded', applyUserUi);
  }

  function renderLogin() {
    if (!isLoginPage) return;
    const current = getSession();
    if (current) {
      location.href = returnUrl();
      return;
    }

    const status = document.getElementById('loginStatus');
    const remember = document.getElementById('rememberLogin');

    function fail(message) {
      if (status) status.textContent = message;
      showToast(message, 'error');
    }

    function handleCredential(response) {
      const profile = parseJwt(response.credential);
      const access = resolveUser(profile);
      if (!access.ok) {
        fail(access.reason);
        return;
      }
      setSession({
        token: response.credential,
        user: access.user,
        exp: profile.exp || Math.floor(Date.now() / 1000) + 3600,
        loginAt: new Date().toISOString()
      }, !!remember?.checked);
      location.href = returnUrl();
    }

    function loadGoogle() {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = function () {
        google.accounts.id.initialize({
          client_id: CONFIG.clientId,
          callback: handleCredential,
          auto_select: false
        });
        google.accounts.id.renderButton(document.getElementById('googleLogin'), {
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280
        });
      };
      script.onerror = function () {
        fail('Không tải được Google Login. Kiểm tra kết nối mạng hoặc Client ID.');
      };
      document.head.appendChild(script);
    }

    loadGoogle();
  }

  function signOut() {
    clearSession();
    try {
      if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
    } catch (e) {}
    location.href = LOGIN_PAGE;
  }

  function getUser() {
    return getSession()?.user || null;
  }

  window.OEGAuth = {
    getSession,
    getUser,
    canAccess,
    canAction,
    signOut,
    rolePermissions: ROLE_PERMISSIONS
  };

  guardPage();
  document.addEventListener('DOMContentLoaded', renderLogin);
})();