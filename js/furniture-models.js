/**
 * 家具3D模型构建函数 - 升级版
 * 更精细的几何体组合、Canvas纹理、材质升级
 */
import * as THREE from 'three';

// ==================== 工具函数 ====================

/** 创建木纹Canvas纹理 */
function createWoodTexture(baseColor = '#8B7355', grainColor = '#6B5335') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 60; i++) {
        const y = Math.random() * 512;
        ctx.strokeStyle = `rgba(${parseInt(grainColor.slice(1,3),16)},${parseInt(grainColor.slice(3,5),16)},${parseInt(grainColor.slice(5,7),16)},${0.1 + Math.random() * 0.15})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < 512; x += 20) {
            ctx.lineTo(x, y + (Math.random() - 0.5) * 8);
        }
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

/** 创建布料纹理 */
function createFabricTexture(color1, color2, pattern = 'solid') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    // 噪点模拟布料质感
    if (pattern === 'noise') {
        for (let i = 0; i < 3000; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
    } else if (pattern === 'floral') {
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 256, y = Math.random() * 256, r = 8 + Math.random() * 12;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.35})`;
            ctx.fill();
        }
    }
    return new THREE.CanvasTexture(canvas);
}

/** 金属材质 */
function metalMaterial(color = 0xC0C0C0, roughness = 0.2, metalness = 0.9) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** 木头材质带纹理 */
function woodMaterial(baseColor, grainColor) {
    return new THREE.MeshStandardMaterial({ map: createWoodTexture(baseColor, grainColor), roughness: 0.75, metalness: 0.05 });
}

// ==================== 床 ====================

export function createBed() {
    const bedGroup = new THREE.Group();
    bedGroup.name = 'bed';

    const frameMat = woodMaterial('#8B7355', '#6B5335');

    // 床架
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.8), frameMat);
    frame.position.y = 0.2;
    frame.castShadow = true;
    frame.receiveShadow = true;
    bedGroup.add(frame);

    // 床腿
    const legGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    [[-1.0, 0.2, -0.8], [1.0, 0.2, -0.8], [-1.0, 0.2, 0.8], [1.0, 0.2, 0.8]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, frameMat);
        leg.position.set(...pos);
        leg.castShadow = true;
        bedGroup.add(leg);
    });

    // 床垫
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0xFFF8F0, roughness: 0.9 });
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 1.7), mattressMat);
    mattress.position.y = 0.52;
    mattress.castShadow = true;
    bedGroup.add(mattress);

    // 床单垂下来效果
    const sheetGeo = new THREE.BoxGeometry(2.15, 0.05, 1.75);
    const sheetMat = new THREE.MeshStandardMaterial({ color: 0xFFF0F5, roughness: 0.95 });
    const sheet = new THREE.Mesh(sheetGeo, sheetMat);
    sheet.position.y = 0.65;
    bedGroup.add(sheet);

    // 床单侧面垂下
    const drapeMat = new THREE.MeshStandardMaterial({ color: 0xFFF0F5, roughness: 0.95, side: THREE.DoubleSide });
    // 左侧垂下
    const drapeL = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.35), drapeMat);
    drapeL.position.set(0, 0.48, 0.88);
    drapeL.rotation.x = 0.1;
    bedGroup.add(drapeL);
    // 右侧垂下
    const drapeR = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.35), drapeMat);
    drapeR.position.set(0, 0.48, -0.88);
    drapeR.rotation.x = -0.1;
    bedGroup.add(drapeR);
    // 尾部垂下
    const drapeF = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.35), drapeMat);
    drapeF.position.set(1.07, 0.48, 0);
    drapeF.rotation.y = Math.PI / 2;
    drapeF.rotation.x = 0.05;
    bedGroup.add(drapeF);

    // 被子 - 褶皱纹理（用多个box模拟）
    const blanketTex = createFabricTexture('#FFB6C1', '#E6E6FA', 'floral');
    const blanketMat = new THREE.MeshStandardMaterial({ map: blanketTex, roughness: 0.85 });

    // 被子主体
    const blanketMain = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.4), blanketMat);
    blanketMain.position.set(0, 0.72, 0.1);
    blanketMain.castShadow = true;
    bedGroup.add(blanketMain);

    // 褶皱条（横向3条凸起）
    for (let i = 0; i < 3; i++) {
        const fold = new THREE.Mesh(
            new THREE.BoxGeometry(1.75, 0.05, 0.08),
            blanketMat
        );
        fold.position.set(0, 0.8, -0.4 + i * 0.4);
        bedGroup.add(fold);
    }
    // 褶皱条（纵向2条）
    for (let i = 0; i < 2; i++) {
        const fold = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.05, 1.35),
            blanketMat
        );
        fold.position.set(-0.5 + i * 1.0, 0.8, 0.1);
        bedGroup.add(fold);
    }

    // 枕头1（高的）
    const pillow1Geo = new THREE.BoxGeometry(0.55, 0.2, 0.35);
    const pillow1Mat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.95 });
    const pillow1 = new THREE.Mesh(pillow1Geo, pillow1Mat);
    pillow1.position.set(-0.5, 0.76, -0.55);
    pillow1.rotation.z = 0.1;
    pillow1.castShadow = true;
    pillow1.name = 'pillow';
    bedGroup.add(pillow1);

    // 枕头2（矮的）
    const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.32), pillow1Mat);
    pillow2.position.set(0.5, 0.73, -0.55);
    pillow2.rotation.z = -0.1;
    pillow2.castShadow = true;
    bedGroup.add(pillow2);

    // 床头板（弧形雕花）
    const headboardGroup = new THREE.Group();
    headboardGroup.name = 'headboard';

    // 主板
    const hbMain = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.1), frameMat);
    hbMain.position.set(0, 0.8, -0.85);
    hbMain.castShadow = true;
    headboardGroup.add(hbMain);

    // 弧形顶（用圆柱切片模拟）
    const hbArcGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.1, 32, 1, false, 0, Math.PI);
    const hbArc = new THREE.Mesh(hbArcGeo, frameMat);
    hbArc.position.set(0, 1.4, -0.85);
    hbArc.rotation.y = Math.PI / 2;
    hbArc.rotation.z = Math.PI;
    hbArc.castShadow = true;
    headboardGroup.add(hbArc);

    // 雕花装饰（中心菱形）
    const diamondMat = new THREE.MeshStandardMaterial({ color: 0x9B7355, roughness: 0.6 });
    const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), diamondMat);
    diamond.position.set(0, 1.0, -0.79);
    diamond.rotation.z = Math.PI / 4;
    headboardGroup.add(diamond);

    // 雕花装饰（两侧小圆）
    [[-0.6, 1.0, -0.79], [0.6, 1.0, -0.79]].forEach(pos => {
        const circle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), diamondMat);
        circle.position.set(...pos);
        circle.rotation.x = Math.PI / 2;
        headboardGroup.add(circle);
    });

    bedGroup.add(headboardGroup);

    // 床头柜
    const nightstandGroup = createNightstand();
    nightstandGroup.position.set(-1.5, 0, -0.3);
    bedGroup.add(nightstandGroup);

    bedGroup.userData = { type: 'bed', interactive: true, hint: '💤 关于我' };
    return bedGroup;
}

/** 床头柜 + 小台灯 */
function createNightstand() {
    const group = new THREE.Group();
    group.name = 'nightstand';
    const nsMat = woodMaterial('#7B6345', '#5B4325');

    // 柜体
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.4), nsMat);
    body.position.y = 0.25;
    body.castShadow = true;
    group.add(body);

    // 抽屉
    const drawer = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.18, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.6 })
    );
    drawer.position.set(0, 0.3, 0.21);
    group.add(drawer);

    // 抽屉把手
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8),
        metalMaterial(0xFFD700, 0.2, 0.9)
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.3, 0.24);
    group.add(handle);

    // 小台灯
    const lampGroup = createTableLamp();
    lampGroup.position.set(0, 0.52, 0);
    group.add(lampGroup);

    return group;
}

/** 小台灯 - 可发光 */
function createTableLamp() {
    const group = new THREE.Group();
    group.name = 'tablelamp';

    // 底座
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.03, 16),
        metalMaterial(0xC0C0C0, 0.2, 0.9)
    );
    base.position.y = 0.015;
    group.add(base);

    // 灯杆
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8),
        metalMaterial(0xC0C0C0, 0.2, 0.9)
    );
    pole.position.y = 0.13;
    group.add(pole);

    // 灯罩
    const shadeGeo = new THREE.CylinderGeometry(0.04, 0.1, 0.12, 16, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
        color: 0xFFE4B5,
        roughness: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = 0.28;
    group.add(shade);

    // 灯泡（发光体）
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFF8DC })
    );
    bulb.position.y = 0.24;
    bulb.name = 'lamp-bulb';
    group.add(bulb);

    // 灯光
    const light = new THREE.PointLight(0xFFE4B5, 0.6, 3);
    light.position.y = 0.25;
    light.name = 'lamp-light';
    group.add(light);

    return group;
}

// ==================== 书架 ====================

export function createBookshelf() {
    const shelfGroup = new THREE.Group();
    shelfGroup.name = 'bookshelf';

    const whiteWood = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.7, metalness: 0.05 });

    // 背板
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.08), whiteWood);
    back.position.z = -0.21;
    back.castShadow = true;
    shelfGroup.add(back);

    // 侧板
    const sideGeo = new THREE.BoxGeometry(0.08, 2.5, 0.5);
    const leftSide = new THREE.Mesh(sideGeo, whiteWood);
    leftSide.position.set(-0.71, 0, 0.04);
    leftSide.castShadow = true;
    shelfGroup.add(leftSide);
    const rightSide = leftSide.clone();
    rightSide.position.x = 0.71;
    shelfGroup.add(rightSide);

    // 5层隔板
    const shelfGeo = new THREE.BoxGeometry(1.34, 0.04, 0.45);
    for (let i = 0; i < 5; i++) {
        const shelf = new THREE.Mesh(shelfGeo, whiteWood);
        shelf.position.y = -1 + i * 0.5;
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        shelfGroup.add(shelf);
    }

    // 精细书籍 - 至少15本，各种颜色厚度，有些斜靠
    const bookColors = [
        0x9B59B6, 0xE74C3C, 0x3498DB, 0x2ECC71, 0xF39C12,
        0x1ABC9C, 0xE91E63, 0x673AB7, 0x00BCD4, 0xFF9800,
        0x8BC34A, 0xFF5722, 0x607D8B, 0x795548, 0x009688
    ];

    // 确定的书籍布局 - 每层不同配置
    const layerConfigs = [
        { count: 5, tiltIndex: 4 },  // 第1层5本，第5本斜靠
        { count: 4, tiltIndex: -1 }, // 第2层4本
        { count: 6, tiltIndex: 3 },  // 第3层6本，第4本斜靠
        { count: 5, tiltIndex: 2 },  // 第4层5本，第3本斜靠
    ];

    layerConfigs.forEach((config, layer) => {
        const yPos = -0.75 + layer * 0.5;
        let xStart = -0.6;

        for (let i = 0; i < config.count; i++) {
            const isTilted = i === config.tiltIndex;
            const bookWidth = 0.04 + Math.random() * 0.08;
            const bookHeight = 0.25 + Math.random() * 0.15;
            const bookDepth = 0.25 + Math.random() * 0.1;
            const colorIdx = (layer * 4 + i) % bookColors.length;

            const book = new THREE.Mesh(
                new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth),
                new THREE.MeshStandardMaterial({ color: bookColors[colorIdx], roughness: 0.8 })
            );

            if (isTilted) {
                book.position.set(xStart + bookWidth / 2 + 0.03, yPos + bookHeight / 2 - 0.2, 0.05);
                book.rotation.z = -0.25;
            } else {
                book.position.set(xStart + bookWidth / 2, yPos + bookHeight / 2 - 0.23, 0.05);
                book.rotation.y = (Math.random() - 0.5) * 0.1;
            }
            book.castShadow = true;
            shelfGroup.add(book);
            xStart += bookWidth + (isTilted ? 0.06 : 0.01);
            if (xStart > 0.5) break;
        }
    });

    // 书架顶部小盆栽
    const topPlant = createSmallPottedPlant();
    topPlant.position.set(-0.3, 1.27, 0.1);
    topPlant.scale.setScalar(0.8);
    shelfGroup.add(topPlant);

    // 书架顶部相框
    const topFrame = createSmallPhotoFrame(0xDDA0DD);
    topFrame.position.set(0.3, 1.35, 0.1);
    topFrame.scale.setScalar(0.7);
    shelfGroup.add(topFrame);

    shelfGroup.userData = { type: 'bookshelf', interactive: true, hint: '📚 我的文章' };
    return shelfGroup;
}

// ==================== 彩色抽屉柜 ====================

export function createDrawerCabinet() {
    const cabinetGroup = new THREE.Group();
    cabinetGroup.name = 'drawer';

    const drawerColors = [0xFFB6C1, 0xFFD700, 0x90EE90, 0xDDA0DD, 0x87CEEB];
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });

    // 柜体
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), frameMat);
    body.position.y = 0.55;
    body.castShadow = true;
    cabinetGroup.add(body);

    // 木框线条（抽屉之间）
    for (let i = 0; i < 4; i++) {
        const divider = new THREE.Mesh(
            new THREE.BoxGeometry(0.58, 0.02, 0.48),
            new THREE.MeshStandardMaterial({ color: 0xF0F0F0, roughness: 0.5 })
        );
        divider.position.set(0, 0.26 + i * 0.22, 0.01);
        cabinetGroup.add(divider);
    }

    // 5个抽屉
    for (let i = 0; i < 5; i++) {
        const drawer = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.18, 0.02),
            new THREE.MeshStandardMaterial({ color: drawerColors[i], roughness: 0.5, metalness: 0.1 })
        );
        drawer.position.set(0, 0.15 + i * 0.22, 0.26);
        drawer.castShadow = true;
        drawer.name = `drawer-${i}`;
        cabinetGroup.add(drawer);

        // 抽屉拉手（圆形旋钮式）
        const knob = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 12, 12),
            metalMaterial(0xFFD700, 0.2, 0.9)
        );
        knob.position.set(0, 0.15 + i * 0.22, 0.29);
        cabinetGroup.add(knob);
    }

    // 柜顶小物件 - 小熊玩偶
    const bear = createTeddyBear();
    bear.position.set(-0.15, 1.15, 0);
    bear.scale.setScalar(0.3);
    cabinetGroup.add(bear);

    // 柜顶相框
    const frame = createSmallPhotoFrame(0xFFB6C1);
    frame.position.set(0.15, 1.2, 0);
    frame.scale.setScalar(0.5);
    cabinetGroup.add(frame);

    cabinetGroup.userData = { type: 'drawer', interactive: true, hint: '🖼️ 我的收藏' };
    return cabinetGroup;
}

/** 小熊玩偶 */
function createTeddyBear() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.9 });

    // 身体
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), mat);
    body.position.y = 0;
    body.scale.set(1, 1.2, 0.9);
    group.add(body);

    // 头
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mat);
    head.position.y = 0.42;
    group.add(head);

    // 耳朵
    [[-0.15, 0.58, 0], [0.15, 0.58, 0]].forEach(pos => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat);
        ear.position.set(...pos);
        group.add(ear);
    });

    // 鼻子
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.6 })
    );
    nose.position.set(0, 0.4, 0.2);
    group.add(nose);

    // 眼睛
    [[-0.08, 0.46, 0.18], [0.08, 0.46, 0.18]].forEach(pos => {
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x1A1A1A })
        );
        eye.position.set(...pos);
        group.add(eye);
    });

    return group;
}

/** 小相框 */
function createSmallPhotoFrame(frameColor = 0xDDA0DD) {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.5 });

    // 外框
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.02), frameMat));
    // 内部白色区域
    const inner = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9 })
    );
    inner.position.z = 0.011;
    group.add(inner);

    return group;
}

// ==================== 书桌 ====================

export function createDesk() {
    const deskGroup = new THREE.Group();
    deskGroup.name = 'desk';

    const topMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.6 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.7 });

    // 桌面
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.8), topMat);
    top.position.y = 0.75;
    top.castShadow = true;
    top.receiveShadow = true;
    deskGroup.add(top);

    // 桌腿
    [[-0.72, 0.375, -0.32], [0.72, 0.375, -0.32], [-0.72, 0.375, 0.32], [0.72, 0.375, 0.32]].forEach(pos => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), legMat);
        leg.position.set(...pos);
        leg.castShadow = true;
        deskGroup.add(leg);
    });

    // 抽屉（桌下）
    const drawerBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.15, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xECECEC, roughness: 0.6 })
    );
    drawerBox.position.set(-0.45, 0.65, 0.1);
    deskGroup.add(drawerBox);

    // 抽屉拉手
    const dHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8),
        metalMaterial(0xC0C0C0, 0.2, 0.9)
    );
    dHandle.rotation.x = Math.PI / 2;
    dHandle.position.set(-0.45, 0.65, 0.36);
    deskGroup.add(dHandle);

    // 笔筒
    const penHolder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.035, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x9B59B6, roughness: 0.5 })
    );
    penHolder.position.set(-0.5, 0.83, 0.2);
    penHolder.castShadow = true;
    deskGroup.add(penHolder);

    // 笔（3支）
    const penColors = [0x1A1A1A, 0xE74C3C, 0x3498DB];
    penColors.forEach((color, i) => {
        const pen = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.14, 6),
            new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
        );
        pen.position.set(-0.5 + i * 0.015, 0.88 + i * 0.01, 0.2);
        pen.rotation.z = 0.1 * (i - 1);
        deskGroup.add(pen);
    });

    // 小台灯（桌上）
    const deskLamp = createTableLamp();
    deskLamp.position.set(0.55, 0.78, -0.15);
    deskLamp.scale.setScalar(0.7);
    deskGroup.add(deskLamp);

    // 水杯
    const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.025, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x87CEEB, roughness: 0.3, transparent: true, opacity: 0.7 })
    );
    cup.position.set(-0.3, 0.83, 0.25);
    cup.castShadow = true;
    deskGroup.add(cup);
    // 水杯里的水
    const water = new THREE.Mesh(
        new THREE.CylinderGeometry(0.027, 0.023, 0.06, 12),
        new THREE.MeshStandardMaterial({ color: 0xADD8E6, roughness: 0.1, transparent: true, opacity: 0.5 })
    );
    water.position.set(-0.3, 0.84, 0.25);
    deskGroup.add(water);

    // 吊柜
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.35), topMat);
    cabinet.position.set(0, 1.5, -0.2);
    cabinet.castShadow = true;
    deskGroup.add(cabinet);

    // 吊柜门 + 把手
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });
    for (let i = 0; i < 2; i++) {
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.02), doorMat);
        door.position.set(-0.28 + i * 0.56, 1.5, -0.02);
        deskGroup.add(door);

        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8),
            metalMaterial(0xC0C0C0, 0.2, 0.9)
        );
        handle.rotation.x = Math.PI / 2;
        handle.position.set(-0.28 + i * 0.56 + (i === 0 ? 0.22 : -0.22), 1.5, -0.01);
        deskGroup.add(handle);
    }

    deskGroup.userData = { type: 'desk', interactive: false };
    return deskGroup;
}

// ==================== 电脑 ====================

export function createComputer() {
    const computerGroup = new THREE.Group();
    computerGroup.name = 'computer';

    const standMat = metalMaterial(0x2C2C2C, 0.3, 0.8);

    // 显示器底座
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.02, 32), standMat);
    base.position.y = 0.01;
    computerGroup.add(base);

    // 显示器支架
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), standMat);
    stand.position.y = 0.095;
    computerGroup.add(stand);

    // 更薄的显示器
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.35, 0.015),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.5, metalness: 0.3 })
    );
    frame.position.y = 0.35;
    frame.castShadow = true;
    computerGroup.add(frame);

    // 屏幕（微光效果）
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x4A90D9, transparent: true, opacity: 0.95 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), screenMat);
    screen.position.set(0, 0.35, 0.008);
    screen.name = 'screen';
    computerGroup.add(screen);

    // 屏幕光
    const screenLight = new THREE.PointLight(0x4A90D9, 0.3, 1.5);
    screenLight.position.set(0, 0.35, 0.3);
    screenLight.name = 'screen-light';
    computerGroup.add(screenLight);

    // 键盘
    const keyboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.015, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.5, metalness: 0.3 })
    );
    keyboard.position.set(0, 0.008, 0.25);
    computerGroup.add(keyboard);

    // 键盘按键（简化 - 几行小方块）
    const keyMat = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.6 });
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 10; col++) {
            const key = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.008, 0.018), keyMat);
            key.position.set(-0.12 + col * 0.028, 0.018, 0.2 + row * 0.028);
            computerGroup.add(key);
        }
    }

    // 鼠标垫
    const mousepad = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.005, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x9B59B6, roughness: 0.8 })
    );
    mousepad.position.set(0.3, 0.003, 0.2);
    computerGroup.add(mousepad);

    // 鼠标
    const mouseBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.02, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.4, metalness: 0.3 })
    );
    mouseBody.position.set(0.3, 0.015, 0.2);
    mouseBody.name = 'mouse';
    computerGroup.add(mouseBody);

    computerGroup.userData = { type: 'computer', interactive: true, hint: '🎬 视频播放' };
    return computerGroup;
}

// ==================== 钢琴 ====================

export function createPiano() {
    const pianoGroup = new THREE.Group();
    pianoGroup.name = 'piano';

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.3, metalness: 0.2 });

    // 主体
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.6), bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;
    pianoGroup.add(body);

    // 琴盖（打开的感觉 - 略微倾斜）
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.04, 0.62), bodyMat);
    lid.position.set(0, 1.33, 0);
    lid.rotation.x = 0.08;
    lid.castShadow = true;
    pianoGroup.add(lid);

    // 琴盖支撑杆
    const prop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8),
        metalMaterial(0xC0C0C0, 0.2, 0.9)
    );
    prop.position.set(0, 1.25, 0.2);
    prop.rotation.x = 0.3;
    pianoGroup.add(prop);

    // 键盘区域底板
    const keyArea = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.08, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.5 })
    );
    keyArea.position.set(0, 0.95, 0.18);
    pianoGroup.add(keyArea);

    // 白键（更精细）
    const whiteKeyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.3, metalness: 0.05 });
    for (let i = 0; i < 14; i++) {
        const key = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.2), whiteKeyMat);
        key.position.set(-0.48 + i * 0.07, 1.0, 0.2);
        key.name = `white-key-${i}`;
        pianoGroup.add(key);
    }

    // 黑键（更精细，位置更准确）
    const blackKeyMat = new THREE.MeshStandardMaterial({ color: 0x0A0A0A, roughness: 0.2, metalness: 0.4 });
    const blackKeyPattern = [1, 1, 0, 1, 1, 1, 0];
    let blackKeyIdx = 0;
    for (let i = 0; i < 13; i++) {
        if (blackKeyPattern[i % 7]) {
            const key = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.12), blackKeyMat);
            key.position.set(-0.44 + i * 0.07, 1.02, 0.15);
            key.name = `black-key-${blackKeyIdx}`;
            pianoGroup.add(key);
            blackKeyIdx++;
        }
    }

    // 踏板（更精细）
    const pedalMat = metalMaterial(0xFFD700, 0.2, 0.9);
    for (let i = 0; i < 3; i++) {
        const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.1), pedalMat);
        pedal.position.set(-0.1 + i * 0.1, 0.01, 0.35);
        pianoGroup.add(pedal);
        // 踏板杆
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), pedalMat);
        rod.position.set(-0.1 + i * 0.1, 0.04, 0.35);
        pianoGroup.add(rod);
    }

    // 乐谱架
    const standMat = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.5 });
    const musicStand = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.02), standMat);
    musicStand.position.set(0, 1.15, 0.28);
    musicStand.rotation.x = -0.2;
    pianoGroup.add(musicStand);

    // 乐谱
    const scoreMat = new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.9 });
    const score = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.005), scoreMat);
    score.position.set(0, 1.17, 0.3);
    score.rotation.x = -0.2;
    pianoGroup.add(score);

    // 乐谱上的线条
    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = 128;
    lineCanvas.height = 96;
    const lctx = lineCanvas.getContext('2d');
    lctx.fillStyle = '#FFFFF0';
    lctx.fillRect(0, 0, 128, 96);
    for (let i = 0; i < 5; i++) {
        lctx.strokeStyle = '#333';
        lctx.lineWidth = 1;
        lctx.beginPath();
        lctx.moveTo(10, 30 + i * 8);
        lctx.lineTo(118, 30 + i * 8);
        lctx.stroke();
    }
    // 小音符
    lctx.fillStyle = '#333';
    for (let i = 0; i < 8; i++) {
        lctx.beginPath();
        lctx.arc(20 + i * 12, 28 + Math.random() * 40, 3, 0, Math.PI * 2);
        lctx.fill();
    }
    score.material.map = new THREE.CanvasTexture(lineCanvas);
    score.material.needsUpdate = true;

    pianoGroup.userData = { type: 'piano', interactive: true, hint: '🎹 音乐播放' };
    return pianoGroup;
}

// ==================== 音箱 ====================

export function createSpeaker() {
    const speakerGroup = new THREE.Group();
    speakerGroup.name = 'speaker';

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.4, metalness: 0.4 });

    // 主体
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.35, 32), bodyMat);
    body.position.y = 0.175;
    body.castShadow = true;
    speakerGroup.add(body);

    // 顶部格栅
    const grill = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.02, 32),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.6 })
    );
    grill.position.y = 0.36;
    grill.rotation.x = Math.PI / 2;
    speakerGroup.add(grill);

    // 格栅纹理（同心圆）
    const grillCanvas = document.createElement('canvas');
    grillCanvas.width = 128;
    grillCanvas.height = 128;
    const gctx = grillCanvas.getContext('2d');
    gctx.fillStyle = '#1A1A1A';
    gctx.fillRect(0, 0, 128, 128);
    for (let r = 10; r < 60; r += 6) {
        gctx.strokeStyle = `rgba(60,60,60,0.5)`;
        gctx.lineWidth = 2;
        gctx.beginPath();
        gctx.arc(64, 64, r, 0, Math.PI * 2);
        gctx.stroke();
    }
    grill.material.map = new THREE.CanvasTexture(grillCanvas);
    grill.material.needsUpdate = true;

    // 紫色光环
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.01, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x9B59B6, transparent: true, opacity: 0.8 })
    );
    ring.position.y = 0.36;
    ring.rotation.x = Math.PI / 2;
    ring.name = 'speaker-ring';
    speakerGroup.add(ring);

    // LED指示灯
    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00FF88 })
    );
    led.position.set(0, 0.05, 0.15);
    led.name = 'speaker-led';
    speakerGroup.add(led);

    speakerGroup.userData = { type: 'speaker', interactive: true, hint: '🔊 背景音乐' };
    return speakerGroup;
}

// ==================== 笔记本 ====================

export function createNotebook() {
    const notebookGroup = new THREE.Group();
    notebookGroup.name = 'notebook';

    // 封面底部（打开的）
    const bottomCover = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.015, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
    );
    bottomCover.castShadow = true;
    notebookGroup.add(bottomCover);

    // 纸张（有横线纹理）
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = 256;
    pageCanvas.height = 320;
    const pctx = pageCanvas.getContext('2d');
    pctx.fillStyle = '#FFFFF5';
    pctx.fillRect(0, 0, 256, 320);
    // 横线
    pctx.strokeStyle = '#B0C4DE';
    pctx.lineWidth = 1;
    for (let y = 20; y < 310; y += 16) {
        pctx.beginPath();
        pctx.moveTo(20, y);
        pctx.lineTo(236, y);
        pctx.stroke();
    }
    // 红色边线
    pctx.strokeStyle = '#FFB6C1';
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.moveTo(40, 0);
    pctx.lineTo(40, 320);
    pctx.stroke();

    const pageTex = new THREE.CanvasTexture(pageCanvas);
    const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.01, 0.38),
        new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9 })
    );
    pages.position.y = 0.013;
    notebookGroup.add(pages);

    // 翻开的上半封面（倾斜）
    const topCover = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.015, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
    );
    topCover.position.set(0, 0.08, -0.18);
    topCover.rotation.x = -0.6;
    notebookGroup.add(topCover);

    // 书脊
    const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.02, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.6 })
    );
    spine.position.set(-0.15, 0.012, 0);
    notebookGroup.add(spine);

    // 笔（旁边放一支）
    const pen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.4 })
    );
    pen.position.set(0.2, 0.01, 0.05);
    pen.rotation.z = Math.PI / 2;
    pen.rotation.y = 0.3;
    notebookGroup.add(pen);
    // 笔尖
    const penTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.006, 0.02, 6),
        metalMaterial(0xFFD700, 0.2, 0.9)
    );
    penTip.position.set(0.3, 0.01, 0.08);
    penTip.rotation.z = -Math.PI / 2;
    notebookGroup.add(penTip);

    notebookGroup.userData = { type: 'notebook', interactive: true, hint: '📓 写日记' };
    return notebookGroup;
}

// ==================== 窗户 ====================

export function createWindow() {
    const windowGroup = new THREE.Group();
    windowGroup.name = 'window';

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });

    // 外框
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.1), frameMat);
    frame.castShadow = true;
    windowGroup.add(frame);

    // 十字窗棂
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.06), frameMat);
    crossH.position.z = 0.04;
    windowGroup.add(crossH);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.06), frameMat);
    crossV.position.z = 0.04;
    windowGroup.add(crossV);

    // 玻璃（半透明）
    const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 1.3),
        new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            roughness: 0.1,
            metalness: 0.1
        })
    );
    glass.position.z = 0.02;
    windowGroup.add(glass);

    // 窗帘 - 粉色树图案，有褶皱感
    const curtainTex = createFabricTexture('#FFB6C1', '#FFC0CB', 'noise');
    const curtainMatBase = new THREE.MeshStandardMaterial({
        map: curtainTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
    });

    // 窗帘树图案画上去
    const curtainCanvas = document.createElement('canvas');
    curtainCanvas.width = 512;
    curtainCanvas.height = 512;
    const cctx = curtainCanvas.getContext('2d');
    const cgradient = cctx.createLinearGradient(0, 0, 0, 512);
    cgradient.addColorStop(0, '#FFB6C1');
    cgradient.addColorStop(1, '#FFC0CB');
    cctx.fillStyle = cgradient;
    cctx.fillRect(0, 0, 512, 512);

    // 褶皱阴影
    for (let i = 0; i < 8; i++) {
        const x = i * 64 + 32;
        cctx.fillStyle = `rgba(200, 100, 150, ${0.1 + Math.random() * 0.1})`;
        cctx.fillRect(x, 0, 8, 512);
    }

    // 树图案
    cctx.strokeStyle = '#FF69B4';
    cctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        const x = 50 + i * 100;
        const y = 450;
        cctx.beginPath();
        cctx.moveTo(x, y);
        cctx.lineTo(x, y - 150);
        cctx.stroke();
        cctx.fillStyle = '#FF69B4';
        cctx.beginPath();
        cctx.arc(x, y - 180, 40, 0, Math.PI * 2);
        cctx.fill();
        cctx.beginPath();
        cctx.arc(x - 30, y - 150, 30, 0, Math.PI * 2);
        cctx.fill();
        cctx.beginPath();
        cctx.arc(x + 30, y - 150, 30, 0, Math.PI * 2);
        cctx.fill();
    }

    const finalCurtainTex = new THREE.CanvasTexture(curtainCanvas);
    const curtainMat = new THREE.MeshStandardMaterial({
        map: finalCurtainTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
    });

    // 左窗帘（多段褶皱）
    const leftCurtain = createCurtainWithFolds(curtainMat, true);
    leftCurtain.position.set(-0.4, 0, 0.12);
    leftCurtain.name = 'curtain-left';
    windowGroup.add(leftCurtain);

    // 右窗帘
    const rightCurtain = createCurtainWithFolds(curtainMat, false);
    rightCurtain.position.set(0.4, 0, 0.12);
    rightCurtain.name = 'curtain-right';
    windowGroup.add(rightCurtain);

    // 窗台
    const sill = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.06, 0.2),
        frameMat
    );
    sill.position.set(0, -0.78, 0.1);
    windowGroup.add(sill);

    // 窗台小盆栽
    const sillPlant = createSmallPottedPlant();
    sillPlant.position.set(0.3, -0.72, 0.1);
    sillPlant.scale.setScalar(0.5);
    windowGroup.add(sillPlant);

    windowGroup.userData = { type: 'window', interactive: true, hint: '🪟 切换天气' };
    return windowGroup;
}

/** 带褶皱的窗帘（用多个平面段模拟） */
function createCurtainWithFolds(material, isLeft) {
    const group = new THREE.Group();
    const segments = 4;
    const segWidth = 0.2;
    for (let i = 0; i < segments; i++) {
        const seg = new THREE.Mesh(
            new THREE.PlaneGeometry(segWidth, 1.5),
            material.clone()
        );
        const offset = (i - segments / 2 + 0.5) * segWidth;
        seg.position.x = offset;
        // 褶皱：交替微微旋转和前后偏移
        seg.rotation.y = (i % 2 === 0 ? 0.08 : -0.08);
        seg.position.z = (i % 2 === 0 ? 0.03 : -0.03);
        group.add(seg);
    }
    return group;
}

// ==================== 空调 ====================

export function createAirConditioner() {
    const acGroup = new THREE.Group();
    acGroup.name = 'airconditioner';

    // 主体
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.25, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.4, metalness: 0.1 })
    );
    acGroup.add(body);

    // 出风口格栅（多条横线）
    for (let i = 0; i < 8; i++) {
        const louver = new THREE.Mesh(
            new THREE.BoxGeometry(0.68, 0.008, 0.03),
            new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.5 })
        );
        louver.position.set(0, -0.08 - i * 0.008, 0.1);
        louver.rotation.x = 0.15;
        acGroup.add(louver);
    }

    // LED指示灯
    const led = new THREE.Mesh(
        new THREE.CircleGeometry(0.012, 12),
        new THREE.MeshBasicMaterial({ color: 0x00FF88 })
    );
    led.position.set(-0.35, 0.05, 0.101);
    led.name = 'ac-led';
    acGroup.add(led);

    // 品牌标志区域
    const logo = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.02, 0.005),
        new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.3, metalness: 0.5 })
    );
    logo.position.set(0.2, 0.05, 0.101);
    acGroup.add(logo);

    acGroup.userData = { type: 'airconditioner', interactive: false };
    return acGroup;
}

// ==================== 椅子 ====================

export function createChair() {
    const chairGroup = new THREE.Group();
    chairGroup.name = 'chair';

    const chairMat = new THREE.MeshStandardMaterial({ color: 0x9B59B6, roughness: 0.7, metalness: 0.1 });
    const legMat = metalMaterial(0xC0C0C0, 0.3, 0.8);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), chairMat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    chairGroup.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.06), chairMat);
    back.position.set(0, 0.74, -0.2);
    back.rotation.x = 0.1;
    back.castShadow = true;
    chairGroup.add(back);

    [[-0.18, 0.225, -0.18], [0.18, 0.225, -0.18], [-0.18, 0.225, 0.18], [0.18, 0.225, 0.18]].forEach(pos => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 16), legMat);
        leg.position.set(...pos);
        leg.castShadow = true;
        chairGroup.add(leg);
    });

    chairGroup.userData = { type: 'chair', interactive: false };
    return chairGroup;
}

// ==================== 新增家具/装饰 ====================

/** 小盆栽 */
function createSmallPottedPlant() {
    const group = new THREE.Group();
    group.name = 'potted-plant';

    // 花盆
    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.04, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0xD2691E, roughness: 0.8 })
    );
    pot.position.y = 0.05;
    pot.castShadow = true;
    group.add(pot);

    // 泥土
    const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.01, 12),
        new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 })
    );
    soil.position.y = 0.1;
    group.add(soil);

    // 植物茎
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.12, 6),
        new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8 })
    );
    stem.position.y = 0.16;
    group.add(stem);

    // 叶子（多片）
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(
            new THREE.PlaneGeometry(0.06, 0.04),
            leafMat
        );
        const angle = (i / 5) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.03, 0.18 + i * 0.02, Math.sin(angle) * 0.03);
        leaf.rotation.y = angle;
        leaf.rotation.x = -0.3;
        group.add(leaf);
    }

    return group;
}

/** 地毯 - 紫粉色花纹 */
export function createCarpet() {
    const carpetGroup = new THREE.Group();
    carpetGroup.name = 'carpet';

    const carpetCanvas = document.createElement('canvas');
    carpetCanvas.width = 512;
    carpetCanvas.height = 512;
    const cctx = carpetCanvas.getContext('2d');

    // 紫粉渐变底
    const grad = cctx.createRadialGradient(256, 256, 50, 256, 256, 256);
    grad.addColorStop(0, '#DDA0DD');
    grad.addColorStop(0.5, '#FFB6C1');
    grad.addColorStop(1, '#DDA0DD');
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, 512, 512);

    // 花纹 - 边框
    cctx.strokeStyle = '#9B59B6';
    cctx.lineWidth = 8;
    cctx.strokeRect(30, 30, 452, 452);
    cctx.strokeRect(50, 50, 412, 412);

    // 中心花纹
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        cctx.fillStyle = `rgba(155, 89, 182, ${0.3 + i * 0.05})`;
        cctx.beginPath();
        cctx.ellipse(256 + Math.cos(angle) * 100, 256 + Math.sin(angle) * 100, 40, 25, angle, 0, Math.PI * 2);
        cctx.fill();
    }
    // 中心圆
    cctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
    cctx.beginPath();
    cctx.arc(256, 256, 60, 0, Math.PI * 2);
    cctx.fill();

    const carpetTex = new THREE.CanvasTexture(carpetCanvas);
    const carpet = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1.2),
        new THREE.MeshStandardMaterial({
            map: carpetTex,
            roughness: 0.95,
            metalness: 0
        })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = 0.01;
    carpet.receiveShadow = true;
    carpetGroup.add(carpet);

    carpetGroup.userData = { type: 'carpet', interactive: false };
    return carpetGroup;
}

/** 墙上相框 */
export function createWallPhotoFrame(color = 0xDDA0DD, width = 0.35, height = 0.4) {
    const group = new THREE.Group();
    group.name = 'wall-frame';

    const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });

    // 外框（4条边）
    const thickness = 0.03;
    // 上
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(width + thickness * 2, thickness, thickness), frameMat), { position: new THREE.Vector3(0, height / 2 + thickness / 2, 0) }));
    // 下
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(width + thickness * 2, thickness, thickness), frameMat), { position: new THREE.Vector3(0, -height / 2 - thickness / 2, 0) }));
    // 左
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(thickness, height, thickness), frameMat), { position: new THREE.Vector3(-width / 2 - thickness / 2, 0, 0) }));
    // 右
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(thickness, height, thickness), frameMat), { position: new THREE.Vector3(width / 2 + thickness / 2, 0, 0) }));

    // 内容（白色底+彩色渐变模拟照片）
    const photoCanvas = document.createElement('canvas');
    photoCanvas.width = 128;
    photoCanvas.height = 128;
    const pctx = photoCanvas.getContext('2d');
    const pgrad = pctx.createLinearGradient(0, 0, 128, 128);
    pgrad.addColorStop(0, '#FFB6C1');
    pgrad.addColorStop(0.5, '#DDA0DD');
    pgrad.addColorStop(1, '#87CEEB');
    pctx.fillStyle = pgrad;
    pctx.fillRect(0, 0, 128, 128);
    // 小爱心装饰
    pctx.fillStyle = '#FF69B4';
    pctx.font = '30px serif';
    pctx.fillText('♥', 50, 75);

    const photoTex = new THREE.CanvasTexture(photoCanvas);
    const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.5 })
    );
    photo.position.z = 0.005;
    group.add(photo);

    group.userData = { type: 'wall-frame', interactive: false };
    return group;
}

/** 门 - 木门带把手 */
export function createDoor() {
    const doorGroup = new THREE.Group();
    doorGroup.name = 'door';

    const doorMat = woodMaterial('#8B6914', '#6B4914');

    // 门板
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.06), doorMat);
    door.position.y = 1.05;
    door.castShadow = true;
    doorGroup.add(door);

    // 门框
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFF8DC, roughness: 0.6 });
    // 左框
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.15, 0.08), frameMat);
    leftFrame.position.set(-0.49, 1.075, 0);
    doorGroup.add(leftFrame);
    // 右框
    const rightFrame = leftFrame.clone();
    rightFrame.position.x = 0.49;
    doorGroup.add(rightFrame);
    // 上框
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.08, 0.08), frameMat);
    topFrame.position.set(0, 2.15, 0);
    doorGroup.add(topFrame);

    // 门把手
    const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 12, 12),
        metalMaterial(0xFFD700, 0.2, 0.9)
    );
    handle.position.set(0.35, 1.05, 0.04);
    doorGroup.add(handle);

    // 门把手底座
    const handleBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.03, 8),
        metalMaterial(0xFFD700, 0.2, 0.9)
    );
    handleBase.rotation.x = Math.PI / 2;
    handleBase.position.set(0.35, 1.05, 0.035);
    doorGroup.add(handleBase);

    doorGroup.userData = { type: 'door', interactive: false };
    return doorGroup;
}

/** 挂钟 */
export function createWallClock() {
    const clockGroup = new THREE.Group();
    clockGroup.name = 'wall-clock';

    // 钟面
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 256;
    faceCanvas.height = 256;
    const fctx = faceCanvas.getContext('2d');
    fctx.fillStyle = '#FFFFF0';
    fctx.beginPath();
    fctx.arc(128, 128, 120, 0, Math.PI * 2);
    fctx.fill();

    // 数字
    fctx.fillStyle = '#333';
    fctx.font = 'bold 24px serif';
    fctx.textAlign = 'center';
    fctx.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        fctx.fillText(i.toString(), 128 + Math.cos(angle) * 95, 128 + Math.sin(angle) * 95);
    }

    // 刻度
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const len = i % 5 === 0 ? 15 : 8;
        fctx.strokeStyle = i % 5 === 0 ? '#333' : '#999';
        fctx.lineWidth = i % 5 === 0 ? 2 : 1;
        fctx.beginPath();
        fctx.moveTo(128 + Math.cos(angle) * (110 - len), 128 + Math.sin(angle) * (110 - len));
        fctx.lineTo(128 + Math.cos(angle) * 110, 128 + Math.sin(angle) * 110);
        fctx.stroke();
    }

    // 时针
    fctx.strokeStyle = '#333';
    fctx.lineWidth = 4;
    fctx.beginPath();
    fctx.moveTo(128, 128);
    fctx.lineTo(128 + Math.cos(-Math.PI / 6) * 55, 128 + Math.sin(-Math.PI / 6) * 55);
    fctx.stroke();

    // 分针
    fctx.lineWidth = 2;
    fctx.beginPath();
    fctx.moveTo(128, 128);
    fctx.lineTo(128 + Math.cos(Math.PI / 3) * 80, 128 + Math.sin(Math.PI / 3) * 80);
    fctx.stroke();

    // 中心点
    fctx.fillStyle = '#9B59B6';
    fctx.beginPath();
    fctx.arc(128, 128, 5, 0, Math.PI * 2);
    fctx.fill();

    const faceTex = new THREE.CanvasTexture(faceCanvas);

    // 外框
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.025, 16, 32),
        new THREE.MeshStandardMaterial({ color: 0xDDA0DD, roughness: 0.4, metalness: 0.3 })
    );
    clockGroup.add(rim);

    // 钟面
    const face = new THREE.Mesh(
        new THREE.CircleGeometry(0.29, 32),
        new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 })
    );
    face.position.z = 0.005;
    clockGroup.add(face);

    clockGroup.userData = { type: 'wall-clock', interactive: false };
    return clockGroup;
}

/** 星星灯串 - 沿墙壁顶部 */
export function createStarLights(wallWidth = 8) {
    const group = new THREE.Group();
    group.name = 'star-lights';

    const starCount = 20;
    const spacing = wallWidth / starCount;

    // 连接线
    const wireGeo = new THREE.BufferGeometry();
    const wirePoints = [];
    for (let i = 0; i < starCount; i++) {
        const x = -wallWidth / 2 + i * spacing;
        const y = 3.7 + Math.sin(i * 0.5) * 0.1;
        wirePoints.push(x, y, 0.05);
    }
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wirePoints, 3));
    const wireMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const wire = new THREE.Line(wireGeo, wireMat);
    group.add(wire);

    // 星星灯珠
    for (let i = 0; i < starCount; i++) {
        const x = -wallWidth / 2 + i * spacing;
        const y = 3.7 + Math.sin(i * 0.5) * 0.1;
        const z = 0.05;

        // 星星形状（简化为发光球）
        const starMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.75 + (i % 3) * 0.08, 0.9, 0.7),
            transparent: true,
            opacity: 0.9
        });
        const star = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), starMat);
        star.position.set(x, y, z);
        star.name = `star-light-${i}`;
        group.add(star);

        // 发光点光源（每隔几个加一个，性能考虑）
        if (i % 4 === 0) {
            const light = new THREE.PointLight(
                new THREE.Color().setHSL(0.75 + (i % 3) * 0.08, 0.9, 0.7),
                0.15,
                2
            );
            light.position.set(x, y, z);
            light.name = `star-point-light-${i}`;
            group.add(light);
        }
    }

    group.userData = { type: 'star-lights', interactive: false };
    return group;
}

// ==================== 新增装饰品（Minecraft风格+精致细节） ====================

/** 多肉盆栽 - Minecraft风格（低多面体） */
export function createPlantPot(x = 0, y = 0, z = 0, potColor = 0xCD853F) {
    const group = new THREE.Group();
    group.name = 'plant-pot';

    // 陶土盆（圆角盒子效果）
    const potGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.08, 8);
    const pot = new THREE.Mesh(potGeo, new THREE.MeshStandardMaterial({
        color: potColor, roughness: 0.8, metalness: 0.05
    }));
    pot.position.y = 0.04;
    pot.castShadow = true;
    group.add(pot);

    // 盆沿
    const rimGeo = new THREE.TorusGeometry(0.065, 0.012, 6, 8);
    const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({
        color: potColor, roughness: 0.8
    }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.085;
    group.add(rim);

    // 土
    const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.01, 8),
        new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 1.0 })
    );
    soil.position.y = 0.09;
    group.add(soil);

    // 多肉叶子 - 多个低多面体球叠在一起（Minecraft风格）
    const leafColors = [0x228B22, 0x32CD32, 0x2E8B57, 0x3CB371, 0x90EE90];
    const leafPositions = [
        [0, 0, 0], [0.03, 0.02, 0], [-0.03, 0.02, 0],
        [0, 0.04, 0], [0.02, 0.06, 0.01], [-0.02, 0.06, -0.01],
        [0.01, 0.08, 0.02], [-0.01, 0.08, -0.02]
    ];
    leafPositions.forEach((pos, i) => {
        const leafMat = new THREE.MeshStandardMaterial({
            color: leafColors[i % leafColors.length],
            roughness: 0.7,
            metalness: 0.0,
            flatShading: true  // Minecraft风格平面着色
        });
        const leaf = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.02 + Math.random() * 0.01, 0), // 低多面体
            leafMat
        );
        leaf.position.set(pos[0], 0.1 + pos[1], pos[2]);
        leaf.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        group.add(leaf);
    });

    group.position.set(x, y, z);
    group.userData = { type: 'plant', interactive: false };
    return group;
}

/** 香薰蜡烛 - 圆柱体+火焰 */
export function createCandle(x = 0, y = 0, z = 0, color = 0xFFFFF0) {
    const group = new THREE.Group();
    group.name = 'candle';

    // 蜡烛体
    const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.1, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    candle.position.y = 0.05;
    group.add(candle);

    // 烛芯
    const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.002, 0.02, 4),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    wick.position.y = 0.11;
    group.add(wick);

    // 火焰（两层半球）
    const flameOuter = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xFFAA00, transparent: true, opacity: 0.9 })
    );
    flameOuter.scale.y = 1.6;
    flameOuter.position.y = 0.13;
    group.add(flameOuter);

    const flameInner = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xFFFFAA, transparent: true, opacity: 1.0 })
    );
    flameInner.scale.y = 1.5;
    flameInner.position.y = 0.13;
    group.add(flameInner);

    // 烛光点光源
    const candleLight = new THREE.PointLight(0xFFAA44, 0.2, 1);
    candleLight.position.y = 0.14;
    group.add(candleLight);

    group.position.set(x, y, z);
    group.userData = { type: 'candle', interactive: false };
    return group;
}

/** 尤克里里 - Minecraft风格 */
export function createUkulele(x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    group.name = 'ukulele';

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xFF6B35, roughness: 0.5, metalness: 0.1, flatShading: true
    });

    // 琴身（扁平椭球，box化）
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.04), bodyMat);
    body.position.y = -0.02;
    group.add(body);

    // 琴身圆角（简化：加小圆柱）
    const corner1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), bodyMat);
    corner1.scale.set(1, 1, 0.25);
    corner1.position.set(0, -0.02, 0);
    group.add(corner1);

    // 琴颈
    const neck = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.22, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 })
    );
    neck.position.y = 0.18;
    group.add(neck);

    // 指板
    const fretboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.2, 0.022),
        new THREE.MeshStandardMaterial({ color: 0x2F1810, roughness: 0.4 })
    );
    fretboard.position.set(0, 0.18, 0.001);
    group.add(fretboard);

    // 音孔
    const soundHole = new THREE.Mesh(
        new THREE.CircleGeometry(0.02, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.8 })
    );
    soundHole.position.set(0, -0.02, 0.021);
    group.add(soundHole);

    // 琴弦（4条细线）
    for (let i = 0; i < 4; i++) {
        const string = new THREE.Mesh(
            new THREE.CylinderGeometry(0.001, 0.001, 0.35, 4),
            new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.2 })
        );
        string.position.set(-0.008 + i * 0.006, 0.17, 0.012);
        group.add(string);
    }

    // 弦枕
    const nut = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.008, 0.025),
        new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.5 })
    );
    nut.position.y = 0.09;
    group.add(nut);

    group.position.set(x, y, z);
    group.userData = { type: 'ukulele', interactive: false };
    return group;
}

/** 墙上海报/装饰画（带框架） */
export function createWallPoster(x = 0, y = 0, z = 0, rotY = 0) {
    const group = new THREE.Group();
    group.name = 'wall-poster';

    // 画框
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.5 });
    const posterW = 0.5, posterH = 0.35;

    // 4条边框
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(posterW + 0.04, 0.025, 0.02), frameMat), { position: new THREE.Vector3(0, posterH / 2 + 0.012, 0) }));
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(posterW + 0.04, 0.025, 0.02), frameMat), { position: new THREE.Vector3(0, -posterH / 2 - 0.012, 0) }));
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.025, posterH, 0.02), frameMat), { position: new THREE.Vector3(-posterW / 2 - 0.012, 0, 0) }));
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.025, posterH, 0.02), frameMat), { position: new THREE.Vector3(posterW / 2 + 0.012, 0, 0) }));

    // 海报内容 - 梦幻紫色渐变 + 月亮星星
    const posterCanvas = document.createElement('canvas');
    posterCanvas.width = 256; posterCanvas.height = 180;
    const pctx = posterCanvas.getContext('2d');
    const grad = pctx.createLinearGradient(0, 0, 256, 180);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.5, '#4B0082');
    grad.addColorStop(1, '#8A2BE2');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 256, 180);
    // 月亮
    pctx.fillStyle = '#FFFFAA';
    pctx.beginPath(); pctx.arc(190, 50, 30, 0, Math.PI * 2); pctx.fill();
    pctx.fillStyle = '#4B0082';
    pctx.beginPath(); pctx.arc(200, 45, 28, 0, Math.PI * 2); pctx.fill(); // 月牙
    // 星星
    pctx.fillStyle = '#FFFFAA';
    [[30, 30], [80, 15], [140, 40], [60, 70], [110, 80], [170, 90]].forEach(([sx, sy]) => {
        pctx.beginPath(); pctx.arc(sx, sy, 3, 0, Math.PI * 2); pctx.fill();
    });
    // 文字
    pctx.fillStyle = 'rgba(255,255,255,0.7)';
    pctx.font = 'bold 20px serif';
    pctx.fillText('Dream Room ✨', 20, 150);

    const posterTex = new THREE.CanvasTexture(posterCanvas);
    const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(posterW, posterH),
        new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.4 })
    );
    poster.position.z = 0.002;
    group.add(poster);

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    group.userData = { type: 'wall-poster', interactive: false };
    return group;
}

/** 床头小熊玩偶 - Minecraft风格（方块组合） */
export function createStuffedBear(x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    group.name = 'stuffed-bear';

    const bearMat = new THREE.MeshStandardMaterial({
        color: 0xD2691E, roughness: 0.9, metalness: 0.0, flatShading: true
    });
    const bearMatLight = new THREE.MeshStandardMaterial({
        color: 0xF4A460, roughness: 0.9, metalness: 0.0, flatShading: true
    });

    // 身体（方块）
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), bearMat);
    body.position.y = 0.06;
    group.add(body);

    // 头（方块）
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.09), bearMat);
    head.position.y = 0.17;
    group.add(head);

    // 耳朵（两个小球）
    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), bearMat);
    earL.position.set(-0.04, 0.225, 0);
    group.add(earL);
    const earR = earL.clone();
    earR.position.x = 0.04;
    group.add(earR);

    // 眼睛（黑色方块）
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.01), eyeMat);
    eyeL.position.set(-0.025, 0.18, 0.045);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.025;
    group.add(eyeR);

    // 鼻子（棕色小球）
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    nose.position.set(0, 0.16, 0.046);
    group.add(nose);

    // 肚子（浅色方块）
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.01), bearMatLight);
    belly.position.set(0, 0.06, 0.045);
    group.add(belly);

    // 腿（方块）
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.04), bearMat);
    legL.position.set(-0.035, -0.01, 0.02);
    group.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.035;
    group.add(legR);

    // 蝴蝶结
    const bowMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.5 });
    const bow1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.01), bowMat);
    bow1.position.set(-0.015, 0.21, 0.046);
    bow1.rotation.z = 0.3;
    group.add(bow1);
    const bow2 = bow1.clone();
    bow2.rotation.z = -0.3;
    bow2.position.x = 0.015;
    group.add(bow2);
    const bowCenter = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.01), bowMat);
    bowCenter.position.set(0, 0.21, 0.047);
    group.add(bowCenter);

    group.position.set(x, y, z);
    group.userData = { type: 'stuffed-bear', interactive: false };
    return group;
}

/** 窗台小盆栽组（3盆多肉） */
export function createWindowPlantSet(x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    group.name = 'window-plant-set';

    const p1 = createPlantPot(0, 0, 0, 0xCD853F);
    const p2 = createPlantPot(0.12, 0, 0, 0xA0522D);
    const p3 = createPlantPot(-0.1, 0, 0.05, 0xDEB887);

    p2.scale.setScalar(0.85);
    p3.scale.setScalar(0.7);

    group.add(p1); group.add(p2); group.add(p3);
    group.position.set(x, y, z);
    group.userData = { type: 'plant-set', interactive: false };
    return group;
}

/** 桌面上散落的书堆 */
export function createBookStack(x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    group.name = 'book-stack';

    const bookColors = [0x1a3a5c, 0x8B0000, 0x2F4F4F, 0x4B0082, 0x8B4513, 0x006400];
    const bookData = [
        { w: 0.15, h: 0.022, d: 0.2, colorIdx: 0, rotY: 0 },
        { w: 0.14, h: 0.018, d: 0.19, colorIdx: 1, rotY: 0.05 },
        { w: 0.16, h: 0.025, d: 0.21, colorIdx: 2, rotY: -0.03 },
        { w: 0.13, h: 0.02, d: 0.18, colorIdx: 3, rotY: 0.08 },
        { w: 0.15, h: 0.018, d: 0.2, colorIdx: 4, rotY: -0.06 },
    ];

    let cumY = 0;
    bookData.forEach((book, i) => {
        const mat = new THREE.MeshStandardMaterial({
            color: bookColors[book.colorIdx],
            roughness: 0.7,
            metalness: 0.0,
            flatShading: true
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(book.w, book.h, book.d), mat);
        mesh.position.y = cumY + book.h / 2;
        mesh.rotation.y = book.rotY;
        mesh.castShadow = true;
        group.add(mesh);
        cumY += book.h;
    });

    group.position.set(x, y, z);
    group.userData = { type: 'book-stack', interactive: false };
    return group;
}
