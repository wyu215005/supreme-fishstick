/**
 * 轮播图模块
 * 处理图片自动轮换、导航和指示器功能
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
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.indicators.forEach(indicator => indicator.classList.remove('active'));

        // 显示当前幻灯片
        if (this.slides[index]) {
            this.slides[index].classList.add('active');
        }
        if (this.indicators[index]) {
            this.indicators[index].classList.add('active');
        }

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







