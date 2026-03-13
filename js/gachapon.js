/**
 * 扭蛋机模块
 * 随机美食选择器 - 增强版动画交互
 */

class GachaponApp {
    constructor() {
        this.defaultDishes = [
            '宫保鸡丁', '麻婆豆腐', '红烧肉', '糖醋里脊', 
            '鱼香肉丝', '水煮鱼', '回锅肉', '酸菜鱼', 
            '辣子鸡', '口水鸡'
        ];
        this.storageKey = 'gachapon_dishes';
        this.dishes = this.loadDishes();
        this.isSpinning = false;
        this.colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#eccc68', '#70a1ff', '#ff6b81', '#a29bfe', '#fd79a8', '#00cec9'];
        this.spinDuration = 2400;
        this.progressTimer = null;
        this.CONFETTI_COUNT = 70;

        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.renderDishList();
        this.createCapsules(true);
        this.bindEvents();
        this.setDisplay('● READY');
    }

    /**
     * 更新机器状态显示屏
     */
    setDisplay(text) {
        const el = document.getElementById('displayText');
        if (el) el.textContent = text;
    }

    /**
     * 设置指示灯状态
     */
    setLights(state) {
        const red = document.getElementById('lightRed');
        const yellow = document.getElementById('lightYellow');
        const green = document.getElementById('lightGreen');
        if (!red || !yellow || !green) return;
        // 先清除所有 lit 类
        [red, yellow, green].forEach(l => l.className = 'machine-light');
        if (state === 'ready') {
            green.classList.add('lit-green');
        } else if (state === 'spinning') {
            red.classList.add('lit-red');
            yellow.classList.add('lit-yellow');
        } else if (state === 'done') {
            red.classList.add('lit-red');
            yellow.classList.add('lit-yellow');
            green.classList.add('lit-green');
        }
    }

    /**
     * 加载菜品列表
     */
    loadDishes() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [...this.defaultDishes];
    }

    /**
     * 创建球形胶囊
     */
    createCapsules(isStatic = true) {
        const dome = document.getElementById('dome');
        if (!dome) return;
        
        dome.innerHTML = '';
        const count = 16;
        
        for (let i = 0; i < count; i++) {
            const ball = document.createElement('div');
            ball.className = 'capsule-v3';

            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = 28 + (col * 42) + (Math.random() * 14);
            const y = 210 - (row * 36) + (Math.random() * 12);

            ball.style.backgroundColor = this.colors[i % this.colors.length];
            ball.style.left = `${x}px`;

            const initRot = Math.round(Math.random() * 360);
            ball.style.setProperty('--init-rot', `${initRot}deg`);
            ball.style.transform = `rotate(${initRot}deg)`;

            if (isStatic) {
                ball.style.top = `${y}px`;
            } else {
                ball.style.top = `-50px`;
                setTimeout(() => {
                    ball.style.transition = 'top 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    ball.style.top = `${y}px`;
                }, i * 45);
            }

            dome.appendChild(ball);
        }
    }

    /**
     * 更新进度圆环
     */
    updateProgress(pct) {
        const circle = document.getElementById('spinProgressCircle');
        const svg = document.getElementById('spinProgressSvg');
        if (!circle || !svg) return;
        const circumference = 283;
        circle.style.strokeDashoffset = circumference * (1 - pct);
        if (pct > 0) {
            svg.classList.add('visible');
        } else {
            svg.classList.remove('visible');
        }
    }

    /**
     * 开始转动 - 三阶段动画
     */
    spin() {
        if (this.isSpinning || this.dishes.length === 0) {
            UTILS.showToast('请先添加菜品！');
            return;
        }

        this.isSpinning = true;
        // 清理可能残留的进度动画
        if (this.progressTimer) {
            cancelAnimationFrame(this.progressTimer);
            this.progressTimer = null;
        }
        const machine = document.getElementById('machineBody');
        const knob = document.getElementById('spinBtn');
        const balls = document.querySelectorAll('.capsule-v3');

        // 阶段 1: 准备 (0-300ms) - 旋钮旋转，指示灯切换
        this.setDisplay('◉ LOADING..');
        this.setLights('spinning');
        knob.style.transition = 'transform 0.3s ease-in-out';
        knob.style.transform = 'rotate(90deg) scale(1.08)';
        this.updateProgress(0);

        // 阶段 2: 摇晃 (300ms-2200ms) - 机器摇晃，球乱飞
        setTimeout(() => {
            this.setDisplay('▶ SPINNING..');
            machine.classList.add('machine-spinning');
            knob.style.transition = 'transform 0.9s linear';
            knob.style.transform = 'rotate(720deg)';

            // 球开始随机运动 - 更混乱的运动轨迹
            balls.forEach((ball, i) => {
                setTimeout(() => {
                    ball.style.transition = 'all 0.3s ease-out';
                    ball.style.animation = 'none';
                    ball.style.left = `${Math.random() * 205 + 20}px`;
                    ball.style.top = `${Math.random() * 185 + 30}px`;
                    ball.style.transform = `rotate(${Math.random() * 1440}deg) scale(${0.8 + Math.random() * 0.4})`;
                }, i * 22);
            });

            // 中间阶段：球持续混乱运动
            setTimeout(() => {
                balls.forEach((ball, i) => {
                    setTimeout(() => {
                        ball.style.transition = 'all 0.28s ease-in-out';
                        ball.style.left = `${Math.random() * 200 + 22}px`;
                        ball.style.top = `${Math.random() * 180 + 35}px`;
                        ball.style.transform = `rotate(${Math.random() * 2160}deg) scale(${0.75 + Math.random() * 0.5})`;
                    }, i * 18);
                });
            }, 600);

            // 进度条动画
            const startTime = performance.now();
            const totalTime = this.spinDuration - 300;
            const tick = (now) => {
                const elapsed = now - startTime;
                const pct = Math.min(elapsed / totalTime, 1);
                this.updateProgress(pct);
                if (pct < 1) {
                    this.progressTimer = requestAnimationFrame(tick);
                }
            };
            this.progressTimer = requestAnimationFrame(tick);
        }, 300);

        // 阶段 3: 出结果 (2400ms) - 停止摇晃，弹出球，显示结果
        setTimeout(() => {
            if (this.progressTimer) {
                cancelAnimationFrame(this.progressTimer);
            }
            this.updateProgress(1);

            machine.classList.remove('machine-spinning');
            knob.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
            knob.style.transform = 'rotate(0deg)';

            const result = this.dishes[Math.floor(Math.random() * this.dishes.length)];
            this.setDisplay('★ DONE!');
            this.setLights('done');

            // 弹出球动画
            this.ejectBall();

            setTimeout(() => {
                this.updateProgress(0);
                this.showResult(result);
                this.createCapsules(false);
                this.isSpinning = false;
                // 延迟重置为 READY
                setTimeout(() => {
                    this.setDisplay('● READY');
                    this.setLights('ready');
                }, 3000);
            }, 800);
        }, this.spinDuration);
    }

    /**
     * 弹出球动画
     */
    ejectBall() {
        const tray = document.getElementById('trayOpening');
        if (!tray) return;

        // 移除旧的弹出球
        const old = tray.querySelector('.ejected-capsule');
        if (old) old.remove();

        const ball = document.createElement('div');
        ball.className = 'ejected-capsule';
        ball.style.backgroundColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        tray.appendChild(ball);

        setTimeout(() => ball.remove(), 1800);
    }

    /**
     * 显示彩带/烟花效果 - 更绚丽
     */
    showConfetti() {
        const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ffd700', '#ff6b81', '#7bed9f', '#a29bfe', '#fd79a8', '#00cec9', '#fdcb6e'];
        const shapes = ['circle', 'square', 'star'];
        const count = this.CONFETTI_COUNT;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const piece = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = 5 + Math.random() * 9;
                const xStart = Math.random() * window.innerWidth;
                const drift = (Math.random() - 0.5) * 200;
                const duration = 1400 + Math.random() * 2000;
                const shape = shapes[Math.floor(Math.random() * shapes.length)];

                let borderRadius = '50%';
                let extra = '';
                if (shape === 'square') borderRadius = '2px';
                if (shape === 'star') {
                    borderRadius = '0';
                    extra = 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);';
                }

                piece.style.cssText = `
                    position: fixed;
                    top: -10px;
                    left: ${xStart}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: ${borderRadius};
                    z-index: 20000;
                    pointer-events: none;
                    ${extra}
                `;
                document.body.appendChild(piece);

                const startT = performance.now();
                const swingAmplitude = 30 + Math.random() * 40;
                const swingFreq = 2 + Math.random() * 2;
                const animate = (now) => {
                    const elapsed = now - startT;
                    const progress = elapsed / duration;
                    if (progress >= 1) {
                        piece.remove();
                        return;
                    }
                    const y = progress * window.innerHeight * 1.15;
                    const swing = Math.sin(progress * Math.PI * swingFreq) * swingAmplitude;
                    const x = drift * progress + swing;
                    const rotation = progress * (shape === 'circle' ? 360 : 1080);
                    const scale = 1 - progress * 0.5;
                    const opacity = progress > 0.7 ? (1 - progress) * 3.33 : 1;
                    piece.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
                    piece.style.opacity = opacity;
                    requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }, i * 18);
        }
    }

    /**
     * 显示结果
     */
    showResult(dish) {
        const overlay = document.getElementById('resultOverlay');
        const card = document.getElementById('resultCard');
        const text = document.getElementById('resultDish');

        text.innerText = dish;
        overlay.style.display = 'flex';
        setTimeout(() => {
            card.classList.add('show');
            this.showConfetti();
        }, 60);
    }

    /**
     * 关闭结果弹窗
     */
    closeResult() {
        const overlay = document.getElementById('resultOverlay');
        const card = document.getElementById('resultCard');
        card.classList.remove('show');
        setTimeout(() => overlay.style.display = 'none', 400);
    }

    /**
     * 渲染菜品列表
     */
    renderDishList() {
        const list = document.getElementById('dishList');
        if (!list) return;

        list.innerHTML = this.dishes.map((dish, i) => `
            <div class="dish-item">
                <span style="font-weight:500; font-size: 0.88rem;">${this.escapeDishName(dish)}</span>
                <span class="dish-delete" data-index="${i}" style="color: var(--text-muted); cursor:pointer; font-size:1.1rem; line-height:1; padding: 2px; border-radius: 4px; transition: all 0.15s; flex-shrink: 0;" aria-label="删除 ${this.escapeDishName(dish)}" role="button" tabindex="0">&times;</span>
            </div>
        `).join('');
    }

    /**
     * 转义菜品名称防止 XSS
     */
    escapeDishName(name) {
        const div = document.createElement('div');
        div.textContent = String(name);
        return div.innerHTML;
    }

    /**
     * 添加菜品
     */
    addDish() {
        const input = document.getElementById('dishInput');
        const val = input.value.trim();
        
        if (!val) {
            UTILS.showToast('请输入菜品名称！');
            return;
        }

        if (val.length > 20) {
            UTILS.showToast('菜品名称不能超过 20 个字符！');
            return;
        }

        if (this.dishes.length >= 30) {
            UTILS.showToast('菜品已达上限（30个），请先删除一些再添加！');
            return;
        }

        if (this.dishes.includes(val)) {
            UTILS.showToast('该菜品已存在！');
            return;
        }

        this.dishes.push(val);
        this.save();
        this.renderDishList();
        input.value = '';
        UTILS.showToast('✅ 添加成功！');
    }

    /**
     * 删除菜品
     */
    deleteDish(index) {
        if (index < 0 || index >= this.dishes.length) return;
        
        const dish = this.dishes[index];
        this.dishes.splice(index, 1);
        this.save();
        this.renderDishList();
        UTILS.showToast(`🗑️ 已删除 "${dish}"`);
    }

    /**
     * 保存数据
     */
    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.dishes));
    }

    /**
     * 恢复默认菜单
     */
    reset() {
        if (confirm('确定要恢复默认菜单吗？')) {
            this.dishes = [...this.defaultDishes];
            this.save();
            this.renderDishList();
            UTILS.showToast('🔄 已恢复默认菜单');
        }
    }

    /**
     * 绑定事件（使用 addEventListener 替代内联 onclick）
     */
    bindEvents() {
        const spinBtn = document.getElementById('spinBtn');
        const addBtn = document.getElementById('addBtn');
        const resetBtn = document.getElementById('resetBtn');
        const closeBtn = document.getElementById('closeResultBtn');
        const input = document.getElementById('dishInput');
        const dishList = document.getElementById('dishList');

        if (spinBtn) spinBtn.addEventListener('click', () => this.spin());
        if (spinBtn) spinBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.spin(); }
        });
        if (addBtn) addBtn.addEventListener('click', () => this.addDish());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeResult());
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.addDish(); }
            });
            // 聚焦时高亮边框
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--accent-blue, #3b82f6)';
                input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = '';
                input.style.boxShadow = '';
            });
        }

        // 事件委托：菜品删除按钮
        if (dishList) {
            dishList.addEventListener('click', (e) => {
                const btn = e.target.closest('.dish-delete');
                if (btn) this.deleteDish(parseInt(btn.dataset.index, 10));
            });
            dishList.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const btn = e.target.closest('.dish-delete');
                    if (btn) { e.preventDefault(); this.deleteDish(parseInt(btn.dataset.index, 10)); }
                }
            });
            // hover 效果
            dishList.addEventListener('mouseover', (e) => {
                const btn = e.target.closest('.dish-delete');
                if (btn) { btn.style.color = '#ef4444'; btn.style.background = '#fee2e2'; }
            });
            dishList.addEventListener('mouseout', (e) => {
                const btn = e.target.closest('.dish-delete');
                if (btn) { btn.style.color = ''; btn.style.background = ''; }
            });
        }

        // 点击遮罩关闭弹窗
        const overlay = document.getElementById('resultOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeResult();
            });
        }

        // 初始化指示灯
        this.setLights('ready');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.app = new GachaponApp();
});