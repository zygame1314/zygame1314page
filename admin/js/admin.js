class AdminSystem {
    constructor() {
        this.currentSection = 'dashboard';
        this.cache = new Map();
        this.searchHandlers = new Map();
        this.filterHandlers = new Map();
        this.donationsCache = [];
        this.musicCache = [];
        this.projectsCache = [];
        this.noticesCache = [];
        this.timelineCache = [];
        this.init();
        this.d1ManagerActionsInitialized = false;
        this.d1SelectedItems = new Set();
    }
    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.removeDuplicateNavItems();
        this.setupNavigation();
        this.setupModals();
        this.loadDashboard();
    }
    async checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        try {
            const response = await fetch('https://api.zygame1314.site/auth', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Token validation failed');
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Invalid token');
            }
            console.log('Authentication successful for user:', result.user);
        } catch (error) {
            localStorage.removeItem('authToken');
            window.location.href = '/admin/login';
        }
    }
    setupEventListeners() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebarToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('collapsed');
        });
        mobileSidebarToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            overlay.classList.toggle('show');
        });
        overlay?.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });
        document.querySelectorAll('.view-all-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const title = btn.getAttribute('title');
                if (title === '刷新数据') {
                    this.refreshCurrentSection();
                } else if (title === '返回主站') {
                    window.open('/', '_blank');
                }
            });
        });
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            Components.modal.confirm(
                '确认退出',
                '确定要退出管理系统吗？',
                () => {
                    localStorage.removeItem('authToken');
                    window.location.href = '/admin/login';
                }
            );
        });
    }
    removeDuplicateNavItems() {
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        const seenSections = new Set();
        navLinks.forEach(link => {
            const section = link.dataset.section;
            if (section) {
                if (seenSections.has(section)) {
                    link.parentElement.remove();
                } else {
                    seenSections.add(section);
                }
            }
        });
    }
    setupNavigation() {
        this.updateBreadcrumb('仪表盘');
    }
    setupModals() {
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                Components.modal.hide();
            });
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Components.modal.hide();
                }
            });
        });
    }
    navigateToSection(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.parentElement.classList.add('active');
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            this.updateBreadcrumb(this.getSectionTitle(section));
            this.loadSectionData(section);
        }
    }
    getSectionTitle(section) {
        const titles = {
            dashboard: '仪表盘',
            donations: '捐献管理',
            music: '音乐管理',
            projects: '项目管理',
            notices: '公告管理',
            timeline: '时间线管理',
            'important-notices': '重要公告管理',
            articles: '文章管理',
            'd1-manager': '激活码管理'
        };
        return titles[section] || section;
    }
    updateBreadcrumb(title) {
        const breadcrumb = document.querySelector('.breadcrumb-item');
        if (breadcrumb) {
            breadcrumb.textContent = title;
        }
    }
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'donations':
                await this.loadDonations();
                break;
            case 'music':
                await this.loadMusic();
                break;
            case 'projects':
                await this.loadProjects();
                break;
            case 'notices':
                await this.loadNotices();
                break;
            case 'timeline':
                await this.loadTimeline();
                break;
            case 'articles':
                await this.loadArticles();
                break;
            case 'important-notices':
                await this.loadImportantNotices();
                break;
            case 'd1-manager':
                await this.loadD1Manager();
                break;
        }
    }
    refreshCurrentSection() {
        this.cache.clear();
        this.loadSectionData(this.currentSection);
        Components.notification.success('数据已刷新');
    }
    async loadDashboard() {
        try {
            const stats = await api.getStatistics();
            this.updateStatistics(stats);
            const donations = await api.donations.getList(1, 5);
            this.updateRecentDonations(donations.data || []);
        } catch (error) {
            Components.notification.error('加载仪表盘数据失败');
            console.error('Dashboard load error:', error);
        }
    }
    updateStatistics(stats) {
        document.getElementById('total-donations').textContent = stats.totalDonations;
        document.getElementById('total-songs').textContent = stats.totalSongs;
        document.getElementById('total-projects').textContent = stats.totalProjects;
        document.getElementById('total-notices').textContent = stats.totalNotices;
    }
    updateRecentDonations(donations) {
        const container = document.getElementById('recent-donations');
        if (!container) return;
        if (donations.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无捐献记录</div>';
            return;
        }
        container.innerHTML = '';
        donations.forEach(donation => {
            const item = Utils.domUtils.createElement('div', {
                className: 'data-item'
            });
            item.innerHTML = `
                <div class="data-item-info">
                    <div class="data-item-title">${donation.name || '匿名'}</div>
                    <div class="data-item-meta">${Utils.formatDate(donation.date)} · ${donation.platform}</div>
                </div>
                <div class="data-item-value">¥${Utils.formatMoney(donation.amount)}</div>
            `;
            container.appendChild(item);
        });
    }
    async loadDonations(platform = null) {
        const currentPage = parseInt(Utils.getUrlParam('donation_page')) || 1;
        const currentPlatform = platform === null ? (Utils.getUrlParam('platform') || '') : platform;
        try {
            Components.loading.show('donationsTableBody', '加载捐献数据...');
            const data = await api.donations.getList(currentPage, 10, currentPlatform || null);
            this.renderDonationsTable(data.data || []);
            if (data.pagination) {
                Components.pagination.create(
                    'donationsPagination',
                    data.pagination.page,
                    data.pagination.totalPages,
                    (page) => {
                        Utils.setUrlParam('donation_page', page);
                        this.loadDonations(currentPlatform);
                    }
                );
            }
            this.setupDonationActions();
        } catch (error) {
            Components.notification.error('加载捐献数据失败');
            console.error('Donations load error:', error);
        }
    }
    renderDonationsTable(donations) {
        const columns = [
            { key: 'name', title: '捐献者' },
            {
                key: 'amount',
                title: '金额',
                render: (value) => `¥${Utils.formatMoney(value)}`
            },
            { key: 'platform', title: '平台' },
            {
                key: 'date',
                title: '日期',
                render: (value) => Utils.formatDate(value, 'YYYY-MM-DD HH:mm')
            },
            {
                key: 'message',
                title: '留言',
                render: (value) => Utils.truncateText(value || '无', 50)
            },
            {
                key: 'actions',
                title: '操作',
                render: (_, row) => `
                    <div class="action-buttons">
                        <button class="action-btn edit" title="编辑" data-id="${row.id || ''}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" title="删除" data-id="${row.id || ''}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `
            }
        ];
        this.cache.set('donations-current', donations);
        const tbody = document.getElementById('donationsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (donations.length === 0) {
            const emptyRow = Utils.domUtils.createElement('tr');
            const emptyCell = Utils.domUtils.createElement('td', {
                textContent: '暂无捐献记录',
                colspan: columns.length.toString()
            });
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '2rem';
            emptyCell.style.color = 'var(--text-muted)';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        } else {
            donations.forEach(row => {
                const tr = Utils.domUtils.createElement('tr');
                columns.forEach(column => {
                    const td = Utils.domUtils.createElement('td');
                    if (column.render) {
                        td.innerHTML = column.render(row[column.key], row);
                    } else {
                        td.textContent = row[column.key] || '';
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
    }
    setupDonationActions() {
        document.getElementById('addDonationBtn')?.addEventListener('click', () => {
            this.showDonationForm();
        });
        const platformFilter = document.getElementById('platformFilter');
        if (platformFilter && !this.filterHandlers.has('donation_platform')) {
            const filterHandler = async (e) => {
                const platform = e.target.value;
                await this.filterDonationsByPlatform(platform);
            };
            platformFilter.addEventListener('change', filterHandler);
            this.filterHandlers.set('donation_platform', filterHandler);
        }
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (btn.classList.contains('edit')) {
                    this.editDonation(id);
                } else if (btn.classList.contains('delete')) {
                    this.deleteDonation(id);
                }
            });
        });
    }
    showDonationForm(donation = null) {
        const isEdit = !!donation;
        const title = isEdit ? '编辑捐献记录' : '添加捐献记录';
        const fields = [
            {
                name: 'name',
                label: '捐献者姓名',
                type: 'text',
                required: true,
                value: donation?.name || '',
                placeholder: '请输入捐献者姓名'
            },
            {
                name: 'amount',
                label: '捐献金额',
                type: 'number',
                required: true,
                value: donation?.amount || '',
                placeholder: '0.00'
            },
            {
                name: 'platform',
                label: '支付平台',
                type: 'select',
                required: true,
                value: donation?.platform || '',
                options: [
                    { value: '', label: '请选择平台' },
                    { value: 'alipay', label: '支付宝' },
                    { value: 'wechat', label: '微信支付' }
                ]
            },
            {
                name: 'date',
                label: '捐献日期',
                type: 'datetime-local',
                required: true,
                value: donation ? Utils.formatDate(donation.date, 'YYYY-MM-DD HH:mm').replace(' ', 'T') : ''
            },
            {
                name: 'message',
                label: '留言',
                type: 'textarea',
                value: donation?.message || '',
                placeholder: '可选的留言内容',
                rows: 3
            }
        ];
        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '添加',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const validationRules = {
                    name: [Utils.validation.rules.required],
                    amount: [Utils.validation.rules.required, Utils.validation.rules.positiveNumber],
                    platform: [Utils.validation.rules.required],
                    date: [Utils.validation.rules.required]
                };
                const result = Components.formBuilder.validate(modalForm, validationRules);
                if (result.isValid) {
                    try {
                        if (isEdit) {
                            await api.donations.update({
                                id: donation.id,
                                ...result.data
                            });
                        } else {
                            await api.donations.add(result.data);
                        }
                        Components.modal.hide();
                        Components.notification.success(isEdit ? '捐献记录已更新' : '捐献记录已添加');
                        await this.loadDonations();
                    } catch (error) {
                        Components.notification.error('保存失败：' + error.message);
                    }
                }
            }
        });
    }
    editDonation(id) {
        const cachedData = this.cache.get('donations-current');
        if (cachedData) {
            const donation = cachedData.find(d => d.id == id);
            if (donation) {
                this.showDonationForm(donation);
                return;
            }
        }
        Components.notification.warning('未找到要编辑的记录');
    }
    deleteDonation(id) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这条捐献记录吗？此操作不可撤销。',
            async () => {
                try {
                    await api.donations.delete(id);
                    Components.notification.success('捐献记录已删除');
                    await this.loadDonations();
                } catch (error) {
                    Components.notification.error('删除失败：' + error.message);
                }
            }
        );
    }
    async filterDonationsByPlatform(platform) {
        Utils.setUrlParam('donation_page', 1);
        if (platform) {
            Utils.setUrlParam('platform', platform);
        } else {
            Utils.removeUrlParam('platform');
        }
        await this.loadDonations(platform);
    }
    async loadMusic() {
        try {
            Components.loading.show('musicGrid', '加载音乐数据...');
            const data = await api.music.getPlaylist();
            const songs = data.songs || [];
            this.cache.set('music', songs);
            this.renderMusicGrid(songs);
            this.setupMusicActions();
        } catch (error) {
            Components.notification.error('加载音乐数据失败');
            console.error('Music load error:', error);
        }
    }
    renderMusicGrid(songs) {
        const container = document.getElementById('musicGrid');
        if (!container) return;
        if (songs.length === 0) {
            Components.emptyState.show('musicGrid', {
                icon: 'fas fa-music',
                title: '暂无音乐',
                message: '还没有添加任何音乐',
                action: {
                    text: '添加音乐',
                    onClick: () => this.showMusicForm()
                }
            });
            return;
        }
        container.innerHTML = '';
        songs.forEach(song => {
            const musicCard = Utils.domUtils.createElement('div', {
                className: 'music-card'
            });
            musicCard.innerHTML = `
                <div class="music-cover" style="background-image: url('${song.cover || 'https://bucket.zygame1314.site/static/images/default-music.jpg'}')">
                    <div class="music-overlay">
                        <button class="play-btn" title="播放" data-path="${song.path}">
                            <span class="play-icon"></span>
                        </button>
                    </div>
                </div>
                <div class="music-info">
                    <div class="music-title">${song.title}</div>
                    <div class="music-artist">${song.artist}</div>
                    ${song.ytLink ? `<a href="${song.ytLink}" target="_blank" class="yt-link">YouTube</a>` : ''}
                    <div class="music-actions">
                        <button class="btn btn-sm edit-music" data-id="${song.id}">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger delete-music" data-id="${song.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(musicCard);
        });
    }
    setupMusicActions() {
        document.getElementById('addMusicBtn')?.addEventListener('click', () => {
            this.showMusicForm();
        });
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const path = e.currentTarget.dataset.path;
                this.playMusic(path, e.currentTarget);
            });
        });
        document.querySelectorAll('.edit-music').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const cachedData = this.cache.get('music');
                if (cachedData) {
                    const song = cachedData.find(s => s.id == id);
                    if (song) {
                        this.showMusicForm(song);
                    } else {
                        Components.notification.error('在缓存中找不到该音乐。');
                    }
                } else {
                    Components.notification.error('音乐缓存未找到，请尝试刷新页面。');
                }
            });
        });
        document.querySelectorAll('.delete-music').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                this.deleteMusic(id);
            });
        });
    }
    showMusicForm(song = null) {
        const isEdit = !!song;
        const title = isEdit ? '编辑音乐' : '添加音乐';
        const fields = [
            {
                name: 'title',
                label: '歌曲标题',
                type: 'text',
                required: true,
                value: song?.title || '',
                placeholder: '请输入歌曲标题'
            },
            {
                name: 'artist',
                label: '艺术家',
                type: 'text',
                required: true,
                value: song?.artist || '',
                placeholder: '请输入艺术家名称'
            },
            {
                name: 'path',
                label: '音频文件',
                type: 'audio-upload',
                required: true,
                value: song?.path || '',
                help: '上传或修改音频文件。'
            },
            {
                name: 'cover',
                label: '封面图片',
                type: 'image-upload',
                value: song?.cover || '',
                uploadContext: 'music'
            },
            {
                name: 'ytLink',
                label: 'YouTube 链接',
                type: 'url',
                value: song?.ytLink || '',
                placeholder: 'https://youtube.com/watch?v=...'
            },
            {
                name: 'comment',
                label: '备注',
                type: 'textarea',
                value: song?.comment || '',
                placeholder: '可选的备注信息',
                rows: 2
            },
            {
                name: 'expression',
                label: '表情',
                type: 'select',
                value: song?.expression || '',
                options: [
                    { value: '', label: '无表情' },
                    { value: 'Exp1', label: '恼怒' },
                    { value: 'Exp2', label: '无语' },
                    { value: 'Exp3', label: '惊讶' },
                    { value: 'Exp4', label: '困惑' },
                    { value: 'Exp5', label: '墨镜' },
                    { value: 'Exp6', label: '袋子' },
                    { value: 'Exp7', label: '眩晕' },
                    { value: 'Exp8', label: '星星眼' },
                    { value: 'TongueOut', label: '吐舌头' },
                    { value: 'HighlightOFF', label: '失去高光' }
                ],
                help: '选择一个在播放此音乐时触发的Live2D表情。'
            }
        ];
        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '添加',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const validationRules = {
                    title: [Utils.validation.rules.required],
                    artist: [Utils.validation.rules.required],
                    path: [Utils.validation.rules.required]
                };
                const result = Components.formBuilder.validate(modalForm, validationRules);
                if (result.isValid) {
                    try {
                        if (isEdit) {
                            await api.music.update({ id: song.id, ...result.data });
                        } else {
                            await api.music.add(result.data);
                        }
                        Components.modal.hide();
                        Components.notification.success(isEdit ? '音乐已更新' : '音乐已添加');
                        await this.loadMusic();
                    } catch (error) {
                        Components.notification.error('保存失败：' + error.message);
                    }
                }
            }
        });
        if (isEdit && song.expression) {
            setTimeout(() => {
                const expressionSelect = document.querySelector('#modal form select[name="expression"]');
                if (expressionSelect) {
                    expressionSelect.value = song.expression;
                }
            }, 0);
        }
    }
    deleteMusic(id) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这首音乐吗？此操作不可撤销。',
            async () => {
                try {
                    await api.music.delete(id);
                    Components.notification.success('音乐已删除');
                    await this.loadMusic();
                } catch (error) {
                    Components.notification.error('删除失败：' + error.message);
                }
            }
        );
    }
    playMusic(path, button) {
        let audioPlayer = window.audioPlayer;
        if (!audioPlayer) {
            audioPlayer = new Audio();
            window.audioPlayer = audioPlayer;
        }
        const allPlayButtons = document.querySelectorAll('.play-btn');
        const isCurrentlyPlaying = button.classList.contains('playing');
        allPlayButtons.forEach(btn => {
            btn.classList.remove('playing');
            btn.querySelector('.play-icon').classList.remove('paused');
        });
        if (isCurrentlyPlaying) {
            audioPlayer.pause();
        } else {
            audioPlayer.src = path;
            audioPlayer.play();
            button.classList.add('playing');
            button.querySelector('.play-icon').classList.add('paused');
            audioPlayer.onended = () => {
                button.classList.remove('playing');
                button.querySelector('.play-icon').classList.remove('paused');
            };
        }
    }
    async loadProjects() {
        try {
            Components.loading.show('projectsGrid', '加载项目数据...');
            const data = await api.projects.getList(1, 50);
            const projects = data.projects || [];
            this.cache.set('projects', projects);
            this.renderProjectsGrid(projects);
            this.setupProjectActions();
        } catch (error) {
            Components.notification.error('加载项目数据失败');
            console.error('Projects load error:', error);
        }
    }
    renderProjectsGrid(projects) {
        const container = document.getElementById('projectsGrid');
        if (!container) return;
        if (projects.length === 0) {
            Components.emptyState.show('projectsGrid', {
                icon: 'fas fa-code',
                title: '暂无项目',
                message: '还没有添加任何项目',
                action: {
                    text: '添加项目',
                    onClick: () => this.showProjectForm()
                }
            });
            return;
        }
        container.innerHTML = '';
        projects.forEach(project => {
            const projectCard = Utils.domUtils.createElement('div', {
                className: 'project-card'
            });
            projectCard.innerHTML = `
                <div class="project-image" style="background-image: url('${project.imageUrl || 'https://bucket.zygame1314.site/static/images/default-project.jpg'}')"></div>
                <div class="project-content">
                    <div class="project-title">${project.title}</div>
                    <div class="project-description">${project.description || '暂无描述'}</div>
                    <div class="project-type">${project.type || 'normal'}</div>
                    <div class="project-actions">
                        <button class="btn btn-sm edit-project" data-id="${project.id}">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger delete-project" data-id="${project.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                        ${(project.actions || []).map(action => `<a href="${action.url}" target="_blank" class="btn btn-sm">${action.text}</a>`).join('')}
                        ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="btn btn-sm">
                            <i class="fab fa-github"></i> GitHub
                        </a>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(projectCard);
        });
    }
    setupProjectActions() {
        document.getElementById('addProjectBtn')?.addEventListener('click', () => {
            this.showProjectForm();
        });
        document.querySelectorAll('.edit-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const cachedData = this.cache.get('projects');
                if (cachedData) {
                    const project = cachedData.find(p => p.id == id);
                    if (project) {
                        this.showProjectForm(project);
                    } else {
                        Components.notification.error('在缓存中找不到该项目。');
                    }
                } else {
                    Components.notification.error('项目缓存未找到，请尝试刷新页面。');
                }
            });
        });
        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                this.deleteProject(id);
            });
        });
    }
    showProjectForm(project = null) {
        const isEdit = !!project;
        const title = isEdit ? '编辑项目' : '添加项目';
        const fields = [
            {
                name: 'id',
                label: '项目ID',
                type: 'text',
                required: true,
                value: project?.id || '',
                placeholder: '项目唯一标识符'
            },
            {
                name: 'title',
                label: '项目标题',
                type: 'text',
                required: true,
                value: project?.title || '',
                placeholder: '请输入项目标题'
            },
            {
                name: 'description',
                label: '项目描述',
                type: 'textarea',
                required: true,
                value: project?.description || '',
                placeholder: '请输入项目描述',
                rows: 3
            },
            {
                name: 'imageUrl',
                label: '项目图片',
                type: 'image-upload',
                value: project?.imageUrl || '',
                uploadContext: 'projects'
            },
            {
                name: 'githubUrl',
                label: 'GitHub URL',
                type: 'url',
                value: project?.githubUrl || '',
                placeholder: 'https://github.com/username/repo'
            },
            {
                name: 'type',
                label: '项目类型',
                type: 'select',
                value: project?.type || 'normal',
                options: [
                    { value: 'normal', label: '普通项目' },
                    { value: 'featured', label: '特色项目' },
                    { value: 'open-source', label: '开源项目' },
                    { value: 'commercial', label: '商业项目' }
                ]
            },
            {
                name: 'actions',
                label: '操作按钮',
                type: 'key-value-editor',
                value: project?.actions || []
            }
        ];
        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '添加',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const validationRules = {
                    id: [Utils.validation.rules.required],
                    title: [Utils.validation.rules.required],
                    description: [Utils.validation.rules.required]
                };
                const result = Components.formBuilder.validate(modalForm, validationRules);
                if (result.isValid) {
                    try {
                        const projectData = result.data;
                        if (projectData.actions) {
                            try {
                                const actions = JSON.parse(projectData.actions);
                                if (!Array.isArray(actions) || actions.length === 0) {
                                    Components.notification.error('必须至少包含一个操作按钮。');
                                    return;
                                }
                                projectData.actions = actions;
                            } catch (e) {
                                Components.notification.error('操作按钮数据格式无效。');
                                return;
                            }
                        } else {
                            projectData.actions = [];
                        }
                        if (isEdit) {
                            await api.projects.update(projectData);
                        } else {
                            await api.projects.add(projectData);
                        }
                        Components.modal.hide();
                        Components.notification.success(isEdit ? '项目已更新' : '项目已添加');
                        await this.loadProjects();
                    } catch (error) {
                        Components.notification.error('保存失败：' + error.message);
                    }
                }
            }
        });
    }
    deleteProject(id) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这个项目吗？此操作不可撤销。',
            async () => {
                try {
                    await api.projects.delete(id);
                    Components.notification.success('项目已删除');
                    await this.loadProjects();
                } catch (error) {
                    Components.notification.error('删除失败：' + error.message);
                }
            }
        );
    }
    async loadNotices() {
        try {
            Components.loading.show('noticesList', '加载公告数据...');
            const data = await api.notices.getList();
            const notices = data.notices || [];
            this.cache.set('notices', notices);
            this.renderNoticesList(notices);
            this.setupNoticeActions();
        } catch (error) {
            Components.notification.error('加载公告数据失败');
            console.error('Notices load error:', error);
        }
    }
    renderNoticesList(notices) {
        const container = document.getElementById('noticesList');
        if (!container) return;
        if (notices.length === 0) {
            Components.emptyState.show('noticesList', {
                icon: 'fas fa-bullhorn',
                title: '暂无公告',
                message: '还没有发布任何公告',
                action: {
                    text: '添加公告',
                    onClick: () => this.showNoticeForm()
                }
            });
            return;
        }
        container.innerHTML = '';
        notices.forEach((notice, index) => {
            const noticeItem = Utils.domUtils.createElement('div', {
                className: 'notice-item'
            });
            noticeItem.innerHTML = `
                <div class="notice-header">
                    <i class="notice-icon ${notice.icon || 'fas fa-info-circle'}"></i>
                    <div class="notice-title">${notice.title}</div>
                    <div class="notice-actions">
                        <button class="action-btn edit edit-notice" title="编辑" data-id="${notice.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete delete-notice" title="删除" data-id="${notice.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="notice-content">
                    ${Array.isArray(notice.content)
                    ? notice.content.map(item => {
                        const description = item.description ? `<p class="notice-description">${item.description}</p>` : '';
                        const highlightClass = item.highlight ? 'highlight' : '';
                        return `
                                <div class="notice-detail-item ${item.type || 'info'} ${highlightClass}">
                                    ${item.icon ? `<i class="notice-detail-icon ${item.icon}"></i>` : ''}
                                    <div class="notice-detail-text">
                                        <strong>${item.text || ''}</strong>
                                        ${description}
                                    </div>
                                </div>
                            `;
                    }).join('')
                    : notice.content
                }
                </div>
            `;
            container.appendChild(noticeItem);
        });
    }
    setupNoticeActions() {
        document.getElementById('addNoticeBtn')?.addEventListener('click', () => {
            this.showNoticeForm();
        });
        document.querySelectorAll('.edit-notice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const cachedData = this.cache.get('notices');
                if (cachedData) {
                    const notice = cachedData.find(n => n.id == id);
                    if (notice) {
                        this.showNoticeForm(notice);
                    } else {
                        Components.notification.error('在缓存中找不到该公告。');
                    }
                } else {
                    Components.notification.error('公告缓存未找到，请尝试刷新页面。');
                }
            });
        });
        document.querySelectorAll('.delete-notice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteNotice(id);
            });
        });
    }
    showNoticeForm(notice = null) {
        const isEdit = !!notice;
        const title = isEdit ? '编辑公告' : '添加公告';
        const fields = [
            {
                name: 'title',
                label: '公告标题',
                type: 'text',
                required: true,
                value: notice?.title || '',
                placeholder: '请输入公告标题'
            },
            {
                name: 'icon',
                label: '图标类名',
                type: 'text',
                value: notice?.icon || 'fas fa-info-circle',
                placeholder: 'fas fa-info-circle',
                help: '使用 FontAwesome 图标类名'
            },
            {
                name: 'content',
                label: '公告内容',
                type: 'textarea',
                required: true,
                value: notice ? JSON.stringify(notice.content, null, 2) : '',
                placeholder: '请输入公告内容，每行一段',
                rows: 5,
                help: '每行内容将作为一段显示'
            }
        ];
        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '添加',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const validationRules = {
                    title: [Utils.validation.rules.required],
                    content: [Utils.validation.rules.required]
                };
                const result = Components.formBuilder.validate(modalForm, validationRules);
                if (result.isValid) {
                    try {
                        let contentData;
                        try {
                            contentData = JSON.parse(result.data.content);
                        } catch (e) {
                            Components.notification.error('公告内容不是有效的JSON格式。');
                            return;
                        }
                        const noticeData = {
                            title: result.data.title,
                            icon: result.data.icon,
                            content: contentData
                        };
                        if (isEdit) {
                            await api.notices.update({
                                id: notice.id,
                                ...noticeData
                            });
                        } else {
                            await api.notices.add(noticeData);
                        }
                        Components.modal.hide();
                        Components.notification.success(isEdit ? '公告已更新' : '公告已添加');
                        await this.loadNotices();
                    } catch (error) {
                        Components.notification.error('保存失败：' + error.message);
                    }
                }
            }
        });
    }
    deleteNotice(id) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这条公告吗？此操作不可撤销。',
            async () => {
                try {
                    await api.notices.delete(id);
                    Components.notification.success('公告已删除');
                    await this.loadNotices();
                } catch (error) {
                    Components.notification.error('删除失败：' + error.message);
                }
            }
        );
    }
    async loadTimeline() {
        try {
            Components.loading.show('timelineContainer', '加载时间线数据...');
            const data = await api.timeline.getList(1, 50);
            const milestones = data.milestones || [];
            this.cache.set('timeline', milestones);
            this.renderTimeline(milestones);
            this.setupTimelineActions();
        } catch (error) {
            Components.notification.error('加载时间线数据失败');
            console.error('Timeline load error:', error);
        }
    }
    renderTimeline(milestones) {
        const container = document.getElementById('timelineContainer');
        if (!container) return;
        if (milestones.length === 0) {
            Components.emptyState.show('timelineContainer', {
                icon: 'fas fa-history',
                title: '暂无时间线',
                message: '还没有添加任何时间节点',
                action: {
                    text: '添加时间节点',
                    onClick: () => this.showTimelineForm()
                }
            });
            return;
        }
        container.innerHTML = '';
        milestones.forEach((milestone, index) => {
            const timelineItem = Utils.domUtils.createElement('div', {
                className: 'timeline-item'
            });
            timelineItem.innerHTML = `
                <div class="timeline-content">
                    <div class="timeline-date">${Utils.formatDate(milestone.date)}</div>
                    <div class="timeline-title">${milestone.title}</div>
                    <div class="timeline-description">${milestone.description}</div>
                    <div class="timeline-actions" style="margin-top: 1rem;">
                        <button class="btn btn-sm edit-timeline" data-id="${milestone.id}">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger delete-timeline" data-id="${milestone.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(timelineItem);
        });
    }
    setupTimelineActions() {
        document.getElementById('addTimelineBtn')?.addEventListener('click', () => {
            this.showTimelineForm();
        });
        document.querySelectorAll('.edit-timeline').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const cachedData = this.cache.get('timeline');
                if (cachedData) {
                    const milestone = cachedData.find(m => m.id == id);
                    if (milestone) {
                        this.showTimelineForm(milestone);
                    } else {
                        Components.notification.error('在缓存中找不到该时间节点。');
                    }
                } else {
                    Components.notification.error('时间线缓存未找到，请尝试刷新页面。');
                }
            });
        });
        document.querySelectorAll('.delete-timeline').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                this.deleteTimeline(id);
            });
        });
    }
    showTimelineForm(milestone = null) {
        const isEdit = !!milestone;
        const title = isEdit ? '编辑时间节点' : '添加时间节点';
        const fields = [
            {
                name: 'date',
                label: '日期',
                type: 'date',
                required: true,
                value: milestone ? Utils.formatDate(milestone.date) : '',
                placeholder: '选择日期'
            },
            {
                name: 'title',
                label: '标题',
                type: 'text',
                required: true,
                value: milestone?.title || '',
                placeholder: '请输入时间节点标题'
            },
            {
                name: 'description',
                label: '描述',
                type: 'textarea',
                required: true,
                value: milestone?.description || '',
                placeholder: '请输入详细描述',
                rows: 3
            }
        ];
        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '添加',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const validationRules = {
                    date: [Utils.validation.rules.required],
                    title: [Utils.validation.rules.required],
                    description: [Utils.validation.rules.required]
                };
                const result = Components.formBuilder.validate(modalForm, validationRules);
                if (result.isValid) {
                    try {
                        if (isEdit) {
                            await api.timeline.update({
                                id: milestone.id,
                                ...result.data
                            });
                        } else {
                            await api.timeline.add(result.data);
                        }
                        Components.modal.hide();
                        Components.notification.success(isEdit ? '时间节点已更新' : '时间节点已添加');
                        await this.loadTimeline();
                    } catch (error) {
                        Components.notification.error('保存失败：' + error.message);
                    }
                }
            }
        });
    }
    deleteTimeline(id) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这个时间节点吗？此操作不可撤销。',
            async () => {
                try {
                    await api.timeline.delete(id);
                    Components.notification.success('时间节点已删除');
                    await this.loadTimeline();
                } catch (error) {
                    Components.notification.error('删除失败：' + error.message);
                }
            }
        );
    }
    async loadArticles() {
        const currentPage = parseInt(Utils.getUrlParam('article_page')) || 1;
        try {
            Components.loading.show('articlesGrid', '加载文章数据...');
            const data = await api.articles.getList(currentPage, 10);
            const articles = data.data || [];
            this.cache.set('articles', articles);
            this.renderArticlesGrid(articles);
            if (data.pagination) {
                Components.pagination.create(
                    'articlesPagination',
                    data.pagination.page,
                    data.pagination.totalPages,
                    (page) => {
                        Utils.setUrlParam('article_page', page);
                        this.loadArticles();
                    }
                );
            }
            this.setupArticleActions();
        } catch (error) {
            Components.notification.error('加载文章数据失败');
            console.error('Articles load error:', error);
        }
    }
    renderArticlesGrid(articles) {
        const container = document.getElementById('articlesGrid');
        if (!container) return;
        if (articles.length === 0) {
            Components.emptyState.show('articlesGrid', {
                icon: 'fas fa-book',
                title: '暂无文章',
                message: '还没有发布任何文章',
                action: {
                    text: '添加文章',
                    onClick: () => this.showArticleForm()
                }
            });
            return;
        }
        container.innerHTML = '';
        articles.forEach(article => {
            const articleCard = Utils.domUtils.createElement('div', {
                className: 'article-card'
            });
            const tagsHtml = (article.tags && article.tags.length > 0)
                ? `<span><i class="fas fa-tags"></i> ${article.tags.join(', ')}</span>`
                : '';
            const aiHtml = (article.aiAssistants && article.aiAssistants.length > 0)
                ? `<span><i class="fas fa-robot"></i> ${article.aiAssistants.join(', ')}</span>`
                : '';
            articleCard.innerHTML = `
                ${article.thumbnail ? `<div class="article-thumbnail" style="background-image: url('${article.thumbnail}')"></div>` : ''}
                <div class="article-content">
                    <div class="article-title">${article.title}</div>
                    <div class="article-excerpt">${article.excerpt || '暂无摘要'}</div>
                    <div class="article-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${Utils.formatDate(article.date)}</span>
                        ${tagsHtml}
                        ${aiHtml}
                    </div>
                    <div class="article-actions">
                        <button class="btn btn-sm edit-article" data-id="${article.id}">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger delete-article" data-id="${article.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(articleCard);
        });
    }
    async loadImportantNotices() {
        try {
            Components.loading.show('importantNoticesList', '加载重要公告...');
            const data = await api.importantNotices.getList();
            const notices = data.notices || [];
            this.cache.set('important-notices', notices);
            this.renderImportantNotices(notices);
            this.setupImportantNoticeActions();
        } catch (error) {
            Components.notification.error('加载重要公告失败: ' + error.message);
        }
    }
    renderImportantNotices(notices) {
        const container = document.getElementById('importantNoticesList');
        if (!container) return;
        if (notices.length === 0) {
            Components.emptyState.show('importantNoticesList', {
                icon: 'fas fa-exclamation-triangle',
                title: '无重要公告',
                message: '当前没有正在生效的重要公告。',
                action: {
                    text: '添加公告',
                    onClick: () => this.showImportantNoticeForm()
                }
            });
            return;
        }
        container.innerHTML = '';
        notices.forEach(notice => {
            const noticeEl = Utils.domUtils.createElement('div', { className: 'notice-item' });
            const statusClass = notice.active ? 'online' : 'offline';
            const statusText = notice.active ? '生效中' : '已禁用';
            let imageHtml = '';
            if (notice.image && notice.image.url) {
                imageHtml = `
                        <div class="notice-image-container">
                            <img src="${notice.image.url}" alt="${notice.image.alt || '公告图片'}" style="max-width: 100%; height: auto; margin-top: 1rem;">
                        </div>
                    `;
            }
            let pollHtml = '';
            if (notice.poll && notice.poll.active) {
                pollHtml = `
                        <div class="notice-poll-container" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                            <strong>投票: ${notice.poll.question}</strong>
                            <ul>
                                ${notice.poll.options.map(opt => `<li>${opt.text}</li>`).join('')}
                            </ul>
                        </div>
                    `;
            }
            noticeEl.innerHTML = `
                    <div class="notice-header">
                        <div class="notice-title">${notice.title}</div>
                        <div class="notice-actions">
                            <span class="status-value ${statusClass}">${statusText}</span>
                            <button class="action-btn edit-important-notice" title="编辑" data-id="${notice.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete-important-notice" title="删除" data-id="${notice.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="notice-content">
                        <p>${notice.content}</p>
                        ${imageHtml}
                        ${pollHtml}
                        <small style="display: block; margin-top: 1rem; opacity: 0.7;">过期时间: ${notice.expiryDate ? Utils.formatDate(notice.expiryDate) : '无'}</small>
                    </div>
                `;
            container.appendChild(noticeEl);
        });
    }
    setupImportantNoticeActions() {
        document.getElementById('addImportantNoticeBtn')?.addEventListener('click', () => {
            this.showImportantNoticeForm();
        });
        document.querySelectorAll('.edit-important-notice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const cachedNotices = this.cache.get('important-notices');
                if (cachedNotices) {
                    const notice = cachedNotices.find(n => n.id == id);
                    if (notice) {
                        this.showImportantNoticeForm(notice);
                    } else {
                        Components.notification.error('在缓存中找不到该公告，数据可能已过期。');
                    }
                } else {
                    Components.notification.error('公告缓存未找到，请尝试刷新页面。');
                }
            });
        });
        document.querySelectorAll('.delete-important-notice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteImportantNotice(id);
            });
        });
    }
    showImportantNoticeForm(notice = null) {
        const isEdit = !!notice;
        const title = isEdit ? '编辑重要公告' : '添加重要公告';
        const fields = [
            { type: 'divider', label: '基础信息' },
            { name: 'id', label: 'ID', type: 'text', value: notice?.id || `notice_${Date.now()}`, required: true, help: '唯一标识符，创建后不建议修改', readonly: isEdit },
            { name: 'active', label: '是否激活', type: 'checkbox', checked: notice ? notice.active : true, className: 'form-group-toggle' },
            { name: 'title', label: '标题', type: 'text', value: notice?.title || '', required: true },
            { name: 'content', label: '内容', type: 'textarea', value: notice?.content || '', required: true, rows: 4 },
            { name: 'expiryDate', label: '过期时间', type: 'datetime-local', value: notice?.expiryDate ? Utils.formatDate(notice.expiryDate, 'YYYY-MM-DD HH:mm').replace(' ', 'T') : '' },
            { type: 'divider', label: '图片设置' },
            { name: 'imageUrl', label: '图片', type: 'image-upload', value: notice?.image?.url || '', uploadContext: 'notices' },
            { name: 'imageAlt', label: '图片描述', type: 'text', value: notice?.image?.alt || '' },
            { name: 'imagePosition', label: '图片位置', type: 'select', value: notice?.image?.position || 'top', options: [{ value: 'top', label: '上' }, { value: 'bottom', label: '下' }, { value: 'left', label: '左' }, { value: 'right', label: '右' }] },
            { name: 'imageWidth', label: '图片宽度', type: 'text', value: notice?.image?.width || '', placeholder: '例如: 100px 或 50%' },
            { name: 'imageHeight', label: '图片高度', type: 'text', value: notice?.image?.height || '', placeholder: '例如: 100px 或 auto' },
            { type: 'divider', label: '投票设置' },
            { name: 'pollActive', label: '开启投票', type: 'checkbox', checked: notice?.poll?.active || false, className: 'form-group-toggle' },
            { name: 'pollQuestion', label: '投票问题', type: 'text', value: notice?.poll?.question || '' },
            { name: 'pollOptions', label: '投票选项', type: 'textarea', value: notice?.poll?.options ? notice.poll.options.map(o => o.text).join('\n') : '', help: '每行一个选项', rows: 4 },
        ];
        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '添加',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const result = Components.formBuilder.validate(modalForm, { title: [], content: [] });
                if (result.isValid) {
                    try {
                        const data = result.data;
                        data.active = modalForm.querySelector('[name="active"]').checked;
                        if (data.imageUrl) {
                            data.image = {
                                url: data.imageUrl,
                                alt: data.imageAlt,
                                position: data.imagePosition,
                                width: data.imageWidth,
                                height: data.imageHeight,
                            };
                        } else {
                            data.image = null;
                        }
                        delete data.imageUrl;
                        delete data.imageAlt;
                        delete data.imagePosition;
                        delete data.imageWidth;
                        delete data.imageHeight;
                        const pollActive = modalForm.querySelector('[name="pollActive"]').checked;
                        const pollQuestion = data.pollQuestion.trim();
                        const pollOptionsText = data.pollOptions.trim();
                        const newPollOptions = pollOptionsText.split('\n').map(o => o.trim()).filter(Boolean);
                        if (pollActive && (!pollQuestion || newPollOptions.length === 0)) {
                            Components.notification.error('开启投票后，必须填写投票问题和至少一个选项。');
                            return;
                        }
                        if (pollQuestion && newPollOptions.length > 0) {
                            const existingPoll = notice?.poll || {};
                            const existingOptionsMap = new Map((existingPoll.options || []).map(opt => [opt.text, opt]));
                            data.poll = {
                                active: pollActive,
                                question: pollQuestion,
                                options: newPollOptions.map((text, index) => {
                                    const existingOption = existingOptionsMap.get(text);
                                    return {
                                        id: existingOption?.id || index,
                                        text: text,
                                        votes: existingOption?.votes || 0
                                    };
                                })
                            };
                        } else {
                            data.poll = null;
                        }
                        delete data.pollQuestion;
                        delete data.pollOptions;
                        await api.importantNotices.update(data);
                        Components.modal.hide();
                        Components.notification.success('重要公告已保存');
                        this.loadImportantNotices();
                    } catch (error) {
                        Components.notification.error('保存失败: ' + error.message);
                    }
                }
            }
        });
        document.querySelectorAll('#modal .form-group-toggle').forEach(group => {
            const checkbox = group.querySelector('input[type="checkbox"]');
            if (checkbox) {
                const toggleSwitch = document.createElement('label');
                toggleSwitch.setAttribute('for', checkbox.id);
                toggleSwitch.className = 'toggle-switch';
                if (!group.querySelector('.toggle-switch')) {
                    checkbox.insertAdjacentElement('afterend', toggleSwitch);
                }
            }
        });
    }
    deleteImportantNotice(id) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这条重要公告吗？此操作不可撤销。',
            async () => {
                try {
                    await api.importantNotices.delete(id);
                    Components.notification.success('重要公告已删除');
                    await this.loadImportantNotices();
                } catch (error) {
                    Components.notification.error('删除失败：' + error.message);
                }
            }
        );
    }
    setupArticleActions() {
        document.getElementById('addArticleBtn')?.addEventListener('click', () => {
            this.showArticleForm();
        });
        document.querySelectorAll('.edit-article').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                this.editArticle(id);
            });
        });
        document.querySelectorAll('.delete-article').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                this.deleteArticle(id);
            });
        });
    }
    async showArticleForm(article = null) {
        const isEdit = !!article;
        const title = isEdit ? '编辑文章' : '添加新文章';
        const fields = [
            { name: 'id', label: 'ID (Slug)', type: 'text', required: true, value: article?.id || '', placeholder: 'e.g., my-first-article', readonly: isEdit, help: '文章的唯一标识符，通常是URL的一部分。创建后不可修改。' },
            { name: 'title', label: '标题', type: 'text', required: true, value: article?.title || '' },
            { name: 'date', label: '发布日期', type: 'date', required: true, value: article ? Utils.formatDate(article.date, 'YYYY-MM-DD') : Utils.formatDate(new Date(), 'YYYY-MM-DD') },
            { name: 'contentUrl', label: '内容文件URL', type: 'text', required: true, value: article?.contentUrl || '', placeholder: '/articles/my-first-article.html', help: '指向HTML文件的路径。' },
            { name: 'excerpt', label: '摘要', type: 'textarea', value: article?.excerpt || '', rows: 3 },
            { name: 'thumbnail', label: '缩略图', type: 'image-upload', value: article?.thumbnail || '', uploadContext: 'articles' },
            { name: 'tags', label: '标签', type: 'textarea', value: article?.tags?.join('\n') || '', help: '每行一个标签', rows: 3 },
            { name: 'aiAssistants', label: 'AI助手', type: 'textarea', value: article?.aiAssistants?.join('\n') || '', placeholder: 'e.g., ChatGPT\nCopilot', help: '每行一个AI助手', rows: 3 }
        ];
        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '创建',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const validationRules = {
                    id: [Utils.validation.rules.required],
                    title: [Utils.validation.rules.required],
                    date: [Utils.validation.rules.required],
                    contentUrl: [Utils.validation.rules.required]
                };
                const result = Components.formBuilder.validate(modalForm, validationRules);
                if (result.isValid) {
                    try {
                        const articleData = { ...result.data };
                        articleData.tags = articleData.tags.split('\n').map(t => t.trim()).filter(Boolean);
                        articleData.aiAssistants = articleData.aiAssistants.split('\n').map(t => t.trim()).filter(Boolean);
                        if (isEdit) {
                            await api.articles.update(articleData);
                        } else {
                            await api.articles.add(articleData);
                        }
                        Components.modal.hide();
                        Components.notification.success(isEdit ? '文章已更新' : '文章已创建');
                        await this.loadArticles();
                    } catch (error) {
                        Components.notification.error('保存失败: ' + error.message);
                    }
                }
            }
        });
    }
    async editArticle(id) {
        const cachedArticles = this.cache.get('articles');
        if (cachedArticles) {
            const article = cachedArticles.find(a => a.id == id);
            if (article) {
                this.showArticleForm(article);
                return;
            }
        }
        try {
            Components.notification.info('正在从服务器获取完整的文章数据...');
            const article = await api.articles.getById(id);
            if (article) {
                this.showArticleForm(article);
            } else {
                Components.notification.error('找不到指定的文章');
            }
        } catch (error) {
            Components.notification.error('加载文章失败: ' + error.message);
        }
    }
    deleteArticle(id) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这篇文章吗？此操作不可撤销。',
            async () => {
                try {
                    await api.articles.delete(id);
                    Components.notification.success('文章已删除');
                    await this.loadArticles();
                } catch (error) {
                    Components.notification.error('删除失败: ' + error.message);
                }
            }
        );
    }
    async loadD1Manager() {
        try {
            Components.loading.show('d1CodesTableBody', '正在从D1数据库加载激活码...');
            const result = await api.d1Manager.getRecords(null, 60);
            this.cache.set('d1-codes', result.data);
            this.renderD1Table(result.data);
            this.setupD1ManagerActions();
        } catch (error) {
            Components.notification.error('加载激活码失败: ' + error.message);
            const tbody = document.getElementById('d1CodesTableBody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="8" class="loading">加载失败，请检查网络或联系管理员。</td></tr>`;
            }
        }
    }
    renderD1Table(codes) {
        const tbody = document.getElementById('d1CodesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!codes || codes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">未找到任何记录</td></tr>`;
            return;
        }
        codes.forEach(code => {
            const tr = document.createElement('tr');
            tr.dataset.code = code.code;
            const status = code.is_banned
                ? `<span class="status-value danger">已封禁</span>`
                : code.is_used
                    ? `<span class="status-value success">已使用</span>`
                    : `<span class="status-value warning">未使用</span>`;
            let banButton = '';
            if (code.is_used && !code.is_banned) {
                banButton = `<button class="action-btn ban" title="封禁用户" data-user-id="${code.used_by_user_id}"><i class="fas fa-user-slash"></i></button>`;
            }
            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox"></td>
                <td>${status}</td>
                <td><code class="code-block">${Utils.escapeHtml(code.code)}</code></td>
                <td title="${Utils.escapeHtml(code.note || '')}">${Utils.truncateText(code.note || '', 30)}</td>
                <td>${code.used_by_user_id || 'N/A'}</td>
                <td>${code.realname || 'N/A'}</td>
                <td>${code.expires_at ? Utils.formatDate(code.expires_at, 'YYYY-MM-DD') : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn copy" title="复制激活码" data-code="${Utils.escapeHtml(code.code)}"><i class="fas fa-copy"></i></button>
                        ${banButton}
                        <button class="action-btn delete" title="删除激活码"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        this.updateD1Selection();
    }
    setupD1ManagerActions() {
        if (this.d1ManagerActionsInitialized) return;
        const searchInput = document.getElementById('d1SearchInput');
        const searchBtn = document.getElementById('d1SearchBtn');
        const generateBtn = document.getElementById('generateCodeBtn');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const tableBody = document.getElementById('d1CodesTableBody');
        const batchCopyBtn = document.getElementById('batchCopyBtn');
        const batchDeleteBtn = document.getElementById('batchDeleteBtn');
        const batchBanBtn = document.getElementById('batchBanBtn');
        if (searchInput && searchBtn) {
            const performD1Search = async () => {
                const term = searchInput.value.trim();
                if (term && term.length < 3) {
                    Components.notification.show('搜索关键词长度不能少于3个字符', 'warning');
                    return;
                }
                Components.loading.show('d1CodesTableBody', term ? `正在搜索 "${term}"...` : '正在加载数据...');
                const result = await api.d1Manager.getRecords(term || null, !term ? 60 : null);
                this.cache.set('d1-codes', result.data);
                this.renderD1Table(result.data);
            };
            searchBtn.addEventListener('click', performD1Search);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performD1Search();
            });
        }
        generateBtn.addEventListener('click', () => this.showGenerateCodeForm());
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            tableBody.querySelectorAll('.row-checkbox').forEach(checkbox => checkbox.checked = isChecked);
            this.d1SelectedItems.clear();
            if (isChecked) {
                const currentData = this.cache.get('d1-codes') || [];
                currentData.forEach(item => this.d1SelectedItems.add(item));
            }
            this.updateD1Selection();
        });
        batchCopyBtn.addEventListener('click', () => this.handleBatchCopy());
        batchDeleteBtn.addEventListener('click', () => this.handleBatchDelete());
        batchBanBtn.addEventListener('click', () => this.handleBatchBan());
        tableBody.addEventListener('click', (e) => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            const codeId = row.dataset.code;
            const currentData = this.cache.get('d1-codes') || [];
            const rowData = currentData.find(c => c.code === codeId);
            if (target.matches('.row-checkbox')) {
                if (target.checked) {
                    this.d1SelectedItems.add(rowData);
                } else {
                    this.d1SelectedItems.delete(rowData);
                }
                this.updateD1Selection();
            } else if (target.closest('.copy')) {
                Utils.copyToClipboard(rowData.code);
                Components.notification.success(`已复制: ${rowData.code}`);
            } else if (target.closest('.delete')) {
                this.handleDeleteCode(rowData);
            } else if (target.closest('.ban')) {
                this.handleBanUser(rowData);
            }
        });
        this.d1ManagerActionsInitialized = true;
    }
    updateD1Selection() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const totalRows = (this.cache.get('d1-codes') || []).length;
        const selectedCount = this.d1SelectedItems.size;
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = selectedCount === totalRows && totalRows > 0;
            selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalRows;
        }
        const countDisplay = document.getElementById('d1SelectionCount');
        if (countDisplay) {
            countDisplay.textContent = `已选 ${selectedCount} / ${totalRows} 条`;
        }
    }
    showGenerateCodeForm() {
        const fields = [
            { name: 'num_codes', label: '数量', type: 'number', required: true, value: '10' },
            { name: 'duration_days', label: '有效期(天)', type: 'number', required: true, value: '30' },
            { name: 'prefix', label: '前缀 (可选)', type: 'text', value: 'WEB-', placeholder: '例如 GEN-' },
            { name: 'note', label: '备注', type: 'text', required: true, value: 'Web后台生成' },
        ];
        const formHtml = Components.formBuilder.create(fields).outerHTML;
        Components.modal.show('生成激活码', formHtml, {
            saveText: '生成',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const result = Components.formBuilder.validate(modalForm, {
                    num_codes: [Utils.validation.rules.required, Utils.validation.rules.positiveNumber],
                    duration_days: [Utils.validation.rules.required, Utils.validation.rules.positiveNumber],
                    note: [Utils.validation.rules.required]
                });
                if (!result.isValid) return;
                const { num_codes, duration_days, prefix, note } = result.data;
                const codesToInsert = [];
                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                for (let i = 0; i < num_codes; i++) {
                    let randPart = '';
                    for (let j = 0; j < 12; j++) {
                        randPart += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                    }
                    const formattedCode = `${randPart.slice(0, 4)}-${randPart.slice(4, 8)}-${randPart.slice(8, 12)}`;
                    codesToInsert.push({
                        code: (prefix || '') + formattedCode,
                        note: note,
                        days: parseInt(duration_days, 10)
                    });
                }
                try {
                    await api.d1Manager.insertCodes(codesToInsert);
                    Components.modal.hide();
                    Components.notification.success(`${num_codes}个激活码已成功生成！`);
                    this.loadD1Manager();
                } catch (error) {
                    Components.notification.error('生成失败: ' + error.message);
                }
            }
        });
    }
    handleDeleteCode(rowData) {
        Components.modal.confirm(
            '确认删除',
            `确定要删除激活码 "${rowData.code}" 吗？`,
            async () => {
                try {
                    await api.d1Manager.deleteCodes([rowData.code]);
                    Components.notification.success('激活码已删除');
                    this.loadD1Manager();
                } catch (error) {
                    Components.notification.error('删除失败: ' + error.message);
                }
            }
        );
    }
    handleBanUser(rowData) {
        Components.modal.confirm(
            '确认封禁',
            `确定要封禁用户 "${rowData.used_by_user_id}" 吗？这将使其无法再次激活。`,
            async () => {
                try {
                    await api.d1Manager.banUser(rowData.used_by_user_id, 'Admin Ban from Web Panel');
                    Components.notification.success('用户已封禁');
                    this.loadD1Manager();
                } catch (error) {
                    Components.notification.error('封禁失败: ' + error.message);
                }
            }
        );
    }
    handleBatchCopy() {
        if (this.d1SelectedItems.size === 0) {
            Components.notification.warning('请先选择要复制的激活码。');
            return;
        }
        const codes = Array.from(this.d1SelectedItems).map(item => item.code).join('\n');
        Utils.copyToClipboard(codes);
        Components.notification.success(`已复制 ${this.d1SelectedItems.size} 个激活码。`);
    }
    handleBatchDelete() {
        if (this.d1SelectedItems.size === 0) {
            Components.notification.warning('请先选择要删除的激活码。');
            return;
        }
        Components.modal.confirm(
            '确认批量删除',
            `确定要删除选中的 ${this.d1SelectedItems.size} 个激活码吗？此操作无法撤销。`,
            async () => {
                try {
                    const codesToDelete = Array.from(this.d1SelectedItems).map(item => item.code);
                    await api.d1Manager.deleteCodes(codesToDelete);
                    Components.notification.success('选中的激活码已全部删除');
                    this.d1SelectedItems.clear();
                    this.loadD1Manager();
                } catch (error) {
                    Components.notification.error('批量删除失败: ' + error.message);
                }
            }
        );
    }
    handleBatchBan() {
        if (this.d1SelectedItems.size === 0) {
            Components.notification.warning('请先选择要封禁用户的行。');
            return;
        }
        const usersToBan = Array.from(this.d1SelectedItems).filter(item => item.is_used && !item.is_banned);
        if (usersToBan.length === 0) {
            Components.notification.info('选中的行中没有可封禁的用户（可能未使用或已封禁）。');
            return;
        }
        Components.modal.confirm(
            '确认批量封禁',
            `确定要封禁选中的 ${usersToBan.length} 个用户吗？`,
            async () => {
                try {
                    const banPromises = usersToBan.map(item =>
                        api.d1Manager.banUser(item.used_by_user_id, 'Admin Batch Ban from Web Panel')
                    );
                    await Promise.all(banPromises);
                    Components.notification.success('选中的用户已全部封禁');
                    this.d1SelectedItems.clear();
                    this.loadD1Manager();
                } catch (error) {
                    Components.notification.error('批量封禁失败: ' + error.message);
                }
            }
        );
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.adminSystem = new AdminSystem();
});
window.AdminSystem = AdminSystem;
