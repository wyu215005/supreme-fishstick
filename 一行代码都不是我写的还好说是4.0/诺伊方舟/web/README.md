# 🐟 FishRain 博客使用指南

## 快速开始

### 1️⃣ 打开博客
在浏览器中打开以下文件：
- `index.html` - 首页
- `articles.html` - 文章列表
- `about.html` - 关于我（**包含钓鱼打卡**）
- `gachapon.html` - 扭蛋机
- `guestbook.html` - 留言板

---

## 🎣 钓鱼打卡系统使用说明

### 📍 位置
在"关于我"页面（`about.html`）向下滚动，找到紫色渐变卡片。

### 📝 功能说明

#### 1. **打卡按钮**
- 点击 "🎣 立即甩杆" 按钮
- 如果今天已打卡，按钮会变灰且显示"🎣 今天已打卡"
- 打卡时会播放小猫甩杆钓鱼的动画

#### 2. **周统计区域**
显示当前周（周一至周日）的打卡情况：
- ⬜ 未打卡 - 灰色透明背景
- 🟩 已打卡 - 绿色背景，闪闪发光
- 🟨 今天 - 金黄色边框

每个日期对应一种海洋生物：
- 周一 🐟 | 周二 🦈 | 周三 🐠 | 周四 🦑 | 周五 🐙 | 周六 🦐 | 周日 🦞

#### 3. **统计数据**
显示三个关键指标：
- **总学习天数** - 你一共打过多少天卡
- **连续打卡** - 当前连续打卡的天数
- **月均学习** - 平均每月打卡天数

#### 4. **小猫动画**
- 点击打卡时，小猫 🐱 会甩杆钓鱼
- 钓到一条小鱼 🐟 会飞出来
- 动画完成后会看到成功提示

---

## 💾 数据管理

### 自动保存
- 打卡数据会自动保存到浏览器本地存储
- 关闭浏览器后数据不会丢失
- 跨设备访问数据不同步（每设备独立记录）

### 数据位置
在浏览器开发者工具中查看：
1. 按 `F12` 打开开发者工具
2. 选择 "应用"（Application）标签
3. 左侧选择 "本地存储"（Local Storage）
4. 查找键名：`fishrain_checkin`

### 导出数据
如需导出打卡数据，在控制台运行：
```javascript
copy(JSON.stringify(JSON.parse(localStorage.getItem('fishrain_checkin')), null, 2))
```

### 清除数据
如需重置打卡数据，在控制台运行：
```javascript
localStorage.removeItem('fishrain_checkin')
location.reload()  // 刷新页面
```

---

## 🔧 自定义配置

### 修改打卡系统设置
编辑 `js/config.js` 文件，找到 `SITE_CONFIG.checkin` 部分：

```javascript
checkin: {
  storageKey: 'fishrain_checkin',        // 存储键名
  weekDays: ['周一', '周二', ...],       // 星期标签
  weekEmoji: ['🐟', '🦈', ...],          // 对应生物
  animationDuration: 800                 // 动画时长(毫秒)
}
```

### 修改网站基本信息
同样在 `js/config.js` 中修改 `SITE_CONFIG` 的其他部分：

```javascript
siteName: 'FishRain',                    // 网站名称
siteEmoji: '🐟',                         // 网站emoji
description: '记录学习与成长的地方',     // 网站描述
year: 2026                               // 版权年份
```

---

## 📚 其他功能

### 📖 文章管理
- 编辑 `js/articles.js` 中的 `articles` 数组添加文章
- 支持标题、日期、标签、摘要、分类

### 🎰 扭蛋机
- 在页面上添加菜品名称
- 点击旋钮开始转动
- 系统默认有 10 道菜品
- 所有自定义菜品保存到本地

### 💬 留言板
- 访客可以留言
- 留言按时间倒序显示
- 支持 HTML 转义防止 XSS

---

## 🐛 常见问题

### Q: 打卡数据丢失了怎么办？
**A:** 
1. 检查是否清除了浏览器缓存
2. 检查浏览器是否允许本地存储
3. 尝试用另一个浏览器测试
4. 如果数据真的丢失，可以手动恢复：
   ```javascript
   // 在控制台运行此代码恢复默认数据
   localStorage.setItem('fishrain_checkin', '{"totalDays":0,"currentStreak":0,"lastCheckIn":null,"checkinDates":[],"monthData":{}}')
   ```

### Q: 为什么打卡按钮点不了？
**A:** 
1. 确保今天还没有打过卡
2. 刷新页面重试
3. 检查浏览器控制台是否有错误信息

### Q: 如何在多个设备同步打卡数据？
**A:** 目前没有服务器支持，数据只能本地存储。如需同步，可以：
1. 手动导出和导入数据
2. 未来可改为云端存储方案

### Q: 怎样修改小猫的emoji？
**A:** 编辑 `about.html`，找到 `<div class="cat-sprite">🐱</div>`，替换为你喜欢的emoji

---

## 🎯 开发建议

### 添加后端支持
如果想要跨设备同步数据，需要添加：
1. 用户登录系统
2. 数据库存储（如 MongoDB）
3. API 接口（如 Node.js + Express）

### 性能优化
- 图片压缩和懒加载
- CSS 和 JS 最小化
- 使用 CDN 加速

### SEO 优化
- 添加 meta 标签
- 生成 sitemap.xml
- 添加 robots.txt

---

## 📖 文件结构

```
诺伊方舟/
├── index.html              首页
├── articles.html           文章列表
├── about.html              关于我（打卡系统）
├── gachapon.html           扭蛋机
├── guestbook.html          留言板
├── css/
│   └── style.css           样式文件
├── js/
│   ├── config.js           全局配置
│   ├── navbar.js           导航栏
│   ├── carousel.js         轮播图
│   ├── articles.js         文章管理
│   ├── checkin-v2.js       钓鱼打卡（新）
│   ├── gachapon.js         扭蛋机
│   ├── guestbook.js        留言板
│   └── quick-nav.js        快速导航（可选）
├── images/                 图片文件夹
│   ├── avatar.jpg          头像
│   ├── carousel*.jpg       轮播图
│   └── ...
└── OPTIMIZATION_GUIDE.md   优化说明
```

---

## 🚀 部署

### GitHub Pages
1. 将项目上传到 GitHub
2. 在 Settings 中启用 GitHub Pages
3. 选择分支和文件夹
4. 等待部署完成

### 自有服务器
1. 将所有文件上传到服务器
2. 配置 web 服务器（Apache/Nginx）
3. 访问域名即可

### Vercel/Netlify
1. 连接 GitHub 仓库
2. 自动部署
3. 享受 CDN 加速

---

## 💡 更新日志

### v2.0 (2026-01-15)
- ✨ 完整实现小猫钓鱼打卡系统
- ✅ 代码模块化和优化
- 🧹 清理 100+ 行废弃代码
- 📱 改进响应式设计
- 🎯 增强用户体验

### v1.0
- 基础功能实现

---

## 📞 反馈

如有任何问题或建议，欢迎在留言板留言！

**祝你使用愉快！🎉**
