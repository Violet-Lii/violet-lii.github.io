/**
 * 光影系统 - 升级版
 * AO模拟、紫色氛围光、窗户透光、地板反射、柔和阴影、灯串/台灯/屏幕光
 */
import * as THREE from 'three';

let scene, lights = {}, currentTime = 'day';

export function init(sceneRef) {
    scene = sceneRef;
    createLights();
    return { setDayMode, setNightMode, setDreamMode, toggleTime, getCurrentTime, getLights };
}

function createLights() {
    // 环境光
    lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(lights.ambient);

    // 主光源 - 更柔和的阴影
    lights.main = new THREE.DirectionalLight(0xffffff, 0.8);
    lights.main.position.set(5, 10, 5);
    lights.main.castShadow = true;
    lights.main.shadow.mapSize.width = 2048;
    lights.main.shadow.mapSize.height = 2048;
    lights.main.shadow.camera.near = 0.5;
    lights.main.shadow.camera.far = 50;
    lights.main.shadow.camera.left = -10;
    lights.main.shadow.camera.right = 10;
    lights.main.shadow.camera.top = 10;
    lights.main.shadow.camera.bottom = -10;
    lights.main.shadow.bias = -0.0005;
    lights.main.shadow.radius = 3; // 柔和阴影
    scene.add(lights.main);

    // 紫色氛围光（中心）
    lights.purple = new THREE.PointLight(0x9B59B6, 0.5, 10);
    lights.purple.position.set(0, 2, 0);
    scene.add(lights.purple);

    // 粉色补光
    lights.pink = new THREE.PointLight(0xFFB6C1, 0.3, 8);
    lights.pink.position.set(-2, 1.5, 2);
    scene.add(lights.pink);

    // 窗户光源 - 带体积光模拟
    lights.window = new THREE.SpotLight(0xFFFAF0, 0.6, 10, Math.PI / 4);
    lights.window.position.set(-3, 3, -3);
    lights.window.target.position.set(0, 0, 0);
    lights.window.castShadow = true;
    lights.window.shadow.mapSize.width = 1024;
    lights.window.shadow.mapSize.height = 1024;
    scene.add(lights.window);
    scene.add(lights.window.target);

    // 窗户光柱（用半透明圆柱模拟体积光）
    const lightBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 1.2, 4, 16, 1, true),
        new THREE.MeshBasicMaterial({
            color: 0xFFFAF0,
            transparent: true,
            opacity: 0.03,
            side: THREE.DoubleSide
        })
    );
    lightBeam.position.set(-1, 2, -3.5);
    lightBeam.rotation.z = 0.15;
    lightBeam.name = 'light-beam';
    scene.add(lightBeam);
    lights.beam = lightBeam;

    // 地面反射光
    lights.fill = new THREE.HemisphereLight(0xffffff, 0x9B59B6, 0.3);
    scene.add(lights.fill);

    // ===== 家具附近微光（紫色氛围点光源） =====

    // 床头微光
    lights.bedGlow = new THREE.PointLight(0xDDA0DD, 0.2, 3);
    lights.bedGlow.position.set(2, 1, 2.5);
    scene.add(lights.bedGlow);

    // 书架微光
    lights.shelfGlow = new THREE.PointLight(0x9B59B6, 0.15, 3);
    lights.shelfGlow.position.set(-3.5, 1.5, 0);
    scene.add(lights.shelfGlow);

    // 桌面微光
    lights.deskGlow = new THREE.PointLight(0x87CEEB, 0.15, 3);
    lights.deskGlow.position.set(3.2, 1, -1);
    scene.add(lights.deskGlow);

    // 钢琴微光
    lights.pianoGlow = new THREE.PointLight(0x9B59B6, 0.15, 3);
    lights.pianoGlow.position.set(1.5, 1, -3);
    scene.add(lights.pianoGlow);

    // 抽屉柜微光
    lights.drawerGlow = new THREE.PointLight(0xFFB6C1, 0.15, 3);
    lights.drawerGlow.position.set(-3.5, 1, 1);
    scene.add(lights.drawerGlow);

    // AO模拟 - 用暗色遮光层在角落
    createAOSimulation();
}

/** AO效果模拟 - 角落暗化 */
function createAOSimulation() {
    // 后墙左下角
    const ao1 = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 3),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
    );
    ao1.position.set(-2.5, 1, -3.97);
    scene.add(ao1);

    // 后墙右下角
    const ao2 = ao1.clone();
    ao2.position.set(2.5, 1, -3.97);
    scene.add(ao2);

    // 左墙下角
    const ao3 = ao1.clone();
    ao3.position.set(-3.97, 1, 0);
    ao3.rotation.y = Math.PI / 2;
    scene.add(ao3);

    // 右墙下角
    const ao4 = ao1.clone();
    ao4.position.set(3.97, 1, 0);
    ao4.rotation.y = -Math.PI / 2;
    scene.add(ao4);

    // 天花板与墙交接处暗化
    const aoCeil1 = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.05, side: THREE.DoubleSide })
    );
    aoCeil1.position.set(0, 3.8, -3.97);
    scene.add(aoCeil1);

    const aoCeil2 = aoCeil1.clone();
    aoCeil2.position.set(-3.97, 3.8, 0);
    aoCeil2.rotation.y = Math.PI / 2;
    scene.add(aoCeil2);

    const aoCeil3 = aoCeil1.clone();
    aoCeil3.position.set(3.97, 3.8, 0);
    aoCeil3.rotation.y = -Math.PI / 2;
    scene.add(aoCeil3);
}

export function setDayMode() {
    currentTime = 'day';
    animateLight(lights.ambient, { intensity: 0.5 }, 1000);
    animateLight(lights.main, { intensity: 1.0, color: 0xffffff }, 1000);
    animateLight(lights.purple, { intensity: 0.3 }, 1000);
    animateLight(lights.pink, { intensity: 0.2 }, 1000);
    animateLight(lights.window, { intensity: 0.8, color: 0xFFFAF0 }, 1000);
    animateLight(lights.fill, { intensity: 0.4 }, 1000);
    animateLight(lights.bedGlow, { intensity: 0.1 }, 1000);
    animateLight(lights.shelfGlow, { intensity: 0.08 }, 1000);
    animateLight(lights.deskGlow, { intensity: 0.1 }, 1000);
    animateLight(lights.pianoGlow, { intensity: 0.08 }, 1000);
    animateLight(lights.drawerGlow, { intensity: 0.08 }, 1000);
    // 光柱白天更明显
    if (lights.beam) {
        animateBeamOpacity(0.03, 1000);
    }
    animateBackground(0x87CEEB, 1000);
}

export function setNightMode() {
    currentTime = 'night';
    animateLight(lights.ambient, { intensity: 0.15 }, 1000);
    animateLight(lights.main, { intensity: 0.1, color: 0x4169E1 }, 1000);
    animateLight(lights.purple, { intensity: 0.8 }, 1000);
    animateLight(lights.pink, { intensity: 0.5 }, 1000);
    animateLight(lights.window, { intensity: 0.3, color: 0xE6E6FA }, 1000);
    animateLight(lights.fill, { intensity: 0.2 }, 1000);
    animateLight(lights.bedGlow, { intensity: 0.3 }, 1000);
    animateLight(lights.shelfGlow, { intensity: 0.2 }, 1000);
    animateLight(lights.deskGlow, { intensity: 0.25 }, 1000);
    animateLight(lights.pianoGlow, { intensity: 0.3 }, 1000);
    animateLight(lights.drawerGlow, { intensity: 0.2 }, 1000);
    if (lights.beam) {
        animateBeamOpacity(0.01, 1000);
    }
    animateBackground(0x1a1a3e, 1000);
}

export function setDreamMode() {
    currentTime = 'dream';
    animateLight(lights.ambient, { intensity: 0.35 }, 1000);
    animateLight(lights.main, { intensity: 0.5, color: 0xE6E6FA }, 1000);
    animateLight(lights.purple, { intensity: 1.2 }, 1000);
    animateLight(lights.pink, { intensity: 0.8 }, 1000);
    animateLight(lights.window, { intensity: 0.6, color: 0xDDA0DD }, 1000);
    animateLight(lights.fill, { intensity: 0.5 }, 1000);
    animateLight(lights.bedGlow, { intensity: 0.4 }, 1000);
    animateLight(lights.shelfGlow, { intensity: 0.35 }, 1000);
    animateLight(lights.deskGlow, { intensity: 0.35 }, 1000);
    animateLight(lights.pianoGlow, { intensity: 0.4 }, 1000);
    animateLight(lights.drawerGlow, { intensity: 0.35 }, 1000);
    if (lights.beam) {
        animateBeamOpacity(0.06, 1000);
    }
    animateBackground(0x2d1b4e, 1000);
}

export function toggleTime() {
    const modes = ['day', 'night', 'dream'];
    const next = modes[(modes.indexOf(currentTime) + 1) % 3];
    if (next === 'day') setDayMode();
    else if (next === 'night') setNightMode();
    else setDreamMode();
    return next;
}

export function getCurrentTime() { return currentTime; }
export function getLights() { return lights; }

function animateLight(light, target, duration) {
    const startValues = { intensity: light.intensity, color: light.color.getHex() };
    const startTime = Date.now();
    const animate = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        const eased = easeInOutCubic(progress);
        if (target.intensity !== undefined) {
            light.intensity = startValues.intensity + (target.intensity - startValues.intensity) * eased;
        }
        if (target.color !== undefined) {
            const startColor = new THREE.Color(startValues.color);
            const endColor = new THREE.Color(target.color);
            light.color.lerpColors(startColor, endColor, eased);
        }
        if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
}

function animateBeamOpacity(targetOpacity, duration) {
    if (!lights.beam) return;
    const startOpacity = lights.beam.material.opacity;
    const startTime = Date.now();
    const animate = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        const eased = easeInOutCubic(progress);
        lights.beam.material.opacity = startOpacity + (targetOpacity - startOpacity) * eased;
        if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
}

function animateBackground(targetColor, duration) {
    const startColor = scene.background ? scene.background.getHex() : 0x000000;
    const startTime = Date.now();
    const animate = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        const eased = easeInOutCubic(progress);
        const current = new THREE.Color();
        current.lerpColors(new THREE.Color(startColor), new THREE.Color(targetColor), eased);
        scene.background = current;
        if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
