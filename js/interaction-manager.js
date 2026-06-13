/**
 * 交互管理器 V2 - 音效集成版
 * 音效触发时机：悬停结束(softClick)、翻书、钢琴、抽屉、窗帘、枕头、窗户、笔记本
 */
import * as THREE from 'three';
import * as RoomBuilder from './room-builder.js';
import * as CameraController from './camera-controller.js';
import * as AnimationsSystem from './animations.js';
import * as LightingSystem from './lighting.js';
import * as SoundSystem from './sound-system.js';

let camera, scene, renderer;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;
let mouseScreenX = 0, mouseScreenY = 0;
const callbacks = {};
let soundUnlocked = false;

export function init(cameraRef, sceneRef, rendererRef) {
    camera = cameraRef;
    scene = sceneRef;
    renderer = rendererRef;
    bindEvents();

    // 首次用户交互时解锁音频
    const unlockAudio = () => {
        if (!soundUnlocked) {
            SoundSystem.init();
            SoundSystem.unlock();
            soundUnlocked = true;
        }
    };
    renderer.domElement.addEventListener('pointerdown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    return { registerCallback };
}

export function registerCallback(furnitureType, callback) {
    callbacks[furnitureType] = callback;
}

function bindEvents() {
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('touchend', onTouch);

    const mobileInteract = document.getElementById('mobile-interact');
    if (mobileInteract) {
        mobileInteract.addEventListener('click', () => {
            if (hoveredObject) triggerInteraction(hoveredObject);
        });
    }
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    mouseScreenX = event.clientX;
    mouseScreenY = event.clientY;

    raycaster.setFromCamera(mouse, camera);
    const interactiveObjects = getInteractiveObjects();
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
        const object = findInteractiveParent(intersects[0].object);
        if (object && object !== hoveredObject) {
            if (hoveredObject) onHoverEnd(hoveredObject);
            hoveredObject = object;
            onHoverStart(object);
        }
    } else {
        if (hoveredObject) { onHoverEnd(hoveredObject); hoveredObject = null; }
    }
}

function onClick(event) {
    if (CameraController.getMode() === 'third-person') {
        if (hoveredObject) triggerInteraction(hoveredObject);
    } else {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(getInteractiveObjects(), true);
        if (intersects.length > 0) {
            const object = findInteractiveParent(intersects[0].object);
            if (object) triggerInteraction(object);
        }
    }
}

function onTouch(event) {
    if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(getInteractiveObjects(), true);
        if (intersects.length > 0) {
            const object = findInteractiveParent(intersects[0].object);
            if (object) triggerInteraction(object);
        }
    }
}

function onHoverStart(object) {
    const hint = object.userData ? object.userData.hint : null;
    if (hint) showHint(hint);
    highlightObject(object, true);
    renderer.domElement.style.cursor = 'pointer';
}

function onHoverEnd(object) {
    hideHint();
    highlightObject(object, false);
    renderer.domElement.style.cursor = 'default';
    // 悬停结束时播放软音效
    SoundSystem.playSoftClick();
}

function triggerInteraction(object) {
    const type = object.userData ? object.userData.type : null;
    if (!type) return;

    // 触发交互动画
    playAnimation(object, type);

    // 触发对应音效
    triggerSound(type);

    // 回调
    if (callbacks[type]) {
        setTimeout(() => { callbacks[type](object); }, 500);
    }
}

/** 根据家具类型触发对应音效 */
function triggerSound(type) {
    switch (type) {
        case 'bookshelf':
            // 魔法书音效：连续翻页
            setTimeout(() => SoundSystem.playPageFlip(), 100);
            setTimeout(() => SoundSystem.playPageFlip(), 400);
            setTimeout(() => SoundSystem.playMagicParticle(), 600);
            break;
        case 'notebook':
            SoundSystem.playPageFlip();
            setTimeout(() => SoundSystem.playPageFlip(), 200);
            break;
        case 'piano':
            // 随机弹几个音
            const notes = ['C4', 'E4', 'G4', 'C5', 'E5'];
            notes.forEach((note, i) => {
                setTimeout(() => SoundSystem.playPianoKey(note), i * 150);
            });
            break;
        case 'drawer':
            SoundSystem.playDrawerOpen();
            break;
        case 'bed':
            SoundSystem.playPillowBounce();
            break;
        case 'window':
            SoundSystem.playCurtainRustle();
            setTimeout(() => SoundSystem.playWindChime(), 800);
            break;
        case 'speaker':
            SoundSystem.playMagicParticle();
            break;
        case 'computer':
            SoundSystem.playSoftClick();
            break;
        case 'door':
            SoundSystem.playDoorCreak();
            break;
    }
}

function playAnimation(object, type) {
    switch (type) {
        case 'bookshelf':
            AnimationsSystem.magicBookAnimation(object, () => {
                SoundSystem.playMagicParticle();
            });
            break;
        case 'computer':
            const screen = object.getObjectByName('screen');
            if (screen) AnimationsSystem.screenGlowAnimation(screen);
            break;
        case 'piano':
            AnimationsSystem.pianoKeyAnimation(object);
            break;
        case 'speaker':
            AnimationsSystem.soundWaveAnimation(object);
            break;
        case 'drawer':
            AnimationsSystem.drawerOpenAnimation(object, Math.floor(Math.random() * 5));
            break;
        case 'bed':
            AnimationsSystem.pillowBounceAnimation(object);
            break;
        case 'window':
            AnimationsSystem.curtainWaveAnimation(object, () => {
                const newMode = LightingSystem.toggleTime();
                updateTimeButtons(newMode);
            });
            break;
        case 'notebook':
            const originalY = object.position.y;
            object.position.y += 0.05;
            setTimeout(() => { object.position.y = originalY; }, 200);
            break;
    }
}

function highlightObject(object, highlight) {
    object.traverse((child) => {
        if (child.isMesh && child.material) {
            if (highlight) {
                child.material.emissive = new THREE.Color(0x9B59B6);
                child.material.emissiveIntensity = 0.2;
            } else {
                child.material.emissive = new THREE.Color(0x000000);
                child.material.emissiveIntensity = 0;
            }
        }
    });
}

function getInteractiveObjects() {
    const objects = [];
    const furniture = RoomBuilder.getAllFurniture();
    Object.values(furniture).forEach(item => {
        if (item.userData && item.userData.interactive) objects.push(item);
    });
    return objects;
}

function findInteractiveParent(object) {
    let current = object;
    while (current) {
        if (current.userData && current.userData.interactive) return current;
        current = current.parent;
    }
    return null;
}

function showHint(text) {
    const hintElement = document.getElementById('interaction-hint');
    const hintText = document.getElementById('hint-text');
    if (hintElement && hintText) {
        hintText.textContent = text;
        hintElement.classList.remove('hidden');
        hintElement.style.left = (mouseScreenX || window.innerWidth / 2) + 'px';
        hintElement.style.top = ((mouseScreenY || window.innerHeight / 2) - 50) + 'px';
        hintElement.style.transform = 'translate(-50%, -100%)';
    }
}

function hideHint() {
    const hintElement = document.getElementById('interaction-hint');
    if (hintElement) hintElement.classList.add('hidden');
}

export function updateTimeButtons(mode) {
    const buttons = {
        'day': document.getElementById('btn-day'),
        'night': document.getElementById('btn-night'),
        'dream': document.getElementById('btn-dream')
    };
    Object.keys(buttons).forEach(key => {
        if (buttons[key]) buttons[key].classList.toggle('active', key === mode);
    });
}
