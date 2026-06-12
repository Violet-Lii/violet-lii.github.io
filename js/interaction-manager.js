/**
 * 交互管理器 - 性能优化版
 * 处理鼠标点击、射线检测、内容展示
 */

class InteractionManager {
    constructor(camera, scene, controller) {
        this.camera = camera;
        this.scene = scene;
        this.controller = controller;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 可交互对象列表
        this.interactiveObjects = [];
        
        // 当前选中的对象
        this.selectedObject = null;
        
        // 提示框元素
        this.tooltip = null;
        
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        // 创建提示框
        this.createTooltip();
        
        // 监听鼠标点击
        this.controller.domElement.addEventListener('click', (e) => this.onClick(e));
        
        // 监听鼠标移动（显示提示）
        this.controller.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    /**
     * 创建提示框
     */
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'interaction-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: rgba(139, 92, 246, 0.9);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(this.tooltip);
    }

    /**
     * 注册可交互对象
     */
    register(object) {
        if (object.userData && object.userData.type === 'furniture') {
            this.interactiveObjects.push(object);
        }
    }

    /**
     * 鼠标移动事件
     */
    onMouseMove(event) {
        // 计算归一化设备坐标
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // 检测鼠标悬停
        this.checkHover();
    }

    /**
     * 鼠标点击事件
     */
    onClick(event) {
        // 计算归一化设备坐标
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // 检测点击
        this.checkClick();
    }

    /**
     * 检测鼠标悬停
     */
    checkHover() {
        // 设置射线
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 检测相交
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
        
        if (intersects.length > 0) {
            // 找到可交互对象
            const object = this.findInteractiveParent(intersects[0].object);
            
            if (object && this.isInRange(object)) {
                // 显示提示
                this.showTooltip(object.userData.name, intersects[0].point);
                this.controller.domElement.style.cursor = 'pointer';
            } else {
                this.hideTooltip();
                this.controller.domElement.style.cursor = 'default';
            }
        } else {
            this.hideTooltip();
            this.controller.domElement.style.cursor = 'default';
        }
    }

    /**
     * 检测点击
     */
    checkClick() {
        // 设置射线
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 检测相交
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
        
        if (intersects.length > 0) {
            // 找到可交互对象
            const object = this.findInteractiveParent(intersects[0].object);
            
            if (object && this.isInRange(object)) {
                // 执行交互动作
                this.executeAction(object);
            }
        }
    }

    /**
     * 查找可交互的父对象
     */
    findInteractiveParent(object) {
        let current = object;
        while (current) {
            if (current.userData && current.userData.type === 'furniture') {
                return current;
            }
            current = current.parent;
        }
        return null;
    }

    /**
     * 检查是否在交互范围内
     */
    isInRange(object) {
        const distance = this.controller.getPosition().distanceTo(object.position);
        return distance <= CONFIG.interaction.maxDistance;
    }

    /**
     * 显示提示框
     */
    showTooltip(name, position) {
        const names = {
            'bookshelf': '📚 书架 - 点击查看文章',
            'computer': '💻 电脑 - 点击观看视频',
            'window': '🪟 窗户 - 点击查看照片',
            'piano': '🎹 钢琴 - 点击播放音乐',
            'speaker': '🔊 音箱 - 点击播放音频',
            'notebook': '📒 笔记本 - 点击查看随笔',
            'bed': '🛏️ 床 - 休息一下吧',
            'desk': '🪑 桌子'
        };
        
        this.tooltip.textContent = names[name] || name;
        this.tooltip.style.display = 'block';
        
        // 更新位置（跟随鼠标）
        const mousePos = new THREE.Vector3();
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.tooltip.style.left = (event.clientX + 15) + 'px';
        this.tooltip.style.top = (event.clientY - 30) + 'px';
    }

    /**
     * 隐藏提示框
     */
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    /**
     * 执行交互动作
     */
    executeAction(object) {
        const action = object.userData.action;
        const name = object.userData.name;
        
        // 播放点击动画
        this.playClickAnimation(object);
        
        // 执行对应动作
        switch (action) {
            case 'showArticles':
                this.showArticles();
                break;
            case 'showVideos':
                this.showVideos();
                break;
            case 'showPhotos':
                this.showPhotos();
                break;
            case 'playMusic':
                this.playMusic();
                break;
            case 'playAudio':
                this.playAudio();
                break;
            case 'showNotes':
                this.showNotes();
                break;
            default:
                console.log(`Interacted with: ${name}`);
        }
    }

    /**
     * 播放点击动画
     */
    playClickAnimation(object) {
        // 使用GSAP创建缩放动画
        if (typeof gsap !== 'undefined') {
            gsap.to(object.scale, {
                x: 1.1,
                y: 1.1,
                z: 1.1,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: "power2.out"
            });
        }
    }

    /**
     * 显示文章列表
     */
    showArticles() {
        const panel = document.getElementById('content-panel');
        const content = document.getElementById('panel-content');
        
        let html = '<h2>📚 我的文章</h2>';
        html += '<p style="color: var(--text-secondary); margin-bottom: 20px;">点击魔法书查看详情 ✨</p>';
        
        CONFIG.content.articles.forEach(article => {
            html += `
                <div class="article-card" onclick="window.contentLoader.loadArticle(${article.id})">
                    <h4>${article.title}</h4>
                    <div class="meta">
                        <span>📅 ${article.date}</span> | 
                        <span>📁 ${article.category}</span> | 
                        <span>🏷️ ${article.tags.join(', ')}</span>
                    </div>
                    <div class="summary">${article.summary}</div>
                </div>
            `;
        });
        
        content.innerHTML = html;
        panel.classList.remove('hidden');
        panel.classList.add('visible');
    }

    /**
     * 显示视频列表
     */
    showVideos() {
        const panel = document.getElementById('content-panel');
        const content = document.getElementById('panel-content');
        
        let html = '<h2>🎬 我的视频</h2>';
        html += '<p style="color: var(--text-secondary); margin-bottom: 20px;">点击电脑屏幕播放 💜</p>';
        
        CONFIG.content.videos.forEach(video => {
            html += `
                <div class="article-card" onclick="window.open('${video.url}', '_blank')">
                    <h4>${video.title}</h4>
                    <p style="color: var(--text-secondary);">点击在新窗口播放</p>
                </div>
            `;
        });
        
        content.innerHTML = html;
        panel.classList.remove('hidden');
        panel.classList.add('visible');
    }

    /**
     * 显示照片墙
     */
    showPhotos() {
        const panel = document.getElementById('content-panel');
        const content = document.getElementById('panel-content');
        
        let html = '<h2>🪟 照片墙</h2>';
        html += '<p style="color: var(--text-secondary); margin-bottom: 20px;">窗外的风景 🌌</p>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">';
        
        CONFIG.content.photos.forEach(photo => {
            html += `
                <div style="border-radius: 10px; overflow: hidden; border: 2px solid var(--glass-border);">
                    <img src="${photo.url}" alt="${photo.title}" style="width: 100%; height: 150px; object-fit: cover;">
                    <div style="padding: 10px; text-align: center;">${photo.title}</div>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
        panel.classList.remove('hidden');
        panel.classList.add('visible');
    }

    /**
     * 播放音乐
     */
    playMusic() {
        alert('🎹 钢琴音乐播放中...（示例）\n\n实际使用时可以加载你的音乐文件');
    }

    /**
     * 播放音频
     */
    playAudio() {
        alert('🔊 音频播放中...（示例）\n\n实际使用时可以加载你的音频文件');
    }

    /**
     * 显示随笔
     */
    showNotes() {
        const panel = document.getElementById('content-panel');
        const content = document.getElementById('panel-content');
        
        let html = '<h2>📒 我的随笔</h2>';
        html += '<p style="color: var(--text-secondary); margin-bottom: 20px;">桌上的笔记本 📝</p>';
        html += `
            <div class="article-card">
                <h4>示例随笔</h4>
                <p style="color: var(--text-secondary); line-height: 1.8;">
                    这里是随笔内容...<br>
                    可以写一些日常感悟、心情记录等。<br>
                    支持 Markdown 格式。
                </p>
            </div>
        `;
        
        content.innerHTML = html;
        panel.classList.remove('hidden');
        panel.classList.add('visible');
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
    }
}

// 导出
window.InteractionManager = InteractionManager;
