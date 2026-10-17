/**
 * 导航栏模块
 * 导航链接激活状态、响应式汉堡菜单、主题衣橱（三主题切换面板）
 * 主题状态的读写统一走 js/theme-init.js 的 FishRainTheme，
 * 本文件只负责衣橱面板的 UI 交互，避免重复监听与状态冲突
 */

document.addEventListener('DOMContentLoaded', function () {
  setActiveNavLink();
  setupHamburgerMenu();
  setupWardrobe();
});

/**
 * 设置当前页面的导航链接为活动状态
 */
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    const isActive = linkPage === currentPage ||
                     (currentPage === '' && linkPage === 'index.html');

    if (isActive) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * 初始化汉堡菜单（移动端）
 */
function setupHamburgerMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
  });

  // 点击导航链接后收起菜单
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('active');
      menu.classList.remove('active');
    });
  });

  // 点击菜单外部区域关闭菜单
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('active');
      menu.classList.remove('active');
    }
  });
}

/**
 * 主题衣橱：三主题选择面板
 * 点击立即切换（无需刷新）、点击外部关闭、Esc 关闭、
 * 上下方向键在选项间移动、关闭后焦点归还按钮
 */
function setupWardrobe() {
  const toggle = document.getElementById('themeToggle');
  const panel = document.getElementById('themePanel');
  if (!toggle || !panel || !window.FishRainTheme) return;

  const options = Array.from(panel.querySelectorAll('.theme-option'));
  const TRANSITION_MS = 180; // 与 .theme-panel 的过渡时长一致

  function syncChecked() {
    const current = FishRainTheme.get();
    options.forEach(opt => {
      const selected = opt.dataset.themeValue === current;
      opt.classList.toggle('active', selected);
      opt.setAttribute('aria-checked', String(selected));
    });
  }

  function openPanel() {
    panel.hidden = false;
    // 下一帧再加 open 类，让过渡动画有机会触发
    requestAnimationFrame(() => panel.classList.add('open'));
    toggle.setAttribute('aria-expanded', 'true');
    const current = options.find(o => o.dataset.themeValue === FishRainTheme.get());
    (current || options[0]).focus();
  }

  function closePanel(returnFocus) {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    // 等过渡结束后再彻底隐藏
    setTimeout(() => {
      if (!panel.classList.contains('open')) panel.hidden = true;
    }, TRANSITION_MS);
    if (returnFocus) toggle.focus();
  }

  function isOpen() {
    return !panel.hidden;
  }

  toggle.addEventListener('click', () => {
    isOpen() ? closePanel(true) : openPanel();
  });

  // 点击衣橱以外的区域关闭
  document.addEventListener('click', e => {
    if (!isOpen()) return;
    if (!panel.contains(e.target) && !toggle.contains(e.target)) closePanel(false);
  });

  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel(true);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = options.indexOf(document.activeElement);
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      const next = options[(idx + dir + options.length) % options.length];
      if (next) next.focus();
    }
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      FishRainTheme.set(opt.dataset.themeValue);
      syncChecked();
      closePanel(true);
    });
  });

  syncChecked();
}
