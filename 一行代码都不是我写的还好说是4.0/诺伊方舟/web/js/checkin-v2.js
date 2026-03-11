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
    
    if (cat && scene) {
      // 小猫甩杆动画
      cat.classList.add('casting');
      scene.classList.add('casting');
      
      // 生成飞出的鱼
      this.createFlyingFish();
      
      setTimeout(() => {
        cat.classList.remove('casting');
        scene.classList.remove('casting');
        UTILS.showToast('🎉 钓到一条小鱼！');
        this.render();
      }, this.config.animationDuration);
    }
  }

  /**
   * 创建飞出的鱼动画
   */
  createFlyingFish() {
    const scene = document.querySelector('.fishing-scene');
    if (!scene) return;

    const fish = document.createElement('div');
    fish.className = 'flying-fish';
    fish.textContent = '🐟';
    fish.style.cssText = `
      position: absolute;
      font-size: 2rem;
      bottom: 40px;
      left: 50px;
      animation: fishFly 1s ease-out;
      z-index: 10;
      pointer-events: none;
    `;
    
    scene.appendChild(fish);
    
    setTimeout(() => fish.remove(), 1000);
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
          <div class="stat-number">${this.data.totalDays}</div>
          <div class="stat-label">总学习天数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${this.data.currentStreak}</div>
          <div class="stat-label">连续打卡</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${(this.data.totalDays / 30).toFixed(1)}</div>
          <div class="stat-label">月均学习</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
        ${streakText}
      </div>
    `;
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
