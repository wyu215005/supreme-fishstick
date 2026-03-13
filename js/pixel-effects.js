/* ============================================================
   🪙 FishRain 像素金币点击特效 - Mario Coin Effect
   鼠标点击后弹出像素风金币，向上飘散消失
   ============================================================ */

(function () {
    'use strict';

    // 金币形态列表：随机选取
    var COINS = ['🪙', '⭐', '💰', '✨'];
    var COIN_LABELS = ['+1', '+5', '+10', '+100'];
    var SPAWN_DELAY_MS = 60;
    var MAX_HORIZONTAL_OFFSET = 30;

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function spawnCoin(x, y) {
        var count = randomInt(2, 4);
        for (var i = 0; i < count; i++) {
            (function (idx) {
                var delay = idx * SPAWN_DELAY_MS;
                setTimeout(function () {
                    var el = document.createElement('div');
                    el.className = 'pixel-coin-fx';

                    var coin = COINS[randomInt(0, COINS.length - 1)];
                    var label = COIN_LABELS[randomInt(0, COIN_LABELS.length - 1)];
                    el.textContent = coin + ' ' + label;

                    // 随机左右偏移，让金币扩散开
                    var offsetX = randomInt(-MAX_HORIZONTAL_OFFSET, MAX_HORIZONTAL_OFFSET);
                    el.style.left = (x + offsetX) + 'px';
                    el.style.top = y + 'px';

                    document.body.appendChild(el);

                    // 动画结束后移除元素
                    el.addEventListener('animationend', function () {
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    });
                }, delay);
            })(i);
        }
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
