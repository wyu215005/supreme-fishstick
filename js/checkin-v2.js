/**
 * 🎣 小猫钓鱼打卡系统
 * 完整的学习打卡功能实现
 */

class FishingCheckin {
  constructor() {
    this.config = SITE_CONFIG.checkin;
    this.today = UTILS.getTodayKey();
    this.weekDay = UTILS.getWeekDay();
    this.data = this.loadData();
    this.init();
  }

  /**
   * 初始化
   */
  init() {
    this.render();
    this.bindEvents();
    this.startBubbles();
  }

  /**
   * 从localStorage加载数据
   */
  loadData() {
    const saved = localStorage.getItem(this.config.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('加载打卡数据失败:', e);
        return this.getDefaultData();
      }
    }
    return this.getDefaultData();
  }

  /**
   * 获取默认数据结构
   */
  getDefaultData() {
    return {
      totalDays: 0,        // 总共钓鱼天数
      currentStreak: 0,    // 当前连续打卡天数
      lastCheckIn: null,   // 最后打卡日期
      checkinDates: [],    // 打卡日期列表
      monthData: {}        // 月份打卡数据
    };
  }

  /**
   * 保存数据
   */
  saveData() {
    localStorage.setItem(this.config.storageKey, JSON.stringify(this.data));
  }

  /**
   * 执行打卡操作
   */
  checkin() {
    // 检查是否已打卡
    if (this.data.lastCheckIn === this.today) {
      UTILS.showToast('🐟 今天已经钓过鱼啦！明天再来吧');
      return false;
    }

    // 检查连续打卡
    const yesterday = this.getYesterdayKey();
    const isConsecutive = this.data.lastCheckIn === yesterday;

    // 更新数据
    this.data.totalDays++;
    this.data.lastCheckIn = this.today;
    this.data.checkinDates.push(this.today);
    this.data.currentStreak = isConsecutive ? this.data.currentStreak + 1 : 1;

    // 记录月份数据
    const monthKey = this.today.substring(0, 7); // YYYY-MM
    if (!this.data.monthData[monthKey]) {
      this.data.monthData[monthKey] = [];
    }
    this.data.monthData[monthKey].push(this.today);

    this.saveData();
    this.playAnimation();
    return true;
  }

  /**
   * 获取昨天的日期键
   */
  getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return UTILS.formatDate(d);
  }

  /**
   * 播放动画
   */
  playAnimation() {
    const cat = document.querySelector('.cat-sprite');
    const scene = document.querySelector('.fishing-scene');

    if (!cat || !scene) return;

    // 小猫甩杆动画
    cat.classList.add('casting');
    scene.classList.add('casting');

    // 甩杆后 0.35s：水花四溅，鱼儿跃出
    setTimeout(() => this.createCatchBurst(scene), 350);

    setTimeout(() => {
      cat.classList.remove('casting');
      scene.classList.remove('casting');
      // 小猫开心跳跃
      cat.classList.add('happy');
      setTimeout(() => cat.classList.remove('happy'), 900);
      UTILS.showToast('🎉 钓到一条小鱼！');
      this.render();
    }, this.config.animationDuration);
  }

  /**
   * 钓鱼成功的粒子爆发（鱼/爱心/水花）
   */
  createCatchBurst(scene) {
    const emojis = ['🐟', '🐠', '💖', '✨', '💦'];
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('div');
      p.className = 'fx-particle';
      p.textContent = emojis[i % emojis.length];
      p.style.left = '50%';
      p.style.top = '60%';
      p.style.setProperty('--dx', (Math.random() * 180 - 90) + 'px');
      p.style.setProperty('--dy', (-70 - Math.random() * 100) + 'px');
      p.style.setProperty('--rot', (Math.random() * 160 - 80) + 'deg');
      p.style.setProperty('--dur', (0.7 + Math.random() * 0.6) + 's');
      p.style.fontSize = (1.2 + Math.random() * 0.8) + 'rem';
      scene.appendChild(p);
      setTimeout(() => p.remove(), 1400);
    }
  }

  /**
   * 水族箱气泡：钓鱼场景内缓缓上浮
   */
  startBubbles() {
    const scene = document.querySelector('.fishing-scene');
    if (!scene) return;
    setInterval(() => {
      if (document.hidden) return;
      if (document.querySelectorAll('.fishing-bubble').length >= 8) return;
      const bubble = document.createElement('div');
      bubble.className = 'fishing-bubble';
      const size = 4 + Math.random() * 8;
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      bubble.style.left = (8 + Math.random() * 84) + '%';
      bubble.style.animationDuration = (2.6 + Math.random() * 2.8) + 's';
      scene.appendChild(bubble);
      bubble.addEventListener('animationend', () => bubble.remove());
    }, 850);
  }

  /**
   * 渲染界面
   */
  render() {
    this.renderHeader();
    this.renderWeekStats();
    this.renderButton();
    this.renderStats();
  }

  /**
   * 渲染标题区域
   */
  renderHeader() {
    const header = document.querySelector('.checkin-header');
    if (!header) return;

    const monthKey = this.today.substring(0, 7);
    const monthDays = this.data.monthData[monthKey] || [];
    
    const now = new Date();
    const monthName = `${now.getFullYear()}年${now.getMonth() + 1}月`;

    header.innerHTML = `
      <h3 style="margin: 0; font-size: 1.2rem;">🎣 钓鱼打卡</h3>
      <div style="text-align: right; font-size: 0.9rem;">
        <div>${monthName}</div>
        <div style="color: var(--text-secondary);">本月 ${monthDays.length} 天</div>
      </div>
    `;
  }

  /**
   * 渲染周统计
   */
  renderWeekStats() {
    const container = document.querySelector('.week-stats');
    if (!container) return;

    const days = SITE_CONFIG.checkin.weekDays;
    const emojis = SITE_CONFIG.checkin.weekEmoji;
    
    let html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.8rem; margin-top: 1.5rem;">';
    
    for (let i = 0; i < 7; i++) {
      const dayDate = this.getDateOfWeekDay(i + 1);
      const dateKey = UTILS.formatDate(dayDate);
      const isCheckedIn = this.data.checkinDates.includes(dateKey);
      const isToday = dateKey === this.today;
      
      html += `
        <div class="week-day-item ${isCheckedIn ? 'active' : ''} ${isToday ? 'today' : ''}" 
             title="${days[i]} ${dayDate.getDate()}日">
          <div class="week-day-emoji">${emojis[i]}</div>
          <div class="week-day-label">${days[i]}</div>
          <div class="week-day-date">${dayDate.getDate()}</div>
        </div>
      `;
    }
    
    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * 获取某个周几的日期
   */
  getDateOfWeekDay(weekDay) {
    const today = new Date();
    const currentWeekDay = today.getDay() || 7;
    const diff = weekDay - currentWeekDay;
    
    const date = new Date(today);
    date.setDate(date.getDate() + diff);
    return date;
  }

  /**
   * 渲染按钮状态
   */
  renderButton() {
    const btn = document.querySelector('.checkin-btn');
    if (!btn) return;

    const isCheckedInToday = this.data.lastCheckIn === this.today;
    btn.disabled = isCheckedInToday;
    btn.textContent = isCheckedInToday ? '🎣 今天已打卡' : '🎣 立即甩杆';
    btn.className = `checkin-btn ${isCheckedInToday ? 'disabled' : ''}`;
  }

  /**
   * 渲染统计信息
   */
  renderStats() {
    const statsContainer = document.querySelector('.checkin-stats');
    if (!statsContainer) return;

    const streakText = this.data.currentStreak > 0 
      ? `🔥 连续${this.data.currentStreak}天` 
      : '开始打卡吧';

    statsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem;">
        <div class="stat-card">
          <div class="stat-number" data-target="${this.data.totalDays}">0</div>
          <div class="stat-label">总学习天数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" data-target="${this.data.currentStreak}">0</div>
          <div class="stat-label">连续打卡</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" data-target="${(this.data.totalDays / 30).toFixed(1)}" data-decimals="1">0.0</div>
          <div class="stat-label">月均学习</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
        ${streakText}
      </div>
    `;

    this.animateNumbers(statsContainer);
  }

  /**
   * 统计数字滚动动画
   */
  animateNumbers(container) {
    container.querySelectorAll('.stat-number').forEach(numEl => {
      const target = parseFloat(numEl.dataset.target) || 0;
      const decimals = parseInt(numEl.dataset.decimals || '0', 10);
      const duration = 650;
      const start = performance.now();
      numEl.classList.add('bump');
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        numEl.textContent = decimals ? val.toFixed(decimals) : String(Math.round(val));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const btn = document.querySelector('.checkin-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (this.checkin()) {
          // 打卡成功
          this.render();
        }
      });
    }
  }
}

/**
 * 页面加载时初始化
 */
document.addEventListener('DOMContentLoaded', () => {
  // 只在有钓鱼组件的页面初始化
  if (document.querySelector('.fishing-checkin')) {
    window.fishingCheckin = new FishingCheckin();
  }
});
