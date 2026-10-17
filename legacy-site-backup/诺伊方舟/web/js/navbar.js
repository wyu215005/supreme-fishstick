/**
 * 导航栏模块
 * 处理导航链接激活状态和响应式菜单
 */

document.addEventListener('DOMContentLoaded', function() {
  setActiveNavLink();
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







