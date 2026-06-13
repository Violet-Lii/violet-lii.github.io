/**
 * 房间3D建模 - 升级版
 * 新增：地毯、相框、盆栽、门、挂钟、星星灯串、地板反射、氛围光
 */
import * as THREE from 'three';
import {
    createBed, createBookshelf, createDrawerCabinet, createDesk,
    createComputer, createAirConditioner, createChair, createWindow,
    createPiano, createSpeaker, createNotebook,
    createCarpet, createWallPhotoFrame, createDoor, createWallClock, createStarLights,
    createPlantPot, createCandle, createUkulele, createWallPoster, createStuffedBear,
    createWindowPlantSet, createBookStack
} from './furniture-models.js';

let scene, roomGroup;
const furniture = {};

export function init(sceneRef) {
    scene = sceneRef;
    roomGroup = new THREE.Group();
    roomGroup.name = 'room';
    scene.add(roomGroup);

    createRoom();
    createFurniture();

    return { getInteractiveFurniture, getFurniture, getAllFurniture };
}

function createRoom() {
    // 地板 - 木地板纹理（更精细）
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 1024;
    floorCanvas.height = 1024;
    const ctx = floorCanvas.getContext('2d');
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, 1024, 1024);

    // 木板纹理
    for (let i = 0; i < 1024; i += 64) {
        // 木板基底色变化
        const shade = Math.random() * 20 - 10;
        ctx.fillStyle = `rgb(${222 + shade}, ${184 + shade}, ${135 + shade})`;
        ctx.fillRect(0, i, 1024, 62);

        // 木纹
        for (let j = 0; j < 3; j++) {
            ctx.strokeStyle = `rgba(139, 90, 43, ${0.15 + Math.random() * 0.15})`;
            ctx.lineWidth = 1 + Math.random();
            ctx.beginPath();
            ctx.moveTo(0, i + 10 + j * 18);
            for (let x = 0; x < 1024; x += 30) {
                ctx.lineTo(x, i + 10 + j * 18 + (Math.random() - 0.5) * 4);
            }
            ctx.stroke();
        }

        // 板缝
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i + Math.random() * 4 - 2);
        ctx.stroke();
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    // 地板 - 带反射效果（MeshPhysicalMaterial）
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshPhysicalMaterial({
            map: floorTexture,
            roughness: 0.6,
            metalness: 0.1,
            clearcoat: 0.3,
            clearcoatRoughness: 0.4,
            reflectivity: 0.3
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    roomGroup.add(floor);

    // 地板反射平面（半透明镜像效果简化 - 用一个稍亮的地板副本）
    const reflFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshStandardMaterial({
            color: 0xDEB887,
            roughness: 0.9,
            metalness: 0,
            transparent: true,
            opacity: 0.05
        })
    );
    reflFloor.rotation.x = -Math.PI / 2;
    reflFloor.position.y = 0.001;
    roomGroup.add(reflFloor);

    // 墙壁 - 淡紫色（带微妙纹理）
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 256;
    wallCanvas.height = 256;
    const wctx = wallCanvas.getContext('2d');
    wctx.fillStyle = '#E6E6FA';
    wctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) {
        wctx.fillStyle = `rgba(200, 180, 230, ${Math.random() * 0.03})`;
        wctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    }
    const wallTex = new THREE.CanvasTexture(wallCanvas);
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(2, 2);

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTex,
        roughness: 0.9,
        side: THREE.DoubleSide
    });

    // 后墙
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallMaterial);
    backWall.position.set(0, 2, -4);
    backWall.receiveShadow = true;
    backWall.name = 'backWall';
    roomGroup.add(backWall);

    // 左墙
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallMaterial);
    leftWall.position.set(-4, 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    leftWall.name = 'leftWall';
    roomGroup.add(leftWall);

    // 右墙
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallMaterial);
    rightWall.position.set(4, 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    rightWall.name = 'rightWall';
    roomGroup.add(rightWall);

    // 天花板
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.95 })
    );
    ceiling.position.y = 4;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.name = 'ceiling';
    roomGroup.add(ceiling);

    // 踢脚线
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xFFF8DC, roughness: 0.6 });
    // 后墙踢脚线
    const bb1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.03), baseboardMat);
    bb1.position.set(0, 0.05, -3.98);
    roomGroup.add(bb1);
    // 左墙踢脚线
    const bb2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 8), baseboardMat);
    bb2.position.set(-3.98, 0.05, 0);
    roomGroup.add(bb2);
    // 右墙踢脚线
    const bb3 = bb2.clone();
    bb3.position.x = 3.98;
    roomGroup.add(bb3);
}

function createFurniture() {
    // 床 - 前景靠一面墙
    const bed = createBed();
    bed.position.set(2, 0, 2.5);
    bed.rotation.y = Math.PI;
    furniture.bed = bed;
    roomGroup.add(bed);

    // 书架 - 靠左墙
    const bookshelf = createBookshelf();
    bookshelf.position.set(-3.5, 1.25, 0);
    bookshelf.rotation.y = Math.PI / 2;
    furniture.bookshelf = bookshelf;
    roomGroup.add(bookshelf);

    // 抽屉柜 - 书架旁
    const drawer = createDrawerCabinet();
    drawer.position.set(-3.5, 0, 1);
    drawer.rotation.y = Math.PI / 2;
    furniture.drawer = drawer;
    roomGroup.add(drawer);

    // 书桌 - 靠右墙
    const desk = createDesk();
    desk.position.set(3.2, 0, -1);
    desk.rotation.y = -Math.PI / 2;
    furniture.desk = desk;
    roomGroup.add(desk);

    // 电脑 - 桌上
    const computer = createComputer();
    computer.position.set(3.15, 0.78, -1);
    computer.rotation.y = -Math.PI / 2;
    furniture.computer = computer;
    roomGroup.add(computer);

    // 椅子
    const chair = createChair();
    chair.position.set(2.5, 0, -1);
    chair.rotation.y = Math.PI / 4;
    furniture.chair = chair;
    roomGroup.add(chair);

    // 空调 - 墙上
    const aircon = createAirConditioner();
    aircon.position.set(0, 3, -3.9);
    furniture.aircon = aircon;
    roomGroup.add(aircon);

    // 窗户 - 后墙
    const window_ = createWindow();
    window_.position.set(-1, 2, -3.9);
    furniture.window = window_;
    roomGroup.add(window_);

    // 钢琴 - 靠后墙
    const piano = createPiano();
    piano.position.set(1.5, 0, -3);
    furniture.piano = piano;
    roomGroup.add(piano);

    // 音箱
    const speaker = createSpeaker();
    speaker.position.set(-2.5, 0, -3);
    furniture.speaker = speaker;
    roomGroup.add(speaker);

    // 笔记本 - 桌上
    const notebook = createNotebook();
    notebook.position.set(3.15, 0.81, -0.5);
    notebook.rotation.y = -Math.PI / 2;
    notebook.rotation.z = 0.1;
    furniture.notebook = notebook;
    roomGroup.add(notebook);

    // ===== 新增家具/装饰 =====

    // 地毯 - 床边
    const carpet = createCarpet();
    carpet.position.set(2, 0, 1.2);
    furniture.carpet = carpet;
    roomGroup.add(carpet);

    // 墙上相框 - 后墙2个
    const frame1 = createWallPhotoFrame(0xDDA0DD, 0.35, 0.4);
    frame1.position.set(1, 2.8, -3.95);
    furniture.wallFrame1 = frame1;
    roomGroup.add(frame1);

    const frame2 = createWallPhotoFrame(0xFFB6C1, 0.4, 0.35);
    frame2.position.set(2.2, 2.5, -3.95);
    furniture.wallFrame2 = frame2;
    roomGroup.add(frame2);

    // 墙上相框 - 右墙1个
    const frame3 = createWallPhotoFrame(0x87CEEB, 0.3, 0.38);
    frame3.position.set(3.95, 2.6, 1);
    frame3.rotation.y = -Math.PI / 2;
    furniture.wallFrame3 = frame3;
    roomGroup.add(frame3);

    // 门 - 右墙前方
    const door = createDoor();
    door.position.set(3.9, 0, 3);
    door.rotation.y = -Math.PI / 2;
    furniture.door = door;
    roomGroup.add(door);

    // 挂钟 - 后墙
    const clock = createWallClock();
    clock.position.set(-2.5, 3, -3.95);
    furniture.wallClock = clock;
    roomGroup.add(clock);

    // 星星灯串 - 后墙顶部
    const starLights1 = createStarLights(8);
    starLights1.position.set(0, 0, -3.9);
    furniture.starLights1 = starLights1;
    roomGroup.add(starLights1);

    // 星星灯串 - 左墙顶部
    const starLights2 = createStarLights(8);
    starLights2.position.set(-3.9, 0, 0);
    starLights2.rotation.y = Math.PI / 2;
    furniture.starLights2 = starLights2;
    roomGroup.add(starLights2);

    // 星星灯串 - 右墙顶部
    const starLights3 = createStarLights(8);
    starLights3.position.set(3.9, 0, 0);
    starLights3.rotation.y = -Math.PI / 2;
    furniture.starLights3 = starLights3;
    roomGroup.add(starLights3);

    // ===== 新增 Minecraft 风格装饰品 =====

    // 窗台盆栽组（窗户下方）
    const plantSet = createWindowPlantSet(-1, 1.4, -3.85);
    furniture.plantSet = plantSet;
    roomGroup.add(plantSet);

    // 书架顶蜡烛
    const candle1 = createCandle(-3.35, 2.55, 0.1);
    candle1.scale.setScalar(0.8);
    furniture.candle1 = candle1;
    roomGroup.add(candle1);

    // 书架顶第二根蜡烛
    const candle2 = createCandle(-3.35, 2.55, -0.3);
    candle2.scale.setScalar(0.6);
    furniture.candle2 = candle2;
    roomGroup.add(candle2);

    // 尤克里里（靠墙角落）
    const ukulele = createUkulele(-3.3, 0.8, -2.5);
    ukulele.rotation.z = 0.2;
    furniture.ukulele = ukulele;
    roomGroup.add(ukulele);

    // 墙上海报（后墙右侧）
    const poster1 = createWallPoster(2.5, 2.3, -3.95);
    furniture.poster1 = poster1;
    roomGroup.add(poster1);

    // 墙上第二张海报（左墙）
    const poster2 = createWallPoster(-3.95, 2.2, -1.5);
    poster2.rotation.y = Math.PI / 2;
    furniture.poster2 = poster2;
    roomGroup.add(poster2);

    // 床头小熊玩偶
    const bear = createStuffedBear(1.2, 0.72, 3.35);
    bear.rotation.y = -0.5;
    bear.scale.setScalar(1.3);
    furniture.bear = bear;
    roomGroup.add(bear);

    // 桌面积木书堆
    const bookStack = createBookStack(3.0, 0.8, -0.3);
    bookStack.scale.setScalar(0.9);
    furniture.bookStack = bookStack;
    roomGroup.add(bookStack);

    // 窗台另一侧单独小盆栽
    const smallPlant = createPlantPot(-0.6, 1.42, -3.85);
    smallPlant.scale.setScalar(0.6);
    furniture.smallPlant = smallPlant;
    roomGroup.add(smallPlant);
}

export function getInteractiveFurniture() {
    const interactive = {};
    Object.keys(furniture).forEach(key => {
        if (furniture[key].userData && furniture[key].userData.interactive) {
            interactive[key] = furniture[key];
        }
    });
    return interactive;
}

export function getFurniture(name) { return furniture[name]; }
export function getAllFurniture() { return furniture; }
