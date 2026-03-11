/**
 * 留言板模块
 * 管理用户留言和显示
 */

class Guestbook {
    constructor() {
        this.storageKey = 'guestbook_messages';
        this.messages = this.loadMessages();
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.renderMessages();
        this.setupForm();
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
     * 添加留言
     */
    addMessage() {
        const nameInput = document.getElementById('messageName');
        const contentInput = document.getElementById('messageContent');

        if (!nameInput || !contentInput) return;

        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        if (!name || !content) {
            UTILS.showToast('请填写完整信息！');
            return;
        }

        const message = {
            id: Date.now(),
            name: name,
            content: content,
            date: new Date().toLocaleString('zh-CN')
        };

        this.messages.unshift(message); // 新消息放在最前面
        this.saveMessages();
        this.renderMessages();

        // 清空表单
        nameInput.value = '';
        contentInput.value = '';

        // 显示成功提示
        UTILS.showToast('留言成功！感谢你的留言 💌');
    }

    /**
     * 渲染留言列表
     */
    renderMessages() {
        const container = document.getElementById('messageList');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">还没有留言，快来留下第一条吧！</p>';
            return;
        }

        container.innerHTML = this.messages.map((message, index) => `
            <div class="message-item slide-in" style="animation-delay: ${index * 0.1}s">
                <div class="message-header">
                    <div class="message-author">✨ ${this.escapeHtml(message.name)}</div>
                    <div class="message-date">${message.date}</div>
                </div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            </div>
        `).join('');
    }

    /**
     * 保存留言到本地存储
     */
    saveMessages() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    }

    /**
     * 从本地存储加载留言
     */
    loadMessages() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('加载留言失败:', e);
                return [];
            }
        }
        return [];
    }

    /**
     * 转义HTML防止XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    new Guestbook();
});







