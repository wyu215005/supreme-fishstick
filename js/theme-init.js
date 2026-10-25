/* ============================================================
   FishRain 主题衣橱 · 预绘制恢复与状态管理
   在 <head> 中同步执行：首次绘制前恢复主题，避免闪白/闪错主题
   对外提供 window.FishRainTheme，供 navbar.js 等模块统一调用
   存储键沿用 fishrain_theme，旧版 light/dark 值自动迁移
   ============================================================ */

window.FishRainTheme = (function () {
    'use strict';

    var STORAGE_KEY = 'fishrain_theme';
    var THEMES = ['ocean', 'paper', 'play'];

    // 旧版 light/dark 取值 → 新主题的迁移映射
    var LEGACY_MAP = { 'dark': 'ocean', 'light': 'paper' };

    function normalize(value) {
        if (THEMES.indexOf(value) !== -1) return value;
        if (LEGACY_MAP[value]) return LEGACY_MAP[value];
        return 'paper'; // 默认主题：晴天手账（首次访问）
    }

    function readStored() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function get() {
        return normalize(readStored());
    }

    var lastApplied = null;
    function apply(theme) {
        lastApplied = theme;
        document.documentElement.setAttribute('data-theme', theme);
    }

    function set(theme) {
        theme = normalize(theme);
        apply(theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* 隐私模式等场景忽略 */ }
        try {
            window.dispatchEvent(new CustomEvent('fishrain:themechange', { detail: { theme: theme } }));
        } catch (e) { /* 极旧浏览器无 CustomEvent：仅缺少换装反馈 */ }
        return theme;
    }

    /* ---- 初始化（本文件在 <head> 同步加载，先于首次绘制）---- */
    var stored = readStored();
    var initial = normalize(stored);
    // 旧值迁移：把 'dark' / 'light' 等历史值改写为新主题标识
    if (stored !== initial) {
        try { localStorage.setItem(STORAGE_KEY, initial); } catch (e) { /* ignore */ }
    }
    apply(initial);

    /* ---- 双重断言：页面加载完成与 bfcache 恢复时重新校验主题 ----
       防御场景：跨标签页切换后返回（bfcache 恢复不重跑脚本、主题已在他页更新）、
       或任何延后执行的代码意外覆盖 data-theme 属性 */
    document.addEventListener('DOMContentLoaded', function () { apply(get()); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) apply(get()); });

    /* ---- 主题守卫：页面加载后如有代码意外改写 data-theme，立即恢复用户偏好 ----
       仅在 DOM 值既不等于存储偏好、也不等于本模块刚应用过的值时介入（后者兼容
       隐私模式下 localStorage 写入失败、但用户主动切换主题的场景），不影响正常切换 */
    if (window.MutationObserver) {
        new MutationObserver(function () {
            var expected = get();
            var current = document.documentElement.getAttribute('data-theme');
            if (current !== expected && current !== lastApplied) {
                apply(expected);
            }
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    return {
        themes: THEMES,
        get: get,
        set: set,
        apply: apply
    };
})();
