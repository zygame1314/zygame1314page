import { API_BASE } from './config.js';
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.isPlaying = false;
        this.currentSong = 0;
        this.songs = [];
        this.isLoaded = false;
        this.originalSongs = [];
        this.shuffledQueue = [];
        this.loopMode = 'none';
        this.isShuffled = false;
        this.volume = 1;
        this.initializeElements();
        this.setupAudioAnalyzer();
        this.createVisualizer();
        this.setupMobileLayout();
        this.loadPlaylist().then(() => {
            this.initializePlaylist();
            this.addEventListeners();
            this.updateLoopButton();
            this.updateUIForSong(this.currentSong);
        });
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 1200);
    }

    setupMobileLayout() {
        if (this.isMobileDevice()) {
            if (this.leftVisualizer) {
                this.leftVisualizer.style.display = 'none';
            }
            if (this.rightVisualizer) {
                this.rightVisualizer.style.display = 'none';
            }

            this.setupTouchEvents();

            this.progress.classList.add('mobile-progress');
            this.volumeSlider.classList.add('mobile-volume');

            document.querySelector('.music-player').classList.add('mobile-player');
        }
    }

    setupTouchEvents() {
        this.progress.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const initialTouch = e.touches[0];
            const initialRect = this.progress.getBoundingClientRect();
            const initialOffsetX = initialTouch.clientX - initialRect.left;
            this.setProgress({ offsetX: initialOffsetX, clientX: initialTouch.clientX });

            const touchMoveHandler = (moveEvent) => {
                moveEvent.preventDefault();
                const touch = moveEvent.touches[0];
                const moveRect = this.progress.getBoundingClientRect();
                const moveOffsetX = touch.clientX - moveRect.left;
                this.setProgress({ offsetX: moveOffsetX, clientX: touch.clientX });
            };
            const touchEndHandler = () => {
                document.removeEventListener('touchmove', touchMoveHandler);
                document.removeEventListener('touchend', touchEndHandler);
            };
            document.addEventListener('touchmove', touchMoveHandler, { passive: false });
            document.addEventListener('touchend', touchEndHandler);
        }, { passive: false });

        this.volumeSlider.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const initialTouch = e.touches[0];
            this.setVolume({ clientX: initialTouch.clientX });

            const touchMoveHandler = (moveEvent) => {
                moveEvent.preventDefault();
                const touch = moveEvent.touches[0];
                this.setVolume({ clientX: touch.clientX });
            };
            const touchEndHandler = () => {
                document.removeEventListener('touchmove', touchMoveHandler);
                document.removeEventListener('touchend', touchEndHandler);
            };
            document.addEventListener('touchmove', touchMoveHandler, { passive: false });
            document.addEventListener('touchend', touchEndHandler);
        }, { passive: false });

        let touchStartX = 0;
        this.coverImg.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        this.coverImg.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;

            if (diff < -50) {
                this.nextSong();
            } else if (diff > 50) {
                this.prevSong();
            }
        }, { passive: true });
    }

    async loadPlaylist() {
        try {
            const response = await fetch(`${API_BASE}/getdata/playlist`);
            if (!response.ok) {
                console.error(`Failed to load playlist. Status: ${response.status}`);
                throw new Error('Failed to load playlist');
            }

            const data = await response.json();

            this.songs = data.songs.map(song => ({
                ...song
            }));

            this.originalSongs = [...this.songs];

        } catch (error) {
            console.error('Error loading playlist:', error);
            this.songs = [
                {
                    title: '播放列表加载失败',
                    artist: '请检查网络连接或稍后再试',
                    path: ''
                }
            ];
            this.originalSongs = [...this.songs];
        }
    }

    initializeElements() {
        this.playBtn = document.querySelector('#play-btn');
        this.prevBtn = document.querySelector('#prev-btn');
        this.nextBtn = document.querySelector('#next-btn');
        this.songTitle = document.querySelector('.song-title');
        this.artist = document.querySelector('.artist');
        this.progress = document.querySelector('.music-progress');
        this.progressBar = document.querySelector('.music-progress-bar');
        this.currentTimeEl = document.querySelector('.current-time');
        this.totalTimeEl = document.querySelector('.total-time');
        this.coverImg = document.querySelector('.cover-img');
        this.loopBtn = document.querySelector('#loop-btn');
        this.shuffleBtn = document.querySelector('#shuffle-btn');
        this.playlistBtn = document.querySelector('#playlist-btn');
        this.playlistContainer = document.querySelector('.playlist-container');
        this.volumeSlider = document.querySelector('.volume-slider');
        this.volumeProgress = document.querySelector('.volume-progress');
        this.volumeIcon = document.querySelector('.volume-icon');
        this.ytLinkContainer = document.querySelector('.yt-link');
    }

    addEventListeners() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.prevSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextSong());
        this.loopBtn.addEventListener('click', () => this.toggleLoop());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.playlistBtn.addEventListener('click', () => this.togglePlaylist());
        this.volumeIcon.addEventListener('click', () => this.toggleMute());

        let isDraggingProgress = false;
        this.progress.addEventListener('mousedown', (e) => {
            isDraggingProgress = true;
            const rect = this.progress.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            this.setProgress({ offsetX: offsetX, clientX: e.clientX });

            const onMouseMove = (moveEvent) => {
                if (isDraggingProgress) {
                    const moveRect = this.progress.getBoundingClientRect();
                    const moveOffsetX = moveEvent.clientX - moveRect.left;
                    this.setProgress({ offsetX: moveOffsetX, clientX: moveEvent.clientX });
                }
            };
            const onMouseUp = () => {
                isDraggingProgress = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        let isDraggingVolume = false;
        this.volumeSlider.addEventListener('mousedown', (e) => {
            isDraggingVolume = true;
            this.setVolume(e);

            const onMouseMove = (moveEvent) => {
                if (isDraggingVolume) {
                    this.setVolume(moveEvent);
                }
            };
            const onMouseUp = () => {
                isDraggingVolume = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    updateUIForSong(index) {
        const song = this.songs[index];
        this.songTitle.textContent = song.title;
        this.artist.textContent = song.artist;

        if (song.ytLink) {
            this.ytLinkContainer.innerHTML = `
                <a href="${song.ytLink}" target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-youtube"></i>
                    来源链接
                </a>
            `;
            this.ytLinkContainer.style.display = 'block';
        } else {
            this.ytLinkContainer.style.display = 'none';
        }

        if (song.cover) {
            this.coverImg.setAttribute('data-src', song.cover);
            this.coverImg.classList.remove('lazy-initialized', 'lazy-loaded', 'lazy-error');
            this.coverImg.classList.add('lazy-placeholder');
            this.coverImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
            this.coverImg.style.display = 'block';
        } else {
            this.coverImg.removeAttribute('data-src');
            this.coverImg.classList.remove('lazy-initialized', 'lazy-loaded', 'lazy-error');
            this.coverImg.classList.add('lazy-placeholder');
            this.coverImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
        }

        this.coverImg.onerror = () => {
            console.error(`封面图片加载失败: ${this.coverImg.getAttribute('data-src')}`);
            this.coverImg.classList.add('default-cover');

            const defaultImg = new Image();
            defaultImg.onload = () => {
                this.coverImg.src = this.coverImg.getAttribute('data-src') || '';
                this.coverImg.classList.remove('lazy-placeholder');
                this.coverImg.classList.add('lazy-loaded');
            };
            defaultImg.src = this.coverImg.getAttribute('data-src') || '';
        };

        if (window.reinitializeLazyLoad) {
            setTimeout(() => window.reinitializeLazyLoad(), 50);
        } else {
            const tempImg = new Image();
            tempImg.onload = () => {
                this.coverImg.src = this.coverImg.getAttribute('data-src');
                this.coverImg.classList.remove('lazy-placeholder');
                this.coverImg.classList.add('lazy-loaded');
            };
            tempImg.src = this.coverImg.getAttribute('data-src');
        }

        this.updatePlaylistActive();
    }

    loadSong(index) {
        this.updateUIForSong(index);
        this.audio.src = this.songs[index].path;
        this.audio.crossOrigin = "anonymous";
        this.isLoaded = false;
        this.audio.load();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pauseSong();
        } else {
            this.playSong();
        }
    }

    setupAudioAnalyzer() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    }

    createVisualizer() {
        if (this.isMobileDevice()) return;

        this.createSpectrum('left');
        this.createSpectrum('right');
        this.animateRhythm();
    }

    createSpectrum(side) {
        const visualizer = document.createElement('div');
        visualizer.className = `audio-visualizer ${side}`;

        const columnCount = 7;
        const columns = [];
        for (let i = 0; i < columnCount; i++) {
            const column = document.createElement('div');
            column.className = 'visualizer-column';
            visualizer.appendChild(column);
            columns.push(column);
        }

        document.body.appendChild(visualizer);

        this[`${side}Visualizer`] = visualizer;
        this[`${side}Columns`] = columns;
    }

    getBarCount() {
        const visualizer = this.leftVisualizer || this.rightVisualizer;
        const columnHeight = visualizer ? visualizer.clientHeight : window.innerHeight;
        return Math.max(6, Math.floor(columnHeight / 10));
    }

    ensureColumnBars(column, count) {
        const current = column.querySelectorAll('.pixel-bar');
        if (current.length === count) return;

        if (current.length < count) {
            for (let i = current.length; i < count; i++) {
                const bar = document.createElement('div');
                bar.className = 'pixel-bar';
                bar.style.height = '4px';
                bar.style.opacity = '0';
                column.appendChild(bar);
            }
        } else {
            for (let i = current.length - 1; i >= count; i--) {
                current[i].remove();
            }
        }

        const bars = column.querySelectorAll('.pixel-bar');
        bars.forEach((bar, idx) => {
            const intensity = (idx + 1) / bars.length;
            bar.style.opacity = intensity.toFixed(2);
        });
    }

    animateRhythm() {
        const update = () => {
            if (this.isPlaying && !this.isMobileDevice()) {
                this.analyser.getByteFrequencyData(this.dataArray);
                this.updateSpectrum('left', this.leftColumns);
                this.updateSpectrum('right', this.rightColumns);
            } else {
                if (this.leftColumns) this.resetSpectrum(this.leftColumns);
                if (this.rightColumns) this.resetSpectrum(this.rightColumns);
            }
            requestAnimationFrame(update);
        };
        update();
    }

    updateSpectrum(side, columns) {
        if (!columns || !columns.length) return;

        const barCount = this.getBarCount();
        columns.forEach(column => this.ensureColumnBars(column, barCount));

        const columnCount = columns.length;
        const binCount = this.analyser.frequencyBinCount;

        columns.forEach((column, colIndex) => {
            const bars = column.querySelectorAll('.pixel-bar');
            const mirrorIndex = side === 'right' ? (columnCount - 1 - colIndex) : colIndex;
            const startBin = Math.floor((mirrorIndex / columnCount) * binCount * 0.6);
            const endBin = Math.floor(((mirrorIndex + 1) / columnCount) * binCount * 0.6);
            let energy = 0;
            let count = 0;
            for (let i = startBin; i < endBin && i < binCount; i++) {
                energy += this.dataArray[i];
                count++;
            }
            const average = count ? energy / count : 0;
            const activeBars = Math.max(0, Math.floor((average / 255) * barCount));

            bars.forEach((bar, idx) => {
                if (idx < activeBars) {
                    bar.style.opacity = ((idx + 1) / barCount).toFixed(2);
                    bar.style.transform = 'scale(1)';
                } else {
                    bar.style.opacity = '0';
                    bar.style.transform = 'scale(0.6)';
                }
            });
        });
    }

    resetSpectrum(columns) {
        if (!columns || !columns.length) return;
        const barCount = this.getBarCount();
        columns.forEach(column => {
            this.ensureColumnBars(column, barCount);
            const bars = column.querySelectorAll('.pixel-bar');
            bars.forEach((bar, idx) => {
                bar.style.opacity = (idx === 0 ? '0.3' : '0');
                bar.style.transform = 'scale(0.6)';
            });
        });
    }

    async playSong() {
        try {
            if (!this.audio.src) {
                this.loadSong(this.currentSong);
            }
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            if (!this.isLoaded) {
                await new Promise((resolve) => {
                    const canPlayHandler = () => {
                        this.audio.removeEventListener('canplay', canPlayHandler);
                        resolve();
                    };

                    if (this.audio.readyState >= 2) {
                        resolve();
                    } else {
                        this.audio.addEventListener('canplay', canPlayHandler);
                    }
                });

                const song = this.songs[this.currentSong];
                if (song.comment && window.showLive2dNotification) {
                    window.showLive2dNotification(song.comment, null, song.expression || null);
                }

                this.isLoaded = true;
            }

            this.isPlaying = true;
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';

            if (!this.isMobileDevice()) {
                if (this.leftVisualizer) this.leftVisualizer.style.display = 'flex';
                if (this.rightVisualizer) this.rightVisualizer.style.display = 'flex';
            }

            await this.audio.play();
        } catch (error) {
            console.error('播放出错:', error);
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    pauseSong() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.audio.pause();

    }

    initializePlaylist() {
        const playlist = document.querySelector('.playlist');
        this.songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            li.addEventListener('click', () => {
                this.currentSong = index;
                this.loadSong(index);
                this.playSong();
                this.updatePlaylistActive();
            });
            playlist.appendChild(li);
        });
    }

    updatePlaylistActive() {
        const items = document.querySelectorAll('.playlist li');
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentSong);
        });
    }

    toggleLoop() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.loopMode);
        this.loopMode = modes[(currentIndex + 1) % modes.length];
        this.updateLoopButton();
    }

    updateLoopButton() {
        const icons = {
            'none': '<i class="fas fa-sync"></i>',
            'one': '<i class="fas fa-sync"></i><span class="loop-one-indicator">1</span>',
            'all': '<i class="fas fa-sync-alt"></i>'
        };

        this.loopBtn.innerHTML = icons[this.loopMode];
        this.loopBtn.classList.remove('mode-none', 'mode-one', 'mode-all');
        this.loopBtn.classList.add(`mode-${this.loopMode}`);

        this.loopBtn.title = `循环模式: ${{
            none: '关闭',
            one: '单曲循环',
            all: '列表循环'
        }[this.loopMode]
            }`;
    }

    createShuffleQueue() {
        this.shuffledQueue = [...Array(this.songs.length).keys()];
        for (let i = this.shuffledQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledQueue[i], this.shuffledQueue[j]] =
                [this.shuffledQueue[j], this.shuffledQueue[i]];
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active', this.isShuffled);

        if (this.isShuffled) {
            this.createShuffleQueue();
            const currentIndex = this.shuffledQueue.indexOf(this.currentSong);
            if (currentIndex !== -1) {
                this.shuffledQueue.splice(currentIndex, 1);
                this.shuffledQueue.unshift(this.currentSong);
            }
        }
    }

    togglePlaylist() {
        this.playlistContainer.classList.toggle('show');
    }

    setVolume(e) {
        const rect = this.volumeSlider.getBoundingClientRect();
        const volume = (e.clientX - rect.left) / rect.width;
        this.volume = Math.max(0, Math.min(1, volume));
        this.updateVolume();
    }

    updateVolume() {
        this.audio.volume = this.volume;
        this.volumeProgress.style.width = `${this.volume * 100}%`;
        this.volumeIcon.className = `fas fa-volume-${this.volume === 0 ? 'mute' : this.volume < 0.5 ? 'down' : 'up'
            }`;
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.lastVolume = this.volume;
            this.volume = 0;
        } else {
            this.volume = this.lastVolume || 1;
        }
        this.updateVolume();
    }

    prevSong() {
        if (this.isShuffled) {
            const currentShuffleIndex = this.shuffledQueue.indexOf(this.currentSong);
            const prevShuffleIndex = (currentShuffleIndex - 1 + this.shuffledQueue.length) % this.shuffledQueue.length;
            this.currentSong = this.shuffledQueue[prevShuffleIndex];
        } else {
            this.currentSong = (this.currentSong - 1 + this.songs.length) % this.songs.length;
        }

        this.isLoaded = false;

        this.loadSong(this.currentSong);
        if (this.isPlaying) this.playSong();
    }

    nextSong() {
        if (this.loopMode === 'one') {
            this.audio.currentTime = 0;
            this.playSong();
            return;
        }

        if (this.isShuffled) {
            const currentShuffleIndex = this.shuffledQueue.indexOf(this.currentSong);
            const nextShuffleIndex = (currentShuffleIndex + 1) % this.shuffledQueue.length;
            this.currentSong = this.shuffledQueue[nextShuffleIndex];

            if (nextShuffleIndex === 0 && this.loopMode === 'all') {
                this.createShuffleQueue();
            }
        } else {
            this.currentSong = (this.currentSong + 1) % this.songs.length;
        }

        if (this.loopMode === 'none' && this.currentSong === 0) {
            this.loadSong(0);
            this.pauseSong();
            return;
        }

        this.isLoaded = false;

        this.loadSong(this.currentSong);
        if (this.isPlaying) this.playSong();
    }

    updateProgress() {
        const { duration, currentTime } = this.audio;
        const progressPercent = (currentTime / duration) * 100;
        this.progressBar.style.width = `${progressPercent}%`;

        this.currentTimeEl.textContent = this.formatTime(currentTime);
        if (duration) {
            this.totalTimeEl.textContent = this.formatTime(duration);
        }
    }

    setProgress(e) {
        const rect = this.progress.getBoundingClientRect();
        let clickX;

        if (typeof e.offsetX === 'number' && e.target === this.progress) {
            clickX = e.offsetX;
        } else if (typeof e.clientX === 'number') {
            clickX = e.clientX - rect.left;
        } else {
            return;
        }

        const width = rect.width;
        if (width > 0 && this.audio.duration && !isNaN(this.audio.duration)) {
            let newTime = (clickX / width) * this.audio.duration;
            newTime = Math.max(0, Math.min(newTime, this.audio.duration));
            this.audio.currentTime = newTime;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});