/**
 * 相机控制器 V2 - 增强版
 * 新增：平滑加速/减速、视角切换过渡动画、行走头部晃动(Head Bob)、
 *       鼠标灵敏度调节、边界弹性碰撞
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let mode = 'third-person';

// 第一人称参数
const moveSpeed = 0.08;
const sprintSpeed = 0.14;
const lookSpeed = 0.0018;
const deceleration = 0.85;       // 减速系数（越大越滑）
const acceleration = 1.8;        // 加速系数
const headBobAmount = 0.025;     // 头部晃动幅度
const headBobSpeed = 10;         // 头部晃动速度
const baseHeight = 1.6;          // 眼睛高度

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const keys = { forward: false, backward: false, left: false, right: false, sprint: false };
let isLocked = false;
let isMoving = false;
let headBobTime = 0;
let lastMoveDir = new THREE.Vector3();

const roomBounds = { minX: -3.5, maxX: 3.5, minZ: -3.5, maxZ: 3.5 };

// 视角切换动画
let transition = {
    active: false,
    progress: 0,
    duration: 0.6,    // 秒
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    onComplete: null
};

// 鼠标灵敏度
let mouseSensitivity = 1.0;

// 平滑鼠标累积
let smoothMouseX = 0, smoothMouseY = 0;
const mouseSmoothFactor = 0.3;

export function init(cameraRef, sceneRef, rendererRef) {
    camera = cameraRef;
    scene = sceneRef;
    renderer = rendererRef;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.target.set(0, 0.5, 0);

    bindEvents();
    camera.position.set(5, 4, 5);

    return {
        toggleViewMode,
        getMode,
        update,
        setFirstPersonMode,
        setThirdPersonMode,
        setMouseSensitivity
    };
}

function bindEvents() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    initMobileControls();
}

function onKeyDown(event) {
    // 忽略输入框内按键
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    switch (event.code) {
        case 'KeyW': case 'ArrowUp':    keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': keys.left = true; break;
        case 'KeyD': case 'ArrowRight':keys.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.sprint = true; break;
        case 'KeyV': toggleViewMode(); break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': case 'ArrowUp':    keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': keys.left = false; break;
        case 'KeyD': case 'ArrowRight':keys.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': keys.sprint = false; break;
    }
}

function onMouseMove(event) {
    if (!isLocked || mode !== 'first-person') return;

    // 平滑鼠标
    smoothMouseX += (event.movementX || 0) * lookSpeed * mouseSensitivity;
    smoothMouseY += (event.movementY || 0) * lookSpeed * mouseSensitivity;

    // 限制垂直角度
    smoothMouseY = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, smoothMouseY));
}

function onMouseClick() {
    if (mode === 'first-person' && !isLocked) {
        document.body.requestPointerLock();
    }
}

function onPointerLockChange() {
    isLocked = document.pointerLockElement === document.body;
}

export function toggleViewMode() {
    if (transition.active) return; // 防止动画中途切换
    if (mode === 'third-person') setFirstPersonMode();
    else setThirdPersonMode();
}

export function setFirstPersonMode() {
    mode = 'first-person';
    controls.enabled = false;

    // 保存当前第三人称位置
    const currentPos = camera.position.clone();
    const currentTarget = controls.target.clone();

    // 计算进入第一人称的目标位置（保持视线方向）
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();

    const startPos = currentPos.clone();
    const endPos = new THREE.Vector3(0, baseHeight, 0);
    const startTarget = currentTarget.clone();
    const endTarget = startPos.clone().add(dir.multiplyScalar(5));
    endTarget.y = baseHeight;

    // 启动过渡动画
    startTransition(startPos, endPos, startTarget, endTarget, () => {
        camera.position.set(0, baseHeight, 0);
        camera.rotation.set(0, 0, 0);
        smoothMouseX = 0; smoothMouseY = 0;
        document.body.requestPointerLock();
        isLocked = true;
        updateViewModeUI();
        window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: { mode: 'first-person' } }));
    });
}

export function setThirdPersonMode() {
    if (document.exitPointerLock) document.exitPointerLock();
    isLocked = false;

    const currentPos = camera.position.clone();
    const currentTarget = new THREE.Vector3(0, baseHeight, 0);

    // 后退到第三人称位置
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();

    const endPos = currentPos.clone().add(dir.multiplyScalar(3));
    endPos.y = 4;
    endPos.x = Math.max(-3, Math.min(3, endPos.x));
    endPos.z = Math.max(-3, Math.min(3, endPos.z));

    startTransition(currentPos, endPos, currentTarget, currentTarget, () => {
        mode = 'third-person';
        controls.enabled = true;
        controls.target.set(0, 0.5, 0);
        camera.position.copy(endPos);
        Object.keys(keys).forEach(k => keys[k] = false);
        velocity.set(0, 0, 0);
        updateViewModeUI();
        window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: { mode: 'third-person' } }));
    });
}

/** 视角过渡动画 */
function startTransition(startPos, endPos, startTarget, endTarget, onComplete) {
    transition.active = true;
    transition.progress = 0;
    transition.startPos.copy(startPos);
    transition.endPos.copy(endPos);
    transition.startTarget.copy(startTarget);
    transition.endTarget.copy(endTarget);
    transition.onComplete = onComplete;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateViewModeUI() {
    const viewModeText = document.getElementById('view-mode');
    const btnFirst = document.getElementById('btn-first-person');
    const btnThird = document.getElementById('btn-third-person');

    if (viewModeText) viewModeText.textContent = mode === 'first-person' ? '👁️ 第一人称视角' : '🎥 第三人称视角';
    if (btnFirst) btnFirst.classList.toggle('active', mode === 'first-person');
    if (btnThird) btnThird.classList.toggle('active', mode === 'third-person');
}

export function update(delta) {
    if (transition.active) {
        updateTransition(delta);
        return;
    }

    if (mode === 'first-person') {
        updateFirstPerson(delta);
        applyHeadBob(delta);
    } else {
        controls.update();
    }
}

function updateTransition(delta) {
    transition.progress += delta / transition.duration;
    if (transition.progress >= 1) {
        transition.active = false;
        transition.progress = 1;
        if (transition.onComplete) transition.onComplete();
        return;
    }

    const t = easeInOutCubic(transition.progress);
    camera.position.lerpVectors(transition.startPos, transition.endPos, t);

    // 相机看向方向插值
    const lookDir = new THREE.Vector3().subVectors(transition.endTarget, transition.startPos).normalize();
    const currentLookDir = new THREE.Vector3().subVectors(transition.startTarget, transition.startPos).normalize();
    currentLookDir.lerp(lookDir, t);
    camera.lookAt(camera.position.clone().add(currentLookDir));
}

function updateFirstPerson(delta) {
    direction.z = Number(keys.forward) - Number(keys.backward);
    direction.x = Number(keys.right) - Number(keys.left);
    direction.normalize();

    const currentSpeed = keys.sprint ? sprintSpeed : moveSpeed;

    // 加速/减速
    if (direction.z !== 0 || direction.x !== 0) {
        velocity.z += direction.z * currentSpeed * acceleration;
        velocity.x += direction.x * currentSpeed * acceleration;
        isMoving = true;
    } else {
        isMoving = false;
    }

    // 限速
    const maxSpeed = currentSpeed;
    velocity.z = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.z));
    velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.x));

    // 减速滑动
    velocity.z *= deceleration;
    velocity.x *= deceleration;

    // 停止阈值
    if (Math.abs(velocity.z) < 0.001) velocity.z = 0;
    if (Math.abs(velocity.x) < 0.001) velocity.x = 0;

    // 朝相机朝向移动
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    camera.position.addScaledVector(forward, -velocity.z);
    camera.position.addScaledVector(right, velocity.x);

    // 边界弹性（轻微反弹）
    const bounceForce = 0.3;
    if (camera.position.x < roomBounds.minX) { camera.position.x = roomBounds.minX; velocity.x *= -bounceForce; }
    if (camera.position.x > roomBounds.maxX) { camera.position.x = roomBounds.maxX; velocity.x *= -bounceForce; }
    if (camera.position.z < roomBounds.minZ) { camera.position.z = roomBounds.minZ; velocity.z *= -bounceForce; }
    if (camera.position.z > roomBounds.maxZ) { camera.position.z = roomBounds.maxZ; velocity.z *= -bounceForce; }

    // 应用鼠标视角
    camera.rotation.order = 'YXZ';
    camera.rotation.y = -smoothMouseX;
    camera.rotation.x = -smoothMouseY;
}

function applyHeadBob(delta) {
    const speed = Math.sqrt(velocity.z * velocity.z + velocity.x * velocity.x);
    if (speed > 0.005) {
        headBobTime += delta * headBobSpeed * (keys.sprint ? 1.4 : 1);
        const bob = Math.sin(headBobTime) * headBobAmount * (speed / moveSpeed);
        camera.position.y = baseHeight + bob;
    } else {
        // 归还到基高
        camera.position.y += (baseHeight - camera.position.y) * 0.1;
        headBobTime = 0;
    }
}

export function getMode() { return mode; }
export function getVelocity() { return velocity.length(); }
export function isMoving() { return isMoving; }

export function setMouseSensitivity(sens) {
    mouseSensitivity = Math.max(0.2, Math.min(3.0, sens));
}

function initMobileControls() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');
    if (!joystickBase || !joystickStick) return;

    let touchId = null;
    const maxDistance = 35;

    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchId = e.touches[0].identifier;
    }, { passive: false });
    joystickBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = joystickBase.getBoundingClientRect();
        for (let touch of e.touches) {
            if (touch.identifier === touchId) {
                const dx = touch.clientX - rect.left - rect.width / 2;
                const dy = touch.clientY - rect.top - rect.height / 2;
                const distance = Math.min(maxDistance, Math.sqrt(dx * dx + dy * dy));
                const angle = Math.atan2(dy, dx);
                joystickStick.style.transform = `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px))`;
                keys.forward = dy < -10;
                keys.backward = dy > 10;
                keys.left = dx < -10;
                keys.right = dx > 10;
            }
        }
    }, { passive: false });
    joystickBase.addEventListener('touchend', (e) => {
        joystickStick.style.transform = 'translate(-50%, -50%)';
        keys.forward = keys.backward = keys.left = keys.right = false;
        touchId = null;
    });
}
