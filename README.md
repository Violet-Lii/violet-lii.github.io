# 豆豆的小阁楼 - 3D梦幻紫虚拟房间

一个基于 Three.js 的 3D 交互式虚拟房间博客，支持第一人称视角、梦幻紫主题、点击交互等功能。

## ✨ 特性

- 🎮 **第一人称视角** - WASD移动，鼠标环顾四周
- 💜 **梦幻紫主题** - 紫色光影、粒子效果、魔法氛围
- 🖱️ **点击交互** - 点击家具查看文章、视频、照片等
- 📚 **魔法书效果** - 文章以魔法书形式悬浮打开
- 🎹 **多媒体支持** - 钢琴播放音乐、音箱播放音频、电脑播放视频
- 🌌 **粒子背景** - 紫色粒子漂浮，增加梦幻感
- 📱 **响应式设计** - 支持桌面和移动端

## 🏠 房间布局

```
    🪟 窗户（照片墙）
  ┌─────────────────┐
  │  🛏️ 床         │
  │                 │
  │    📚 书架 ← 点击查看文章
  │                 │
  │  💻 电脑 ← 点击观看视频
  │                 │
  │  🪑 桌子        │
  └─────────────────┘
```

## 🎮 操作指南

### 键盘控制
- `W` - 向前移动
- `A` - 向左移动
- `S` - 向后移动
- `D` - 向右移动
- `空格键` - 暂停/继续背景音乐
- `ESC` - 关闭内容面板

### 鼠标控制
- `左键点击` - 与家具交互
- `拖动鼠标` - 环顾四周

### 可交互物品
- 📚 **书架** - 点击查看文章列表（魔法书效果）
- 💻 **电脑** - 点击观看视频
- 🪟 **窗户** - 点击查看照片墙
- 🎹 **钢琴** - 点击播放音乐
- 🔊 **音箱** - 点击播放音频
- 📒 **笔记本** - 点击查看随笔

## 🚀 快速开始

### 方法一：直接打开（推荐）

1. 下载本项目到本地
2. 双击打开 `index.html`
3. 开始探索！

> **注意**：某些浏览器可能需要本地服务器才能正常运行（CORS限制）。

### 方法二：使用本地服务器

```bash
# 使用 Python 3
cd 3d-room
python -m http.server 8000

# 然后在浏览器访问
# http://localhost:8000
```

## 📁 项目结构

```
3d-room/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   ├── config.js              # 配置文件
│   ├── room-builder.js        # 房间构建器
│   ├── first-person-controller.js  # 第一人称控制器
│   ├── interaction-manager.js  # 交互管理器
│   ├── content-loader.js       # 内容加载器
│   └── main.js                # 主程序入口
├── assets/            # 资源文件夹
│   ├── images/       # 图片
│   ├── audio/        # 音频
│   └── videos/       # 视频
└── content/          # 内容数据
    ├── articles.json  # 文章数据
    ├── videos.json    # 视频数据
    └── photos.json    # 照片数据
```

## ⚙️ 配置说明

编辑 `js/config.js` 自定义配置：

```javascript
const CONFIG = {
    room: {
        width: 10,    // 房间宽度
        height: 4,    // 房间高度
        depth: 12     // 房间深度
    },
    camera: {
        fov: 70,           // 视野角度
        moveSpeed: 0.15,   // 移动速度
        lookSpeed: 0.002   // 视角旋转速度
    },
    particles: {
        count: 50,   // 粒子数量（性能优化）
        size: 0.05,  // 粒子大小
        speed: 0.01   // 粒子移动速度
    }
};
```

## 📝 添加内容

### 添加文章

编辑 `js/config.js` 中的 `CONFIG.content.articles`：

```javascript
articles: [
    {
        id: 1,
        title: "文章标题",
        date: "2026-06-12",
        category: "分类",
        tags: ["标签1", "标签2"],
        summary: "文章摘要...",
        content: "文章完整内容..."
    }
]
```

### 添加视频

编辑 `js/config.js` 中的 `CONFIG.content.videos`：

```javascript
videos: [
    {
        id: 1,
        title: "视频标题",
        url: "https://www.bilibili.com/video/BVxxx"
    }
]
```

### 添加照片

将照片放入 `assets/images/` 文件夹，然后编辑 `js/config.js`：

```javascript
photos: [
    {
        id: 1,
        title: "照片标题",
        url: "/assets/images/photo1.jpg"
    }
]
```

## 🔧 性能优化

本项目已进行以下性能优化：

- ✅ **减少粒子数量** - 从200减少到50
- ✅ **复用材质和几何体** - 避免重复创建
- ✅ **限制灯光数量** - 只使用必要的光源
- ✅ **禁用阴影** - 提升渲染性能
- ✅ **限制像素比** - 防止高分辨率设备性能下降
- ✅ **资源清理** - 提供 `dispose()` 方法清理内存
- ✅ **按需加载** - 内容缓存机制

### 低配设备优化建议

如果设备性能不足，可以：

1. 降低粒子数量：
   ```javascript
   particles: { count: 20 }  // 减少到20
   ```

2. 降低渲染分辨率：
   ```javascript
   performance: { maxPixelRatio: 1 }  // 强制1倍像素比
   ```

3. 关闭抗锯齿：
   ```javascript
   performance: { enableAntialiasing: false }
   ```

## 🐛 常见问题

### 1. 页面空白或加载失败

**解决方案**：
- 检查浏览器控制台错误信息
- 确保网络连接正常（需要加载Three.js和GSAP CDN）
- 尝试使用本地服务器运行

### 2. 移动速度太快/太慢

**解决方案**：
编辑 `js/config.js`，调整 `camera.moveSpeed` 值。

### 3. 点击家具无反应

**解决方案**：
- 确保距离家具足够近（交互距离默认为3个单位）
- 检查控制台是否有JavaScript错误

### 4. 帧率过低

**解决方案**：
- 参考"低配设备优化建议"进行配置
- 关闭其他占用GPU的程序

## 📚 技术栈

- **Three.js** - 3D渲染引擎
- **GSAP** - 动画库
- **Vanilla JavaScript** - 无框架依赖
- **CSS3** - 样式和动画

## 📄 许可证

MIT License

## 🙏 致谢

- Three.js 团队
- GSAP 团队
- 所有开源贡献者

## 📧 联系我

- GitHub: [Violet-Lii](https://github.com/Violet-Lii)
- 博客: [豆豆的小阁楼](https://violet-lii.github.io)

---

**享受你的3D梦幻紫房间！** 💜✨
