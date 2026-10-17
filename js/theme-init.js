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
        return 'ocean'; // 默认主题：深海夜航
    }

    function readStored() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function get() {
        return normalize(readStored());
    }

    function apply(theme) {
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

    return {
        themes: THEMES,
        get: get,
        set: set,
        apply: apply
    };
})();
