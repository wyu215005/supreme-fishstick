/**
 * 文章管理模块
 * 处理文章显示、搜索和标签过滤
 */

class ArticlesManager {
    constructor() {
        // 文章数据 —— 聚焦数据开发方向
        this.articles = [
            {
                id: 1,
                title: '数据仓库分层架构：ODS/DWD/DWS/ADS 实践',
                date: '2024-01-10',
                tags: ['数据仓库', '架构设计', '数据工程'],
                excerpt: '深入解析数仓分层架构设计原则，每层的职责定义、命名规范与数据流转最佳实践，助你构建可维护的企业级数仓。',
                category: '数据工程',
                link: 'https://github.com/wyu215005/DataWarehouse-Layered-Architecture-ODS-DWD-DWM-DWS-ADS-'
            },
            {
                id: 2,
                title: 'SQL 性能调优：从慢查询到毫秒级响应',
                date: '2024-01-20',
                tags: ['SQL', '性能优化', '数据库'],
                excerpt: '系统梳理索引设计、执行计划分析、分区裁剪、物化视图等核心优化手段，结合真实业务场景的调优案例讲解。',
                category: '数据库'
            },
            {
                id: 3,
                title: 'Apache Airflow：数据管道编排实战',
                date: '2024-02-01',
                tags: ['Airflow', 'ETL', '任务调度'],
                excerpt: '使用 Airflow DAG 构建可靠的数据管道：任务依赖、重试策略、SLA 监控与动态任务生成，踩坑经验全记录。',
                category: '数据工程'
            },
            {
                id: 4,
                title: 'PySpark 大数据处理：RDD 到 DataFrame',
                date: '2024-02-15',
                tags: ['Spark', 'PySpark', '大数据'],
                excerpt: '从 RDD 底层原理到 DataFrame/Dataset API 高阶用法，深入理解 Spark 执行模型、宽窄依赖与 Shuffle 机制。',
                category: '计算引擎',
                link: 'https://github.com/wyu215005/PySpark-Big-Data-Processing-From-RDD-to-DataFrame?tab=readme-ov-file'
            },
            {
                id: 5,
                title: 'Hive 维度建模：星型模式与雪花模式',
                date: '2024-03-01',
                tags: ['Hive', '维度建模', '数据仓库'],
                excerpt: '探讨维度建模核心方法论：事实表与维度表设计、缓慢变化维（SCD）处理、代理键策略在 Hive 中的落地实践。',
                category: '数据工程'
            },
            {
                id: 6,
                title: 'Kafka 消息队列：生产者消费者与数据一致性',
                date: '2024-03-15',
                tags: ['Kafka', '消息队列', '实时计算'],
                excerpt: '详解 Kafka Topic/Partition/Offset 核心概念、消息丢失与重复消费场景分析，以及 Python 实战消费者示例。',
                category: '实时计算'
            },
            {
                id: 7,
                title: 'ClickHouse OLAP 查询优化实践',
                date: '2024-04-01',
                tags: ['ClickHouse', 'OLAP', '查询优化'],
                excerpt: '深入 ClickHouse MergeTree 存储引擎、主键稀疏索引与跳数索引的工作原理，以及 JOIN 优化与物化视图使用技巧。',
                category: '数据库'
            },
            {
                id: 8,
                title: 'Python 数据分析：Pandas 高阶操作',
                date: '2024-04-10',
                tags: ['Python', 'Pandas', '数据分析'],
                excerpt: '超越入门的 Pandas 使用技巧：groupby 聚合、pivot_table、窗口函数、内存优化与千万行数据处理方案。',
                category: '数据分析'
            },
            {
                id: 9,
                title: '数据质量治理：从发现到修复的全流程',
                date: '2024-04-20',
                tags: ['数据质量', '数据治理', '数据工程'],
                excerpt: '构建数据质量监控体系：完整性、准确性、一致性、及时性四个维度的检测规则设计，以及异常告警与修复流程。',
                category: '数据治理',
                link: 'https://github.com/wyu215005/Data-Quality-Governance-The-End-to-End-Lifecycle-from-Discovery-to-Remediation'
            },
            {
                id: 10,
                title: 'ETL vs ELT：现代数仓的架构选择',
                date: '2024-05-01',
                tags: ['ETL', 'ELT', '数据仓库', '架构设计'],
                excerpt: '对比 ETL 和 ELT 在不同业务场景下的取舍：云数仓时代 ELT 的优势、dbt 工具链实践与数据变换层设计。',
                category: '数据工程'
            },
            {
                id: 11,
                title: 'Linux 常用命令速查：数据工程师必备',
                date: '2024-05-15',
                tags: ['Linux', '运维', '工具'],
                excerpt: '数据工程师高频 Linux 场景：文件处理、进程管理、日志分析、Shell 脚本、定时任务与网络排查命令汇总。',
                category: '开发工具'
            },
            {
                id: 12,
                title: 'Docker 容器化大数据开发环境搭建',
                date: '2024-06-01',
                tags: ['Docker', '容器化', '开发环境'],
                excerpt: '使用 Docker Compose 快速搭建本地 Hadoop/Hive/Spark/Kafka 开发环境，告别繁琐的环境配置，一键启动大数据集群。',
                category: '开发工具'
            },
            {
                id: 13,
                title: 'Shuffle 的魔法：MapReduce 工作原理逐步详解',
                date: '2024-06-20',
                tags: ['MapReduce', 'Hadoop', '大数据', 'Shuffle'],
                excerpt: '深入 MapReduce 编程模型：Map 阶段、Shuffle 阶段与 Reduce 阶段的全流程解析，揭秘 Shuffle 如何实现跨节点数据重新分组与排序，助你彻底理解分布式计算核心机制。',
                category: '计算引擎',
                link: 'https://github.com/wyu215005/The-Magic-of-Shuffle-A-Step-by-Step-Guide-to-MapReduce'
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

        container.innerHTML = this.filteredArticles.map(article => {
            const safeLink = article.link && /^https:\/\/github\.com\//.test(article.link)
                ? article.link : null;
            const githubBadge = safeLink
                ? `<span class="article-github-badge">🔗 查看 GitHub 项目</span>`
                : '';
            const cardHtml = `
                <div class="article-card fade-in${safeLink ? ' article-card-linked' : ''}" role="article"${safeLink ? '' : ' tabindex="0"'} aria-label="${article.title}">
                    <div class="article-card-header">
                        <div class="article-card-title">${this.escapeHtml(article.title)}</div>
                    </div>
                    <div class="article-card-body">
                        <div class="article-card-meta">
                            📅 ${article.date} | 📁 ${article.category}
                        </div>
                        <div class="article-card-excerpt">${this.escapeHtml(article.excerpt)}</div>
                        <div class="article-card-tags">
                            ${article.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                        ${githubBadge}
                    </div>
                </div>`;
            if (safeLink) {
                return `<a href="${this.escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer" class="article-card-link" aria-label="${this.escapeHtml(article.title)} - 在 GitHub 中打开">${cardHtml}</a>`;
            }
            return cardHtml;
        }).join('');
    }

    /**
     * 渲染标签筛选
     */
    renderTags() {
        const container = document.getElementById('tagContainer');
        if (!container) return;

        // 收集所有标签并统计文章数
        const tagCount = {};
        this.articles.forEach(article => {
            article.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });

        // 按文章数降序排列
        const sortedTags = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);

        container.innerHTML = sortedTags.map(tag => `
            <span class="tag" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>
        `).join('');
    }

    /**
     * 设置搜索框事件
     */
    setupSearch() {
        const searchBox = document.getElementById('searchBox');
        if (!searchBox) return;

        searchBox.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
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
                this.toggleTag(tag, e.target);
            }
        });
    }

    /**
     * 切换标签选中状态
     */
    toggleTag(tag, el) {
        if (this.activeTags.has(tag)) {
            this.activeTags.delete(tag);
        } else {
            this.activeTags.add(tag);
        }
        el.classList.toggle('active');
        this.filterArticles(document.getElementById('searchBox')?.value?.toLowerCase().trim() || '');
    }

    /**
     * 过滤文章
     */
    filterArticles(query) {
        this.filteredArticles = this.articles.filter(article => {
            const matchesQuery = !query ||
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query) ||
                article.tags.some(tag => tag.toLowerCase().includes(query));

            const matchesTags = this.activeTags.size === 0 ||
                Array.from(this.activeTags).some(tag => article.tags.includes(tag));

            return matchesQuery && matchesTags;
        });

        this.renderArticles();
    }

    /**
     * 转义 HTML，防止 XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    new ArticlesManager();
});
