/**
 * 音效系统 - Web Audio API 程序化生成
 * 无需外部文件，跨平台兼容，即开即用
 * 音效列表：翻页、抽屉、点击、钢琴音、窗帘飘、枕头、环境音
 */
let audioCtx = null;
let masterGain = null;
let initialized = false;

export function init() {
    if (initialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.6;
        masterGain.connect(audioCtx.destination);
        initialized = true;
        console.log('[SoundSystem] ✅ 音效系统已就绪');
    } catch (e) {
        console.warn('[SoundSystem] ⚠️ Web Audio API 不可用:', e);
    }
}

/** 解锁 AudioContext（用户首次交互后需调用） */
export function unlock() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/** 设置音量 0-1 */
export function setVolume(vol) {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, vol));
}

// ===== 音效生成器 =====

/**
 * 翻书页 - 纸张摩擦声
 */
export function playPageFlip() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    // 白色噪声（纸张质感）
    const bufSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // 高通滤波（去除低频）
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 800;

    // 带通滤波（纸张质感）
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 2500;
    bpf.Q.value = 0.8;

    // 音量包络
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    source.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gainNode);
    gainNode.connect(masterGain);

    source.start(now);
    source.stop(now + 0.15);
}

/**
 * 抽屉拉开/推入
 */
export function playDrawerOpen() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    // 滚轮摩擦低频噪声
    const bufSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        // 渐入渐出的噪声
        const t = i / bufSize;
        const env = Math.sin(t * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 400;
    lpf.Q.value = 1;

    // 添加一点谐波
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80;
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.05, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.25;

    source.connect(lpf);
    lpf.connect(gainNode);
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    gainNode.connect(masterGain);

    source.start(now);
    osc.start(now);
    osc.stop(now + 0.4);
}

/**
 * 软点击 - 书架魔法书/枕头等
 */
export function playSoftClick() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    // 短促的正弦波
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    // 添加高频谐波
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1600;
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gainNode);
    osc2.connect(gain2);
    gain2.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(now); osc.stop(now + 0.12);
    osc2.start(now); osc2.stop(now + 0.06);
}

/**
 * 钢琴按键音
 */
export function playPianoKey(note = 440) {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const frequencies = {
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
        'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25
    };
    const freq = frequencies[note] || note;

    // 主音
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // 谐波
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = freq * 3;

    const gain = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    gain3.gain.setValueAtTime(0.05, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);

    osc.start(now); osc.stop(now + 1.5);
    osc2.start(now); osc2.stop(now + 0.8);
    osc3.start(now); osc3.stop(now + 0.5);
}

/**
 * 窗帘飘动
 */
export function playCurtainRustle() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const bufSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        const t = i / bufSize;
        // 波纹状渐入渐出
        const env = Math.sin(t * Math.PI) * (0.5 + 0.5 * Math.sin(t * 12 * Math.PI));
        data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1800;
    bpf.Q.value = 0.5;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.15;

    source.connect(bpf);
    bpf.connect(gainNode);
    gainNode.connect(masterGain);

    source.start(now);
}

/**
 * 枕头落下
 */
export function playPillowBounce() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    // 低频 thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // 软绵质感（高频噪声）
    const bufSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const noiseData = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        const t = i / bufSize;
        noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 600;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.2;

    osc.connect(gainNode);
    gainNode.connect(masterGain);
    noise.connect(lpf);
    lpf.connect(noiseGain);
    noiseGain.connect(masterGain);

    osc.start(now); osc.stop(now + 0.2);
    noise.start(now);
}

/**
 * 窗户风铃/轻响
 */
export function playWindChime() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
        const delay = i * 0.08;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.5);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 1.5);
    });
}

/**
 * 魔法粒子生成音（柔和上升音阶）
 */
export function playMagicParticle() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
        const delay = i * 0.06;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
    });
}

/**
 * 开门声
 */
export function playDoorCreak() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const bufSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        const t = i / bufSize;
        const env = t < 0.1 ? t * 10 : (t > 0.8 ? (1 - t) * 5 : 1);
        const freq = 100 + Math.sin(t * 8 * Math.PI) * 30;
        data[i] = Math.sin(freq * t * Math.PI * 2 * 8) * env * 0.5 + (Math.random() * 2 - 1) * env * 0.1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 500;
    bpf.Q.value = 2;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.2;

    source.connect(bpf);
    bpf.connect(gainNode);
    gainNode.connect(masterGain);

    source.start(now);
}

/**
 * UI确认音（关闭弹窗等）
 */
export function playUIClick() {
    if (!audioCtx) return;
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
}

/**
 * 背景环境音（轻柔紫色氛围）
 */
export function startAmbient() {
    if (!audioCtx) return;
    stopAmbient();

    const ctx = audioCtx;
    const now = ctx.currentTime;

    // 大气层白噪声（极低音量）
    const bufSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        // 低频粉色噪声
        data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 200;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.08;

    source.connect(lpf);
    lpf.connect(gainNode);
    gainNode.connect(masterGain);
    source.start();

    return () => { source.stop(); };
}

let ambientStop = null;
export function stopAmbient() {
    if (ambientStop) { ambientStop(); ambientStop = null; }
}

// ===== 音效映射表（供 interaction-manager 调用）=====
export const SOUNDS = {
    pageFlip: playPageFlip,
    drawerOpen: playDrawerOpen,
    softClick: playSoftClick,
    pianoKey: playPianoKey,
    curtainRustle: playCurtainRustle,
    pillowBounce: playPillowBounce,
    windChime: playWindChime,
    magicParticle: playMagicParticle,
    doorCreak: playDoorCreak,
    uiClick: playUIClick,
};
