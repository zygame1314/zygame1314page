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
        this.loadPlaylist().then(() => {
            this.initializePlaylist();
            this.addEventListeners();
            this.updateLoopButton();
            this.updateUIForSong(this.currentSong);
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
        this.createVisualizer('left');
        this.createVisualizer('right');

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

        const barCount = 32;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'spectrum-bar';

            bar.style.setProperty('--pixel-offset', `${Math.random() * 5}px`);
            container.appendChild(bar);
        }

        document.body.appendChild(visualizer);

        if (!this[`${side}Visualizer`]) {
            this[`${side}Visualizer`] = visualizer;
        }
    }

    frequencyToColor(frequency) {
        if (frequency < 50) {
            return `rgb(0, ${100 + frequency}, ${150 + frequency / 2})`;
        } else if (frequency < 120) {
            return `rgb(0, ${180 + frequency / 4}, ${120 - frequency / 3})`;
        } else if (frequency < 190) {
            return `rgb(${frequency - 120}, ${255}, 0)`;
        } else if (frequency < 220) {
            return `rgb(${255}, ${255 - (frequency - 190) * 4}, 0)`;
        } else {
            return `rgb(255, ${Math.max(0, 120 - (frequency - 220))}, ${Math.min(255, (frequency - 220) * 5)})`;
        }
    }

    animateRhythm() {
        const createNoise = (magnitude = 5) => Math.floor(Math.random() * magnitude);

        const updateRhythm = () => {
            if (this.isPlaying) {
                this.analyser.getByteFrequencyData(this.dataArray);

                if (this.leftVisualizer) {
                    const leftBars = this.leftVisualizer.querySelectorAll('.spectrum-bar');
                    const leftBarCount = leftBars.length;

                    for (let i = 0; i < leftBarCount; i++) {
                        const dataIndex = Math.floor(i * (this.dataArray.length / 2) / leftBarCount);
                        const value = this.dataArray[dataIndex] + createNoise();

                        const width = `${Math.floor((value / 255) * 20) * 5}%`;
                        const color = this.frequencyToColor(value);

                        leftBars[i].style.width = width;
                        leftBars[i].style.color = color;
                        leftBars[i].style.backgroundColor = color;
                        leftBars[i].classList.toggle('active', value > 200);
                    }
                }

                if (this.rightVisualizer) {
                    const rightBars = this.rightVisualizer.querySelectorAll('.spectrum-bar');
                    const rightBarCount = rightBars.length;

                    for (let i = 0; i < rightBarCount; i++) {
                        const dataIndex = Math.floor((this.dataArray.length / 2) + i * (this.dataArray.length / 2) / rightBarCount);
                        const value = this.dataArray[dataIndex < this.dataArray.length ? dataIndex : this.dataArray.length - 1] + createNoise();

                        const width = `${Math.floor((value / 255) * 20) * 5}%`;
                        const color = this.frequencyToColor(value);

                        rightBars[i].style.width = width;
                        rightBars[i].style.color = color;
                        rightBars[i].style.backgroundColor = color;
                        rightBars[i].classList.toggle('active', value > 200);

                        if (value > 180 && Math.random() > 0.9) {
                            rightBars[i].style.filter = 'brightness(1.3)';
                            setTimeout(() => {
                                if (rightBars[i]) rightBars[i].style.filter = 'none';
                            }, 50);
                        }
                    }
                }
            } else {
                if (this.leftVisualizer) {
                    const leftBars = this.leftVisualizer.querySelectorAll('.spectrum-bar');
                    leftBars.forEach(bar => {
                        bar.style.width = '0';
                        bar.classList.remove('active');
                    });
                }

                if (this.rightVisualizer) {
                    const rightBars = this.rightVisualizer.querySelectorAll('.spectrum-bar');
                    rightBars.forEach(bar => {
                        bar.style.width = '0';
                        bar.classList.remove('active');
                    });
                }
            }

            requestAnimationFrame(updateRhythm);
        };

        requestAnimationFrame(updateRhythm);
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

            if (this.leftVisualizer) this.leftVisualizer.style.display = 'flex';
            if (this.rightVisualizer) this.rightVisualizer.style.display = 'flex';

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