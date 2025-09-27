class API {
    constructor() {
        this.baseURL = 'https://api.zygame1314.site';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }
    async _request(url, options = {}) {
        const token = localStorage.getItem('authToken');
        const headers = { ...this.defaultHeaders, ...options.headers };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const config = {
            headers,
            ...options
        };
        try {
            const response = await fetch(`${this.baseURL}${url}`, config);
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/admin/login';
                return;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    async get(url, params = {}) {
        const urlWithParams = new URL(`${this.baseURL}${url}`, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                urlWithParams.searchParams.append(key, params[key]);
            }
        });
        return this._request(urlWithParams.pathname + urlWithParams.search, {
            method: 'GET'
        });
    }
    async post(url, data = {}) {
        return this._request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async put(url, data = {}) {
        return this._request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    async delete(url, params = {}) {
        const urlWithParams = new URL(`${this.baseURL}${url}`, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                urlWithParams.searchParams.append(key, params[key]);
            }
        });
        return this._request(urlWithParams.pathname + urlWithParams.search, {
            method: 'DELETE'
        });
    }
    donations = {
        getList: async (page = 1, limit = 10, platform = null) => {
            const params = { page, limit };
            if (platform) {
                params.platform = platform;
            }
            return this.get('/getdata/donations', params);
        },
        add: async (donation) => {
            return this.post('/getdata/donations', donation);
        },
        update: async (donation) => {
            return this.put('/getdata/donations', donation);
        },
        delete: async (id) => {
            return this.delete('/getdata/donations', { id });
        }
    };
    music = {
        getPlaylist: async () => {
            return this.get('/getdata/playlist');
        },
        add: async (music) => {
            return this.post('/getdata/playlist', music);
        },
        update: async (music) => {
            return this.put('/getdata/playlist', music);
        },
        delete: async (id) => {
            return this.delete('/getdata/playlist', { id });
        }
    };
    projects = {
        getList: async (page = 1, limit = 20) => {
            return this.get('/getdata/projects', { page, limit });
        },
        add: async (project) => {
            return this.post('/getdata/projects', project);
        },
        update: async (project) => {
            return this.put('/getdata/projects', project);
        },
        delete: async (id) => {
            return this.delete('/getdata/projects', { id });
        }
    };
    notices = {
        getList: async () => {
            return this.get('/getdata/notices');
        },
        add: async (notice) => {
            return this.post('/getdata/notices', notice);
        },
        update: async (notice) => {
            return this.put('/getdata/notices', notice);
        },
        delete: async (id) => {
            return this.delete('/getdata/notices', { id });
        }
    };
    timeline = {
        getList: async (page = 1, limit = 50) => {
            return this.get('/getdata/timeline', { page, limit });
        },
        add: async (milestone) => {
            return this.post('/getdata/timeline', milestone);
        },
        update: async (milestone) => {
            return this.put('/getdata/timeline', milestone);
        },
        delete: async (id) => {
            return this.delete('/getdata/timeline', { id });
        }
    };
    importantNotices = {
        getList: async () => {
            return this.get('/getdata/important-notice?admin=true');
        },
        update: async (notice) => {
            return this.put('/getdata/important-notice', notice);
        },
        delete: async (id) => {
            return this.delete('/getdata/important-notice', { id });
        }
    };
    importantNotice = {
        get: async () => {
            return this.get('/getdata/important-notice');
        },
        update: async (notice) => {
            return this.put('/getdata/important-notice', notice);
        },
        add: async (notice) => {
            return this.put('/getdata/important-notice', notice);
        }
    };
    status = {
        getHistory: async (minutes = 60) => {
            return this.get('/check/status-history', { minutes });
        },
        getScripts: async () => {
            return this.get('/check/scripts');
        }
    };
    poll = {
        vote: async (noticeId, options) => {
            return this.post('/notice/vote', { noticeId, options });
        },
        getResults: async (noticeId) => {
            return this.get('/notice/poll-results', { noticeId });
        },
        hasVoted: async (noticeId) => {
            return this.get('/notice/has-voted', { noticeId });
        }
    };
    games = {
        getPopular: async () => {
            return this.get('/games/popular');
        },
        getRecent: async () => {
            return this.get('/games/recent-games');
        },
        getSteamStatus: async () => {
            return this.get('/games/steam-status');
        }
    };
    weather = {
        get: async () => {
            return this.get('/weather/weather');
        }
    };
    articles = {
        getList: async (page = 1, limit = 10) => {
            return this.get('/getdata/articles', { page, limit });
        },
        getById: async (id) => {
            return this.get('/getdata/articles', { id });
        },
        add: async (article) => {
            return this.post('/getdata/articles', article);
        },
        update: async (article) => {
            return this.put('/getdata/articles', article);
        },
        delete: async (id) => {
            return this.delete('/getdata/articles', { id });
        },
        getPublicList: async () => {
            return this.get('/article/list');
        },
        getSummary: async (articleId) => {
            return this.get('/article/summarize', { id: articleId });
        }
    };
    d1Manager = {
        getRecords: async (searchTerm = null, limit = null) => {
            const params = {};
            if (searchTerm) params.search_term = searchTerm;
            if (limit) params.limit = limit;
            return this.get('/admin/d1-manager', params);
        },
        insertCodes: async (codes) => {
            return this.post('/admin/d1-manager', { action: 'INSERT_CODES', payload: { codes } });
        },
        deleteCodes: async (codes) => {
            return this._request('/admin/d1-manager', {
                method: 'DELETE',
                body: JSON.stringify({ codes })
            });
        },
        banUser: async (userId, reason) => {
            return this.post('/admin/d1-manager', { action: 'BAN_USER', payload: { userId, reason } });
        },
        unbanUser: async (userId) => {
            return this.post('/admin/d1-manager', { action: 'UNBAN_USER', payload: { userId } });
        }
    };
    async getStatistics() {
        try {
            const [donations, music, projects, notices] = await Promise.allSettled([
                this.donations.getList(1, 1),
                this.music.getPlaylist(),
                this.projects.getList(1, 1),
                this.notices.getList()
            ]);
            const stats = {
                totalDonations: 0,
                totalSongs: 0,
                totalProjects: 0,
                totalNotices: 0
            };
            if (donations.status === 'fulfilled' && donations.value.pagination) {
                stats.totalDonations = donations.value.pagination.total;
            }
            if (music.status === 'fulfilled' && music.value.songs) {
                stats.totalSongs = music.value.songs.length;
            }
            if (projects.status === 'fulfilled' && projects.value.pagination) {
                stats.totalProjects = projects.value.pagination.total;
            }
            if (notices.status === 'fulfilled' && notices.value.notices) {
                stats.totalNotices = notices.value.notices.length;
            }
            return stats;
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return {
                totalDonations: 0,
                totalSongs: 0,
                totalProjects: 0,
                totalNotices: 0
            };
        }
    }
    async search(query, type = 'all') {
        const results = {
            projects: [],
            notices: []
        };
        try {
            if (type === 'all' || type === 'projects') {
                const projectsData = await this.projects.getList(1, 100);
                if (projectsData.projects) {
                    results.projects = projectsData.projects.filter(item =>
                        item.title?.toLowerCase().includes(query.toLowerCase()) ||
                        item.description?.toLowerCase().includes(query.toLowerCase())
                    );
                }
            }
            if (type === 'all' || type === 'notices') {
                const noticesData = await this.notices.getList();
                if (noticesData.notices) {
                    results.notices = noticesData.notices.filter(item =>
                        item.title?.toLowerCase().includes(query.toLowerCase()) ||
                        JSON.stringify(item.content)?.toLowerCase().includes(query.toLowerCase())
                    );
                }
            }
            return results;
        } catch (error) {
            console.error('Search failed:', error);
            return results;
        }
    }
}
const api = new API();
window.API = API;
window.api = api;
