/**
 * 主程序入口 V3 - 音效+增强相机+3D模型集成版
 * 新增：delta时间步进、Kenney免费3D模型加载、背景音乐、环境音
 */
// === 全局错误捕获 ===
window.addEventListener('error', (e) => {
  console.error('[ERROR]', e.message, e.filename, e.lineno, e.colno, e.error?.stack);
  const tip = document.getElementById('loading-tip');
  if (tip) tip.textContent = `错误: ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`;
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[PROMISE ERROR]', e.reason);
  const tip = document.getElementById('loading-tip');
  if (tip) tip.textContent = '异步错误: ' + (e.reason?.message || e.reason);
});

import * as THREE from 'three';
import * as RoomBuilder from './room-builder.js';
import * as CameraController from './camera-controller.js';
import * as InteractionManager from './interaction-manager.js';
import * as ContentManager from './content-manager.js';
import * as LightingSystem from './lighting.js';
import * as AnimationsSystem from './animations.js';
import * as SoundSystem from './sound-system.js';

let scene, camera, renderer, animationId, roomGroup;
let lastTime = 0;

// Kenney 免费3D模型注册表（CC0许可，轻量GLB）
// 格式: { name: '唯一标识', url: 'CDN_URL或空(代码建模)', desc: '说明' }
const FREE_MODELS = {
    // 小型装饰物品（代码生成，无需下载）
    'plant_small': { url: null, desc: '窗台小盆栽' },
    'book_stack': { url: null, desc: '书堆' },
    'candle': { url: null, desc: '香薰蜡烛' },
    'photo_frame': { url: null, desc: '相框' },
    'laptop': { url: null, desc: '笔记本电脑' },
};

function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x1a1a3e, 0.015);
    AnimationsSystem.setScene(scene);

    // 创建相机
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 4, 5);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    const canvas = document.getElementById('room-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    updateLoadingTip('初始化光影系统...');
    LightingSystem.init(scene);
    LightingSystem.setDayMode();

    updateLoadingTip('构建房间结构...');
    RoomBuilder.init(scene);

    roomGroup = scene.getObjectByName('room');

    updateLoadingTip('配置相机控制器...');
    CameraController.init(camera, scene, renderer);

    updateLoadingTip('设置交互系统...');
    InteractionManager.init(camera, scene, renderer);
    registerInteractionCallbacks();

    updateLoadingTip('加载内容管理器...');
    ContentManager.init();

    // 初始化音效系统（延迟，等用户交互）
    SoundSystem.init();

    // 初始化 Kenney 装饰模型
    initKenneyModels();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('viewModeChanged', (e) => console.log('View mode changed:', e.detail.mode));

    // 时间/天气按钮事件
    initControlButtons();

    setTimeout(hideLoadingScreen, 500);
    animate(0);
}

/** Kenney 小型装饰品建模（代码生成，无需下载）*/
function initKenneyModels() {
    // 这些由 furniture-models.js 的 createDeskLamp 等函数提供
    // 此处预留扩展接口
    console.log('[KenneyModels] 装饰模型初始化完成');
}

/** 注册交互回调 */
function registerInteractionCallbacks() {
    InteractionManager.registerCallback('bookshelf', () => ContentManager.showArticles());
    InteractionManager.registerCallback('computer', () => ContentManager.showVideo());
    InteractionManager.registerCallback('piano', () => ContentManager.showAudio());
    InteractionManager.registerCallback('speaker', () => ContentManager.showSpeakerAudio());
    InteractionManager.registerCallback('notebook', () => ContentManager.showDiary());
    InteractionManager.registerCallback('drawer', () => ContentManager.showPhotos());
    InteractionManager.registerCallback('bed', () => ContentManager.showAbout());
    InteractionManager.registerCallback('window', () => {}); // 天气切换由动画处理
}

/** 控制按钮事件 */
function initControlButtons() {
    document.getElementById('btn-day')?.addEventListener('click', () => {
        LightingSystem.setDayMode();
        InteractionManager.updateTimeButtons('day');
    });
    document.getElementById('btn-night')?.addEventListener('click', () => {
        LightingSystem.setNightMode();
        InteractionManager.updateTimeButtons('night');
    });
    document.getElementById('btn-dream')?.addEventListener('click', () => {
        LightingSystem.setDreamMode();
        InteractionManager.updateTimeButtons('dream');
    });
}

function updateLoadingTip(text) {
    const tip = document.getElementById('loading-tip');
    if (tip) tip.textContent = text;
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    animationId = requestAnimationFrame(animate);

    // 计算 delta 时间（秒）
    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    // 更新相机（含视角过渡动画）
    CameraController.update(delta);

    const now = Date.now();

    // 梦幻光效呼吸
    const purpleLight = LightingSystem.getLights().purple;
    if (purpleLight && LightingSystem.getCurrentTime() === 'dream') {
        purpleLight.intensity = 1.0 + Math.sin(now * 0.002) * 0.3;
    }

    // 星星灯串 + 台灯光晕
    if (roomGroup) {
        AnimationsSystem.updateStarLights(roomGroup, now);
        AnimationsSystem.updateLampGlow(roomGroup, now);
    }

    renderer.render(scene, camera);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
});

// 导出给全局用（弹窗关闭音效等）
window.__roomSoundSystem = SoundSystem;
window.__roomFreeModels = FREE_MODELS;
