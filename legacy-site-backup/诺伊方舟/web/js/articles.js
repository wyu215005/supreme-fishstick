/**
 * 文章管理模块
 * 处理文章显示、搜索和标签过滤
 */

class ArticlesManager {
    constructor() {
        // 文章数据
        this.articles = [
            {
                id: 1,
                title: '线性代数基础：矩阵运算详解',
                date: '2024-01-15',
                tags: ['线性代数', '数学', '基础'],
                excerpt: '深入理解矩阵的基本运算，包括加法、乘法、转置等操作，为后续的数据科学学习打下坚实基础。',
                category: '数学'
            },
            {
                id: 2,
                title: 'Python数据分析：Pandas入门指南',
                date: '2024-01-20',
                tags: ['Python', '数据分析', 'Pandas'],
                excerpt: '学习如何使用Pandas进行数据处理和分析，掌握DataFrame的基本操作和常用函数。',
                category: '编程'
            },
            {
                id: 3,
                title: '数据仓库设计：维度建模实践',
                date: '2024-02-01',
                tags: ['数据仓库', '数据库', '设计'],
                excerpt: '探讨数据仓库的维度建模方法，学习星型模式和雪花模式的设计原则。',
                category: '数据工程'
            },
            {
                id: 4,
                title: '机器学习：线性回归算法原理',
                date: '2024-02-10',
                tags: ['机器学习', '算法', '线性回归'],
                excerpt: '从数学原理到代码实现，全面理解线性回归算法的工作原理和应用场景。',
                category: '机器学习'
            },
            {
                id: 5,
                title: 'SQL优化技巧：提升查询性能',
                date: '2024-02-15',
                tags: ['SQL', '数据库', '优化'],
                excerpt: '分享SQL查询优化的实用技巧，包括索引使用、查询重写等方法。',
                category: '数据工程'
            },
            {
                id: 6,
                title: '数据可视化：Matplotlib与Seaborn',
                date: '2024-02-20',
                tags: ['Python', '数据可视化', 'Matplotlib'],
                excerpt: '学习使用Matplotlib和Seaborn创建美观的数据可视化图表。',
                category: '数据分析'
            }
        ];

        this.filteredArticles = [...this.articles];
        this.activeTags = new Set();
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.renderArticles();
        this.renderTags();
        this.setupSearch();
        this.setupTagFilter();
    }

    /**
     * 渲染文章列表
     */
    renderArticles() {
        const container = document.getElementById('articleList');
        if (!container) return;

        // 更新文章数量显示
        const countElement = document.getElementById('articleCount');
        if (countElement) {
            countElement.textContent = `共找到 ${this.filteredArticles.length} 篇文章`;
        }

        if (this.filteredArticles.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">没有找到相关文章，试试其他搜索条件吧</p>';
            return;
        }

        container.innerHTML = this.filteredArticles.map(article => `
            <div class="article-card fade-in" onclick="window.location.href='#'">
                <div class="article-card-header">
                    <div class="article-card-title">${article.title}</div>
                </div>
                <div class="article-card-body">
                    <div class="article-card-meta">
                        📅 ${article.date} | 📁 ${article.category}
                    </div>
                    <div class="article-card-excerpt">${article.excerpt}</div>
                    <div class="article-card-tags">
                        ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染标签筛选
     */
    renderTags() {
        const container = document.getElementById('tagContainer');
        if (!container) return;

        // 收集所有标签
        const allTags = new Set();
        this.articles.forEach(article => {
            article.tags.forEach(tag => allTags.add(tag));
        });

        container.innerHTML = Array.from(allTags).map(tag => `
            <span class="tag" data-tag="${tag}">${tag}</span>
        `).join('');
    }

    /**
     * 设置搜索框事件
     */
    setupSearch() {
        const searchBox = document.getElementById('searchBox');
        if (!searchBox) return;

        searchBox.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            this.filterArticles(query);
        });
    }

    /**
     * 设置标签过滤事件
     */
    setupTagFilter() {
        const container = document.getElementById('tagContainer');
        if (!container) return;

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag')) {
                const tag = e.target.getAttribute('data-tag');
                this.toggleTag(tag);
            }
        });
    }

    /**
     * 切换标签选中状态
     */
    toggleTag(tag) {
        if (this.activeTags.has(tag)) {
            this.activeTags.delete(tag);
        } else {
            this.activeTags.add(tag);
        }

        // 更新标签样式
        document.querySelectorAll('[data-tag]').forEach(el => {
            if (el.getAttribute('data-tag') === tag) {
                el.classList.toggle('active');
            }
        });

        this.filterArticles(document.getElementById('searchBox')?.value || '');
    }

    /**
     * 过滤文章
     */
    filterArticles(query) {
        this.filteredArticles = this.articles.filter(article => {
            // 文本搜索
            const matchesQuery = !query ||
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query) ||
                article.tags.some(tag => tag.toLowerCase().includes(query));

            // 标签过滤
            const matchesTags = this.activeTags.size === 0 ||
                Array.from(this.activeTags).some(tag => article.tags.includes(tag));

            return matchesQuery && matchesTags;
        });

        this.renderArticles();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    new ArticlesManager();
});


