/**
 * 扭蛋机模块
 * 随机美食选择器
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
        this.colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#eccc68', '#70a1ff', '#ff6b81'];

        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.renderDishList();
        this.createCapsules(true);
        this.bindEvents();
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
        const count = 15;
        
        for (let i = 0; i < count; i++) {
            const ball = document.createElement('div');
            ball.className = 'capsule-v3';

            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = 40 + (col * 45) + (Math.random() * 10);
            const y = 230 - (row * 35) + (Math.random() * 10);

            ball.style.backgroundColor = this.colors[i % this.colors.length];
            ball.style.left = `${x}px`;

            if (isStatic) {
                ball.style.top = `${y}px`;
            } else {
                ball.style.top = `-50px`;
                setTimeout(() => {
                    ball.style.top = `${y}px`;
                }, i * 50);
            }

            ball.style.transform = `rotate(${Math.random() * 360}deg)`;
            dome.appendChild(ball);
        }
    }

    /**
     * 开始转动
     */
    spin() {
        if (this.isSpinning || this.dishes.length === 0) {
            UTILS.showToast('请先添加菜品！');
            return;
        }

        this.isSpinning = true;
        const machine = document.getElementById('machineBody');
        const balls = document.querySelectorAll('.capsule-v3');

        // 机身震动
        machine.style.animation = 'machine-shake 0.1s infinite';

        // 球乱飞
        balls.forEach(ball => {
            ball.style.transition = 'all 0.4s ease-out';
            ball.style.left = `${Math.random() * 210 + 20}px`;
            ball.style.top = `${Math.random() * 180 + 40}px`;
            ball.style.transform = `rotate(${Math.random() * 1000}deg) scale(1.1)`;
        });

        // 1.5秒后停止并显示结果
        setTimeout(() => {
            machine.style.animation = '';
            const result = this.dishes[Math.floor(Math.random() * this.dishes.length)];

            this.showResult(result);
            this.createCapsules(false);
            this.isSpinning = false;
        }, 1500);
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
        setTimeout(() => card.classList.add('show'), 50);
    }

    /**
     * 关闭结果弹窗
     */
    closeResult() {
        const overlay = document.getElementById('resultOverlay');
        const card = document.getElementById('resultCard');
        card.classList.remove('show');
        setTimeout(() => overlay.style.display = 'none', 300);
    }

    /**
     * 渲染菜品列表
     */
    renderDishList() {
        const list = document.getElementById('dishList');
        if (!list) return;

        list.innerHTML = this.dishes.map((dish, i) => `
            <div class="dish-item">
                <span style="font-weight:500;">${dish}</span>
                <span style="color:#ccc; cursor:pointer; font-size:1.2rem;" onclick="app.deleteDish(${i})">&times;</span>
            </div>
        `).join('');
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

        if (this.dishes.includes(val)) {
            UTILS.showToast('该菜品已存在！');
            return;
        }

        this.dishes.push(val);
        this.save();
        this.renderDishList();
        input.value = '';
        UTILS.showToast('添加成功！');
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
        UTILS.showToast(`已删除 "${dish}"`);
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
            UTILS.showToast('已恢复默认菜单');
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const spinBtn = document.getElementById('spinBtn');
        const addBtn = document.getElementById('addBtn');
        const resetBtn = document.getElementById('resetBtn');
        const input = document.getElementById('dishInput');

        if (spinBtn) spinBtn.onclick = () => this.spin();
        if (addBtn) addBtn.onclick = () => this.addDish();
        if (resetBtn) resetBtn.onclick = () => this.reset();
        if (input) input.onkeypress = (e) => {
            if (e.key === 'Enter') this.addDish();
        };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.app = new GachaponApp();
});