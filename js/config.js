/**
 * 配置文件 - 性能优化版
 * 豆豆的小阁楼 - 3D梦幻紫房间
 */

const CONFIG = {
    // 房间尺寸 (性能优化：适中的尺寸)
    room: {
        width: 10,
        height: 4,
        depth: 12,
        wallThickness: 0.2
    },

    // 相机设置
    camera: {
        fov: 70,
        near: 0.1,
        far: 100,
        moveSpeed: 0.15,  // 降低移动速度，提升性能
        lookSpeed: 0.002
    },

    // 光影设置（性能优化：减少灯光数量）
    lights: {
        ambientIntensity: 0.3,
        directionalIntensity: 0.6,
        pointLightCount: 3,  // 限制点光源数量
        pointLightIntensity: 0.4
    },

    // 粒子效果（性能优化：减少粒子数量）
    particles: {
        count: 50,  // 从200减少到50
        size: 0.05,
        speed: 0.01,
        color: 0x8B5CF6,
        opacity: 0.6
    },

    // 家具位置配置
    furniture: {
        bookshelf: { x: -4.5, y: 0, z: -2, scale: 1.2 },
        desk: { x: 2, y: 0, z: -3, rotation: Math.PI / 6 },
        bed: { x: -3, y: 0, z: 4, rotation: -Math.PI / 2 },
        computer: { x: 2.5, y: 0.9, z: -3, onDesk: true },
        window: { x: 0, y: 2, z: -5.9, width: 3, height: 2 },
        piano: { x: 3.5, y: 0, z: 2, rotation: -Math.PI / 4 },
        speaker: { x: -4, y: 0.8, z: 3, onDesk: false },
        notebook: { x: 2.2, y: 0.75, z: -2.8, onDesk: true }
    },

    // 交互距离
    interaction: {
        maxDistance: 3,  // 最大交互距离
        clickThreshold: 0.2  // 点击阈值
    },

    // 内容数据（示例）
    content: {
        articles: [
            {
                id: 1,
                title: "欢迎来到豆豆的小阁楼",
                date: "2026-06-12",
                category: "公告",
                tags: ["博客", "紫色", "新开始"],
                summary: "这是一个3D交互式虚拟房间博客...",
                content: "这里是文章的完整内容..."
            }
        ],
        videos: [
            { id: 1, title: "示例视频", url: "https://www.bilibili.com/video/BV1xx411c7mD" }
        ],
        audios: [
            { id: 1, title: "示例音频", url: "/assets/audio/sample.mp3" }
        ],
        photos: [
            { id: 1, title: "示例照片", url: "/assets/images/photo1.jpg" }
        ]
    },

    // 性能优化选项
    performance: {
        enableShadows: false,  // 关闭阴影，提升性能
        enableAntialiasing: true,
        maxPixelRatio: 2,  // 限制像素比
        enableFrustumCulling: true,  // 启用视锥体剔除
        enableOcclusionCulling: false  // 关闭遮挡剔除（实验性）
    },

    // 颜色主题
    colors: {
        primary: 0x8B5CF6,
        primaryDark: 0x7C3AED,
        primaryLight: 0xA78BFA,
        glow: 0xC084FC,
        wall: 0x2D1B4E,
        floor: 0x1E1135,
        ceiling: 0x0F0A1A
    }
};

// 导出配置
window.CONFIG = CONFIG;
