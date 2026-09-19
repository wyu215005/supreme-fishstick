/**
 * 轮播图模块
 * 处理图片自动轮换、导航、指示器、键盘与触摸滑动
 */

class Carousel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.slides = this.container.querySelectorAll('.carousel-slide');
        this.indicators = this.container.querySelectorAll('.indicator');
        this.currentIndex = 0;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000; // 5秒切换一次
        this.touchStartX = null;

        this.init();
    }

    /**
     * 初始化轮播图
     */
    init() {
        if (this.slides.length === 0) return;

        // 显示第一张图片
        this.showSlide(0);

        // 绑定导航按钮事件
        const prevBtn = this.container.querySelector('.carousel-nav.prev');
        const nextBtn = this.container.querySelector('.carousel-nav.next');

        if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());

        // 绑定指示器事件
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // 键盘左右方向键切换
        document.addEventListener('keydown', (e) => {
            if (e.target && e.target.matches('input, textarea, select')) return;
            if (e.key === 'ArrowLeft') this.prevSlide();
            else if (e.key === 'ArrowRight') this.nextSlide();
        });

        // 触摸滑动切换
        this.container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.stopAutoPlay();
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            if (this.touchStartX === null) return;
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            if (Math.abs(dx) > 45) {
                dx < 0 ? this.nextSlide() : this.prevSlide();
            }
            this.touchStartX = null;
            this.startAutoPlay();
        }, { passive: true });

        // 自动播放
        this.startAutoPlay();

        // 鼠标悬停时暂停自动播放
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
    }

    /**
     * 显示指定索引的幻灯片
     */
    showSlide(index) {
        // 隐藏所有幻灯片
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });

        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
            indicator.setAttribute('aria-selected', String(i === index));
        });

        this.currentIndex = index;
    }

    /**
     * 显示下一张幻灯片
     */
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slides.length;
        this.showSlide(nextIndex);
    }

    /**
     * 显示上一张幻灯片
     */
    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.showSlide(prevIndex);
    }

    /**
     * 跳转到指定幻灯片
     */
    goToSlide(index) {
        this.showSlide(index);
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
    }

    /**
     * 停止自动播放
     */
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
}

// 页面加载完成后初始化轮播图
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('carousel')) {
        new Carousel('carousel');
    }
});
