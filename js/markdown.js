/**
 * FishRain 轻量 Markdown 渲染器（无依赖，内容与页面分离方案的基础）
 *
 * 安全策略：escape-first —— 所有原始文本先做 HTML 转义，再应用受控的
 * Markdown 转换；链接仅放行 http(s)/mailto/相对路径/锚点；<details> 通过
 * 受控白名单重建，其余裸 HTML 一律以转义文本呈现。因此不引入任何
 * 第三方 sanitizer 也不会产生注入面。
 *
 * 支持：标题（编号自动生成 sec-N / sec-N-M 锚点）、段落、粗体/斜体/行内代码、
 * 链接（外链自动新窗口+noopener）、图片、引用、水平线、有序/无序列表（可嵌套）、
 * 表格（含对齐、行内代码内的管道符保护）、围栏代码块（语言标签+复制按钮骨架）、
 * mermaid 代码块（占位符提取，由页面脚本渲染）、\[\...\] 公式块（LaTeX 子集美化）、
 * <details><summary> 白名单、可选代码语法高亮（tok-* span，按页启用）。
 *
 * API：FishRainMarkdown.render(md, opts) → { html, headings, mermaid }
 *   opts.skipFirstH1   丢弃首个 h1（页面 Hero 已展示标题时使用）
 *   opts.mermaidLang    mermaid 块语言名，默认 'mermaid'
 *   opts.highlight      启用代码语法高亮（默认关闭，未启用时输出与旧版一致）
 */
window.FishRainMarkdown = (function () {
    'use strict';

    /* ---------- 基础工具 ---------- */

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeUrl(url) {
        var u = String(url).trim();
        if (/^(https?:|mailto:)/i.test(u)) return { url: u, external: true };
        if (/^#/.test(u)) return { url: u, external: false };
        // 相对路径：不含协议冒号（javascript: 等一律拒绝）
        if (!/^[a-z][a-z0-9+.-]*:/i.test(u) && u.indexOf('//') !== 0) return { url: u, external: false };
        return null;
    }

    /* ---------- 行内转换（输入必须是已转义文本） ---------- */

    // 1) 先摘出行内代码（保护管道符与内部标记），2) 处理其余语法，3) 回填
    function inline(text) {
        var codes = [];
        var src = text.replace(/`([^`]+)`/g, function (m, c) {
            codes.push(c);
            return '\u0000C' + (codes.length - 1) + '\u0000';
        });

        // 图片 ![alt](url) —— 内容源中未使用，仍安全支持
        src = src.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (m, alt, url) {
            var s = safeUrl(url);
            return s ? '<img src="' + s.url + '" alt="' + alt + '" loading="lazy">' : alt;
        });

        // 链接 [text](url)
        src = src.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (m, txt, url) {
            var s = safeUrl(url);
            if (!s) return txt;
            var ext = s.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return '<a href="' + s.url + '"' + ext + '>' + txt + '</a>';
        });

        // 粗体 / 斜体
        src = src.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        src = src.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');

        // 回填行内代码
        return src.replace(/\u0000C(\d+)\u0000/g, function (m, i) {
            return '<code>' + codes[+i] + '</code>';
        });
    }

    /* ---------- LaTeX 子集美化（仅覆盖内容源中出现的指令） ---------- */

    function texToText(s) {
        var out = s;
        for (var i = 0; i < 4; i++) {
            var next = out
                .replace(/\\left|\\right/g, '')
                .replace(/\\lfloor/g, '\u230A').replace(/\\rfloor/g, '\u230B')
                .replace(/\\times/g, '\u00D7')
                .replace(/\\(?:mathrm|text|mathbf)\{([^{}]*)\}/g, '$1')
                .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1) / ($2)')
                .replace(/\\[,;!]|\\\s/g, ' ');
            if (next === out) break;
            out = next;
        }
        return out.replace(/\s+/g, ' ').replace(/\(\s*/g, '(').replace(/\s*\)/g, ')').trim();
    }

    /* ---------- 标题编号 → 锚点 id ---------- */

    function headingId(text) {
        var m = text.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?[\.\s]/);
        if (m) {
            var parts = [m[1]];
            if (m[2]) parts.push(m[2]);
            if (m[3]) parts.push(m[3]);
            return 'sec-' + parts.join('-');
        }
        // 无编号标题：转 slug
        return 'h-' + text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    }

    /* ---------- 表格 ---------- */

    function tableAlign(sep) {
        return sep.map(function (cell) {
            if (/^:-+:$/.test(cell.trim())) return 'center';
            if (/^-+:$/.test(cell.trim())) return 'right';
            return 'left';
        });
    }

    function renderTable(lines) {
        // 先摘出行内代码（保护单元格内的 | ），切分后再放回交给 inline 处理
        function cells(line) {
            var codes = [];
            var s = line.replace(/`([^`]+)`/g, function (m, c) {
                codes.push(c);
                return '\u0000K' + (codes.length - 1) + '\u0000';
            });
            return s.replace(/^\||\|$/g, '').split('|').map(function (p) {
                return p.replace(/\u0000K(\d+)\u0000/g, function (m, i) { return '`' + codes[+i] + '`'; });
            });
        }
        var header = cells(lines[0]);
        var align = tableAlign(cells(lines[1]));
        var html = '<div class="md-table-wrap"><table><thead><tr>';
        header.forEach(function (c, i) {
            html += '<th style="text-align:' + (align[i] || 'left') + '">' + inline(c.trim()) + '</th>';
        });
        html += '</tr></thead><tbody>';
        for (var i = 2; i < lines.length; i++) {
            html += '<tr>';
            cells(lines[i]).forEach(function (c, j) {
                html += '<td style="text-align:' + (align[j] || 'left') + '">' + inline(c.trim()) + '</td>';
            });
            html += '</tr>';
        }
        return html + '</tbody></table></div>';
    }

    /* ---------- 列表 ---------- */

    function renderList(lines) {
        // lines: [{indent, marker('ul'|'ol'), text}]
        var html = '';
        var stack = []; // {type, indent}
        function closeTo(indent) {
            while (stack.length && indent < stack[stack.length - 1].indent) {
                html += stack.pop().type === 'ol' ? '</li></ol>' : '</li></ul>';
                if (stack.length && indent >= stack[stack.length - 1].indent) html += '</li>';
            }
        }
        lines.forEach(function (item) {
            var last = stack[stack.length - 1];
            if (!last || item.indent > last.indent) {
                closeTo(item.indent);
                html += item.marker === 'ol' ? '<ol>' : '<ul>';
                stack.push({ type: item.marker, indent: item.indent });
            } else if (item.indent < last.indent) {
                closeTo(item.indent);
                html += item.marker === 'ol' ? '<ol>' : '<ul>';
                stack.push({ type: item.marker, indent: item.indent });
            } else if (item.marker !== last.type) {
                html += last.type === 'ol' ? '</li></ol>' : '</li></ul>';
                stack.pop();
                html += item.marker === 'ol' ? '<ol>' : '<ul>';
                stack.push({ type: item.marker, indent: item.indent });
            } else {
                html += '</li>';
            }
            html += '<li>' + inline(item.text);
        });
        while (stack.length) html += stack.pop().type === 'ol' ? '</li></ol>' : '</li></ul>';
        return html;
    }

    /* ---------- 可选代码语法高亮（escape-first：先分词、逐段转义，不引入注入面） ---------- */

    var HL_RULES = {
        java: {
            kw: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null var',
            line: '//', block: true, ann: true
        },
        python: {
            kw: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None',
            line: '#'
        },
        sql: {
            kw: 'SELECT FROM WHERE GROUP BY ORDER HAVING JOIN INNER LEFT RIGHT FULL OUTER CROSS ON AS AND OR NOT NULL IS IN LIKE BETWEEN EXISTS SUM COUNT AVG MIN MAX DISTINCT UNION ALL INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DROP ALTER VIEW WITH CASE WHEN THEN END DESC ASC LIMIT PARTITION OVER CAST COALESCE',
            line: '--', block: true, ci: true
        },
        bash: {
            kw: 'if then else elif fi for while do done case esac function return export local echo cd',
            line: '#', cmd: true
        }
    };
    var HL_ALIAS = { sh: 'bash', shell: 'bash', zsh: 'bash', py: 'python' };

    function hlEscRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    // 注释/字符串切分正则（先于关键字匹配，保证字符串内的 // -- # 不被误判为注释）
    function hlSplitRegex(rule) {
        var parts = [];
        if (rule.block) parts.push('/\\*[\\s\\S]*?\\*/');
        if (rule.line) parts.push(hlEscRe(rule.line) + '[^\\n]*');
        if (rule.str !== false) {
            parts.push('"(?:\\\\.|[^"\\\\\\n])*"');
            parts.push("'(?:\\\\.|[^'\\\\\\n])*'");
        }
        return new RegExp(parts.join('|'), 'g');
    }

    // 纯文本段内高亮：注解 / 关键字 / 数字 / 函数名
    function hlTokens(seg, rule) {
        if (!seg) return '';
        var kwSrc = rule.kw.split(/\s+/).map(hlEscRe).join('|');
        var parts = [];
        if (rule.ann) parts.push('@[A-Za-z_][A-Za-z0-9_]*');
        parts.push('\\b(?:' + kwSrc + ')\\b');
        parts.push('\\b(?:0[xX][0-9a-fA-F]+|\\d+(?:\\.\\d+)?)\\b');
        parts.push('\\b[A-Za-z_][A-Za-z0-9_]*(?=\\s*\\()');
        var re = new RegExp(parts.join('|'), rule.ci ? 'gi' : 'g');
        var out = '', last = 0, m;
        while ((m = re.exec(seg))) {
            out += escapeHtml(seg.slice(last, m.index));
            out += '<span class="' + hlClass(m[0], rule) + '">' + escapeHtml(m[0]) + '</span>';
            last = m.index + m[0].length;
            if (m[0].length === 0) re.lastIndex++;
        }
        return out + escapeHtml(seg.slice(last));
    }

    function hlClass(tok, rule) {
        if (tok.charAt(0) === '@') return 'tok-ann';
        if (/^\d/.test(tok)) return 'tok-num';
        if (!rule.kwMap) {
            rule.kwMap = {};
            rule.kw.split(/\s+/).forEach(function (w) { rule.kwMap[rule.ci ? w.toUpperCase() : w] = 1; });
        }
        return rule.kwMap[rule.ci ? tok.toUpperCase() : tok] ? 'tok-kw' : 'tok-fn';
    }

    // bash：每行首个单词（命令位）着色
    function hlBash(seg, rule) {
        return seg.split('\n').map(function (ln) {
            var mm = ln.match(/^(\s*)([A-Za-z_][A-Za-z0-9_.-]*)([\s\S]*)$/);
            if (!mm) return escapeHtml(ln);
            return escapeHtml(mm[1]) +
                '<span class="tok-fn">' + escapeHtml(mm[2]) + '</span>' +
                hlTokens(mm[3], rule);
        }).join('\n');
    }

    function highlight(code, lang) {
        var key = String(lang || '').toLowerCase();
        key = HL_ALIAS[key] || key;
        var rule = HL_RULES[key];
        if (!rule) return escapeHtml(code);
        var out = '', last = 0, m;
        var re = hlSplitRegex(rule);
        while ((m = re.exec(code))) {
            out += rule.cmd ? hlBash(code.slice(last, m.index), rule) : hlTokens(code.slice(last, m.index), rule);
            var isCom = (rule.block && m[0].charAt(0) === '/' && m[0].charAt(1) === '*') ||
                        (rule.line && m[0].indexOf(rule.line) === 0);
            out += '<span class="' + (isCom ? 'tok-com' : 'tok-str') + '">' + escapeHtml(m[0]) + '</span>';
            last = m.index + m[0].length;
            if (m[0].length === 0) re.lastIndex++;
        }
        out += rule.cmd ? hlBash(code.slice(last), rule) : hlTokens(code.slice(last), rule);
        return out;
    }

    /* ---------- 主渲染 ---------- */

    function render(mdText, opts) {
        opts = opts || {};
        var mermaidLang = opts.mermaidLang || 'mermaid';

        // 行内容先统一转义；mermaid/代码块原文单独保留（渲染时仍走转义输出）
        var raw = String(mdText || '').replace(/\r\n?/g, '\n');
        if (opts.skipFirstH1) raw = raw.replace(/^# .*(?:\n|$)/, '');
        var lines = raw.split('\n');

        var html = [];
        var headings = [];
        var mermaid = [];
        var i = 0;

        function pushPara(buf) {
            if (!buf.length) return;
            var joined = buf.map(function (l) { return escapeHtml(l); }).join(' ');
            html.push('<p>' + inline(joined) + '</p>');
        }

        while (i < lines.length) {
            var line = lines[i];
            var t = line.trim();

            // 空行
            if (t === '') { i++; continue; }

            // 围栏代码块
            var fence = t.match(/^```([\w-]*)\s*$/);
            if (fence) {
                var lang = fence[1] || '';
                var body = [];
                i++;
                while (i < lines.length && lines[i].trim() !== '```') { body.push(lines[i]); i++; }
                i++; // 跳过收尾 ```
                var code = body.join('\n');
                if (lang.toLowerCase() === mermaidLang) {
                    var idx = mermaid.length;
                    mermaid.push(code);
                    html.push('<div class="mmd-slot" data-mmd="' + idx + '" role="img" aria-label="diagram"></div>');
                } else {
                    var codeHtml = opts.highlight ? highlight(code, lang) : escapeHtml(code);
                    html.push(
                        '<div class="code-block"><div class="code-head"><span class="code-lang">' +
                        escapeHtml(lang || 'text') + '</span>' +
                        '<button type="button" class="code-copy" data-copy="' + idx + '" aria-label="copy code">' +
                        '<span class="code-copy-label"></span></button></div>' +
                        '<pre><code>' + codeHtml + '</code></pre></div>'
                    );
                }
                continue;
            }

            // 公式块 \[ ... \]
            if (t === '\\[') {
                var math = [];
                i++;
                while (i < lines.length && lines[i].trim() !== '\\]') { math.push(lines[i]); i++; }
                i++;
                html.push('<div class="math-block" role="math">' + escapeHtml(texToText(math.join(' '))) + '</div>');
                continue;
            }

            // 标题
            var h = t.match(/^(#{1,6})\s+(.*)$/);
            if (h) {
                var level = h[1].length;
                var text = escapeHtml(h[2].trim());
                var id = headingId(h[2].trim());
                headings.push({ level: level, id: id, text: h[2].trim() });
                html.push('<h' + level + ' id="' + id + '">' + inline(text) + '</h' + level + '>');
                i++;
                continue;
            }

            // 水平线
            if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(t)) { html.push('<hr>'); i++; continue; }

            // <details> 白名单（仅重建标签，不透传任何属性）
            if (/^<details>\s*<summary>([\s\S]*?)<\/summary>\s*$/.test(t)) {
                var sum = t.replace(/^<details>\s*<summary>([\s\S]*?)<\/summary>\s*$/, '$1');
                html.push('<details class="md-details"><summary>' + inline(escapeHtml(sum)) + '</summary>');
                i++;
                var dbuf = [];
                while (i < lines.length && lines[i].trim() !== '</details>') { dbuf.push(lines[i]); i++; }
                i++;
                html.push(render(dbuf.join('\n') + '\n', { mermaidLang: mermaidLang, highlight: opts.highlight }).html);
                html.push('</details>');
                continue;
            }
            if (/^<\/?(?!\/?details\b)[a-z!]/i.test(t)) {
                // 其余裸 HTML 行：按段落转义呈现
                var hbuf = [line];
                i++;
                while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|```|>|-{3,}|\||\d+\.|\- )/.test(lines[i].trim())) { hbuf.push(lines[i]); i++; }
                pushPara(hbuf);
                continue;
            }

            // 表格（连续 | 开头行，且第二行为分隔行）
            if (t.charAt(0) === '|' && i + 1 < lines.length &&
                /^\|?[\s:-]*-[\s:|-]*\|?$/.test(lines[i + 1].trim()) &&
                lines[i + 1].trim().charAt(0) === '|') {
                var rows = [];
                while (i < lines.length && lines[i].trim().charAt(0) === '|') { rows.push(lines[i].trim()); i++; }
                html.push(renderTable(rows.map(function (r) { return r.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); })));
                continue;
            }

            // 引用块
            if (t.charAt(0) === '>') {
                var qbuf = [];
                while (i < lines.length && lines[i].trim().charAt(0) === '>') { qbuf.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
                // 以空引用行分段
                var paras = [[]];
                qbuf.forEach(function (ql) {
                    if (ql === '') paras.push([]);
                    else paras[paras.length - 1].push(ql);
                });
                html.push('<blockquote>' + paras.map(function (p) {
                    return p.length ? '<p>' + inline(p.map(escapeHtml).join(' ')) + '</p>' : '';
                }).join('') + '</blockquote>');
                continue;
            }

            // 列表
            var li = t.match(/^([-*+])\s+(.*)$/);
            var oi = t.match(/^(\d+)[.)]\s+(.*)$/);
            if (li || oi) {
                var items = [];
                while (i < lines.length) {
                    var raw2 = lines[i];
                    var t2 = raw2.trim();
                    var li2 = t2.match(/^([-*+])\s+(.*)$/);
                    var oi2 = t2.match(/^(\d+)[.)]\s+(.*)$/);
                    if (!li2 && !oi2) break;
                    var indent = raw2.match(/^\s*/)[0].length;
                    items.push({ indent: indent, marker: li2 ? 'ul' : 'ol', text: li2 ? li2[2] : oi2[2] });
                    i++;
                }
                html.push(renderList(items.map(function (it) {
                    return { indent: it.indent, marker: it.marker, text: escapeHtml(it.text) };
                })));
                continue;
            }

            // 普通段落（聚合到空行为止）
            var pbuf = [line];
            i++;
            while (i < lines.length && lines[i].trim() !== '' &&
                   !/^(#{1,6}\s|```|\\\[|>|---|\||[-*+]\s|\d+[.)]\s|<\/details>)/.test(lines[i].trim())) {
                pbuf.push(lines[i]); i++;
            }
            pushPara(pbuf);
        }

        return { html: html.join('\n'), headings: headings, mermaid: mermaid };
    }

    return { render: render, escapeHtml: escapeHtml, texToText: texToText, highlight: highlight };
})();
