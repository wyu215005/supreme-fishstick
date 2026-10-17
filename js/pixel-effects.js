/* ============================================================
   FishRain 互动特效引擎 v3 · 克制版
   滚动渐入 / 回到顶部 / 定点彩蛋粒子 / 鱼雨彩蛋
   粒子只出现在特定彩蛋交互（Logo、换主题、回到顶部），
   普通阅读、表单与导航点击不再产生任何粒子
   ============================================================ */

(function () {
    'use strict';

    // 标记 JS 可用，供 CSS 决定是否启用动画（无 JS 时内容直接可见）
    document.documentElement.classList.add('js-anim');

    /* ---------- 1. 彩蛋粒子（定点触发，非全局点击） ---------- */
    var MAX_PARTICLES = 14;

    function spawnParticle(x, y, emoji) {
        if (document.querySelectorAll('.pixel-coin-fx').length >= MAX_PARTICLES) return;
        var el = document.createElement('div');
        el.className = 'pixel-coin-fx';
        el.textContent = emoji || '✨';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.body.appendChild(el);
        el.addEventListener('animationend', function () {
            el.remove();
        });
    }

    // ① 点击小鱼 Logo：游出一小群鱼
    var logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', function (e) {
            spawnParticle(e.clientX - 8, e.clientY, '🐟');
            spawnParticle(e.clientX + 18, e.clientY + 12, '🐠');
        });
    }

    // ② 换装反馈：主题切换瞬间，衣橱按钮旁闪几下星光
    window.addEventListener('fishrain:themechange', function () {
        var btn = document.getElementById('themeToggle');
        if (!btn) return;
        var r = btn.getBoundingClientRect();
        if (!r.width) return; // 按钮不可见（如打印模式）时跳过
        spawnParticle(r.left + r.width / 2, r.top - 2, '✨');
        spawnParticle(r.left - 4, r.top + r.height / 2, '⭐');
        spawnParticle(r.right + 4, r.top + r.height / 2, '✨');
    });

    /* ---------- 2. 回到顶部按钮（像素小鱼） ---------- */
    function setupBackToTop() {
        var btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', '回到顶部');
        btn.title = '小鱼带你回到顶部~';
        document.body.appendChild(btn);

        function toggle() {
            btn.classList.toggle('visible', window.scrollY > 300);
        }
        window.addEventListener('scroll', toggle, { passive: true });
        toggle();

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            var rect = btn.getBoundingClientRect();
            spawnParticle(rect.left + 24, rect.top, '🐟');
        });
    }

    /* ---------- 3. 滚动渐入 ---------- */
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

    /* ---------- 4. Konami 秘籍 → 鱼雨彩蛋 🐟 ---------- */
    var KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown',
        'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    var konamiIndex = 0;

    document.addEventListener('keydown', function (e) {
        var key = e.key.toLowerCase();
        konamiIndex = (key === KONAMI[konamiIndex]) ? konamiIndex + 1
            : (key === KONAMI[0] ? 1 : 0);
        if (konamiIndex === KONAMI.length) {
            konamiIndex = 0;
            fishRain();
        }
    });

    function fishRain() {
        if (typeof UTILS !== 'undefined' && UTILS.showToast) {
            UTILS.showToast('🐟 鱼雨来啦！Welcome to FishRain！');
        }
        for (var i = 0; i < 26; i++) {
            (function (i) {
                setTimeout(function () {
                    var fish = document.createElement('div');
                    fish.className = 'pixel-fish-rain';
                    fish.textContent = Math.random() < 0.8 ? '🐟' : '🐠';
                    fish.style.left = (Math.random() * 96) + 'vw';
                    fish.style.fontSize = (1.1 + Math.random() * 1.1) + 'rem';
                    fish.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
                    document.body.appendChild(fish);
                    fish.addEventListener('animationend', function () { fish.remove(); });
                }, i * 110);
            })(i);
        }
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
