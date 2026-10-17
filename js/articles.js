/**
 * 文章管理模块
 * 处理文章显示、搜索、分类与标签过滤
 *
 * 数据说明（真实性原则）：
 *  - articles：已发布的学习笔记/工程复盘，全部对应真实存在的公开 GitHub 仓库，
 *    date 为对应仓库的实际创建日期，不使用动态伪造日期。
 *  - topics：写作计划中的选题，明确标注"计划中"，与已发布文章分开渲染，
 *    不计入文章统计，不伪装成已发布内容。
 */

class ArticlesManager {
    constructor() {
        // 已发布：真实存在的学习笔记/复盘仓库
        this.articles = [
            {
                title: 'BI 数仓迁移与分层加工重构：真实项目工程复盘',
                brief: '面向 BI 的 SQL Server 数仓迁移与加工链路重构的脱敏复盘：业务指标口径与数据粒度、ODS/DWD/DWS/ADS 分层加工、17 个依赖批次的 ETL 编排、Check List 故障复盘与 BI 换源对账验证。',
                category: '工程复盘',
                tags: ['数仓迁移', 'T-SQL', 'SSIS', 'Power BI', '数据质量'],
                date: '2026-10-17',
                link: 'https://github.com/wyu215005/bi-warehouse-migration-case-study'
            },
            {
                title: '数据仓库分层架构：ODS / DWD / DWS / ADS 实践笔记',
                brief: '围绕 ODS/DWD/DWS/ADS 四层结构整理的数仓分层学习笔记：每层的职责边界、命名规范与数据流转方式，并结合实际项目中的分层开发经验进行梳理。',
                category: '数据仓库',
                tags: ['数仓分层', 'ODS', 'DWD', 'DWS', 'ADS'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/DataWarehouse-Layered-Architecture-ODS-DWD-DWM-DWS-ADS-'
            },
            {
                title: 'Hive 维度建模：星型模式与雪花模式',
                brief: '维度建模学习笔记：事实表与维度表的设计要点、星型与雪花模式的取舍，以及缓慢变化维（SCD）的常见处理方式。',
                category: '数据仓库',
                tags: ['Hive', '维度建模', '星型模型', '雪花模型'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/Hive-Dimensional-Modeling-Mastering-Star-and-Snowflake-Schemas'
            },
            {
                title: '数据质量治理：从发现到修复的全流程',
                brief: '数据质量学习笔记：完整性、准确性、一致性、及时性四类检测规则的设计思路，以及异常发现、定位与修复的流程整理。',
                category: '数据质量',
                tags: ['数据质量', '数据治理', '核验规则'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/Data-Quality-Governance-The-End-to-End-Lifecycle-from-Discovery-to-Remediation'
            },
            {
                title: 'PySpark 大数据处理：从 RDD 到 DataFrame',
                brief: 'PySpark 学习笔记：从 RDD 基础 API 到 DataFrame 与 Spark SQL，梳理执行模型、宽窄依赖与 Shuffle 机制的理解。',
                category: '大数据基础',
                tags: ['PySpark', 'Spark', 'RDD', 'DataFrame'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/PySpark-Big-Data-Processing-From-RDD-to-DataFrame'
            },
            {
                title: 'Shuffle 的魔法：MapReduce 工作原理逐步详解',
                brief: 'MapReduce 学习笔记：Map、Shuffle、Reduce 三个阶段的流程拆解，重点理解 Shuffle 如何完成跨节点的数据重分区与排序。',
                category: '大数据基础',
                tags: ['MapReduce', 'Shuffle', 'Hadoop'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/The-Magic-of-Shuffle-A-Step-by-Step-Guide-to-MapReduce'
            }
        ];

        // 写作计划：真实方向的选题，尚未发布
        this.topics = [
            { name: 'T-SQL 窗口函数实战笔记', tags: ['SQL Server', '窗口函数'] },
            { name: '存储过程开发与重构', tags: ['T-SQL', '存储过程'] },
            { name: '业务指标口径拆解方法', tags: ['数仓', '指标口径'] },
            { name: '主题宽表设计笔记', tags: ['DWS', '宽表'] },
            { name: 'SSIS 批次编排与异常日志', tags: ['SSIS', 'ETL'] },
            { name: '数据质量核验方案', tags: ['数据质量', '核验'] },
            { name: 'Power BI 指标迁移与 DAX', tags: ['Power BI', 'DAX'] },
            { name: '静态数据血缘梳理方法', tags: ['血缘', '元数据'] },
            { name: 'Hadoop / HDFS / YARN 基础实验复盘', tags: ['Hadoop', 'HDFS', 'YARN'] },
            { name: 'Spark 入门学习路线', tags: ['Spark', '学习中'] },
            { name: 'Hive 基础与湖仓概念', tags: ['Hive', 'Lakehouse'] }
        ];

        this.filteredArticles = [...this.articles];
        this.activeTags = new Set();
        this.activeCategory = null;
        this.init();
    }

    init() {
        this.renderArticles();
        this.renderTags();
        this.renderCategories();
        this.renderLatest();
        this.renderTopics();
        this.setupSearch();
        this.setupTagFilter();
        this.setupCategoryFilter();
    }

    // 渲染文章列表（文章页）
    renderArticles() {
        const container = document.getElementById('articleList');
        if (!container) return;

        if (this.filteredArticles.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <div style="font-size: 2.2rem; margin-bottom: 0.8rem;">🐟</div>
                    <p>没有找到匹配的文章，换个关键词试试～</p>
                </div>`;
            this.updateCount();
            return;
        }

        container.innerHTML = this.filteredArticles.map(article => `
            <div class="article-card">
                <a href="${article.link}" target="_blank" rel="noopener" class="article-card-link">
                    <div class="article-card-header">
                        <h3 class="article-card-title">${article.title}</h3>
                    </div>
                    <div class="article-card-body">
                        <div class="article-card-meta">
                            <span>📅 ${article.date}</span>
                            <span class="meta-cat">${article.category}</span>
                        </div>
                        <p class="article-card-excerpt">${article.brief}</p>
                        <div class="article-card-tags">
                            ${article.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
                        </div>
                        <span class="article-github-badge">📄 GitHub 仓库</span>
                    </div>
                </a>
            </div>
        `).join('');

        this.updateCount();
    }

    // 渲染分类筛选（文章页）
    renderCategories() {
        const container = document.getElementById('categoryContainer');
        if (!container) return;

        const categories = [...new Set(this.articles.map(a => a.category))];
        container.innerHTML = `
            <button class="cat-chip ${this.activeCategory === null ? 'active' : ''}" data-category="">全部</button>
            ${categories.map(cat => `
                <button class="cat-chip ${this.activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>
            `).join('')}`;
    }

    // 渲染标签筛选（文章页）
    renderTags() {
        const container = document.getElementById('tagContainer');
        if (!container) return;

        const allTags = [...new Set(this.articles.flatMap(a => a.tags))];
        container.innerHTML = allTags.map(tag => `
            <span class="tag ${this.activeTags.has(tag) ? 'active' : ''}" data-tag="${tag}">${tag}</span>
        `).join('');
    }

    // 渲染最新文章（首页）
    renderLatest() {
        const container = document.getElementById('latestArticles');
        if (!container) return;

        const latest = [...this.articles]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 3);

        container.innerHTML = latest.map(article => {
            const href = article.link || 'articles.html';
            const ext = article.link ? ' target="_blank" rel="noopener"' : '';
            return `
            <a href="${href}"${ext} class="article-preview">
                <div class="article-card-meta">
                    <span>📅 ${article.date}</span>
                    <span class="meta-cat">${article.category}</span>
                </div>
                <h3 class="article-card-title">${article.title}</h3>
                <p class="article-card-excerpt">${article.brief}</p>
            </a>`;
        }).join('');
    }

    // 渲染选题池（文章页底部，明确标注为计划）
    renderTopics() {
        const container = document.getElementById('topicList');
        if (!container) return;

        container.innerHTML = this.topics.map(topic => `
            <div class="topic-item">
                <span class="topic-name">${topic.name}</span>
                <span class="topic-status">${topic.tags.join(' · ')} · 计划中</span>
            </div>
        `).join('');
    }

    // 搜索
    setupSearch() {
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }
    }

    search(query) {
        this.currentQuery = query.toLowerCase();
        this.applyFilters();
    }

    // 标签筛选
    setupTagFilter() {
        const container = document.getElementById('tagContainer');
        if (container) {
            container.addEventListener('click', (e) => {
                const tagEl = e.target.closest('.tag');
                if (!tagEl) return;
                const tag = tagEl.dataset.tag;
                if (this.activeTags.has(tag)) {
                    this.activeTags.delete(tag);
                } else {
                    this.activeTags.add(tag);
                }
                this.renderTags();
                this.applyFilters();
            });
        }
    }

    // 分类筛选
    setupCategoryFilter() {
        const container = document.getElementById('categoryContainer');
        if (container) {
            container.addEventListener('click', (e) => {
                const chipEl = e.target.closest('.cat-chip');
                if (!chipEl) return;
                this.activeCategory = chipEl.dataset.category || null;
                this.renderCategories();
                this.applyFilters();
            });
        }
    }

    // 应用全部筛选条件
    applyFilters() {
        this.filteredArticles = this.articles.filter(article => {
            // 分类匹配
            if (this.activeCategory && article.category !== this.activeCategory) return false;
            // 标签匹配（选中的标签需全部命中）
            for (const tag of this.activeTags) {
                if (!article.tags.includes(tag)) return false;
            }
            // 搜索匹配
            if (this.currentQuery) {
                const haystack = (article.title + article.brief + article.category + article.tags.join(' ')).toLowerCase();
                if (!haystack.includes(this.currentQuery)) return false;
            }
            return true;
        });
        this.renderArticles();
    }

    updateCount() {
        const countEl = document.getElementById('articleCount');
        if (countEl) {
            countEl.textContent = `共 ${this.filteredArticles.length} 篇`;
        }
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ArticlesManager();
});
