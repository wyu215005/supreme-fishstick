/**
 * 留言板模块
 * 管理用户留言和显示，含频率限制与长度校验
 */

class Guestbook {
    constructor() {
        this.storageKey = 'guestbook_messages';
        this.MAX_MESSAGES = 50;          // 最多保存 50 条
        this.MAX_NAME_LEN = 20;          // 名字最长 20 字
        this.MAX_CONTENT_LEN = 300;      // 留言最长 300 字
        this.RATE_LIMIT_MS = 60 * 1000;  // 每分钟最多 1 条
        this.messages = this.loadMessages();
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.renderMessages();
        this.setupForm();
        this.setupCharCounters();
    }

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
    addMessage() {
        const nameInput = document.getElementById('messageName');
        const contentInput = document.getElementById('messageContent');
        if (!nameInput || !contentInput) return;

        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        // 校验非空
        if (!name || !content) {
            UTILS.showToast('请填写完整信息！');
            return;
        }

        // 长度校验
        if (name.length > this.MAX_NAME_LEN) {
            UTILS.showToast(`名字不能超过 ${this.MAX_NAME_LEN} 个字符！`);
            return;
        }
        if (content.length > this.MAX_CONTENT_LEN) {
            UTILS.showToast(`留言不能超过 ${this.MAX_CONTENT_LEN} 个字符！`);
            return;
        }

        // 频率限制
        if (this.isRateLimited()) {
            UTILS.showToast('留言太频繁了，请稍等一分钟再试 😅');
            return;
        }

        const message = {
            id: Date.now(),
            name: name,
            content: content,
            date: new Date().toLocaleString('zh-CN')
        };

        this.messages.unshift(message);

        // 超出上限时删除最旧的
        if (this.messages.length > this.MAX_MESSAGES) {
            this.messages = this.messages.slice(0, this.MAX_MESSAGES);
        }

        this.saveMessages();
        this.renderMessages();

        // 记录提交时间（用于频率限制）
        sessionStorage.setItem('guestbook_last_submit', String(Date.now()));

        // 清空表单
        nameInput.value = '';
        contentInput.value = '';
        // 重置计数器
        document.querySelectorAll('#messageForm div[style]').forEach(el => {
            if (el.textContent.includes('/')) {
                const max = el.textContent.split('/')[1].trim();
                el.textContent = `0 / ${max}`;
                el.style.color = 'var(--text-secondary)';
            }
        });

        UTILS.showToast('留言成功！感谢你的留言 💌');
    }

    /**
     * 渲染留言列表
     */
    renderMessages() {
        const container = document.getElementById('messageList');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">还没有留言，快来留下第一条吧！</p>';
            return;
        }

        container.innerHTML = this.messages.map((message, index) => `
            <div class="message-item slide-in" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s">
                <div class="message-header">
                    <div class="message-author">✨ ${this.escapeHtml(message.name)}</div>
                    <div class="message-date">${this.escapeHtml(message.date)}</div>
                </div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            </div>
        `).join('');
    }

    /**
     * 保存留言到本地存储
     */
    saveMessages() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
        } catch (e) {
            console.error('保存留言失败:', e);
        }
    }

    /**
     * 从本地存储加载留言
     */
    loadMessages() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error('加载留言失败:', e);
        }
        return [];
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
