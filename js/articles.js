/**
 * 文章管理模块
 * 处理文章显示、搜索、分类与标签过滤
 *
 * 数据说明（真实性原则）：
 *  - articles：已发布的学习笔记，全部对应真实存在的公开 GitHub 仓库，
 *    date 为仓库实际创建日期（2026-03-13），不使用动态伪造日期。
 *  - topics：写作计划中的选题，明确标注"计划中"，与已发布文章分开渲染，
 *    不计入文章统计，不伪装成已发布内容。
 *
 * 多语言说明：
 *  - title/brief/category/tags 为中文基准数据，筛选逻辑始终基于这些内部键；
 *  - titleEn/briefEn/titleFr/briefFr 为展示用翻译（缺失时回退中文）；
 *  - category/tags 的显示层翻译走 i18n 字典（articles.cat* / articles.tags.*），
 *    未映射的技术名词（ODS、Hive 等）原样显示。
 */

class ArticlesManager {
    constructor() {
        // 已发布：真实存在的学习笔记仓库
        this.articles = [
            {
                title: '数据仓库分层架构：ODS / DWD / DWS / ADS 实践笔记',
                brief: '围绕 ODS/DWD/DWS/ADS 四层结构整理的数仓分层学习笔记：每层的职责边界、命名规范与数据流转方式，并结合实际项目中的分层开发经验进行梳理。',
                titleEn: 'Data Warehouse Layered Architecture: ODS / DWD / DWS / ADS in Practice',
                briefEn: 'Learning notes on the ODS/DWD/DWS/ADS layered structure: each layer\u2019s responsibility boundary, naming conventions and data flow, organized together with hands-on layered development experience from a real project.',
                titleFr: 'Architecture en couches du Data Warehouse : notes de pratique ODS / DWD / DWS / ADS',
                briefFr: 'Notes d\u2019apprentissage sur la structure en couches ODS/DWD/DWS/ADS : responsabilités de chaque couche, conventions de nommage et flux de données, complétées par l\u2019expérience d\u2019un développement en couches en projet réel.',
                category: '数据仓库',
                tags: ['数仓分层', 'ODS', 'DWD', 'DWS', 'ADS'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/DataWarehouse-Layered-Architecture-ODS-DWD-DWM-DWS-ADS-'
            },
            {
                title: 'Hive 维度建模：星型模式与雪花模式',
                brief: '维度建模学习笔记：事实表与维度表的设计要点、星型与雪花模式的取舍，以及缓慢变化维（SCD）的常见处理方式。',
                titleEn: 'Hive Dimensional Modeling: Star and Snowflake Schemas',
                briefEn: 'Notes on dimensional modeling: fact and dimension table design, choosing between star and snowflake schemas, and common handling of slowly changing dimensions (SCD).',
                titleFr: 'Modélisation dimensionnelle Hive : schémas en étoile et en flocon',
                briefFr: 'Notes sur la modélisation dimensionnelle : conception des tables de faits et de dimensions, choix entre schémas en étoile et en flocon, et traitement courant des dimensions à évolution lente (SCD).',
                category: '数据仓库',
                tags: ['Hive', '维度建模', '星型模型', '雪花模型'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/Hive-Dimensional-Modeling-Mastering-Star-and-Snowflake-Schemas'
            },
            {
                title: '数据质量治理：从发现到修复的全流程',
                brief: '数据质量学习笔记：完整性、准确性、一致性、及时性四类检测规则的设计思路，以及异常发现、定位与修复的流程整理。',
                titleEn: 'Data Quality Governance: From Discovery to Remediation',
                briefEn: 'Notes on data quality: designing completeness, accuracy, consistency and timeliness checks, plus the workflow for detecting, locating and fixing data issues.',
                titleFr: 'Gouvernance de la qualité des données : du signalement à la correction',
                briefFr: 'Notes sur la qualité des données : conception des contrôles d\u2019exhaustivité, d\u2019exactitude, de cohérence et de ponctualité, et processus de détection, localisation et correction des anomalies.',
                category: '数据质量',
                tags: ['数据质量', '数据治理', '核验规则'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/Data-Quality-Governance-The-End-to-End-Lifecycle-from-Discovery-to-Remediation'
            },
            {
                title: 'PySpark 大数据处理：从 RDD 到 DataFrame',
                brief: 'PySpark 学习笔记：从 RDD 基础 API 到 DataFrame 与 Spark SQL，梳理执行模型、宽窄依赖与 Shuffle 机制的理解。',
                titleEn: 'PySpark Big Data Processing: From RDD to DataFrame',
                briefEn: 'PySpark notes: from the RDD API to DataFrame and Spark SQL, mapping out the execution model, narrow/wide dependencies and the shuffle mechanism.',
                titleFr: 'Traitement Big Data avec PySpark : de RDD à DataFrame',
                briefFr: 'Notes PySpark : de l\u2019API RDD à DataFrame et Spark SQL, avec une vue d\u2019ensemble du modèle d\u2019exécution, des dépendances étroites/larges et du mécanisme de shuffle.',
                category: '大数据基础',
                tags: ['PySpark', 'Spark', 'RDD', 'DataFrame'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/PySpark-Big-Data-Processing-From-RDD-to-DataFrame'
            },
            {
                title: 'Shuffle 的魔法：MapReduce 工作原理逐步详解',
                brief: 'MapReduce 学习笔记：Map、Shuffle、Reduce 三个阶段的流程拆解，重点理解 Shuffle 如何完成跨节点的数据重分区与排序。',
                titleEn: 'The Magic of Shuffle: MapReduce Explained Step by Step',
                briefEn: 'MapReduce notes: breaking down the Map, Shuffle and Reduce stages, with a focus on how Shuffle handles cross-node repartitioning and sorting.',
                titleFr: 'La magie du Shuffle : MapReduce expliqué étape par étape',
                briefFr: 'Notes MapReduce : décomposition des étapes Map, Shuffle et Reduce, avec un accent sur la façon dont le Shuffle réalise le repartitionnement et le tri entre nœuds.',
                category: '大数据基础',
                tags: ['MapReduce', 'Shuffle', 'Hadoop'],
                date: '2026-03-13',
                link: 'https://github.com/wyu215005/The-Magic-of-Shuffle-A-Step-by-Step-Guide-to-MapReduce'
            }
        ];

        // 写作计划：真实方向的选题，尚未发布
        this.topics = [
            { name: 'T-SQL 窗口函数实战笔记', nameEn: 'T-SQL Window Functions in Practice', nameFr: 'Fonctions de fenêtrage T-SQL en pratique', tags: ['SQL Server', '窗口函数'] },
            { name: '存储过程开发与重构', nameEn: 'Stored Procedure Development & Refactoring', nameFr: 'Développement et refactoring de procédures stockées', tags: ['T-SQL', '存储过程'] },
            { name: '业务指标口径拆解方法', nameEn: 'Decomposing Business Metric Definitions', nameFr: 'Décomposer les définitions d\u2019indicateurs métier', tags: ['数仓', '指标口径'] },
            { name: '主题宽表设计笔记', nameEn: 'Design Notes on Subject-Oriented Wide Tables', nameFr: 'Notes de conception de tables larges par sujet', tags: ['DWS', '宽表'] },
            { name: 'SSIS 批次编排与异常日志', nameEn: 'SSIS Batch Orchestration & Error Logging', nameFr: 'Orchestration des lots SSIS et journaux d\u2019erreurs', tags: ['SSIS', 'ETL'] },
            { name: '数据质量核验方案', nameEn: 'Data Quality Validation Approach', nameFr: 'Démarche de validation de la qualité des données', tags: ['数据质量', '核验'] },
            { name: 'Power BI 指标迁移与 DAX', nameEn: 'Migrating Metrics to Power BI & DAX', nameFr: 'Migration des indicateurs vers Power BI et DAX', tags: ['Power BI', 'DAX'] },
            { name: '静态数据血缘梳理方法', nameEn: 'Mapping Static Data Lineage', nameFr: 'Cartographie statique du lignage de données', tags: ['血缘', '元数据'] },
            { name: 'Hadoop / HDFS / YARN 基础实验复盘', nameEn: 'Hadoop / HDFS / YARN Labs Retrospective', nameFr: 'Retour sur les TP Hadoop / HDFS / YARN', tags: ['Hadoop', 'HDFS', 'YARN'] },
            { name: 'Spark 入门学习路线', nameEn: 'A Beginner\u2019s Path into Spark', nameFr: 'Parcours d\u2019initiation à Spark', tags: ['Spark', '学习中'] },
            { name: 'Hive 基础与湖仓概念', nameEn: 'Hive Basics & Lakehouse Concepts', nameFr: 'Bases de Hive et concepts de lakehouse', tags: ['Hive', 'Lakehouse'] }
        ];

        this.filteredArticles = [...this.articles];
        this.activeTags = new Set();
        this.activeCategory = null;
        this.init();
        this.bindLangChange();
    }

    /* ---------- 多语言辅助 ---------- */

    lang() {
        return window.FishRainI18n ? FishRainI18n.get() : 'zh-CN';
    }

    t(key, vars) {
        return window.FishRainI18n ? FishRainI18n.t(key, vars) : key;
    }

    // 取当前语言的标题/摘要（翻译缺失时回退中文原文）
    localized(item) {
        const lang = this.lang();
        if (lang === 'zh-CN') return { title: item.title, brief: item.brief };
        const suffix = lang === 'fr' ? 'Fr' : 'En';
        return {
            title: item['title' + suffix] || item.title,
            brief: item['brief' + suffix] || item.brief
        };
    }

    // 选题名（写作计划）
    topicName(topic) {
        const lang = this.lang();
        if (lang === 'zh-CN') return topic.name;
        const key = lang === 'fr' ? 'nameFr' : 'nameEn';
        return topic[key] || topic.name;
    }

    // 标签显示层翻译：查字典映射，未映射的技术名词原样显示
    tagLabel(tag) {
        const lang = this.lang();
        if (lang === 'zh-CN') return tag;
        const dict = window.FISHRAIN_I18N && window.FISHRAIN_I18N[lang];
        const mapped = dict && dict.articles && dict.articles.tags && dict.articles.tags[tag];
        return mapped || tag;
    }

    // 分类显示层翻译（内部键保持中文，不破坏筛选逻辑）
    catLabel(cat) {
        const map = { '数据仓库': 'articles.catDw', '数据质量': 'articles.catDq', '大数据基础': 'articles.catBd' };
        return map[cat] ? this.t(map[cat]) : cat;
    }

    // 语言切换后重渲染（保留筛选与搜索状态）
    bindLangChange() {
        window.addEventListener('fishrain:langchange', () => {
            this.renderArticles();
            this.renderTags();
            this.renderCategories();
            this.renderLatest();
            this.renderTopics();
        });
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
                    <p>${this.t('articles.empty')}</p>
                </div>`;
            this.updateCount();
            return;
        }

        container.innerHTML = this.filteredArticles.map(article => {
            const L = this.localized(article);
            return `
            <div class="article-card">
                <a href="${article.link}" target="_blank" rel="noopener" class="article-card-link">
                    <div class="article-card-header">
                        <h3 class="article-card-title">${L.title}</h3>
                    </div>
                    <div class="article-card-body">
                        <div class="article-card-meta">
                            <span>📅 ${article.date}</span>
                            <span class="meta-cat">${this.catLabel(article.category)}</span>
                        </div>
                        <p class="article-card-excerpt">${L.brief}</p>
                        <div class="article-card-tags">
                            ${article.tags.map(tag => `<span class="tag" data-tag="${tag}">${this.tagLabel(tag)}</span>`).join('')}
                        </div>
                        <span class="article-github-badge">${this.t('articles.github')}</span>
                    </div>
                </a>
            </div>
        `;}).join('');

        this.updateCount();
    }

    // 渲染分类筛选（文章页）
    renderCategories() {
        const container = document.getElementById('categoryContainer');
        if (!container) return;

        const categories = [...new Set(this.articles.map(a => a.category))];
        container.innerHTML = `
            <button class="cat-chip ${this.activeCategory === null ? 'active' : ''}" data-category="">${this.t('articles.all')}</button>
            ${categories.map(cat => `
                <button class="cat-chip ${this.activeCategory === cat ? 'active' : ''}" data-category="${cat}">${this.catLabel(cat)}</button>
            `).join('')}`;
    }

    // 渲染标签筛选（文章页）
    renderTags() {
        const container = document.getElementById('tagContainer');
        if (!container) return;

        const allTags = [...new Set(this.articles.flatMap(a => a.tags))];
        container.innerHTML = allTags.map(tag => `
            <span class="tag ${this.activeTags.has(tag) ? 'active' : ''}" data-tag="${tag}">${this.tagLabel(tag)}</span>
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
            const L = this.localized(article);
            return `
            <a href="${href}"${ext} class="article-preview">
                <div class="article-card-meta">
                    <span>📅 ${article.date}</span>
                    <span class="meta-cat">${this.catLabel(article.category)}</span>
                </div>
                <h3 class="article-card-title">${L.title}</h3>
                <p class="article-card-excerpt">${L.brief}</p>
            </a>`;
        }).join('');
    }

    // 渲染选题池（文章页底部，明确标注为计划）
    renderTopics() {
        const container = document.getElementById('topicList');
        if (!container) return;

        container.innerHTML = this.topics.map(topic => `
            <div class="topic-item">
                <span class="topic-name">${this.topicName(topic)}</span>
                <span class="topic-status">${topic.tags.map(t => this.tagLabel(t)).join(' · ')} · ${this.t('articles.planned')}</span>
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
            // 搜索匹配（同时匹配原文与当前语言译文）
            if (this.currentQuery) {
                const L = this.localized(article);
                const haystack = (
                    article.title + article.brief + article.category + article.tags.join(' ') + ' ' +
                    L.title + L.brief + this.catLabel(article.category) + article.tags.map(t => this.tagLabel(t)).join(' ')
                ).toLowerCase();
                if (!haystack.includes(this.currentQuery)) return false;
            }
            return true;
        });
        this.renderArticles();
    }

    updateCount() {
        const countEl = document.getElementById('articleCount');
        if (countEl) {
            countEl.textContent = this.t('articles.count', { n: this.filteredArticles.length });
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
