/**
 * 动画系统 - 升级版
 * 新增：星星灯串闪烁、台灯光晕、屏幕冷光、家具交互动画增强
 */
import * as THREE from 'three';

let sceneRef = null;

export function setScene(scene) {
    sceneRef = scene;
}

/**
 * 魔法书悬浮打开动画
 */
export function magicBookAnimation(bookshelf, onComplete) {
    const books = [];
    bookshelf.traverse((child) => {
        if (child.isMesh && child.geometry && child.geometry.parameters) {
            const p = child.geometry.parameters;
            if (p && p.width < 0.15) books.push(child);
        }
    });

    const selectedBooks = books.sort(() => Math.random() - 0.5).slice(0, 5);
    selectedBooks.forEach((book, index) => {
        const originalY = book.position.y;
        const originalZ = book.position.z;
        const startTime = Date.now();
        const delay = index * 200;

        const animate = () => {
            const elapsed = Date.now() - startTime - delay;
            if (elapsed < 0) { requestAnimationFrame(animate); return; }

            if (elapsed < 1500) {
                const progress = elapsed / 1500;
                const eased = 1 - Math.pow(1 - progress, 3);
                book.position.y = originalY + Math.sin(progress * Math.PI) * 0.3;
                book.position.z = originalZ + eased * 0.3;
                book.rotation.y = eased * Math.PI * 2;
                book.rotation.x = Math.sin(progress * Math.PI * 2) * 0.2;
                requestAnimationFrame(animate);
            } else {
                book.position.y = originalY;
                book.position.z = originalZ;
                book.rotation.y = 0;
                book.rotation.x = 0;
                if (index === selectedBooks.length - 1 && onComplete) onComplete();
            }
        };
        animate();
    });

    createMagicParticles(bookshelf.position, 20);
}

/**
 * 屏幕发光动画 - 增强冷光投射效果
 */
export function screenGlowAnimation(screen, onComplete) {
    const originalColor = screen.material.color.getHex();
    const startTime = Date.now();

    // 找到screen-light增强亮度
    const parentGroup = screen.parent;
    let screenLight = null;
    if (parentGroup) {
        parentGroup.traverse(child => {
            if (child.name === 'screen-light') screenLight = child;
        });
    }
    const originalLightIntensity = screenLight ? screenLight.intensity : 0.3;

    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) {
            const pulse = Math.sin(elapsed * 0.01) * 0.5 + 0.5;
            screen.material.color = new THREE.Color(0x4A90D9).multiplyScalar(1 + pulse * 0.5);
            screen.material.emissive = new THREE.Color(0x4A90D9);
            screen.material.emissiveIntensity = pulse * 0.5;
            if (screenLight) screenLight.intensity = 0.3 + pulse * 0.5;
            requestAnimationFrame(animate);
        } else {
            screen.material.color = new THREE.Color(originalColor);
            screen.material.emissive = new THREE.Color(0x000000);
            screen.material.emissiveIntensity = 0;
            if (screenLight) screenLight.intensity = originalLightIntensity;
            if (onComplete) onComplete();
        }
    };
    animate();
}

/**
 * 钢琴琴键发光动画 - 增强版
 */
export function pianoKeyAnimation(piano, onComplete) {
    const keys = [];
    piano.traverse((child) => { if (child.name && child.name.includes('key')) keys.push(child); });

    keys.forEach((key, index) => {
        setTimeout(() => {
            const isWhite = key.name.includes('white');
            key.material.emissive = new THREE.Color(isWhite ? 0xFFB6C1 : 0x9B59B6);
            key.material.emissiveIntensity = 0.8;
            key.position.y += 0.01;

            setTimeout(() => {
                key.material.emissive = new THREE.Color(0x000000);
                key.material.emissiveIntensity = 0;
                key.position.y -= 0.01;
                if (index === keys.length - 1 && onComplete) onComplete();
            }, 300);
        }, index * 80);
    });
}

/**
 * 音波动画 - 增强LED闪烁
 */
export function soundWaveAnimation(speaker, onComplete) {
    const ring = speaker.getObjectByName('speaker-ring');
    const led = speaker.getObjectByName('speaker-led');
    if (!ring) return;

    const startTime = Date.now();
    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 3000) {
            ring.rotation.z += 0.05;
            ring.material.opacity = 0.5 + Math.sin(elapsed * 0.01) * 0.3;
            if (led) {
                led.material.color.setHSL((elapsed * 0.001) % 1, 1, 0.5);
            }
            if (elapsed % 500 < 20) createSoundWave(speaker.position.clone());
            requestAnimationFrame(animate);
        } else {
            ring.material.opacity = 0.8;
            ring.rotation.z = 0;
            if (led) led.material.color.setHex(0x00FF88);
            if (onComplete) onComplete();
        }
    };
    animate();
}

/**
 * 抽屉拉开动画
 */
export function drawerOpenAnimation(cabinet, drawerIndex, onComplete) {
    let targetDrawer = null;
    cabinet.traverse((child) => { if (child.name === `drawer-${drawerIndex}`) targetDrawer = child; });
    if (!targetDrawer) return;

    const originalZ = targetDrawer.position.z;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
            const eased = 1 - Math.pow(1 - elapsed / 500, 3);
            targetDrawer.position.z = originalZ + eased * 0.2;
            requestAnimationFrame(animate);
        } else {
            setTimeout(() => {
                const closeStart = Date.now();
                const closeAnimate = () => {
                    const closeElapsed = Date.now() - closeStart;
                    if (closeElapsed < 500) {
                        const eased = 1 - Math.pow(1 - closeElapsed / 500, 3);
                        targetDrawer.position.z = originalZ + 0.2 - eased * 0.2;
                        requestAnimationFrame(closeAnimate);
                    } else {
                        targetDrawer.position.z = originalZ;
                        if (onComplete) onComplete();
                    }
                };
                closeAnimate();
            }, 1000);
        }
    };
    animate();
}

/**
 * 枕头弹起动画 - 增强版（被子也微动）
 */
export function pillowBounceAnimation(bed, onComplete) {
    let pillow = null;
    bed.traverse((child) => { if (child.name === 'pillow') pillow = child; });
    if (!pillow) return;

    const originalY = pillow.position.y;
    const startTime = Date.now();
    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
            const bounce = Math.sin(elapsed * 0.01) * Math.exp(-elapsed * 0.002);
            pillow.position.y = originalY + bounce * 0.25;
            pillow.rotation.x = bounce * 0.2;
            requestAnimationFrame(animate);
        } else {
            pillow.position.y = originalY;
            pillow.rotation.x = 0;
            if (onComplete) onComplete();
        }
    };
    animate();
}

/**
 * 窗帘飘动动画 - 增强褶皱效果
 */
export function curtainWaveAnimation(window, onComplete) {
    const curtains = [];
    window.traverse((child) => { if (child.name && child.name.includes('curtain')) curtains.push(child); });

    const startTime = Date.now();
    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) {
            curtains.forEach((curtain, index) => {
                curtain.rotation.y = Math.sin(elapsed * 0.005 + index) * 0.08;
                curtain.scale.x = 1 + Math.sin(elapsed * 0.003 + index) * 0.05;
            });
            requestAnimationFrame(animate);
        } else {
            curtains.forEach(curtain => { curtain.rotation.y = 0; curtain.scale.x = 1; });
            if (onComplete) onComplete();
        }
    };
    animate();
}

/**
 * 液态玻璃弹窗动画
 */
export function liquidGlassAnimation(element) {
    element.style.transform = 'scale(0.8) translateY(30px)';
    element.style.opacity = '0';
    setTimeout(() => {
        element.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        element.style.transform = 'scale(1) translateY(0)';
        element.style.opacity = '1';
    }, 50);
}

/**
 * 创建魔法粒子
 */
function createMagicParticles(position, count) {
    if (!sceneRef) return;
    const particles = [];
    const geometry = new THREE.SphereGeometry(0.02, 8, 8);

    for (let i = 0; i < count; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.75 + Math.random() * 0.15, 0.8, 0.7),
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.position.y += Math.random() * 2;
        particle.position.x += (Math.random() - 0.5) * 2;
        particle.position.z += (Math.random() - 0.5) * 2;
        particle.userData = {
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, Math.random() * 0.02, (Math.random() - 0.5) * 0.02),
            life: 1
        };
        sceneRef.add(particle);
        particles.push(particle);
    }

    const animateParticles = () => {
        let alive = false;
        particles.forEach(p => {
            if (p.userData.life > 0) {
                p.position.add(p.userData.velocity);
                p.userData.life -= 0.02;
                p.material.opacity = p.userData.life;
                p.scale.setScalar(p.userData.life);
                alive = true;
            } else {
                sceneRef.remove(p);
            }
        });
        if (alive) requestAnimationFrame(animateParticles);
    };
    animateParticles();
}

/**
 * 创建音波扩散效果
 */
function createSoundWave(position) {
    if (!sceneRef) return;
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.08, 32),
        new THREE.MeshBasicMaterial({ color: 0x9B59B6, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    ring.position.copy(position);
    ring.position.y += 0.3;
    ring.rotation.x = Math.PI / 2;
    sceneRef.add(ring);

    const startTime = Date.now();
    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) {
            const scale = 1 + elapsed * 0.005;
            ring.scale.set(scale, scale, 1);
            ring.material.opacity = 1 - elapsed / 800;
            requestAnimationFrame(animate);
        } else {
            sceneRef.remove(ring);
        }
    };
    animate();
}

/**
 * 星星灯串闪烁动画（由main.js每帧调用）
 */
export function updateStarLights(roomGroup, time) {
    if (!roomGroup) return;
    roomGroup.traverse(child => {
        if (child.name && child.name.startsWith('star-light-')) {
            const idx = parseInt(child.name.split('-')[2]);
            const flicker = Math.sin(time * 0.003 + idx * 1.7) * 0.3 + 0.7;
            child.material.opacity = flicker;
            child.scale.setScalar(0.9 + flicker * 0.2);
        }
    });
}

/**
 * 台灯光晕呼吸（由main.js每帧调用）
 */
export function updateLampGlow(roomGroup, time) {
    if (!roomGroup) return;
    roomGroup.traverse(child => {
        if (child.name === 'lamp-light') {
            const breathe = Math.sin(time * 0.002) * 0.1;
            child.intensity = 0.6 + breathe;
        }
        if (child.name === 'lamp-bulb') {
            const breathe = Math.sin(time * 0.002) * 0.15 + 0.85;
            child.material.opacity = breathe;
        }
    });
}
