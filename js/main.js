/**
 * 主程序入口 - 性能优化版
 * 初始化 Three.js 场景、渲染器、控制器等
 */

(function () {
    'use strict';

    // 全局变量
    let scene, camera, renderer;
    let roomBuilder, controller, interactionManager, contentLoader;
    let particles;
    let animationId;
    let fps = 60;
    let frameCount = 0;
    let lastTime = performance.now();

    /**
     * 初始化
     */
    async function init() {
        try {
            // 更新加载进度
            updateLoadingProgress(10);

            // 初始化场景
            initScene();
            updateLoadingProgress(30);

            // 初始化渲染器
            initRenderer();
            updateLoadingProgress(50);

            // 初始化灯光
            initLights();
            updateLoadingProgress(60);

            // 构建房间
            roomBuilder = new RoomBuilder(scene);
            updateLoadingProgress(75);

            // 初始化控制器
            initController();
            updateLoadingProgress(85);

            // 初始化交互管理器
            initInteraction();

            // 初始化内容加载器
            contentLoader = new ContentLoader();
            window.contentLoader = contentLoader;

            // 添加粒子效果
            initParticles();
            updateLoadingProgress(95);

            // 初始化UI事件
            initUI();

            // 隐藏加载界面
            updateLoadingProgress(100);
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('fade-out');
                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                }, 500);
            }, 500);

            // 开始渲染循环
            animate();

            // 性能监控（可选）
            if (CONFIG.performance.showFPS) {
                initFPSMonitor();
            }

            console.log('✅ 豆豆的小阁楼初始化完成！');

        } catch (error) {
            console.error('❌ 初始化失败:', error);
            showInitError(error);
        }
    }

    /**
     * 初始化场景
     */
    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.colors.bg || 0x0F0A1A);
        scene.fog = new THREE.FogExp2(scene.background, 0.05);  // 雾效增加梦幻感
    }

    /**
     * 初始化渲染器
     */
    function initRenderer() {
        const canvas = document.getElementById('room-canvas');
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: CONFIG.performance.enableAntialiasing,
            alpha: false,
            powerPreference: 'high-performance',  // 性能优化
            stencil: false,  // 禁用模板缓冲区
            depth: true
        });

        // 设置像素比（性能优化）
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.performance.maxPixelRatio));
        renderer.setSize(window.innerWidth, window.innerHeight);

        // 禁用阴影（性能优化）
        renderer.shadowMap.enabled = CONFIG.performance.enableShadows;

        // 监听窗口大小变化
        window.addEventListener('resize', onWindowResize);
    }

    /**
     * 初始化灯光
     */
    function initLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, CONFIG.lights.ambientIntensity);
        scene.add(ambientLight);

        // 方向光（模拟月光）
        const directionalLight = new THREE.DirectionalLight(0x8B5CF6, CONFIG.lights.directionalIntensity);
        directionalLight.position.set(0, CONFIG.room.height - 0.5, 0);
        scene.add(directionalLight);

        // 点光源（紫色灯笼效果，限制数量）
        for (let i = 0; i < CONFIG.lights.pointLightCount; i++) {
            const pointLight = new THREE.PointLight(CONFIG.colors.primary, CONFIG.lights.pointLightIntensity, 5);
            pointLight.position.set(
                (Math.random() - 0.5) * CONFIG.room.width * 0.6,
                2 + Math.random() * 1,
                (Math.random() - 0.5) * CONFIG.room.depth * 0.6
            );
            scene.add(pointLight);

            // 可视化光源（小立方体）
            const lightSphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ color: CONFIG.colors.primary })
            );
            lightSphere.position.copy(pointLight.position);
            scene.add(lightSphere);
        }
    }

    /**
     * 初始化控制器
     */
    function initController() {
        camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );

        controller = new FirstPersonController(camera, renderer.domElement);
        window.controller = controller;
    }

    /**
     * 初始化交互管理器
     */
    function initInteraction() {
        interactionManager = new InteractionManager(camera, scene, controller);
        window.interactionManager = interactionManager;

        // 注册可交互对象
        roomBuilder.objects.forEach(obj => {
            interactionManager.register(obj);
        });
    }

    /**
     * 初始化粒子效果（梦幻紫主题）
     */
    function initParticles() {
        const particleCount = CONFIG.particles.count;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // 位置（在房间内随机分布）
            positions[i * 3] = (Math.random() - 0.5) * CONFIG.room.width * 0.8;
            positions[i * 3 + 1] = Math.random() * CONFIG.room.height * 0.6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * CONFIG.room.depth * 0.8;

            // 颜色（紫色系）
            colors[i * 3] = 0.55 + Math.random() * 0.2;  // R
            colors[i * 3 + 1] = 0.36 + Math.random() * 0.2;  // G
            colors[i * 3 + 2] = 0.96 + Math.random() * 0.1;  // B
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: CONFIG.particles.size,
            vertexColors: true,
            transparent: true,
            opacity: CONFIG.particles.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);
    }

    /**
     * 初始化UI事件
     */
    function initUI() {
        // 关闭按钮
        document.getElementById('close-panel').addEventListener('click', () => {
            const panel = document.getElementById('content-panel');
            panel.classList.remove('visible');
            panel.classList.add('hidden');
        });

        // 帮助按钮
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').classList.add('visible');
        });

        // 关闭帮助
        document.getElementById('close-help').addEventListener('click', () => {
            document.getElementById('help-modal').classList.remove('visible');
        });

        // 菜单按钮（可以扩展）
        document.getElementById('menu-btn').addEventListener('click', () => {
            alert('菜单功能开发中...');
        });

        // 5秒后隐藏操作提示
        setTimeout(() => {
            const hint = document.getElementById('controls-hint');
            if (hint) {
                hint.classList.add('hidden');
            }
        }, 5000);
    }

    /**
     * 渲染循环
     */
    function animate() {
        animationId = requestAnimationFrame(animate);

        // 更新控制器（移动）
        if (controller) {
            controller.update();
        }

        // 更新粒子动画
        if (particles) {
            updateParticles();
        }

        // 渲染场景
        renderer.render(scene, camera);

        // 计算FPS
        frameCount++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = currentTime;

            // 更新FPS显示
            if (CONFIG.performance.showFPS) {
                updateFPSDisplay();
            }
        }
    }

    /**
     * 更新粒子动画
     */
    function updateParticles() {
        const positions = particles.geometry.attributes.position.array;
        const time = Date.now() * 0.001;

        for (let i = 0; i < positions.length; i += 3) {
            // 上下浮动
            positions[i + 1] += Math.sin(time + positions[i]) * CONFIG.particles.speed;

            // 边界检测（重置位置）
            if (positions[i + 1] > CONFIG.room.height) {
                positions[i + 1] = 0;
            }
        }

        particles.geometry.attributes.position.needsUpdate = true;

        // 缓慢旋转
        particles.rotation.y += 0.0001;
    }

    /**
     * 窗口大小变化处理
     */
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 更新加载进度
     */
    function updateLoadingProgress(percent) {
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
    }

    /**
     * 显示初始化错误
     */
    function showInitError(error) {
        document.getElementById('loading-screen').innerHTML = `
            <div class="loader">
                <div style="font-size: 60px; margin-bottom: 30px;">😢</div>
                <h2 style="color: #ff6b6b; margin-bottom: 20px;">初始化失败</h2>
                <p style="color: var(--text-secondary); max-width: 500px; line-height: 1.8;">
                    错误信息：${error.message}<br><br>
                    请尝试：<br>
                    1. 刷新页面<br>
                    2. 检查网络连接<br>
                    3. 使用现代浏览器（Chrome/Edge/Firefox）
                </p>
                <button onclick="location.reload()" 
                        style="margin-top: 30px; padding: 12px 30px; 
                               background: var(--primary); color: white; 
                               border: none; border-radius: 25px; cursor: pointer;">
                    刷新页面
                </button>
            </div>
        `;
    }

    /**
     * 初始化FPS监控
     */
    function initFPSMonitor() {
        const fpsDisplay = document.createElement('div');
        fpsDisplay.id = 'fps-display';
        fpsDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.5);
            color: #0f0;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
        `;
        fpsDisplay.textContent = 'FPS: --';
        document.body.appendChild(fpsDisplay);
    }

    /**
     * 更新FPS显示
     */
    function updateFPSDisplay() {
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${fps}`;
            fpsDisplay.style.color = fps > 30 ? '#0f0' : '#ff0';
        }
    }

    /**
     * 清理资源（性能优化）
     */
    function dispose() {
        // 停止渲染循环
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        // 清理Three.js资源
        if (renderer) {
            renderer.dispose();
        }

        // 清理房间构建器
        if (roomBuilder) {
            roomBuilder.dispose();
        }

        // 清理交互管理器
        if (interactionManager) {
            interactionManager.dispose();
        }

        // 清理内容加载器
        if (contentLoader) {
            contentLoader.dispose();
        }

        // 移除事件监听
        window.removeEventListener('resize', onWindowResize);

        console.log('🧹 资源清理完成');
    }

    // 页面卸载时清理资源
    window.addEventListener('beforeunload', dispose);

    // 暴露必要的方法到全局
    window.app = {
        init,
        dispose,
        getScene: () => scene,
        getCamera: () => camera,
        getRenderer: () => renderer
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
