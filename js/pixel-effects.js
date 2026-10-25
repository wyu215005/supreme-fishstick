/* ============================================================
   FishRain 互动特效引擎 v4 · 极简版
   滚动渐入 / 回到顶部
   （极简化修订：移除点击粒子、Logo 彩蛋与鱼雨彩蛋，
     页面不再出现任何漂浮小图案与海洋生物动画）
   ============================================================ */

(function () {
    'use strict';

    // 标记 JS 可用，供 CSS 决定是否启用动画（无 JS 时内容直接可见）
    document.documentElement.classList.add('js-anim');

    /* ---------- 1. 回到顶部按钮 ---------- */
    function setupBackToTop() {
        var btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', '回到顶部');
        btn.title = '回到顶部';
        document.body.appendChild(btn);

        function toggle() {
            btn.classList.toggle('visible', window.scrollY > 300);
        }
        window.addEventListener('scroll', toggle, { passive: true });
        toggle();

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- 2. 滚动渐入 ---------- */
    var REVEAL_SELECTOR = [
        '.card',
        '.intro-section',
        '.skill-category',
        '.skill-item',
        '.project-item',
        '.tech-card',
        '.article-card',
        '.article-preview',
        '.feature-card',
        '.message-item',
        '.fishing-checkin',
        '.gachapon-machine-v3',
        '.dish-manager',
        '.contact-section'
    ].join(', ');

    function setupReveal() {
        var els = document.querySelectorAll(REVEAL_SELECTOR);
        if (els.length === 0) return;
        if (!('IntersectionObserver' in window)) return; // 老浏览器：不隐藏，直接显示

        els.forEach(function (el) {
            el.classList.remove('fade-in', 'slide-in');
            el.classList.add('pixel-reveal');
            // 按兄弟位置错落入场
            var pos = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
            el.style.animationDelay = Math.min(pos * 55, 330) + 'ms';
        });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                    // 入场动画播完后移除渐入类：pixel-reveal 的 opacity:0 基底若残留，
                    // 之后任何替换 animation 的样式（如扭蛋机 machine-shake !important）
                    // 都会让元素瞬间透明消失
                    var el = entry.target;
                    var delay = parseInt(el.style.animationDelay, 10) || 0;
                    setTimeout(function () {
                        el.classList.remove('pixel-reveal', 'in-view');
                        el.style.animationDelay = '';
                    }, delay + 500);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

        els.forEach(function (el) { io.observe(el); });
    }

    /* ---------- 启动 ---------- */
    // 必须在其他脚本的 DOMContentLoaded 渲染之后执行（本文件总是最后加载），
    // 才能抓到动态生成的文章卡片、留言等元素
    var booted = false;

    function boot() {
        if (booted) return;
        booted = true;
        setupBackToTop();
        setupReveal();
    }

    document.addEventListener('DOMContentLoaded', boot);
    window.addEventListener('load', boot);
})();
