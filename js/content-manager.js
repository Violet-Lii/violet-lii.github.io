/**
 * 内容管理器 - 电影幻灯片效果
 * 每个家具有独特的内容界面视觉风格
 */
import * as AnimationsSystem from './animations.js';
import * as LightingSystem from './lighting.js';
import * as CameraController from './camera-controller.js';
import * as InteractionManager from './interaction-manager.js';

const articles = [
    { id: 1, title: '✨ 欢迎来到我的梦幻小屋', excerpt: '这是一个用Three.js构建的3D交互式个人博客...', date: '2024-01-15', content: '欢迎来到我的3D博客小屋！\n\n这里记录着我的故事、想法和收藏。\n点击房间的各个角落，探索更多惊喜吧！' },
    { id: 2, title: '🎨 关于这个项目的创作历程', excerpt: '从构思到实现，这个3D房间承载了很多美好的想法...', date: '2024-01-20', content: '创作这个项目的过程中，我学到了很多关于Three.js的知识...' },
    { id: 3, title: '💜 紫色：我最爱的梦幻色彩', excerpt: '为什么选择紫色作为主色调？因为它是浪漫、神秘和创意的象征...', date: '2024-02-01', content: '紫色是我最喜欢的颜色，它代表着梦幻、浪漫和创造力...' },
    { id: 4, title: '🎵 音乐与编程的奇妙结合', excerpt: '在编码的时候听什么样的音乐最能激发灵感？', date: '2024-02-10', content: '音乐是编程的好伴侣，不同的音乐能带来不同的灵感...' }
];

const videos = [
    { id: 1, title: '我的Vlog #1', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
];

const music = [
    { id: 1, title: '梦幻钢琴曲', url: 'https://www.w3schools.com/html/horse.mp3' },
    { id: 2, title: '星空小夜曲', url: 'https://www.w3schools.com/html/horse.mp3' },
    { id: 3, title: '月光奏鸣曲', url: 'https://www.w3schools.com/html/horse.mp3' }
];

const photos = [
    { id: 1, title: '海边日落', emoji: '🌅', rotation: -3 },
    { id: 2, title: '山间小路', emoji: '🏔️', rotation: 2 },
    { id: 3, title: '城市夜景', emoji: '🌃', rotation: -1 },
    { id: 4, title: '咖啡时光', emoji: '☕', rotation: 4 },
    { id: 5, title: '花开时节', emoji: '🌸', rotation: -2 },
    { id: 6, title: '星空', emoji: '⭐', rotation: 1 }
];

let currentMusicIndex = 0;
let audioVisualizerCanvas = null;
let audioVisualizerCtx = null;
let audioContext = null;
let analyser = null;

export function init() {
    bindEvents();
    loadDiaries();
}

function bindEvents() {
    document.querySelector('.cinema-close')?.addEventListener('click', () => closeCinema());
    document.getElementById('cinema-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'cinema-overlay') closeCinema();
    });

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

    document.getElementById('btn-first-person')?.addEventListener('click', () => {
        if (CameraController.getMode() !== 'first-person') CameraController.toggleViewMode();
    });
    document.getElementById('btn-third-person')?.addEventListener('click', () => {
        if (CameraController.getMode() !== 'third-person') CameraController.toggleViewMode();
    });
}

// ==================== 电影幻灯片系统 ====================

function openCinema(contentHTML, theme = 'default') {
    const overlay = document.getElementById('cinema-overlay');
    const container = document.getElementById('cinema-content');
    const wrapper = document.getElementById('cinema-wrapper');

    if (document.exitPointerLock) document.exitPointerLock();

    // 设置主题
    wrapper.className = `cinema-wrapper theme-${theme}`;

    container.innerHTML = contentHTML;

    // 动画：场景渐暗
    overlay.classList.remove('hidden');
    overlay.classList.add('cinema-entering');

    // 延迟显示内容（电影级过渡）
    setTimeout(() => {
        wrapper.classList.add('cinema-content-visible');
        overlay.classList.remove('cinema-entering');
    }, 400);

    // 初始化特定内容
    initThemeContent(theme);
}

function closeCinema() {
    const overlay = document.getElementById('cinema-overlay');
    const wrapper = document.getElementById('cinema-wrapper');

    // 停止所有媒体
    overlay.querySelectorAll('video, audio').forEach(media => media.pause());

    // 反向动画
    wrapper.classList.remove('cinema-content-visible');
    wrapper.classList.add('cinema-content-exit');

    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('cinema-content-exit');
        document.getElementById('cinema-content').innerHTML = '';

        // 清理可视化
        if (audioVisualizerCanvas) {
            audioVisualizerCanvas = null;
            audioVisualizerCtx = null;
        }

        if (CameraController.getMode() === 'first-person') {
            setTimeout(() => document.body.requestPointerLock(), 300);
        }
    }, 400);
}

function initThemeContent(theme) {
    if (theme === 'bookshelf') initBookReader();
    else if (theme === 'notebook') initDiary();
    else if (theme === 'piano' || theme === 'speaker') initMusicPlayer(theme);
    else if (theme === 'computer') initVideoPlayer();
    else if (theme === 'drawer') initPhotoWall();
    else if (theme === 'bed') initAboutBubbles();
}

// ==================== 📚 书架 → 文章阅读室 ====================

export function showArticles() {
    const html = `
        <div class="book-reader">
            <div class="book-scene">
                <div class="book-left-page" id="book-left"></div>
                <div class="book-right-page" id="book-right"></div>
                <div class="book-spine"></div>
            </div>
            <div class="book-nav">
                <button class="book-nav-btn" id="book-prev">◀ 上一篇</button>
                <div class="book-progress">
                    <div class="book-progress-bar" id="book-progress-bar"></div>
                </div>
                <button class="book-nav-btn" id="book-next">下一篇 ▶</button>
            </div>
            <div class="book-page-indicator" id="book-indicator">1 / ${articles.length}</div>
        </div>
    `;
    openCinema(html, 'bookshelf');
}

let currentArticleIndex = 0;

function initBookReader() {
    currentArticleIndex = 0;
    renderBookPage();

    document.getElementById('book-prev')?.addEventListener('click', () => {
        if (currentArticleIndex > 0) {
            flipPage('left');
            currentArticleIndex--;
            renderBookPage();
        }
    });

    document.getElementById('book-next')?.addEventListener('click', () => {
        if (currentArticleIndex < articles.length - 1) {
            flipPage('right');
            currentArticleIndex++;
            renderBookPage();
        }
    });
}

function renderBookPage() {
    const article = articles[currentArticleIndex];
    const rightPage = document.getElementById('book-right');
    if (rightPage) {
        rightPage.innerHTML = `
            <h2 class="book-article-title">${article.title}</h2>
            <div class="book-article-date">📅 ${article.date}</div>
            <div class="book-article-content">${article.content.replace(/\n/g, '<br>')}</div>
        `;
    }

    const leftPage = document.getElementById('book-left');
    if (leftPage) {
        leftPage.innerHTML = currentArticleIndex > 0
            ? `<div class="book-prev-preview">${articles[currentArticleIndex - 1].title}</div>`
            : `<div class="book-cover-mark">📖</div>`;
    }

    const indicator = document.getElementById('book-indicator');
    if (indicator) indicator.textContent = `${currentArticleIndex + 1} / ${articles.length}`;

    const progressBar = document.getElementById('book-progress-bar');
    if (progressBar) progressBar.style.width = `${((currentArticleIndex + 1) / articles.length) * 100}%`;
}

function flipPage(direction) {
    const rightPage = document.getElementById('book-right');
    if (!rightPage) return;
    rightPage.style.transform = direction === 'right'
        ? 'perspective(800px) rotateY(-30deg)'
        : 'perspective(800px) rotateY(30deg)';
    rightPage.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
        rightPage.style.transform = 'perspective(800px) rotateY(0deg)';
    }, 300);
}

// ==================== 📓 笔记本 → 日记本 ====================

export function showDiary() {
    const html = `
        <div class="diary-notebook">
            <div class="diary-lines-bg">
                <div class="diary-margin-line"></div>
                ${Array.from({length: 20}, (_, i) => `<div class="diary-line" style="top:${60 + i * 30}px"></div>`).join('')}
            </div>
            <div class="diary-header">
                <h2>📓 我的日记</h2>
                <button class="diary-new-btn" id="diary-new-btn">✏️ 写新日记</button>
            </div>
            <div id="diary-entries-container" class="diary-sticky-notes"></div>
            <div id="diary-editor-area" class="diary-editor-area hidden">
                <div class="diary-new-page">
                    <input type="text" id="diary-title-input" placeholder="标题..." class="diary-input">
                    <textarea id="diary-content-input" placeholder="写下今天的心情..." class="diary-textarea"></textarea>
                    <div class="diary-actions">
                        <button id="diary-save-btn" class="diary-btn-save">💾 保存</button>
                        <button id="diary-cancel-btn" class="diary-btn-cancel">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    openCinema(html, 'notebook');
}

function initDiary() {
    renderDiaryEntries();

    document.getElementById('diary-new-btn')?.addEventListener('click', () => {
        document.getElementById('diary-entries-container').classList.add('hidden');
        document.getElementById('diary-new-btn').classList.add('hidden');
        const editor = document.getElementById('diary-editor-area');
        editor.classList.remove('hidden');
        editor.style.animation = 'pageFlip 0.5s ease';
    });

    document.getElementById('diary-save-btn')?.addEventListener('click', () => {
        const title = document.getElementById('diary-title-input')?.value.trim() || '无标题';
        const content = document.getElementById('diary-content-input')?.value.trim();
        if (content) {
            saveDiary(title, content);
            document.getElementById('diary-title-input').value = '';
            document.getElementById('diary-content-input').value = '';
            document.getElementById('diary-editor-area').classList.add('hidden');
            document.getElementById('diary-entries-container').classList.remove('hidden');
            document.getElementById('diary-new-btn').classList.remove('hidden');
            renderDiaryEntries();
        }
    });

    document.getElementById('diary-cancel-btn')?.addEventListener('click', () => {
        document.getElementById('diary-title-input').value = '';
        document.getElementById('diary-content-input').value = '';
        document.getElementById('diary-editor-area').classList.add('hidden');
        document.getElementById('diary-entries-container').classList.remove('hidden');
        document.getElementById('diary-new-btn').classList.remove('hidden');
    });
}

function renderDiaryEntries() {
    const container = document.getElementById('diary-entries-container');
    if (!container) return;
    container.innerHTML = '';
    const diaries = getDiaries();
    diaries.sort((a, b) => new Date(b.date) - new Date(a.date));

    const stickyColors = ['#FFB6C1', '#FFD700', '#90EE90', '#DDA0DD', '#87CEEB', '#FFDAB9'];

    diaries.forEach((diary, index) => {
        const note = document.createElement('div');
        note.className = 'sticky-note';
        note.style.backgroundColor = stickyColors[index % stickyColors.length];
        note.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg)`;
        note.innerHTML = `
            <div class="sticky-pin">📌</div>
            <h4>${diary.title}</h4>
            <p>${diary.content.substring(0, 60)}${diary.content.length > 60 ? '...' : ''}</p>
            <div class="sticky-date">${diary.date}</div>
        `;
        note.addEventListener('click', () => showDiaryDetail(diary));
        container.appendChild(note);
    });
}

function showDiaryDetail(diary) {
    const container = document.getElementById('diary-entries-container');
    if (!container) return;
    container.innerHTML = `
        <div class="diary-detail" style="animation: pageFlip 0.4s ease">
            <h3 class="diary-detail-title">${diary.title}</h3>
            <div class="diary-detail-date">📅 ${diary.date}</div>
            <div class="diary-detail-content">${diary.content.replace(/\n/g, '<br>')}</div>
            <button class="diary-back-btn" id="diary-back">← 返回列表</button>
        </div>
    `;
    document.getElementById('diary-back')?.addEventListener('click', renderDiaryEntries);
}

function getDiaries() {
    const stored = localStorage.getItem('3d-room-diaries');
    return stored ? JSON.parse(stored) : [];
}

function saveDiary(title, content) {
    const diaries = getDiaries();
    diaries.push({ id: Date.now(), title, content, date: new Date().toLocaleDateString('zh-CN') });
    localStorage.setItem('3d-room-diaries', JSON.stringify(diaries));
}

function loadDiaries() { getDiaries(); }

// ==================== 🎹 钢琴 → 音乐播放器 ====================

export function showAudio() {
    showMusicPlayer('piano');
}

export function showSpeakerAudio() {
    showMusicPlayer('speaker');
}

function showMusicPlayer(theme) {
    currentMusicIndex = 0;
    const isSpeaker = theme === 'speaker';
    const html = `
        <div class="music-player ${isSpeaker ? 'speaker-theme' : 'piano-theme'}">
            <div class="music-visual-area">
                <canvas id="audio-visualizer" width="400" height="200"></canvas>
                <div class="vinyl-disc-large ${isSpeaker ? '' : 'piano-disc'}">
                    <div class="disc-grooves"></div>
                    <div class="disc-center-large">♪</div>
                </div>
            </div>
            <div class="music-info">
                <h3 id="music-title">${music[0].title}</h3>
                <div class="music-artist">梦幻小屋播放列表</div>
            </div>
            <div class="music-controls">
                <button class="music-ctrl-btn" id="music-prev">⏮</button>
                <button class="music-ctrl-btn play-btn" id="music-play">▶</button>
                <button class="music-ctrl-btn" id="music-next">⏭</button>
            </div>
            <div class="music-playlist">
                ${music.map((m, i) => `
                    <div class="music-track ${i === 0 ? 'active' : ''}" data-index="${i}">
                        <span class="track-num">${i + 1}</span>
                        <span class="track-title">${m.title}</span>
                    </div>
                `).join('')}
            </div>
            <audio id="music-audio" src="${music[0].url}"></audio>
        </div>
    `;
    openCinema(html, theme);
}

function initMusicPlayer(theme) {
    const audio = document.getElementById('music-audio');
    const playBtn = document.getElementById('music-play');
    const disc = document.querySelector('.vinyl-disc-large');
    const titleEl = document.getElementById('music-title');
    const tracks = document.querySelectorAll('.music-track');

    // 初始化音频可视化
    audioVisualizerCanvas = document.getElementById('audio-visualizer');
    if (audioVisualizerCanvas) {
        audioVisualizerCtx = audioVisualizerCanvas.getContext('2d');
    }

    playBtn?.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playBtn.textContent = '⏸';
            disc?.classList.add('playing');
            setupAudioVisualizer(audio);
        } else {
            audio.pause();
            playBtn.textContent = '▶';
            disc?.classList.remove('playing');
        }
    });

    document.getElementById('music-prev')?.addEventListener('click', () => {
        currentMusicIndex = (currentMusicIndex - 1 + music.length) % music.length;
        switchTrack(audio, disc, titleEl, tracks);
    });

    document.getElementById('music-next')?.addEventListener('click', () => {
        currentMusicIndex = (currentMusicIndex + 1) % music.length;
        switchTrack(audio, disc, titleEl, tracks);
    });

    tracks.forEach(track => {
        track.addEventListener('click', () => {
            currentMusicIndex = parseInt(track.dataset.index);
            switchTrack(audio, disc, titleEl, tracks);
        });
    });

    audio?.addEventListener('ended', () => {
        currentMusicIndex = (currentMusicIndex + 1) % music.length;
        switchTrack(audio, disc, titleEl, tracks);
    });
}

function switchTrack(audio, disc, titleEl, tracks) {
    audio.src = music[currentMusicIndex].url;
    audio.play();
    if (disc) disc.classList.add('playing');
    const playBtn = document.getElementById('music-play');
    if (playBtn) playBtn.textContent = '⏸';
    if (titleEl) titleEl.textContent = music[currentMusicIndex].title;
    tracks.forEach((t, i) => t.classList.toggle('active', i === currentMusicIndex));
    setupAudioVisualizer(audio);
}

function setupAudioVisualizer(audio) {
    if (!audioContext && audio) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audio);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        } catch(e) {
            // AudioContext可能已经创建过了
        }
    }
    drawVisualizer();
}

function drawVisualizer() {
    if (!audioVisualizerCanvas || !audioVisualizerCtx) return;
    const canvas = audioVisualizerCanvas;
    const ctx = audioVisualizerCtx;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = W / bufferLength * 2;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * H * 0.8;
            const hue = 270 + (i / bufferLength) * 60;
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
            ctx.fillRect(i * barWidth, H - barHeight, barWidth - 1, barHeight);
        }
    } else {
        // 没有analyser时画静态波形
        const time = Date.now() * 0.002;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.5)';
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x++) {
            const y = H / 2 + Math.sin(x * 0.03 + time) * 30 + Math.sin(x * 0.01 + time * 0.5) * 20;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    requestAnimationFrame(drawVisualizer);
}

// ==================== 🖥️ 电脑 → 视频播放器 ====================

export function showVideo() {
    const html = `
        <div class="video-cinema">
            <div class="cinema-curtain-left"></div>
            <div class="cinema-curtain-right"></div>
            <div class="cinema-screen">
                <video id="cinema-video" controls>
                    <source src="${videos[0]?.url || ''}" type="video/mp4">
                </video>
            </div>
            <div class="cinema-controls">
                <div class="cinema-title">🎬 ${videos[0]?.title || '视频播放'}</div>
            </div>
        </div>
    `;
    openCinema(html, 'computer');
}

function initVideoPlayer() {
    // Video element handles its own controls
}

// ==================== 🗄️ 抽屉柜 → 照片墙 ====================

export function showPhotos() {
    const html = `
        <div class="photo-wall">
            <div class="photo-wall-title">🖼️ 我的收藏</div>
            <div class="photo-scatter">
                ${photos.map((p, i) => `
                    <div class="polaroid" style="transform: rotate(${p.rotation}deg) translateY(${i % 2 === 0 ? '-10px' : '10px'})" data-index="${i}">
                        <div class="polaroid-image">${p.emoji}</div>
                        <div class="polaroid-caption">${p.title}</div>
                    </div>
                `).join('')}
            </div>
            <div class="photo-lightbox hidden" id="photo-lightbox">
                <div class="lightbox-content" id="lightbox-content"></div>
                <button class="lightbox-close" id="lightbox-close">✕</button>
            </div>
        </div>
    `;
    openCinema(html, 'drawer');
}

function initPhotoWall() {
    const polaroids = document.querySelectorAll('.polaroid');
    polaroids.forEach(p => {
        p.addEventListener('mouseenter', () => {
            p.style.transform = p.style.transform.replace(/translateY\([^)]+\)/, 'translateY(-20px)');
            p.style.boxShadow = '0 15px 40px rgba(155, 89, 182, 0.4)';
            p.style.zIndex = '10';
        });
        p.addEventListener('mouseleave', () => {
            const idx = parseInt(p.dataset.index);
            p.style.transform = `rotate(${photos[idx].rotation}deg) translateY(${idx % 2 === 0 ? '-10px' : '10px'})`;
            p.style.boxShadow = '';
            p.style.zIndex = '';
        });
        p.addEventListener('click', () => {
            const idx = parseInt(p.dataset.index);
            const lightbox = document.getElementById('photo-lightbox');
            const content = document.getElementById('lightbox-content');
            if (lightbox && content) {
                content.innerHTML = `
                    <div class="lightbox-emoji">${photos[idx].emoji}</div>
                    <div class="lightbox-title">${photos[idx].title}</div>
                `;
                lightbox.classList.remove('hidden');
            }
        });
    });

    document.getElementById('lightbox-close')?.addEventListener('click', () => {
        document.getElementById('photo-lightbox')?.classList.add('hidden');
    });
}

// ==================== 🛏️ 床 → 关于我（梦境泡泡） ====================

export function showAbout() {
    const html = `
        <div class="dream-bubbles">
            <div class="bubble bubble-avatar" style="--float-delay: 0s">
                <div class="bubble-emoji">😊</div>
            </div>
            <div class="bubble bubble-intro" style="--float-delay: 0.5s">
                <h3>关于我</h3>
                <p>欢迎来到我的梦幻小屋！</p>
                <p>这里记录着我的故事、想法和收藏。</p>
                <p>点击房间的各个角落，探索更多惊喜吧～</p>
            </div>
            <div class="bubble bubble-hobby" style="--float-delay: 1s">
                <h3>兴趣爱好</h3>
                <p>🎨 设计 · 🎵 音乐 · 📖 阅读 · 💻 编程</p>
            </div>
            <div class="bubble bubble-social" style="--float-delay: 1.5s">
                <h3>联系方式</h3>
                <div class="social-links">
                    <span>📧 email@example.com</span>
                    <span>🐦 @twitter</span>
                    <span>💻 GitHub</span>
                </div>
            </div>
        </div>
    `;
    openCinema(html, 'bed');
}

function initAboutBubbles() {
    // 泡泡动画由CSS处理
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach((bubble, i) => {
        setTimeout(() => {
            bubble.style.opacity = '1';
            bubble.style.transform = `translateY(0) scale(1)`;
        }, i * 300 + 500);
    });
}
