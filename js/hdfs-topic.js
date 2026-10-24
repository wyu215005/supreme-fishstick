/**
 * HDFS 专题页控制器
 *
 * 职责：
 *  - 按当前语言 fetch 对应 Markdown（内容与页面分离，更新 md 即更新专题）
 *  - FishRainMarkdown 渲染 + 构建 TOC + scrollspy 高亮
 *  - Mermaid 按当前主题的 CSS 变量着色渲染；切主题自动重绘；失败降级为源码
 *  - 语言切换时重渲染内容并尽量保持原章节（两语言统一 sec-N 锚点）
 *  - 代码块复制按钮；外链已由渲染器统一加 noopener
 *  - 三个纯前端教学组件：QJM 多数派计算器 / 故障切换步骤模拟 / 小文件估算器
 *
 * 依赖：js/config.js 无关；js/i18n/*（FishRainI18n）、js/markdown.js、js/vendor/mermaid.min.js
 */

(function () {
    'use strict';

    /* ---------- 可配置项 ---------- */

    var CONTENT_BASE = 'content/';
    var CONTENT = {
        'zh-CN': CONTENT_BASE + 'hdfs-reliability.zh-CN.md',
        'en': CONTENT_BASE + 'hdfs-reliability.en.md',
        'fr': CONTENT_BASE + 'hdfs-reliability.en.md' // 法语暂时回落英文内容
    };
    // 待配置：HDFS 专题对应的公开 GitHub 仓库地址。为空则隐藏入口按钮，不虚构链接。
    var SOURCE_REPO = '';

    /* 故障切换步骤（教学内容随页面脚本维护，i18n 字典仅支持字符串键） */
    var FAILOVER_STEPS = {
        'zh-CN': [
            { title: '健康监测', desc: 'ZKFC 周期性检查本地 NameNode 的健康状态，并维持 ZooKeeper 会话。' },
            { title: '健康异常 / 会话失效', desc: 'Active 与 ZooKeeper 的会话过期，或本地健康检查失败，Active 资格被动摇。' },
            { title: '选主竞争', desc: '另一台 ZKFC 竞争 ZooKeeper 锁并赢得选举，获得 Active 资格。' },
            { title: 'Fencing 隔离', desc: '对旧 Active 执行必要隔离（如 sshfence，需正确配置），防止双主写入。' },
            { title: '追赶 EditLog', desc: '新 Active 提升前先重放必要的已提交 EditLog，补齐命名空间状态。' },
            { title: '提升为 Active', desc: 'Standby 切换为 Active，开始对外提供元数据服务。' },
            { title: '客户端重连', desc: 'HA 客户端经 failover proxy 自动重试并连接到新的 Active。' }
        ],
        'en': [
            { title: 'Health monitoring', desc: 'ZKFC periodically checks local NameNode health and maintains its ZooKeeper session.' },
            { title: 'Health failure / session loss', desc: 'The Active loses its ZooKeeper session or fails a health check, putting its eligibility in question.' },
            { title: 'Election', desc: "The other ZKFC competes for the ZooKeeper lock and wins Active eligibility." },
            { title: 'Fencing', desc: 'The old Active is fenced as configured (e.g. sshfence) to prevent dual writers.' },
            { title: 'EditLog catch-up', desc: 'Before promotion, the new Active replays necessary committed EditLog to complete its namespace state.' },
            { title: 'Promotion', desc: 'The Standby transitions to Active and begins serving metadata.' },
            { title: 'Client reconnection', desc: 'HA clients retry through the failover proxy and connect to the new Active.' }
        ],
        'fr': [
            { title: 'Surveillance de santé', desc: 'Le ZKFC vérifie périodiquement la santé du NameNode local et maintient sa session ZooKeeper.' },
            { title: 'Échec de santé / perte de session', desc: "L'Active perd sa session ZooKeeper ou échoue à un contrôle de santé ; son éligibilité est remise en cause." },
            { title: 'Élection', desc: "L'autre ZKFC concourt pour le verrou ZooKeeper et gagne l'éligibilité Active." },
            { title: 'Coupure (fencing)', desc: "L'ancien Active est isolé selon la configuration (ex. sshfence) pour éviter deux écrivains." },
            { title: 'Rattrapage EditLog', desc: "Avant la promotion, le nouvel Active rejoue les EditLog validés nécessaires pour compléter son état." },
            { title: 'Promotion', desc: "Le Standby devient Active et sert les métadonnées." },
            { title: 'Reconnexion des clients', desc: "Les clients HA réessaient via le proxy de basculement et se connectent au nouvel Active." }
        ]
    };

    /* ---------- 状态 ---------- */

    var state = {
        lang: null,          // 当前内容语言
        result: null,        // FishRainMarkdown.render 结果
        activeId: null,      // scrollspy 当前标题 id
        loaded: false,
        widgets: { qN: 3, qFail: 1, fStep: 0, vol: 20, count: 4000, target: 128 },
        rendering: false
    };

    var articleEl = document.getElementById('hdfsArticle');
    var tocNav = document.getElementById('tocNav');
    var tocToggle = document.getElementById('tocToggle');
    var tocAside = document.getElementById('hdfsToc');
    var backTop = document.getElementById('hdfsBackTop');

    function t(key, vars) { return window.FishRainI18n ? FishRainI18n.t(key, vars) : key; }
    function esc(s) { return window.FishRainMarkdown ? FishRainMarkdown.escapeHtml(s) : String(s); }
    function langKey() {
        var l = window.FishRainI18n ? FishRainI18n.get() : 'zh-CN';
        return CONTENT[l] ? l : 'zh-CN';
    }

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
            '<p class="mmd-fallback-note">' + esc(t('hdfs.mermaidFallback')) + '</p>' +
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
            slot.setAttribute('aria-label', t('hdfs.diagram'));
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
            if (label) label.textContent = t('hdfs.copy');
            btn.setAttribute('aria-label', t('hdfs.copyAria'));
            btn.addEventListener('click', function () {
                var code = block.querySelector('pre code');
                copyText(code ? code.textContent : '', function (ok) {
                    label.textContent = ok ? '✓ ' + t('hdfs.copied') : t('hdfs.copyFail');
                    btn.classList.add(ok ? 'copied' : 'failed');
                    setTimeout(function () {
                        label.textContent = t('hdfs.copy');
                        btn.classList.remove('copied', 'failed');
                    }, 1800);
                });
            });
        });
    }

    /* ---------- 教学组件 ---------- */

    function widgetShell(id, title, desc) {
        return '<div class="hdfs-widget" id="' + id + '">' +
            '<div class="hdfs-widget-head"><span class="hdfs-widget-badge">' + esc(t('hdfs.simBadge')) + '</span></div>' +
            '<h3 class="hdfs-widget-title">' + esc(title) + '</h3>' +
            '<p class="hdfs-widget-desc">' + esc(desc) + '</p>';
    }

    function buildQuorumWidget() {
        var w = state.widgets;
        var N = w.qN, fail = Math.min(w.qFail, N - 1);
        var Q = Math.floor(N / 2) + 1;
        var alive = N - fail;
        var ok = alive >= Q;
        var maxFail = N - Q;
        var html = widgetShell('widgetQ', t('hdfs.calQTitle'), t('hdfs.calQDesc'));
        html += '<div class="hw-row"><span class="hw-label">' + esc(t('hdfs.calQCluster')) + '</span><div class="hw-seg" role="group">';
        [3, 5, 7].forEach(function (n) {
            html += '<button type="button" class="hw-seg-btn' + (n === N ? ' active' : '') + '" data-qn="' + n + '" aria-pressed="' + (n === N) + '">' + n + '</button>';
        });
        html += '</div></div>';
        html += '<div class="hw-row"><span class="hw-label">' + esc(t('hdfs.calQFailures')) + '</span>' +
            '<span class="hw-counter"><button type="button" class="hw-step" data-qf="-1" aria-label="-1">−</button>' +
            '<output class="hw-count" id="qFailVal">' + fail + '</output>' +
            '<button type="button" class="hw-step" data-qf="1" aria-label="+1">＋</button></span></div>';
        html += '<div class="hw-out">' +
            '<div class="hw-out-item"><span class="hw-out-label">' + esc(t('hdfs.calQQuorum')) + '</span><strong>Q = ' + Q + '</strong></div>' +
            '<div class="hw-out-item"><span class="hw-out-label">' + esc(t('hdfs.calQAlive')) + '</span><strong>' + alive + ' / ' + N + '</strong></div>' +
            '<div class="hw-verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? esc(t('hdfs.calQOk')) : esc(t('hdfs.calQNo'))) + '</div>' +
            '</div>';
        html += '<p class="hw-note">' + esc(t('hdfs.calQHint', { n: maxFail })) + '</p>';
        return html + '</div>';
    }

    function buildFailoverWidget() {
        var steps = FAILOVER_STEPS[langKey()] || FAILOVER_STEPS['en'];
        var s = Math.min(state.widgets.fStep, steps.length - 1);
        var cur = steps[s];
        var html = widgetShell('widgetF', t('hdfs.calFTitle'), t('hdfs.calFDesc'));
        html += '<div class="hw-progress" role="progressbar" aria-valuemin="1" aria-valuemax="' + steps.length + '" aria-valuenow="' + (s + 1) + '">';
        steps.forEach(function (st, i) {
            html += '<span class="hw-dot' + (i < s ? ' done' : '') + (i === s ? ' now' : '') + '"></span>';
        });
        html += '</div>';
        html += '<p class="hw-step-indicator">' + esc(t('hdfs.calFStep', { n: s + 1, total: steps.length })) + '</p>';
        html += '<div class="hw-fail-step"><strong>' + esc(cur.title) + '</strong><p>' + esc(cur.desc) + '</p></div>';
        html += '<div class="hw-actions">' +
            '<button type="button" class="hw-btn" data-fstep="-1"' + (s === 0 ? ' disabled' : '') + '>' + esc(t('hdfs.calFPrev')) + '</button>' +
            '<button type="button" class="hw-btn primary" data-fstep="1"' + (s === steps.length - 1 ? ' disabled' : '') + '>' + esc(t('hdfs.calFNext')) + '</button>' +
            '<button type="button" class="hw-btn" data-freset="1">' + esc(t('hdfs.calFReset')) + '</button>' +
            '</div>';
        return html + '</div>';
    }

    function buildSmallFileWidget() {
        var w = state.widgets;
        var avg = w.count > 0 ? (w.vol * 1024) / w.count : 0;
        var est = w.target > 0 ? Math.ceil((w.vol * 1024) / w.target) : 0;
        var red = (w.count > 0 && est > 0) ? Math.max(0, (1 - est / w.count) * 100) : 0;
        var html = widgetShell('widgetS', t('hdfs.calSTitle'), t('hdfs.calSDesc'));
        html += '<div class="hw-grid">';
        [
            ['sv', t('hdfs.calSVolume'), w.vol, '20'],
            ['sc', t('hdfs.calSCount'), w.count, '4000'],
            ['st', t('hdfs.calSTarget'), w.target, '128']
        ].forEach(function (f) {
            html += '<label class="hw-field"><span>' + esc(f[1]) + '</span>' +
                '<input type="number" id="hw-' + f[0] + '" min="1" step="any" value="' + f[2] + '" placeholder="' + f[3] + '" inputmode="decimal"></label>';
        });
        html += '</div>';
        html += '<div class="hw-out">' +
            '<div class="hw-out-item"><span class="hw-out-label">' + esc(t('hdfs.calSAvg')) + '</span><strong>' + (w.count > 0 ? avg.toFixed(2) + ' MiB' : '—') + '</strong></div>' +
            '<div class="hw-out-item"><span class="hw-out-label">' + esc(t('hdfs.calSEst')) + '</span><strong>' + (w.target > 0 ? '≈ ' + est : '—') + '</strong></div>' +
            '<div class="hw-out-item"><span class="hw-out-label">' + esc(t('hdfs.calSReduction')) + '</span><strong>' + (w.count > 0 && est > 0 ? '−' + red.toFixed(1) + '%' : '—') + '</strong></div>' +
            '</div>';
        html += '<p class="hw-note">' + esc(t('hdfs.calSNote')) + '</p>';
        return html + '</div>';
    }

    /* 在指定 h2 小节末尾插入组件（找不到则追加到正文末尾） */
    function injectWidget(sectionId, html) {
        var start = articleEl.querySelector('#' + sectionId);
        if (!start) { articleEl.insertAdjacentHTML('beforeend', html); return; }
        var el = start.nextElementSibling;
        var end = null;
        while (el) {
            if (/^H2$/.test(el.tagName)) { end = el; break; }
            el = el.nextElementSibling;
        }
        if (end) end.insertAdjacentHTML('beforebegin', html);
        else articleEl.insertAdjacentHTML('beforeend', html);
    }

    function injectWidgets() {
        injectWidget('sec-4', buildQuorumWidget());
        injectWidget('sec-5', buildFailoverWidget());
        injectWidget('sec-7', buildSmallFileWidget());
        wireWidgetEvents();
    }

    function rerenderWidget(id, builder) {
        var old = document.getElementById(id);
        if (old) {
            var tmp = document.createElement('div');
            tmp.innerHTML = builder();
            old.replaceWith(tmp.firstChild);
            wireWidgetEvents();
        }
    }

    function wireWidgetEvents() {
        var q = document.getElementById('widgetQ');
        if (q) {
            q.querySelectorAll('[data-qn]').forEach(function (b) {
                b.addEventListener('click', function () {
                    state.widgets.qN = +b.getAttribute('data-qn');
                    state.widgets.qFail = Math.min(state.widgets.qFail, state.widgets.qN - 1);
                    rerenderWidget('widgetQ', buildQuorumWidget);
                });
            });
            q.querySelectorAll('[data-qf]').forEach(function (b) {
                b.addEventListener('click', function () {
                    state.widgets.qFail = Math.max(0, Math.min(state.widgets.qN - 1, state.widgets.qFail + +b.getAttribute('data-qf')));
                    rerenderWidget('widgetQ', buildQuorumWidget);
                });
            });
        }
        var f = document.getElementById('widgetF');
        if (f) {
            f.querySelectorAll('[data-fstep]').forEach(function (b) {
                b.addEventListener('click', function () {
                    var steps = (FAILOVER_STEPS[langKey()] || FAILOVER_STEPS['en']).length;
                    state.widgets.fStep = Math.max(0, Math.min(steps - 1, state.widgets.fStep + +b.getAttribute('data-fstep')));
                    rerenderWidget('widgetF', buildFailoverWidget);
                });
            });
            var r = f.querySelector('[data-freset]');
            if (r) r.addEventListener('click', function () {
                state.widgets.fStep = 0;
                rerenderWidget('widgetF', buildFailoverWidget);
            });
        }
        var s = document.getElementById('widgetS');
        if (s) {
            var inputs = { 'hw-sv': 'vol', 'hw-sc': 'count', 'hw-st': 'target' };
            Object.keys(inputs).forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.addEventListener('input', function () {
                    var v = parseFloat(el.value);
                    state.widgets[inputs[id]] = isNaN(v) || v < 0 ? 0 : v;
                    rerenderWidget('widgetS', buildSmallFileWidget);
                    var focusId = id;
                    var back = document.getElementById(focusId);
                    if (back) { back.focus(); try { back.setSelectionRange(back.value.length, back.value.length); } catch (e) {} }
                });
            });
        }
    }

    /* ---------- 内容加载与渲染 ---------- */

    function fetchText(url) {
        return fetch(url, { credentials: 'same-origin' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        });
    }

    function loadContent(lang, preserveAnchor) {
        state.rendering = true;
        var prevId = state.activeId;
        return fetchText(CONTENT[lang]).then(function (md) {
            state.lang = lang;
            state.result = window.FishRainMarkdown.render(md, { skipFirstH1: true });
            articleEl.innerHTML = state.result.html;
            buildTOC();
            injectWidgets();
            wireCopyButtons();
            renderMermaidSlots();
            state.loaded = true;
            // 语言切换后尽量停留在原章节：两语言共享 sec-N 锚点
            if (preserveAnchor) {
                var target = prevId && document.getElementById(prevId) ? prevId : null;
                if (target) {
                    var el = document.getElementById(target);
                    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'auto' });
                }
                // 找不到同锚点（如原位置在导语区）时维持原滚动比例
                else {
                    var h = document.documentElement.scrollHeight - window.innerHeight;
                    window.scrollTo({ top: Math.min(window.scrollY, Math.max(0, h)), behavior: 'auto' });
                }
                state.activeId = target || null;
                syncActiveTOC();
            } else if (location.hash) {
                var hashId = decodeURIComponent(location.hash.slice(1));
                var hEl = document.getElementById(hashId);
                if (hEl) window.scrollTo({ top: hEl.getBoundingClientRect().top + window.scrollY - 96 });
            }
            computeActiveHeading();
        }).catch(function (err) {
            articleEl.innerHTML = '<div class="hdfs-loadfail"><p>⚠️ ' + esc(t('hdfs.loadFail')) + '</p><p class="hdfs-err">' + esc(err.message) + '</p></div>';
        }).then(function () { state.rendering = false; });
    }

    /* ---------- 事件 ---------- */

    function bindEvents() {
        // 语言切换：重渲染内容并保持章节
        window.addEventListener('fishrain:langchange', function (e) {
            if (state.rendering) return;
            var lang = e.detail && e.detail.lang ? e.detail.lang : langKey();
            if (!CONTENT[lang]) return;
            if (lang === state.lang) return;
            loadContent(lang, true);
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

        // 滚动：scrollspy + 返回顶部
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                computeActiveHeading();
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

    function toggleToc(open) {
        tocAside.classList.toggle('open', open);
        tocToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    /* ---------- 启动 ---------- */

    function applySourceLink() {
        var a = document.getElementById('hdfsSourceLink');
        if (a && SOURCE_REPO) {
            a.href = SOURCE_REPO;
            a.hidden = false;
        }
    }

    function init() {
        // 深链语言：?lang=zh-CN|en|fr（与 hreflang 对应）
        try {
            var p = new URLSearchParams(location.search).get('lang');
            if (window.FishRainI18n && p && FishRainI18n.langs.indexOf(p) !== -1 && p !== FishRainI18n.get()) {
                FishRainI18n.set(p); // 触发 langchange；首次加载由下方 loadContent 兜底
            }
        } catch (e) { /* ignore */ }

        bindEvents();
        applySourceLink();
        loadContent(langKey(), false);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
