/* ============================================================
   🪙 FishRain 像素金币点击特效 - Mario Coin Effect
   鼠标点击后弹出一枚像素风金币，向上飘散消失
   ============================================================ */

(function () {
    'use strict';

    function spawnCoin(x, y) {
        var el = document.createElement('div');
        el.className = 'pixel-coin-fx';
        el.textContent = '🪙';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.body.appendChild(el);
        el.addEventListener('animationend', function () {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }

    // 监听全局点击
    document.addEventListener('click', function (e) {
        spawnCoin(e.clientX, e.clientY);
    });

    // 触摸支持
    document.addEventListener('touchstart', function (e) {
        if (e.touches && e.touches.length > 0) {
            var t = e.touches[0];
            spawnCoin(t.clientX, t.clientY);
        }
    }, { passive: true });
})();
