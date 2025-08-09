class AdminSystem {
    constructor() {
        this.currentSection = 'dashboard';
        this.cache = new Map();
        this.searchHandlers = new Map();
        
        this.donationsCache = [];
        this.musicCache = [];
        this.projectsCache = [];
        this.noticesCache = [];
        this.timelineCache = [];
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupModals();
        this.loadDashboard();
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
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
            window.location.href = 'login.html';
        }
    }

    setupEventListeners() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        
        sidebarToggle?.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });

        mobileSidebarToggle?.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('show');
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
                    window.location.href = 'login.html';
                }
            );
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
            settings: '系统设置'
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
            case 'settings':
                await this.loadSettings();
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

    async loadDonations() {
        const currentPage = parseInt(Utils.getUrlParam('donation_page')) || 1;
        
        try {
            Components.loading.show('donationsTableBody', '加载捐献数据...');
            
            const data = await api.donations.getList(currentPage, 10);
            this.renderDonationsTable(data.data || []);
            
            if (data.pagination) {
                Components.pagination.create(
                    'donationsPagination',
                    data.pagination.page,
                    data.pagination.totalPages,
                    (page) => {
                        Utils.setUrlParam('donation_page', page);
                        this.loadDonations();
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

        Components.table.create('donationsTableBody', columns, donations, {
            emptyText: '暂无捐献记录'
        });
    }

    setupDonationActions() {
        document.getElementById('addDonationBtn')?.addEventListener('click', () => {
            this.showDonationForm();
        });

        const searchInput = document.getElementById('donationSearch');
        if (searchInput && !this.searchHandlers.has('donation')) {
            const searchHandler = Utils.debounce(async (e) => {
                const query = e.target.value.trim();
                if (query) {
                    await this.searchDonations(query);
                } else {
                    await this.loadDonations();
                }
            }, 500);
            searchInput.addEventListener('input', searchHandler);
            this.searchHandlers.set('donation', searchHandler);
        }

        const platformFilter = document.getElementById('platformFilter');
        platformFilter?.addEventListener('change', async (e) => {
            const platform = e.target.value;
            await this.filterDonationsByPlatform(platform);
        });

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
                    { value: 'wechat', label: '微信支付' },
                    { value: 'afdian', label: '爱发电' }
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

    async searchDonations(query) {
        try {
            const results = await api.search(query, 'donations');
            this.renderDonationsTable(results.donations);
        } catch (error) {
            Components.notification.error('搜索失败');
            console.error('Search error:', error);
        }
    }

    async filterDonationsByPlatform(platform) {
        Components.notification.info('筛选功能开发中...');
    }

    async loadMusic() {
        try {
            Components.loading.show('musicGrid', '加载音乐数据...');
            
            const data = await api.music.getPlaylist();
            const songs = data.songs || [];
            this.musicCache = songs;
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
                <div class="music-cover" style="background-image: url('${song.cover || '/images/default-music.jpg'}')">
                    <div class="music-overlay">
                        <button class="play-btn" title="播放">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="music-info">
                    <div class="music-title">${song.title}</div>
                    <div class="music-artist">${song.artist}</div>
                    ${song.ytLink ? `<a href="${song.ytLink}" target="_blank" class="yt-link">YouTube</a>` : ''}
                    <div class="music-actions">
                        <button class="btn btn-sm edit-music" data-song='${JSON.stringify(song)}'>
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

        const searchInput = document.getElementById('musicSearch');
        if (searchInput && !this.searchHandlers.has('music')) {
            const searchHandler = Utils.debounce(async (e) => {
                const query = e.target.value.trim();
                if (query) {
                    await this.searchMusic(query);
                } else {
                    await this.loadMusic();
                }
            }, 500);
            searchInput.addEventListener('input', searchHandler);
            this.searchHandlers.set('music', searchHandler);
        }

        document.querySelectorAll('.edit-music').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const songId = btn.dataset.id;
                const song = this.musicCache?.find(s => s.id == songId);
                if (song) {
                    this.showMusicForm(song);
                } else {
                    Components.notification.error('找不到音乐数据');
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
                label: '音频文件路径',
                type: 'text',
                required: true,
                value: song?.path || '',
                placeholder: '/music/song.mp3'
            },
            {
                name: 'cover',
                label: '封面图片路径',
                type: 'text',
                value: song?.cover || '',
                placeholder: '/images/cover.jpg'
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
                type: 'text',
                value: song?.expression || '',
                placeholder: '可选的表情符号'
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
                            await api.music.update({
                                id: song.id,
                                ...result.data
                            });
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

    async searchMusic(query) {
        try {
            const results = await api.search(query, 'music');
            this.renderMusicGrid(results.music);
        } catch (error) {
            Components.notification.error('搜索失败');
            console.error('Search error:', error);
        }
    }

    async loadProjects() {
        try {
            Components.loading.show('projectsGrid', '加载项目数据...');
            
            const data = await api.projects.getList(1, 50);
            const projects = data.projects || [];
            this.projectsCache = projects;
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
                <div class="project-image" style="background-image: url('${project.imageUrl || '/images/default-project.jpg'}')"></div>
                <div class="project-content">
                    <div class="project-title">${project.title}</div>
                    <div class="project-description">${project.description || '暂无描述'}</div>
                    <div class="project-type">${project.type || 'normal'}</div>
                    <div class="project-actions">
                        <button class="btn btn-sm edit-project" data-project='${JSON.stringify(project)}'>
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger delete-project" data-id="${project.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
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
                const projectId = btn.dataset.id;
                const project = this.projectsCache?.find(p => p.id == projectId);
                if (project) {
                    this.showProjectForm(project);
                } else {
                    Components.notification.error('找不到项目数据');
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
                label: '项目图片URL',
                type: 'text',
                value: project?.imageUrl || '',
                placeholder: '/images/project.jpg'
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
                        await api.projects.save(result.data);
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
            this.noticesCache = notices;
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
                        <button class="action-btn edit edit-notice" title="编辑" data-notice='${JSON.stringify(notice)}'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete delete-notice" title="删除" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="notice-content">
                    ${Array.isArray(notice.content) ? notice.content.join('<br>') : notice.content}
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
                const noticeId = btn.dataset.id;
                const notice = this.noticesCache?.find(n => n.id == noticeId);
                if (notice) {
                    this.showNoticeForm(notice);
                } else {
                    Components.notification.error('找不到公告数据');
                }
            });
        });

        document.querySelectorAll('.delete-notice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = btn.dataset.index;
                this.deleteNotice(index);
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
                value: Array.isArray(notice?.content) ? notice.content.join('\n') : (notice?.content || ''),
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
                        const contentArray = result.data.content.split('\n').filter(line => line.trim());
                        
                        const noticeData = {
                            title: result.data.title,
                            icon: result.data.icon,
                            content: contentArray
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

    deleteNotice(index) {
        Components.modal.confirm(
            '确认删除',
            '确定要删除这条公告吗？此操作不可撤销。',
            async () => {
                try {
                    Components.notification.info('删除功能开发中...');
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
            this.timelineCache = milestones;
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
                        <button class="btn btn-sm edit-timeline" data-milestone='${JSON.stringify(milestone)}'>
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
                const milestoneId = btn.dataset.id;
                const milestone = this.timelineCache?.find(m => m.id == milestoneId);
                if (milestone) {
                    this.showTimelineForm(milestone);
                } else {
                    Components.notification.error('找不到时间节点数据');
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
            this.renderArticlesGrid(data.data || []);
            
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
                className: 'project-card'
            });

            articleCard.innerHTML = `
                <div class="project-content">
                    <div class="project-title">${article.title}</div>
                    <div class="project-meta" style="margin: 1rem 0; color: var(--text-muted); font-size: 0.875rem;">
                        <span><i class="fas fa-calendar-alt"></i> 创建于: ${Utils.formatDate(article.createdAt)}</span>
                        <span style="margin-left: 1rem;"><i class="fas fa-sync-alt"></i> 更新于: ${Utils.formatDate(article.updatedAt)}</span>
                        ${article.category ? `<span style="margin-left: 1rem;"><i class="fas fa-folder"></i> ${article.category}</span>` : ''}
                        ${article.tags ? `<span style="margin-left: 1rem;"><i class="fas fa-tags"></i> ${article.tags}</span>` : ''}
                    </div>
                    <div class="project-actions">
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
                this.renderImportantNotices(data.notices || []);
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
                const statusClass = notice.active ? 'online' : '';
                const statusText = notice.active ? '生效中' : '已禁用';
    
                noticeEl.innerHTML = `
                    <div class="notice-header">
                        <div class="notice-title">${notice.title}</div>
                        <div class="notice-actions">
                            <span class="status-value ${statusClass}">${statusText}</span>
                            <button class="action-btn edit-important-notice" title="编辑" data-id="${notice.id}"><i class="fas fa-edit"></i></button>
                        </div>
                    </div>
                    <div class="notice-content">
                        <p>${notice.content}</p>
                        <small>过期时间: ${notice.expiryDate ? Utils.formatDate(notice.expiryDate) : '无'}</small>
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
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const notices = (await api.importantNotices.getList()).notices;
                    const notice = notices.find(n => n.id == id);
                    if (notice) {
                        this.showImportantNoticeForm(notice);
                    } else {
                        Components.notification.error('找不到该公告');
                    }
                });
            });
        }
    
        showImportantNoticeForm(notice = null) {
            const isEdit = !!notice;
            const title = isEdit ? '编辑重要公告' : '添加重要公告';
    
            const fields = [
                { name: 'id', label: 'ID', type: 'text', value: notice?.id || `notice_${Date.now()}`, required: true, help: '唯一标识符，创建后不建议修改' },
                { name: 'active', label: '是否激活', type: 'checkbox', checked: notice ? notice.active : true },
                { name: 'title', label: '标题', type: 'text', value: notice?.title || '', required: true },
                { name: 'content', label: '内容', type: 'textarea', value: notice?.content || '', required: true, rows: 4 },
                { name: 'expiryDate', label: '过期时间', type: 'datetime-local', value: notice?.expiryDate ? Utils.formatDate(notice.expiryDate, 'YYYY-MM-DD HH:mm').replace(' ', 'T') : '' },
            ];
    
            const form = Components.formBuilder.create(fields);
            Components.modal.show(title, form.outerHTML, {
                saveText: isEdit ? '更新' : '添加',
                onSave: async () => {
                    const modalForm = document.querySelector('#modal form');
                    const result = Components.formBuilder.validate(modalForm, { title: [], content: [] });
                    if (result.isValid) {
                        try {
                            await api.importantNotices.update(result.data);
                            Components.modal.hide();
                            Components.notification.success('重要公告已保存');
                            this.loadImportantNotices();
                        } catch (error) {
                            Components.notification.error('保存失败: ' + error.message);
                        }
                    }
                }
            });
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
            { name: 'title', label: '标题', type: 'text', required: true, value: article?.title || '' },
            { name: 'category', label: '分类', type: 'text', value: article?.category || '' },
            { name: 'tags', label: '标签', type: 'text', value: article?.tags || '', help: '用逗号分隔' },
            { name: 'content', label: '内容 (Markdown)', type: 'textarea', required: true, value: article?.content || '', rows: 15 }
        ];

        const form = Components.formBuilder.create(fields);
        Components.modal.show(title, form.outerHTML, {
            saveText: isEdit ? '更新' : '创建',
            onSave: async () => {
                const modalForm = document.querySelector('#modal form');
                const validationRules = {
                    title: [Utils.validation.rules.required],
                    content: [Utils.validation.rules.required]
                };
                const result = Components.formBuilder.validate(modalForm, validationRules);

                if (result.isValid) {
                    try {
                        const articleData = { ...result.data };
                        if (isEdit) {
                            articleData.id = article.id;
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
        try {
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

    async loadSettings() {
        Components.notification.info('设置功能开发中');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminSystem = new AdminSystem();
});

window.AdminSystem = AdminSystem;
