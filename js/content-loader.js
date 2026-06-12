/**
 * 内容加载器 - 性能优化版
 * 加载文章、视频、音频等内容
 */

class ContentLoader {
    constructor() {
        this.cache = new Map();  // 缓存已加载的内容
        this.loading = false;
    }

    /**
     * 加载文章详情
     */
    async loadArticle(articleId) {
        // 检查缓存
        if (this.cache.has(articleId)) {
            this.displayArticle(this.cache.get(articleId));
            return;
        }

        // 显示加载动画
        this.showLoading();

        try {
            // 从配置中获取文章（实际应该从轻量数据库或JSON文件加载）
            const article = CONFIG.content.articles.find(a => a.id === articleId);
            
            if (!article) {
                throw new Error('文章不存在');
            }

            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 300));

            // 缓存文章
            this.cache.set(articleId, article);

            // 显示文章
            this.displayArticle(article);

        } catch (error) {
            console.error('加载文章失败:', error);
            this.showError('加载失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示文章内容（魔法书效果）
     */
    displayArticle(article) {
        const panel = document.getElementById('content-panel');
        const content = document.getElementById('panel-content');

        // 构建文章页面HTML
        let html = `
            <button class="back-btn" onclick="window.interactionManager.showArticles()" 
                    style="background: none; border: none; color: var(--primary-light); 
                           font-size: 16px; cursor: pointer; margin-bottom: 20px;">
                ← 返回文章列表
            </button>
            <h2>${article.title}</h2>
            <div class="meta" style="color: var(--text-secondary); margin: 15px 0; font-size: 14px;">
                <span>📅 ${article.date}</span> | 
                <span>📁 ${article.category}</span> | 
                <span>🏷️ ${article.tags.join(', ')}</span>
            </div>
            <div class="article-body" style="line-height: 2; font-size: 16px;">
                ${this.formatContent(article.content)}
            </div>
        `;

        // 添加魔法书动画效果
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
        content.innerHTML = html;

        // 触发重绘
        content.offsetHeight;

        // 淡入动画
        content.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';

        panel.classList.remove('hidden');
        panel.classList.add('visible');
    }

    /**
     * 格式化文章内容（支持简单Markdown）
     */
    formatContent(text) {
        // 标题
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // 粗体和斜体
        text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // 链接
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--primary-light);">$1</a>');

        // 图片
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 10px; margin: 15px 0;">');

        // 代码块
        text = text.replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; overflow-x: auto;"><code>$1</code></pre>');

        // 行内代码
        text = text.replace(/`([^`]+)`/g, '<code style="background: rgba(139, 92, 246, 0.2); padding: 2px 6px; border-radius: 4px;">$1</code>');

        // 列表
        text = text.replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');
        text = text.replace(/^\s*[-*+]\s+(.*)$/gim, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // 段落
        text = text.replace(/\n\n/g, '</p><p>');
        text = '<p>' + text + '</p>';

        // 清理多余标签
        text = text.replace(/<p><\/p>/g, '');
        text = text.replace(/<p><(h[1-6]|ul|pre)/g, '<$1');
        text = text.replace(/<\/(h[1-6]|ul|pre)><\/p>/g, '</$1>');

        return text;
    }

    /**
     * 显示加载动画
     */
    showLoading() {
        const content = document.getElementById('panel-content');
        content.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <div style="font-size: 40px; animation: float 2s ease-in-out infinite;">📖</div>
                <p style="color: var(--text-secondary); margin-top: 20px;">魔法书正在打开...</p>
            </div>
        `;
    }

    /**
     * 隐藏加载动画
     */
    hideLoading() {
        // 加载完成后会自动替换内容
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        const content = document.getElementById('panel-content');
        content.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #ff6b6b;">
                <div style="font-size: 40px; margin-bottom: 20px;">😢</div>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * 预加载内容（性能优化）
     */
    preload(ids) {
        ids.forEach(id => {
            if (!this.cache.has(id)) {
                // 静默加载
                this.loadArticle(id);
            }
        });
    }

    /**
     * 清理缓存（内存优化）
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 销毁实例
     */
    dispose() {
        this.clearCache();
    }
}

// 导出
window.ContentLoader = ContentLoader;
