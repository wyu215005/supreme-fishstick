/**
 * 导航栏模块
 * 处理导航链接激活状态、响应式汉堡菜单和暗黑模式切换
 */

document.addEventListener('DOMContentLoaded', function () {
  setActiveNavLink();
  setupHamburgerMenu();
  setupDarkMode();
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
 * 初始化暗黑模式切换
 */
function setupDarkMode() {
  const btn = document.querySelector('.dark-mode-toggle');
  if (!btn) return;

  // 恢复用户偏好
  const saved = localStorage.getItem('fishrain_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    btn.textContent = '☀️';
    btn.setAttribute('aria-label', '切换为浅色模式');
  } else {
    btn.textContent = '🌙';
    btn.setAttribute('aria-label', '切换为暗黑模式');
  }

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      btn.textContent = '🌙';
      btn.setAttribute('aria-label', '切换为暗黑模式');
      localStorage.setItem('fishrain_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      btn.textContent = '☀️';
      btn.setAttribute('aria-label', '切换为浅色模式');
      localStorage.setItem('fishrain_theme', 'dark');
    }
  });
}
