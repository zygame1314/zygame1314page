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
        this.createRhythmDots();
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
            const touch = e.touches[0];
            this.setProgress({
                offsetX: touch.clientX - this.progress.getBoundingClientRect().left
            });
        });

        this.volumeSlider.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.setVolume({
                clientX: touch.clientX
            });
        });

        let touchStartX = 0;
        this.coverImg.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.coverImg.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;

            if (diff < -50) {
                this.nextSong();
            }
            else if (diff > 50) {
                this.prevSong();
            }
        });
    }

    async loadPlaylist() {
        try {
            const response = await fetch('/data/playlist.json');
            if (!response.ok) throw new Error('Failed to load playlist');
            const data = await response.json();
            this.songs = data.songs;
            this.originalSongs = [...data.songs];
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.songs = [{
                title: 'Hollow(8-bit)',
                artist: 'Yosh',
                path: '/data/music/Hollow(8-bit) - Yosh.mp3'
            }];
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
        this.progress.addEventListener('click', (e) => this.setProgress(e));
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextSong());
        this.loopBtn.addEventListener('click', () => this.toggleLoop());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.playlistBtn.addEventListener('click', () => this.togglePlaylist());
        this.volumeSlider.addEventListener('click', (e) => this.setVolume(e));
        this.volumeIcon.addEventListener('click', () => this.toggleMute());
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
            this.coverImg.setAttribute('data-src', '/images/default-album-cover.webp');
            this.coverImg.classList.remove('lazy-initialized', 'lazy-loaded', 'lazy-error');
            this.coverImg.classList.add('lazy-placeholder');
            this.coverImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
        }

        this.coverImg.onerror = () => {
            console.error(`封面图片加载失败: ${this.coverImg.getAttribute('data-src')}`);
            this.coverImg.setAttribute('data-src', '/images/default-album-cover.webp');
            this.coverImg.classList.add('default-cover');

            const defaultImg = new Image();
            defaultImg.onload = () => {
                this.coverImg.src = '/images/default-album-cover.webp';
                this.coverImg.classList.remove('lazy-placeholder');
                this.coverImg.classList.add('lazy-loaded');
            };
            defaultImg.src = '/images/default-album-cover.webp';
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

    createRhythmDots() {
        if (!this.isMobileDevice()) {
            this.createVisualizer('left');
            this.createVisualizer('right');
        }

        this.frequencyToColor = (frequency) => {
            const hue = Math.floor((frequency / 255) * 360);
            return `hsl(${hue}, 80%, 60%)`;
        };

        this.animateRhythm();
    }

    createVisualizer(side) {
        const visualizer = document.createElement('div');
        visualizer.className = `audio-visualizer ${side}`;

        const container = document.createElement('div');
        container.className = 'spectrum-container';
        visualizer.appendChild(container);

        const particleContainer = document.createElement('div');
        particleContainer.className = 'particle-container';
        container.appendChild(particleContainer);

        const particleCount = this.isMobileDevice() ? 60 : 120;
        this[`${side}Particles`] = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'audio-particle';
            particle.style.top = `${Math.random() * 100}%`;
            particleContainer.appendChild(particle);

            this[`${side}Particles`].push({
                element: particle,
                active: false,
                size: 2 + Math.random() * 4,
                speed: 2 + Math.random() * 6,
                life: 0,
                maxLife: 20 + Math.floor(Math.random() * 40),
                frequency: 0,
                y: Math.random() * 100
            });
        }

        document.body.appendChild(visualizer);

        if (!this[`${side}Visualizer`]) {
            this[`${side}Visualizer`] = visualizer;
        }
    }

    frequencyToColor(frequency) {
        if (frequency < 50) {
            return `rgb(${frequency / 2}, 0, ${100 + frequency})`;
        } else if (frequency < 100) {
            return `rgb(0, ${frequency}, ${180 + frequency / 4})`;
        } else if (frequency < 150) {
            return `rgb(0, ${150 + frequency / 2}, ${100 + (150 - frequency)})`;
        } else if (frequency < 200) {
            return `rgb(${(frequency - 150) * 5}, ${220}, ${Math.max(0, 200 - frequency)})`;
        } else {
            return `rgb(${255}, ${Math.max(0, 255 - (frequency - 200) * 2)}, ${Math.min(255, (frequency - 200) * 3)})`;
        }
    }

    animateRhythm() {
        const updateRhythm = () => {
            if (this.isPlaying && !this.isMobileDevice()) {
                this.analyser.getByteFrequencyData(this.dataArray);

                if (this.leftVisualizer && this.leftParticles) {
                    this.updateParticles('left', this.leftParticles);
                }

                if (this.rightVisualizer && this.rightParticles) {
                    this.updateParticles('right', this.rightParticles);
                }
            } else if (this.isPlaying && this.isMobileDevice()) {
                this.analyser.getByteFrequencyData(this.dataArray);
            } else {
                if (this.leftParticles) {
                    this.leftParticles.forEach(p => {
                        p.active = false;
                        p.element.classList.remove('active');
                        p.element.style.opacity = '0';
                    });
                }

                if (this.rightParticles) {
                    this.rightParticles.forEach(p => {
                        p.active = false;
                        p.element.classList.remove('active');
                        p.element.style.opacity = '0';
                    });
                }
            }

            requestAnimationFrame(updateRhythm);
        };

        requestAnimationFrame(updateRhythm);
    }

    updateParticles(side, particles) {
        const isLeft = side === 'left';
        const frequencies = [...this.dataArray];
        const freqChunks = [];

        const chunkSize = Math.floor(frequencies.length / 8);
        for (let i = 0; i < 8; i++) {
            const start = i * chunkSize;
            const chunk = frequencies.slice(start, start + chunkSize);
            const avg = chunk.reduce((sum, val) => sum + val, 0) / chunk.length;
            freqChunks.push(avg);
        }

        const activationThreshold = 30;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            if (!p.active) {
                const freqIndex = Math.floor(Math.random() * freqChunks.length);
                const freqValue = freqChunks[freqIndex];

                if (freqValue > activationThreshold && Math.random() * 255 < freqValue * 0.7) {
                    p.active = true;
                    p.life = 0;
                    p.y = 10 + Math.random() * 80;
                    p.frequency = freqValue;
                    p.element.style.transform = 'translateX(0)';
                    p.element.classList.add('active');

                    const size = (2 + (freqValue / 255) * 6);
                    p.element.style.width = `${size}px`;
                    p.element.style.height = `${size}px`;
                    p.element.style.top = `${p.y}%`;

                    if (isLeft) {
                        p.element.style.left = '0';
                        p.element.style.right = 'auto';
                    } else {
                        p.element.style.right = '0';
                        p.element.style.left = 'auto';
                    }

                    const color = this.frequencyToColor(freqValue);
                    p.element.style.backgroundColor = color;
                    p.element.style.boxShadow = `0 0 ${3 + (freqValue / 255) * 8}px ${color}`;
                    p.element.style.opacity = '1';
                }
            }
            else {
                p.life++;

                const lifeRatio = p.life / p.maxLife;
                const distance = p.life * ((p.frequency / 255) * p.speed + 1);

                const opacity = Math.max(0, 1 - Math.pow(lifeRatio, 1.5));

                if (isLeft) {
                    p.element.style.transform = `translateX(${distance}px)`;
                } else {
                    p.element.style.transform = `translateX(-${distance}px)`;
                }

                p.element.style.opacity = opacity.toString();

                if (p.life >= p.maxLife || opacity <= 0.05) {
                    p.active = false;
                    p.element.classList.remove('active');
                    p.element.style.opacity = '0';
                    p.element.style.transform = 'translateX(0)';
                }
            }
        }
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
                    window.showLive2dNotification(song.comment);
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
        const width = this.progress.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        this.audio.currentTime = (clickX / width) * duration;
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