/**
 * FishRain 国际化引擎
 * 语言检测（localStorage → 浏览器偏好 → 默认 en）+ 字典翻译 + DOM 应用 + 切换事件。
 * 与 theme-init.js 同模式：head 同步加载，pre-paint 设置 <html lang>，
 * DOMContentLoaded 时应用页面翻译，切换不刷新页面、保持滚动位置。
 *
 * DOM 契约：
 *  - 文本节点：<span data-i18n="home.heroTitle">（值支持 <br>/<strong> 等受控标签）
 *  - 属性节点：data-i18n-attr="placeholder:key;aria-label:key"
 *  - 页面标识：<body data-i18n-doc="home|articles|about|guestbook|gachapon">（用于 title/description）
 *  - 切换器：#langToggle / #langPanel / .lang-option[data-lang-value] / #langCode
 *
 * API：window.FishRainI18n = { langs, get, set, t, langCode, langName }
 * 事件：window 'fishrain:langchange' { detail: { lang } } —— 动态渲染脚本监听后重渲染
 */
window.FishRainI18n = (function () {
    'use strict';

    var LANGS = ['zh-CN', 'en', 'fr'];
    var STORAGE_KEY = 'fishrain_lang';
    var FALLBACK = 'en';
    var BASE = 'zh-CN'; // 字典键集基准语言

    /* ---------- 语言检测 ---------- */

    function readStored() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function detect() {
        var stored = readStored();
        if (LANGS.indexOf(stored) !== -1) return stored;
        var nav = '';
        try {
            nav = (navigator.languages && navigator.languages[0]) ||
                  navigator.language || navigator.userLanguage || '';
        } catch (e) { nav = ''; }
        nav = String(nav).toLowerCase();
        if (nav.indexOf('zh') === 0) return 'zh-CN';
        if (nav.indexOf('fr') === 0) return 'fr';
        return FALLBACK;
    }

    var current = detect();

    /* ---------- 字典查询 ---------- */

    function lookup(lang, key) {
        var dict = window.FISHRAIN_I18N && window.FISHRAIN_I18N[lang];
        if (!dict) return undefined;
        var node = dict;
        var parts = key.split('.');
        for (var i = 0; i < parts.length; i++) {
            if (node == null || typeof node !== 'object') return undefined;
            node = node[parts[i]];
        }
        return (typeof node === 'string') ? node : undefined;
    }

    function interpolate(value, vars) {
        if (!vars) return value;
        return value.replace(/\{(\w+)\}/g, function (m, name) {
            return (vars[name] !== undefined && vars[name] !== null) ? String(vars[name]) : m;
        });
    }

    /**
     * 翻译：当前语言 → en 兜底 → zh-CN 兜底 → 返回键名本身
     * @param {string} key 点分键，如 'articles.count'
     * @param {Object} [vars] 插值变量，如 { n: 5 }
     */
    function t(key, vars) {
        var value = lookup(current, key);
        if (value === undefined && current !== FALLBACK) value = lookup(FALLBACK, key);
        if (value === undefined && current !== BASE) value = lookup(BASE, key);
        if (value === undefined) {
            if (window.console && console.warn) console.warn('[i18n] missing key:', key, '(' + current + ')');
            return key;
        }
        return interpolate(value, vars);
    }

    /* ---------- 页面应用 ---------- */

    function applyHtmlLang() {
        document.documentElement.setAttribute('lang', current);
    }

    function applyDocMeta() {
        var body = document.body;
        if (!body) return;
        var docKey = body.getAttribute('data-i18n-doc');
        if (!docKey) return;
        var title = t('meta.' + docKey + 'Title');
        if (title && title !== ('meta.' + docKey + 'Title')) document.title = title;
        var desc = t('meta.' + docKey + 'Desc');
        var metaDesc = document.querySelector('meta[name="description"]');
        if (desc && desc !== ('meta.' + docKey + 'Desc') && metaDesc) {
            metaDesc.setAttribute('content', desc);
        }
    }

    function applyPage() {
        // 文本节点（innerHTML：字典为本地受控静态资源，支持 <br>/<strong>）
        var nodes = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < nodes.length; i++) {
            var key = nodes[i].getAttribute('data-i18n');
            var value = lookup(current, key);
            if (value === undefined) value = lookup(FALLBACK, key);
            if (value === undefined) value = lookup(BASE, key);
            if (value !== undefined) nodes[i].innerHTML = value;
        }
        // 属性节点：data-i18n-attr="placeholder:key;aria-label:key"
        var attrNodes = document.querySelectorAll('[data-i18n-attr]');
        for (var j = 0; j < attrNodes.length; j++) {
            var pairs = attrNodes[j].getAttribute('data-i18n-attr').split(';');
            for (var k = 0; k < pairs.length; k++) {
                var pair = pairs[k].split(':');
                if (pair.length !== 2) continue;
                var attr = pair[0].trim();
                var attrKey = pair[1].trim();
                var attrValue = lookup(current, attrKey);
                if (attrValue === undefined) attrValue = lookup(FALLBACK, attrKey);
                if (attrValue === undefined) attrValue = lookup(BASE, attrKey);
                if (attrValue !== undefined) attrNodes[j].setAttribute(attr, attrValue);
            }
        }
        applyDocMeta();
    }

    /* ---------- 切换器 UI 同步 ---------- */

    function langCode(lang) {
        return lang === 'zh-CN' ? '中' : (lang === 'fr' ? 'FR' : 'EN');
    }

    function syncLangUI() {
        var codeEl = document.getElementById('langCode');
        if (codeEl) codeEl.textContent = langCode(current);
        var options = document.querySelectorAll('.lang-option');
        for (var i = 0; i < options.length; i++) {
            options[i].setAttribute('aria-checked', options[i].getAttribute('data-lang-value') === current ? 'true' : 'false');
        }
    }

    /* ---------- 切换 ---------- */

    /**
     * 切换语言：持久化 + 更新 <html lang> + 重翻译静态 DOM + 广播事件。
     * 不刷新页面，滚动位置自然保持。
     */
    function set(lang) {
        if (LANGS.indexOf(lang) === -1 || lang === current) return current;
        current = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* 隐私模式下忽略 */ }
        applyHtmlLang();
        applyPage();
        syncLangUI();
        try {
            window.dispatchEvent(new CustomEvent('fishrain:langchange', { detail: { lang: lang } }));
        } catch (e) { /* 旧浏览器忽略 */ }
        return current;
    }

    /* ---------- 初始化 ---------- */

    // pre-paint：<html lang> 与实际语言一致（避免 SEO/无障碍读到错误语言）
    applyHtmlLang();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyPage();
            syncLangUI();
        });
    } else {
        applyPage();
        syncLangUI();
    }

    return {
        langs: LANGS,
        get: function () { return current; },
        set: set,
        t: t,
        langCode: langCode,
        langName: function (lang) { return t('lang.' + (lang === 'zh-CN' ? 'zh' : lang)); }
    };
})();
