(function () {
  const modules = [
    { file: 'OEG_M1_Dashboard.html', code: 'M1', icon: 'ðŸ“Š', label: 'Tá»•ng quan' },
    { file: 'OEG_M2_Fnet.html', code: 'M2', icon: 'ðŸ–¥ï¸', label: 'Fnet' },
    { file: 'OEG_M3_FnB_Mart.html', code: 'M3', icon: 'ðŸœ', label: 'FnB & Mart' },
    { file: 'OEG_M4_NhanSu.html', code: 'M4', icon: 'ðŸ‘¥', label: 'NhÃ¢n sá»±' },
    { file: 'OEG_M5_PhongMay.html', code: 'M5', icon: 'âš™ï¸', label: 'PhÃ²ng mÃ¡y' },
    { file: 'OEG_M6_PL.html', code: 'M6', icon: 'ðŸ’°', label: 'P&L' }
  ];
  const utilityIcons = ['âœï¸', 'ðŸ“š', 'ðŸŽ¯'];
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
      btn.setAttribute('aria-label', 'Thu gá»n menu');
      btn.title = 'Thu gá»n / má»Ÿ rá»™ng menu';
      btn.textContent = 'â€¹';
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
      const icon = module ? module.icon : utilityIcons[index % utilityIcons.length];
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
      home.title = 'Vá» trang tá»•ng há»£p';
      home.setAttribute('aria-label', 'Vá» trang tá»•ng há»£p');
      home.textContent = 'âŒ‚';
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
      bar.setAttribute('aria-label', 'Chuyá»ƒn nhanh module');
      modules.forEach(function (mod) {
        const a = document.createElement('a');
        a.className = 'oeg-pill' + (mod.file.toLowerCase() === currentFile ? ' active' : '');
        a.href = mod.file;
        a.innerHTML = '<span>' + mod.icon + '</span><span>' + mod.code + ' Â· ' + mod.label + '</span>';
        bar.appendChild(a);
      });
      topbar.insertAdjacentElement('afterend', bar);
    }
  }

  function enhanceIndex() {
    if (currentFile !== 'index.html') return;
    document.querySelectorAll('.modules .card').forEach(function (card, index) {
      if (!card.querySelector('.card-code')) return;
      const mod = modules[index];
      if (mod && !card.querySelector('.oeg-card-kicker')) {
        const kicker = document.createElement('div');
        kicker.className = 'oeg-card-kicker';
        kicker.textContent = mod.code + ' Â· Quick access';
        card.insertBefore(kicker, card.firstChild);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    enhanceSidebar();
    enhanceTopbar();
    enhanceIndex();

    window.addEventListener('resize', function () {
      const backdrop = document.querySelector('.oeg-sidebar-backdrop');
      if (!window.matchMedia('(max-width: 768px)').matches && backdrop) backdrop.classList.remove('open');
    });
  });
})();
