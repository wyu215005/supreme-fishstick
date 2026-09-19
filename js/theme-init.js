/* 在渲染前恢复主题，避免暗色模式用户看到闪白 */
(function () {
    try {
        if (localStorage.getItem('fishrain_theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    } catch (e) { /* localStorage 不可用时忽略 */ }
})();
