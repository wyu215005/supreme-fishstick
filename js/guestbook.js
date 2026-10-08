/**
 * 留言板模块
 * 云端模式：留言存入 Supabase 数据库，全站访客共享
 * 本地模式：数据库不可达时降级为 localStorage（仅当前浏览器可见）
 */

class Guestbook {
    constructor() {
        this.storageKey = 'guestbook_messages';
        this.MAX_MESSAGES = 50;          // 最多加载/保存 50 条
        this.MAX_NAME_LEN = 20;          // 名字最长 20 字
        this.MAX_CONTENT_LEN = 300;      // 留言最长 300 字
        this.RATE_LIMIT_MS = 60 * 1000;  // 每分钟最多 1 条
        this.AVATAR_EMOJIS = ['🐟', '🐠', '🐡', '🐙', '🦐', '🦑', '🦞', '🐳', '🦈'];

        const cfg = SITE_CONFIG.supabase;
        this.tableUrl = cfg.url + '/rest/v1/' + cfg.guestbookTable;
        this.apiKey = cfg.anonKey;

        this.online = false;
        this.submitting = false;
        this.messages = [];
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.renderStatus('loading');
        this.setupForm();
        this.setupCharCounters();
        this.loadMessages();
    }

    /* ---------- 云端读写 ---------- */

    /**
     * 统一的 REST API 请求头
     */
    apiHeaders(extra) {
        const headers = {
            apikey: this.apiKey,
            Authorization: 'Bearer ' + this.apiKey
        };
        return Object.assign(headers, extra || {});
    }

    /**
     * 加载留言：优先云端，失败时降级本地缓存
     */
    async loadMessages() {
        try {
            const res = await fetch(
                this.tableUrl +
                    '?select=id,name,content,created_at' +
                    '&order=created_at.desc&limit=' + this.MAX_MESSAGES,
                { headers: this.apiHeaders() }
            );
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const rows = await res.json();
            this.messages = rows.map(r => ({
                id: r.id,
                name: r.name,
                content: r.content,
                date: this.formatDate(r.created_at)
            }));
            this.online = true;
            this.renderStatus('online');
        } catch (e) {
            console.warn('云端数据库不可达，降级为本地模式:', e);
            this.online = false;
            this.messages = this.loadLocal();
            this.renderStatus('offline');
        }
        this.renderMessages();
    }

    /**
     * 写入云端数据库，返回带服务端时间戳的留言对象
     */
    async submitToCloud(name, content) {
        const res = await fetch(this.tableUrl, {
            method: 'POST',
            headers: this.apiHeaders({
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            }),
            body: JSON.stringify({ name: name, content: content })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const rows = await res.json();
        const row = rows[0];
        return {
            id: row.id,
            name: row.name,
            content: row.content,
            date: this.formatDate(row.created_at)
        };
    }

    /* ---------- 本地缓存（降级方案） ---------- */

    loadLocal() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error('加载本地留言失败:', e);
        }
        return [];
    }

    saveLocal(message) {
        const list = this.loadLocal();
        list.unshift(message);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(list.slice(0, this.MAX_MESSAGES)));
        } catch (e) {
            console.error('保存本地留言失败:', e);
        }
        return message;
    }

    /* ---------- 表单 ---------- */

    /**
     * 绑定表单事件
     */
    setupForm() {
        const form = document.getElementById('messageForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMessage();
        });
    }

    /**
     * 为输入框添加字数计数器
     */
    setupCharCounters() {
        this.addCounter('messageName', this.MAX_NAME_LEN);
        this.addCounter('messageContent', this.MAX_CONTENT_LEN);
    }

    addCounter(id, max) {
        const input = document.getElementById(id);
        if (!input) return;

        const counter = document.createElement('div');
        counter.style.cssText = 'text-align:right; font-size:0.8rem; color:var(--text-secondary); margin-top:4px;';
        counter.textContent = `0 / ${max}`;
        input.parentNode.appendChild(counter);

        input.addEventListener('input', () => {
            const len = input.value.length;
            counter.textContent = `${len} / ${max}`;
            counter.style.color = len > max * 0.9 ? '#e74c3c' : 'var(--text-secondary)';
        });
    }

    /**
     * 频率限制检查
     */
    isRateLimited() {
        const lastTime = parseInt(sessionStorage.getItem('guestbook_last_submit') || '0', 10);
        return Date.now() - lastTime < this.RATE_LIMIT_MS;
    }

    /**
     * 添加留言
     */
    async addMessage() {
        if (this.submitting) return;
        const nameInput = document.getElementById('messageName');
        const contentInput = document.getElementById('messageContent');
        if (!nameInput || !contentInput) return;

        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        // 校验非空
        if (!name || !content) {
            UTILS.showToast('请填写名字和留言内容');
            return;
        }

        // 长度校验
        if (name.length > this.MAX_NAME_LEN) {
            UTILS.showToast(`名字不能超过 ${this.MAX_NAME_LEN} 字`);
            return;
        }
        if (content.length > this.MAX_CONTENT_LEN) {
            UTILS.showToast(`留言不能超过 ${this.MAX_CONTENT_LEN} 字`);
            return;
        }

        // 频率限制
        if (this.isRateLimited()) {
            UTILS.showToast('操作太频繁了，请一分钟后再试');
            return;
        }

        this.submitting = true;
        this.setSubmitState(true);

        let saved;
        try {
            if (this.online) {
                saved = await this.submitToCloud(name, content);
                UTILS.showToast('留言成功，便签已上墙 📌');
            } else {
                saved = this.saveLocal({
                    id: Date.now(),
                    name: name,
                    content: content,
                    date: new Date().toLocaleString('zh-CN')
                });
                UTILS.showToast('云端暂不可用，已保存在本浏览器');
            }
        } catch (e) {
            console.error('云端写入失败，转为本地保存:', e);
            saved = this.saveLocal({
                id: Date.now(),
                name: name,
                content: content,
                date: new Date().toLocaleString('zh-CN')
            });
            UTILS.showToast('云端保存失败，已转为本地保存');
        }

        this.messages.unshift(saved);

        // 超出上限时删除最旧的
        if (this.messages.length > this.MAX_MESSAGES) {
            this.messages = this.messages.slice(0, this.MAX_MESSAGES);
        }
        this.renderMessages();

        // 记录提交时间（用于频率限制）
        sessionStorage.setItem('guestbook_last_submit', String(Date.now()));

        // 清空表单
        nameInput.value = '';
        contentInput.value = '';
        this.resetCounters();

        this.submitting = false;
        this.setSubmitState(false);
    }

    /**
     * 提交按钮状态（防止重复提交）
     */
    setSubmitState(disabled) {
        const btn = document.querySelector('#messageForm button[type="submit"]');
        if (!btn) return;
        btn.disabled = disabled;
        btn.textContent = disabled ? '正在提交…' : '贴上便签';
    }

    /**
     * 重置字数计数器显示
     */
    resetCounters() {
        document.querySelectorAll('#messageForm div[style]').forEach(el => {
            if (el.textContent.includes('/')) {
                const max = el.textContent.split('/')[1].trim();
                el.textContent = `0 / ${max}`;
                el.style.color = 'var(--text-secondary)';
            }
        });
    }

    /* ---------- 渲染 ---------- */

    /**
     * 数据库连接状态徽标
     */
    renderStatus(state) {
        const el = document.getElementById('dbStatus');
        if (!el) return;
        const map = {
            loading: '📡 正在连接云端…',
            online: '📡 云端同步已开启 · 留言全站可见',
            offline: '📴 云端暂不可用 · 便签先保存在本浏览器'
        };
        el.textContent = map[state] || '';
        el.dataset.state = state;
    }

    /**
     * 渲染留言便签墙
     */
    renderMessages() {
        const container = document.getElementById('messageList');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">还没有留言，来贴第一张便签吧</p>';
            return;
        }

        container.innerHTML = this.messages.map((message, index) => {
            const hash = this.hashOf(String(message.id || message.name || ''));
            const color = `note-color-${hash % 5 + 1}`;
            const rotate = ((hash >>> 3) % 11 - 5) * 0.6;
            const tape = ((hash >>> 6) & 1) ? 'tape-right' : 'tape-left';
            return `
            <div class="message-item note ${color} slide-in" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s; --note-rotate: ${rotate}deg">
                <div class="note-tape ${tape}"></div>
                <div class="message-header">
                    <div class="message-author">${this.avatarOf(message)} ${this.escapeHtml(message.name)}</div>
                    <div class="message-date">${this.escapeHtml(message.date)}</div>
                </div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            </div>`;
        }).join('');
    }

    /**
     * 字符串转固定哈希（同一条留言刷新后颜色/角度不变）
     * 末尾做雪崩混合，保证连续小 id 的低位也有足够差异
     */
    hashOf(seed) {
        let hash = 5381;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash * 33) ^ seed.charCodeAt(i)) >>> 0;
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 2246822507) >>> 0;
        hash ^= hash >>> 13;
        return hash >>> 0;
    }

    /**
     * 根据留言生成固定的海洋生物头像（同一条留言头像不变）
     */
    avatarOf(message) {
        const hash = this.hashOf(String(message.id || message.name || ''));
        return this.AVATAR_EMOJIS[hash % this.AVATAR_EMOJIS.length];
    }

    /**
     * 数据库时间戳转本地显示格式
     */
    formatDate(iso) {
        const d = new Date(iso);
        return isNaN(d.getTime()) ? String(iso) : d.toLocaleString('zh-CN');
    }

    /**
     * 转义 HTML 防止 XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    new Guestbook();
});
