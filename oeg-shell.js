(function () {
  const modules = [
    { file: 'OEG_M1_Dashboard.html', code: 'M1', icon: '\uD83D\uDCCA', label: 'T\u1ED5ng quan' },
    { file: 'OEG_M2_Fnet.html', code: 'M2', icon: '\uD83D\uDDA5\uFE0F', label: 'Fnet' },
    { file: 'OEG_M3_FnB_Mart.html', code: 'M3', icon: '\uD83C\uDF5C', label: 'FnB & Mart' },
    { file: 'OEG_M4_NhanSu.html', code: 'M4', icon: '\uD83D\uDC65', label: 'Nh\u00E2n s\u1EF1' },
    { file: 'OEG_M5_PhongMay.html', code: 'M5', icon: '\u2699\uFE0F', label: 'Ph\u00F2ng m\u00E1y' },
    { file: 'OEG_M6_PL.html', code: 'M6', icon: '\uD83D\uDCB0', label: 'P&L' }
  ];
  const utilityIcons = ['\u270D\uFE0F', '\uD83D\uDCDA', '\uD83C\uDFAF'];
  const toolPages = [
    { file: 'OEG_Wiki_SOP.html', icon: '\uD83D\uDCDA', label: 'Wiki / SOP' }
  ];
  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function cleanText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function setCollapsed(collapsed) {
    document.body.classList.toggle('oeg-sidebar-collapsed', collapsed);
    try { localStorage.setItem('oeg_sidebar_collapsed', collapsed ? '1' : '0'); } catch (e) {}
  }

  window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.querySelector('.oeg-sidebar-backdrop');
    if (window.matchMedia('(max-width: 768px)').matches) {
      sidebar && sidebar.classList.toggle('open');
      backdrop && backdrop.classList.toggle('open', sidebar && sidebar.classList.contains('open'));
    } else {
      setCollapsed(!document.body.classList.contains('oeg-sidebar-collapsed'));
    }
  };

  function enhanceSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const logo = sidebar.querySelector('.sidebar-logo');
    if (logo && !logo.querySelector('.oeg-collapse-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'oeg-collapse-btn';
      btn.setAttribute('aria-label', 'Thu g\u1ECDn menu');
      btn.title = 'Thu g\u1ECDn / m\u1EDF r\u1ED9ng menu';
      btn.textContent = '\u2039';
      btn.addEventListener('click', function () {
        setCollapsed(!document.body.classList.contains('oeg-sidebar-collapsed'));
      });
      logo.appendChild(btn);
    }

    sidebar.querySelectorAll('.nav-item').forEach(function (item, index) {
      if (!item.querySelector('.nav-text')) {
        const textNodes = Array.from(item.childNodes).filter(function (node) {
          return node.nodeType === Node.TEXT_NODE && cleanText(node.textContent);
        });
        textNodes.forEach(function (node) {
          const span = document.createElement('span');
          span.className = 'nav-text';
          span.textContent = node.textContent.trim();
          node.replaceWith(span);
        });
      }

      const text = cleanText(item.querySelector('.nav-text')?.textContent || item.textContent);
      const module = modules.find(function (mod) {
        return text.includes(mod.code) || ((item.getAttribute('href') || '').toLowerCase() === mod.file.toLowerCase());
      });
      const toolPage = toolPages.find(function (tool) {
        return text.toLowerCase().includes(tool.label.toLowerCase()) || ((item.getAttribute('href') || '').toLowerCase() === tool.file.toLowerCase());
      });
      if (toolPage && !item.getAttribute('href')) {
        item.setAttribute('role', 'link');
        item.addEventListener('click', function () { window.location.href = toolPage.file; });
      }
      const icon = module ? module.icon : toolPage ? toolPage.icon : utilityIcons[index % utilityIcons.length];
      if (!item.querySelector('.nav-icon')) {
        const iconEl = document.createElement('span');
        iconEl.className = 'nav-icon';
        iconEl.textContent = icon;
        const dot = item.querySelector('.dot');
        if (dot) dot.replaceWith(iconEl);
        else item.prepend(iconEl);
      }
      item.dataset.title = text;
      item.title = text;
      if (module && module.file.toLowerCase() === currentFile) item.classList.add('active');
      if (toolPage && toolPage.file.toLowerCase() === currentFile) item.classList.add('active');
    });

    if (!document.querySelector('.oeg-sidebar-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'oeg-sidebar-backdrop';
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
      });
      document.body.appendChild(backdrop);
    }

    try {
      if (localStorage.getItem('oeg_sidebar_collapsed') === '1' && !window.matchMedia('(max-width: 768px)').matches) {
        document.body.classList.add('oeg-sidebar-collapsed');
      }
    } catch (e) {}
  }

  function enhanceTopbar() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    const left = topbar.querySelector('.topbar-left') || topbar;
    const right = topbar.querySelector('.topbar-right') || topbar;

    if (!left.querySelector('.oeg-home-btn')) {
      const home = document.createElement('a');
      home.className = 'oeg-home-btn';
      home.href = 'index.html';
      home.title = 'V\u1EC1 trang t\u1ED5ng h\u1EE3p';
      home.setAttribute('aria-label', 'V\u1EC1 trang t\u1ED5ng h\u1EE3p');
      home.textContent = '\u2302';
      const hamburger = left.querySelector('.hamburger');
      if (hamburger && hamburger.nextSibling) left.insertBefore(home, hamburger.nextSibling);
      else left.prepend(home);
    }

    if (!right.querySelector('.oeg-live')) {
      const live = document.createElement('span');
      live.className = 'oeg-live';
      live.innerHTML = '<span class="oeg-live-dot"></span><span>Google Sheets Live</span>';
      right.prepend(live);
    }

    if (!document.querySelector('.oeg-quick-switch')) {
      const bar = document.createElement('nav');
      bar.className = 'oeg-quick-switch';
      bar.setAttribute('aria-label', 'Chuy\u1EC3n nhanh module');
      modules.forEach(function (mod) {
        const a = document.createElement('a');
        a.className = 'oeg-pill' + (mod.file.toLowerCase() === currentFile ? ' active' : '');
        a.href = mod.file;
        a.innerHTML = '<span>' + mod.icon + '</span><span>' + mod.code + ' \u00B7 ' + mod.label + '</span>';
        bar.appendChild(a);
      });
      topbar.insertAdjacentElement('afterend', bar);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    enhanceSidebar();
    enhanceTopbar();

    window.addEventListener('resize', function () {
      const backdrop = document.querySelector('.oeg-sidebar-backdrop');
      if (!window.matchMedia('(max-width: 768px)').matches && backdrop) backdrop.classList.remove('open');
    });
  });
})();
