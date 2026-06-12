/**
 * 3D 房间构建器 - 性能优化版
 * 豆豆的小阁楼 - 梦幻紫房间
 */

class RoomBuilder {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];  // 存储所有可交互对象
        this.materials = {};  // 复用材质，减少内存
        
        // 性能优化：使用实例化几何体
        this.geometries = {};
        
        this.initMaterials();
        this.buildRoom();
        this.buildFurniture();
    }

    /**
     * 初始化材质（复用材质）
     */
    initMaterials() {
        // 紫色发光材质
        this.materials.glow = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.primary,
            emissive: CONFIG.colors.glow,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });

        // 墙壁材质
        this.materials.wall = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.wall,
            roughness: 0.8,
            metalness: 0.2
        });

        // 地板材质
        this.materials.floor = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.floor,
            roughness: 0.9,
            metalness: 0.1
        });

        // 家具材质
        this.materials.furniture = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.primaryLight,
            roughness: 0.6,
            metalness: 0.3
        });
    }

    /**
     * 获取或创建几何体（复用几何体）
     */
    getGeometry(type, params) {
        const key = `${type}_${JSON.stringify(params)}`;
        if (!this.geometries[key]) {
            switch (type) {
                case 'box':
                    this.geometries[key] = new THREE.BoxGeometry(...params);
                    break;
                case 'plane':
                    this.geometries[key] = new THREE.PlaneGeometry(...params);
                    break;
            }
        }
        return this.geometries[key];
    }

    /**
     * 构建房间结构
     */
    buildRoom() {
        // 地板
        const floorGeometry = this.getGeometry('plane', [CONFIG.room.width, CONFIG.room.depth]);
        const floor = new THREE.Mesh(floorGeometry, this.materials.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);

        // 天花板
        const ceiling = new THREE.Mesh(
            this.getGeometry('plane', [CONFIG.room.width, CONFIG.room.depth]),
            this.materials.wall
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = CONFIG.room.height;
        this.scene.add(ceiling);

        // 墙壁（只创建可见的）
        this.buildWall('back', 0, CONFIG.room.height / 2, -CONFIG.room.depth / 2, CONFIG.room.width, CONFIG.room.height);
        this.buildWall('left', -CONFIG.room.width / 2, CONFIG.room.height / 2, 0, CONFIG.room.depth, CONFIG.room.height, Math.PI / 2);
        this.buildWall('right', CONFIG.room.width / 2, CONFIG.room.height / 2, 0, CONFIG.room.depth, CONFIG.room.height, -Math.PI / 2);
        // 前墙不创建，作为入口
    }

    /**
     * 构建单面墙
     */
    buildWall(type, x, y, z, width, height, rotation = 0) {
        const wall = new THREE.Mesh(
            this.getGeometry('plane', [width, height]),
            this.materials.wall
        );
        wall.position.set(x, y, z);
        if (rotation) wall.rotation.y = rotation;
        wall.userData = { type: 'wall', name: type };
        this.scene.add(wall);
        this.objects.push(wall);
    }

    /**
     * 构建家具
     */
    buildFurniture() {
        // 书架
        this.buildBookshelf();

        // 桌子
        this.buildDesk();

        // 床
        this.buildBed();

        // 电脑（放在桌子上）
        this.buildComputer();

        // 窗户
        this.buildWindow();

        // 钢琴
        this.buildPiano();

        // 音箱
        this.buildSpeaker();

        // 笔记本（放在桌子上）
        this.buildNotebook();
    }

    /**
     * 构建书架
     */
    buildBookshelf() {
        const config = CONFIG.furniture.bookshelf;
        const group = new THREE.Group();

        // 书架主体
        const shelf = new THREE.Mesh(
            this.getGeometry('box', [1.5, 3, 0.5]),
            this.materials.furniture
        );
        group.add(shelf);

        // 添加书本（简化：只添加几个立方体代表书）
        for (let i = 0; i < 5; i++) {
            const book = new THREE.Mesh(
                this.getGeometry('box', [0.1, 0.4, 0.3]),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.7, 0.8, 0.6),
                    emissive: CONFIG.colors.glow,
                    emissiveIntensity: 0.2
                })
            );
            book.position.set(-0.6 + i * 0.3, 1 + Math.random() * 0.3, 0);
            group.add(book);
        }

        group.position.set(config.x, config.y, config.z);
        if (config.scale) group.scale.setScalar(config.scale);
        group.userData = { type: 'furniture', name: 'bookshelf', action: 'showArticles' };
        
        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 构建桌子
     */
    buildDesk() {
        const config = CONFIG.furniture.desk;
        const group = new THREE.Group();

        // 桌面
        const desktop = new THREE.Mesh(
            this.getGeometry('box', [2, 0.1, 1]),
            this.materials.furniture
        );
        desktop.position.y = 0.8;
        group.add(desktop);

        // 桌腿（简化：只用4个小立方体）
        const legPositions = [
            [-0.9, 0.4, -0.4],
            [0.9, 0.4, -0.4],
            [-0.9, 0.4, 0.4],
            [0.9, 0.4, 0.4]
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(
                this.getGeometry('box', [0.1, 0.8, 0.1]),
                this.materials.furniture
            );
            leg.position.set(...pos);
            group.add(leg);
        });

        group.position.set(config.x, config.y, config.z);
        if (config.rotation) group.rotation.y = config.rotation;
        group.userData = { type: 'furniture', name: 'desk' };

        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 构建床
     */
    buildBed() {
        const config = CONFIG.furniture.bed;
        const group = new THREE.Group();

        // 床垫
        const mattress = new THREE.Mesh(
            this.getGeometry('box', [2, 0.3, 3]),
            new THREE.MeshStandardMaterial({
                color: 0x9B8CF6,
                roughness: 0.9
            })
        );
        group.add(mattress);

        // 床头板
        const headboard = new THREE.Mesh(
            this.getGeometry('box', [2, 1, 0.2]),
            this.materials.furniture
        );
        headboard.position.set(0, 0.5, -1.5);
        group.add(headboard);

        group.position.set(config.x, config.y, config.z);
        if (config.rotation) group.rotation.y = config.rotation;
        group.userData = { type: 'furniture', name: 'bed' };

        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 构建电脑
     */
    buildComputer() {
        const config = CONFIG.furniture.computer;
        const group = new THREE.Group();

        // 显示器
        const monitor = new THREE.Mesh(
            this.getGeometry('box', [0.8, 0.5, 0.1]),
            new THREE.MeshStandardMaterial({
                color: 0x111111,
                emissive: 0x8B5CF6,
                emissiveIntensity: 0.5
            })
        );
        group.add(monitor);

        // 底座
        const base = new THREE.Mesh(
            this.getGeometry('box', [0.3, 0.4, 0.3]),
            this.materials.furniture
        );
        base.position.y = -0.2;
        group.add(base);

        group.position.set(config.x, config.y, config.z);
        group.userData = { type: 'furniture', name: 'computer', action: 'showVideos' };

        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 构建窗户
     */
    buildWindow() {
        const config = CONFIG.furniture.window;
        const group = new THREE.Group();

        // 窗框
        const frame = new THREE.Mesh(
            this.getGeometry('box', [config.width, config.height, 0.1]),
            new THREE.MeshStandardMaterial({
                color: CONFIG.colors.primary,
                transparent: true,
                opacity: 0.5
            })
        );
        group.add(frame);

        // 玻璃（半透明）
        const glass = new THREE.Mesh(
            this.getGeometry('plane', [config.width - 0.2, config.height - 0.2]),
            new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            })
        );
        glass.position.z = 0.05;
        group.add(glass);

        group.position.set(config.x, config.y, config.z);
        group.userData = { type: 'furniture', name: 'window', action: 'showPhotos' };

        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 构建钢琴
     */
    buildPiano() {
        const config = CONFIG.furniture.piano;
        const group = new THREE.Group();

        // 钢琴主体
        const body = new THREE.Mesh(
            this.getGeometry('box', [1.5, 0.8, 0.6]),
            new THREE.MeshStandardMaterial({
                color: 0x2D1B4E,
                emissive: CONFIG.colors.primary,
                emissiveIntensity: 0.2
            })
        );
        group.add(body);

        // 琴键（简化）
        for (let i = 0; i < 10; i++) {
            const key = new THREE.Mesh(
                this.getGeometry('box', [0.12, 0.05, 0.4]),
                new THREE.MeshStandardMaterial({
                    color: i % 2 === 0 ? 0xFFFFFF : 0x111111
                })
            );
            key.position.set(-0.6 + i * 0.13, 0.4, 0.1);
            group.add(key);
        }

        group.position.set(config.x, config.y, config.z);
        if (config.rotation) group.rotation.y = config.rotation;
        group.userData = { type: 'furniture', name: 'piano', action: 'playMusic' };

        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 构建音箱
     */
    buildSpeaker() {
        const config = CONFIG.furniture.speaker;
        const group = new THREE.Group();

        const speaker = new THREE.Mesh(
            this.getGeometry('box', [0.4, 0.6, 0.4]),
            this.materials.furniture
        );
        group.add(speaker);

        // 喇叭（圆形，用立方体简化）
        const cone = new THREE.Mesh(
            this.getGeometry('box', [0.3, 0.3, 0.1]),
            new THREE.MeshStandardMaterial({
                color: 0x111111,
                emissive: CONFIG.colors.glow,
                emissiveIntensity: 0.3
            })
        );
        cone.position.z = 0.2;
        group.add(cone);

        group.position.set(config.x, config.y, config.z);
        group.userData = { type: 'furniture', name: 'speaker', action: 'playAudio' };

        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 构建笔记本
     */
    buildNotebook() {
        const config = CONFIG.furniture.notebook;
        const group = new THREE.Group();

        // 笔记本主体
        const notebook = new THREE.Mesh(
            this.getGeometry('box', [0.5, 0.05, 0.7]),
            new THREE.MeshStandardMaterial({
                color: 0x8B5CF6,
                emissive: CONFIG.colors.glow,
                emissiveIntensity: 0.3
            })
        );
        group.add(notebook);

        group.position.set(config.x, config.y, config.z);
        group.userData = { type: 'furniture', name: 'notebook', action: 'showNotes' };

        this.scene.add(group);
        this.objects.push(group);
    }

    /**
     * 清理资源（性能优化）
     */
    dispose() {
        // 清理几何体
        Object.values(this.geometries).forEach(geom => geom.dispose());
        this.geometries = {};

        // 清理材质
        Object.values(this.materials).forEach(mat => mat.dispose());
        this.materials = {};

        // 从场景中移除对象
        this.objects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        this.objects = [];
    }
}

// 导出
window.RoomBuilder = RoomBuilder;
