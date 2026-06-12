/**
 * 第一人称控制器 - 性能优化版
 * 支持 WASD 移动 + 鼠标拖动环顾
 */

class FirstPersonController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // 位置状态
        this.position = new THREE.Vector3(0, 1.7, 5);  // 初始位置
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');  // 欧拉角

        // 移动速度
        this.moveSpeed = CONFIG.camera.moveSpeed;
        this.lookSpeed = CONFIG.camera.lookSpeed;

        // 按键状态
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        // 鼠标状态
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        // 碰撞检测边界（房间范围）
        this.bounds = {
            minX: -CONFIG.room.width / 2 + 0.5,
            maxX: CONFIG.room.width / 2 - 0.5,
            minZ: -CONFIG.room.depth / 2 + 0.5,
            maxZ: CONFIG.room.depth / 2 - 0.5,
            minY: 1.5,  // 地面高度
            maxY: CONFIG.room.height - 0.5
        };

        this.init();
    }

    /**
     * 初始化事件监听
     */
    init() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // 鼠标事件
        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // 触摸事件（移动端支持）
        this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // 禁用右键菜单
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

        // 锁定指针（可选，提升体验）
        this.domElement.addEventListener('click', () => {
            // this.domElement.requestPointerLock();
        });

        // 应用初始位置
        this.updateCamera();
    }

    /**
     * 键盘按下
     */
    onKeyDown(event) {
        const key = event.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }

        // 空格键暂停音乐
        if (key === ' ') {
            event.preventDefault();
            this.toggleMusic();
        }

        // ESC 关闭面板
        if (key === 'escape') {
            this.closePanel();
        }
    }

    /**
     * 键盘释放
     */
    onKeyUp(event) {
        const key = event.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
    }

    /**
     * 鼠标按下
     */
    onMouseDown(event) {
        if (event.button === 0) {  // 左键
            this.mouseDown = true;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        }
    }

    /**
     * 鼠标移动
     */
    onMouseMove(event) {
        if (!this.mouseDown) return;

        const deltaX = event.clientX - this.mouseX;
        const deltaY = event.clientY - this.mouseY;

        // 更新旋转（Y轴左右，X轴上下）
        this.rotation.y -= deltaX * this.lookSpeed;
        this.rotation.x -= deltaY * this.lookSpeed;

        // 限制上下视角
        this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x));

        this.mouseX = event.clientX;
        this.mouseY = event.clientY;

        this.updateCamera();
    }

    /**
     * 鼠标释放
     */
    onMouseUp(event) {
        if (event.button === 0) {
            this.mouseDown = false;
        }
    }

    /**
     * 触摸开始
     */
    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.mouseDown = true;
            this.mouseX = event.touches[0].clientX;
            this.mouseY = event.touches[0].clientY;
        }
    }

    /**
     * 触摸移动
     */
    onTouchMove(event) {
        if (!this.mouseDown || event.touches.length !== 1) return;

        event.preventDefault();

        const deltaX = event.touches[0].clientX - this.mouseX;
        const deltaY = event.touches[0].clientY - this.mouseY;

        this.rotation.y -= deltaX * this.lookSpeed * 2;
        this.rotation.x -= deltaY * this.lookSpeed * 2;
        this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x));

        this.mouseX = event.touches[0].clientX;
        this.mouseY = event.touches[0].clientY;

        this.updateCamera();
    }

    /**
     * 触摸结束
     */
    onTouchEnd(event) {
        this.mouseDown = false;
    }

    /**
     * 更新相机位置和旋转
     */
    updateCamera() {
        // 应用旋转
        this.camera.rotation.copy(this.rotation);

        // 应用位置
        this.camera.position.copy(this.position);
    }

    /**
     * 更新移动（在动画循环中调用）
     */
    update() {
        // 计算移动方向（基于相机朝向）
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.y = 0;  // 保持水平移动
        direction.normalize();

        // 计算右方向
        const right = new THREE.Vector3();
        right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

        // 计算移动向量
        const moveVector = new THREE.Vector3(0, 0, 0);

        if (this.keys.w) moveVector.add(direction);
        if (this.keys.s) moveVector.sub(direction);
        if (this.keys.a) moveVector.sub(right);
        if (this.keys.d) moveVector.add(right);

        // 归一化防止斜向加速
        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(this.moveSpeed);
        }

        // 更新位置
        const newPosition = this.position.clone().add(moveVector);

        // 碰撞检测（边界）
        newPosition.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, newPosition.x));
        newPosition.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, newPosition.z));
        newPosition.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, newPosition.y));

        this.position.copy(newPosition);
        this.updateCamera();
    }

    /**
     * 切换音乐播放
     */
    toggleMusic() {
        // 这里可以调用音频管理器
        console.log('Toggle music');
    }

    /**
     * 关闭面板
     */
    closePanel() {
        const panel = document.getElementById('content-panel');
        if (panel) {
            panel.classList.remove('visible');
            panel.classList.add('hidden');
        }
    }

    /**
     * 获取当前位置（用于交互检测）
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * 获取当前朝向（用于交互检测）
     */
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }

    /**
     * 清理资源
     */
    dispose() {
        // 移除事件监听
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        // ... 其他事件
    }
}

// 导出
window.FirstPersonController = FirstPersonController;
