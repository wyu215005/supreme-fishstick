/**
 * 网站全局配置
 * 统一管理网站的配置信息，避免代码重复
 */

const SITE_CONFIG = {
  // 基本信息
  siteName: 'FishRain',
  siteEmoji: '🐟',
  description: '记录学习与成长的地方',
  year: new Date().getFullYear(),
  
  // 导航菜单
  navMenu: [
    { name: '首页', href: 'index.html', emoji: '🏠' },
    { name: '文章', href: 'articles.html', emoji: '📚' },
    { name: '关于我', href: 'about.html', emoji: '👤' },
    { name: '扭蛋机', href: 'gachapon.html', emoji: '🎰' },
    { name: '留言板', href: 'guestbook.html', emoji: '💬' }
  ],

  // 联系方式
  contact: [
    { platform: 'Bilibili', emoji: '📺', info: 'B站：FishRain' },
    { platform: 'GitHub', emoji: '💻', info: 'GitHub：FishRain' },
    { platform: 'Email', emoji: '📧', info: '邮箱：fishrain@example.com' },
    { platform: 'WeChat', emoji: '💬', info: '微信：FishRain2024' }
  ],

  // 打卡系统配置
  checkin: {
    storageKey: 'fishrain_checkin',
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    weekEmoji: ['🐟', '🦈', '🐠', '🦑', '🐙', '🦐', '🦞'],
    animationDuration: 800
  }
};

// 工具函数集合
const UTILS = {
  /**
   * 获取今天的日期键
   */
  getTodayKey: () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  /**
   * 获取当前是星期几 (0-6)
   */
  getWeekDay: () => {
    const d = new Date();
    return d.getDay() || 7; // 周日返回7而不是0
  },

  /**
   * 格式化日期
   */
  formatDate: (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /**
   * 获取当月第一天
   */
  getMonthFirstDay: (date = new Date()) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  },

  /**
   * 显示提示信息
   */
  showToast: (message, duration = 2000) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 10000;
      animation: toastShow 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastFade 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
