/**
 * 通用文章页控制器（topic page）
 *
 * 与 hdfs-topic.js 同源的页面机制，抽为配置驱动，供单语/多语文章页复用：
 *  - 按 window.TOPIC_PAGE.content[语言] fetch Markdown（内容与页面分离）
 *  - FishRainMarkdown 渲染 + 构建 TOC + scrollspy 高亮
 *  - Mermaid 按当前主题 CSS 变量着色；切主题重绘；失败降级为源码
 *  - 语言切换：配置中有对应内容则重渲染并保持章节锚点，否则仅界面语言切换
 *  - 代码块复制按钮；阅读进度条；返回顶部；Esc 收起移动端目录
 *
 * 用法（页面内联，晚于本脚本亦可）：
 *   window.TOPIC_PAGE = { content: { 'zh-CN': 'content/xxx.zh-CN.md' } };
 *
 * 依赖：js/i18n/*（FishRainI18n）、js/markdown.js、js/vendor/mermaid.min.js
 */

(function () {
    'use strict';

    /* ---------- 配置 ---------- */

    var PAGE = window.TOPIC_PAGE || {};
    var CONTENT = PAGE.content || {};
    var DEFAULT_LANG = CONTENT['zh-CN'] ? 'zh-CN' : Object.keys(CONTENT)[0];

    /* ---------- 状态 ---------- */

    var state = {
        lang: null,          // 当前内容语言
        result: null,        // FishRainMarkdown.render 结果
        activeId: null,      // scrollspy 当前标题 id
        loaded: false,
        rendering: false
    };

    var articleEl = document.getElementById('topicArticle');
    var tocNav = document.getElementById('tocNav');
    var tocToggle = document.getElementById('tocToggle');
    var tocAside = document.getElementById('topicToc');
    var backTop = document.getElementById('topicBackTop');
    var progressBar = document.getElementById('topicProgressBar');
    var progressWrap = document.getElementById('topicProgress');

    function t(key, vars) { return window.FishRainI18n ? FishRainI18n.t(key, vars) : key; }
    function esc(s) { return window.FishRainMarkdown ? FishRainMarkdown.escapeHtml(s) : String(s); }

    /* ---------- Mermaid ---------- */

    function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888888';
    }

    function mermaidThemeVars() {
        return {
            background: 'transparent',
            fontSize: '14px',
            fontFamily: cssVar('--font-sans'),
            primaryColor: cssVar('--bg-card'),
            primaryBorderColor: cssVar('--border-strong'),
            primaryTextColor: cssVar('--text-color'),
            lineColor: cssVar('--text-secondary'),
            textColor: cssVar('--text-color'),
            edgeLabelBackground: cssVar('--bg-card'),
            clusterBkg: cssVar('--bg-subtle'),
            clusterBorder: cssVar('--border-strong'),
            actorBkg: cssVar('--bg-card'),
            actorBorder: cssVar('--border-strong'),
            actorTextColor: cssVar('--text-color'),
            actorLineColor: cssVar('--text-muted'),
            signalColor: cssVar('--text-secondary'),
            signalTextColor: cssVar('--text-color'),
            labelBoxBkgColor: cssVar('--bg-subtle'),
            labelBoxBorderColor: cssVar('--border-strong'),
            labelTextColor: cssVar('--text-color'),
            loopTextColor: cssVar('--text-color'),
            noteBkgColor: cssVar('--bg-subtle'),
            noteTextColor: cssVar('--text-secondary'),
            noteBorderColor: cssVar('--border-strong'),
            activationBkgColor: cssVar('--bg-subtle')
        };
    }

    function mermaidConfigure() {
        if (!window.mermaid) return;
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'base',
            themeVariables: mermaidThemeVars(),
            flowchart: { useMaxWidth: true, curve: 'basis', htmlLabels: true, nodeSpacing: 34, rankSpacing: 44 },
            sequence: { useMaxWidth: true, mirrorActors: false, diagramMarginX: 20, diagramMarginY: 12 }
        });
    }

    function mermaidFallback(slot, code) {
        slot.classList.add('mmd-failed');
        slot.innerHTML =
            '<p class="mmd-fallback-note">' + esc(t('topic.mermaidFallback')) + '</p>' +
            '<pre class="mmd-fallback-code"><code>' + esc(code) + '</code></pre>';
    }

    function renderMermaidSlots() {
        var slots = articleEl.querySelectorAll('.mmd-slot[data-mmd]');
        if (!slots.length) return;
        if (!window.mermaid || !state.result) {
            slots.forEach(function (s) { mermaidFallback(s, state.result ? state.result.mermaid[+s.getAttribute('data-mmd')] || '' : ''); });
            return;
        }
        mermaidConfigure();
        slots.forEach(function (slot) {
            var idx = +slot.getAttribute('data-mmd');
            var code = (state.result.mermaid && state.result.mermaid[idx]) || '';
            slot.setAttribute('aria-label', t('topic.diagram'));
            var done = false;
            function success(svg) {
                if (done || !svg || svg.indexOf('<svg') === -1) return;
                done = true;
                slot.innerHTML = svg;
                slot.classList.add('mmd-rendered');
            }
            function fail() {
                if (done) return;
                done = true;
                mermaidFallback(slot, code);
            }
            try {
                // mermaid v9 UMD：render(id, code, cb) 通过回调收到 (svg, bindFunctions)；
                // 无回调时同步返回 SVG 字符串。两种形态都兼容，不返回 Promise。
                var out = mermaid.render('mmd-svg-' + idx + '-' + Date.now(), code, function (svg) {
                    if (svg && svg.indexOf('<svg') !== -1) { success(svg); }
                    else { fail(); }
                });
                if (!done) {
                    if (typeof out === 'string' && out.indexOf('<svg') !== -1) { success(out); }
                    else if (out && typeof out.then === 'function') {
                        out.then(function (r) {
                            var svg = r && (r.svg || r);
                            if (typeof svg === 'string' && svg.indexOf('<svg') !== -1) { success(svg); }
                            else { fail(); }
                        }, fail);
                    }
                    // 同步无返回且回调尚未触发时，留给回调/下一轮处理，不立即降级
                }
            } catch (e) {
                fail();
            }
        });
    }

    /* ---------- TOC / scrollspy ---------- */

    function buildTOC() {
        if (!state.result || !tocNav) return;
        var html = ['<ul>'];
        state.result.headings.forEach(function (h) {
            if (h.level === 1 || h.level > 3) return;
            html.push('<li><a class="toc-link toc-' + h.level + (h.id === state.activeId ? ' active' : '') +
                '" href="#' + h.id + '" data-target="' + h.id + '">' + esc(h.text) + '</a></li>');
        });
        html.push('</ul>');
        tocNav.innerHTML = html.join('');
    }

    function syncActiveTOC() {
        if (!tocNav) return;
        var links = tocNav.querySelectorAll('.toc-link');
        links.forEach(function (a) {
            var on = a.getAttribute('data-target') === state.activeId;
            a.classList.toggle('active', on);
            if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
    }

    function computeActiveHeading() {
        var heads = articleEl.querySelectorAll('h2[id], h3[id]');
        var current = null;
        for (var i = 0; i < heads.length; i++) {
            if (heads[i].getBoundingClientRect().top <= 130) current = heads[i].id;
            else break;
        }
        state.activeId = current;
        syncActiveTOC();
    }

    /* ---------- 复制按钮 ---------- */

    function copyText(text, done) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { done(true); }, function () { legacyCopy(text, done); });
        } else {
            legacyCopy(text, done);
        }
    }

    function legacyCopy(text, done) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
            document.body.appendChild(ta);
            ta.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            done(!!ok);
        } catch (e) { done(false); }
    }

    function wireCopyButtons() {
        articleEl.querySelectorAll('.code-block').forEach(function (block) {
            var btn = block.querySelector('.code-copy');
            var label = btn.querySelector('.code-copy-label');
            if (label) label.textContent = t('topic.copy');
            btn.setAttribute('aria-label', t('topic.copyAria'));
            btn.addEventListener('click', function () {
                var code = block.querySelector('pre code');
                copyText(code ? code.textContent : '', function (ok) {
                    label.textContent = ok ? '✓ ' + t('topic.copied') : t('topic.copyFail');
                    btn.classList.add(ok ? 'copied' : 'failed');
                    setTimeout(function () {
                        label.textContent = t('topic.copy');
                        btn.classList.remove('copied', 'failed');
                    }, 1800);
                });
            });
        });
    }

    /* ---------- 阅读进度条 ---------- */

    function updateProgress() {
        if (!progressBar || !progressWrap) return;
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var pct = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
        progressBar.style.width = pct.toFixed(1) + '%';
        progressWrap.setAttribute('aria-valuenow', Math.round(pct));
    }

    /* ---------- 内容加载与渲染 ---------- */

    function fetchText(url) {
        return fetch(url, { credentials: 'same-origin' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        });
    }

    function loadContent(lang) {
        state.rendering = true;
        return fetchText(CONTENT[lang]).then(function (md) {
            state.lang = lang;
            state.result = window.FishRainMarkdown.render(md, { skipFirstH1: true, highlight: !!PAGE.highlight });
            articleEl.innerHTML = state.result.html;
            buildTOC();
            wireCopyButtons();
            renderMermaidSlots();
            state.loaded = true;
            if (location.hash) {
                var hashId = decodeURIComponent(location.hash.slice(1));
                var hEl = document.getElementById(hashId);
                if (hEl) window.scrollTo({ top: hEl.getBoundingClientRect().top + window.scrollY - 96 });
            }
            computeActiveHeading();
            updateProgress();
        }).catch(function (err) {
            articleEl.innerHTML = '<div class="hdfs-loadfail"><p>⚠️ ' + esc(t('topic.loadFail')) + '</p><p class="hdfs-err">' + esc(err.message) + '</p></div>';
        }).then(function () { state.rendering = false; });
    }

    /* ---------- 事件 ---------- */

    function toggleToc(open) {
        tocAside.classList.toggle('open', open);
        tocToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function bindEvents() {
        // 语言切换：配置中有对应内容则重渲染（保持章节），否则仅界面语言随全站切换
        window.addEventListener('fishrain:langchange', function (e) {
            if (state.rendering) return;
            var lang = e.detail && e.detail.lang ? e.detail.lang : null;
            if (!lang || !CONTENT[lang] || lang === state.lang) return;
            var prevId = state.activeId;
            loadContent(lang).then(function () {
                if (prevId && document.getElementById(prevId)) {
                    var el = document.getElementById(prevId);
                    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'auto' });
                    state.activeId = prevId;
                    syncActiveTOC();
                }
            });
        });

        // 主题切换：Mermaid 按新主题变量重绘
        window.addEventListener('fishrain:themechange', function () {
            if (state.loaded) renderMermaidSlots();
        });

        // TOC 点击：平滑滚动 + 移动端收起
        tocNav.addEventListener('click', function (e) {
            var a = e.target.closest('.toc-link');
            if (!a) return;
            e.preventDefault();
            var el = document.getElementById(a.getAttribute('data-target'));
            if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
            if (tocAside.classList.contains('open')) toggleToc(false);
        });

        tocToggle.addEventListener('click', function () {
            toggleToc(!tocAside.classList.contains('open'));
        });

        // 滚动：scrollspy + 进度条 + 返回顶部
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                computeActiveHeading();
                updateProgress();
                if (backTop) backTop.hidden = window.scrollY < 600;
                ticking = false;
            });
        }, { passive: true });

        if (backTop) backTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Esc 关闭移动端目录
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && tocAside.classList.contains('open')) toggleToc(false);
        });
    }

    /* ---------- 启动 ---------- */

    function init() {
        if (!DEFAULT_LANG || !CONTENT[DEFAULT_LANG]) {
            // 页面缺少 TOPIC_PAGE 配置（如配置脚本未加载）：明确报错而非请求 undefined
            articleEl.innerHTML = '<div class="hdfs-loadfail"><p>⚠️ ' + esc(t('topic.loadFail')) + '</p><p class="hdfs-err">TOPIC_PAGE config missing</p></div>';
            return;
        }
        var start = DEFAULT_LANG;
        if (window.FishRainI18n && CONTENT[FishRainI18n.get()]) start = FishRainI18n.get();
        loadContent(start);
        bindEvents();
        updateProgress();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
