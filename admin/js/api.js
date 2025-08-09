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
                window.location.href = 'login.html';
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
        getList: async (page = 1, limit = 10) => {
            return this.get('/getdata/donations', { page, limit });
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

        save: async (project) => {
            if (project.id && typeof project.id === 'string' && project.id.trim()) {
                return this.put('/getdata/projects', project);
            } else {
                return this.post('/getdata/projects', project);
            }
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

    comment = {
        uploadImage: async (imageFile) => {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const response = await fetch(`${this.baseURL}/comment/upload-image`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        }
    };

    articles = {
        getList: async () => {
            try {
                const data = await this.get('/article/list');
                return {
                    articles: Array.isArray(data) ? data : []
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
                    }
                };
            } catch (error) {
                console.error('Failed to get articles:', error);
                return { articles: [] };
            }
        },

        getSummary: async (articleId) => {
            return this.get('/article/summarize', { id: articleId });
        },

        add: async (article) => {
            return this.post('/article/add', article);
        },

        update: async (article) => {
            return this.put('/article/update', article);
        },

        delete: async (id) => {
            return this.delete('/article/delete', { id });
        }
    };

    async _getArticlesFromHTML() {
        try {
            return {
                articles: [
                    {
                        id: 'activation-code-mechanism',
                        title: '激活码机制详解',
                        description: '详细介绍激活码的工作原理和实现机制',
                        date: '2024-01-15',
                        tags: ['技术', '教程']
                    },
                    {
                        id: 'broke-webmaster-survival',
                        title: '破产站长生存指南',
                        description: '如何在预算有限的情况下维护个人网站',
                        date: '2024-01-10',
                        tags: ['经验', '建站']
                    },
                    {
                        id: 'cloudflare-pages-bing-seo-prerendering-fix',
                        title: 'Cloudflare Pages Bing SEO 预渲染修复',
                        description: '解决Cloudflare Pages在Bing搜索引擎中的SEO问题',
                        date: '2024-01-08',
                        tags: ['SEO', 'Cloudflare']
                    }
                ]
            };
        } catch (error) {
            console.error('Failed to get articles:', error);
            return { articles: [] };
        }
    }

    async uploadFile(file, path = '/upload') {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.baseURL}${path}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }

    async getSystemStatus() {
        try {
            const checks = await Promise.allSettled([
                this.donations.getList(1, 1),
                this.music.getPlaylist(),
                this.projects.getList(1, 1),
                this.notices.getList()
            ]);

            const statuses = {
                donations: checks[0].status === 'fulfilled',
                music: checks[1].status === 'fulfilled',
                projects: checks[2].status === 'fulfilled',
                notices: checks[3].status === 'fulfilled'
            };

            const allWorking = Object.values(statuses).every(status => status);

            return {
                overall: allWorking ? 'healthy' : 'degraded',
                services: statuses,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get system status:', error);
            return {
                overall: 'error',
                services: {},
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    async batchOperation(operations) {
        const results = [];
        
        for (const operation of operations) {
            try {
                const result = await this._request(operation.url, operation.options);
                results.push({ success: true, data: result });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }

        return results;
    }

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
            donations: [],
            music: [],
            projects: [],
            notices: []
        };

        try {
            if (type === 'all' || type === 'donations') {
                const donationsData = await this.donations.getList(1, 100);
                if (donationsData.data) {
                    results.donations = donationsData.data.filter(item =>
                        item.name?.toLowerCase().includes(query.toLowerCase()) ||
                        item.message?.toLowerCase().includes(query.toLowerCase())
                    );
                }
            }

            if (type === 'all' || type === 'music') {
                const musicData = await this.music.getPlaylist();
                if (musicData.songs) {
                    results.music = musicData.songs.filter(item =>
                        item.title?.toLowerCase().includes(query.toLowerCase()) ||
                        item.artist?.toLowerCase().includes(query.toLowerCase())
                    );
                }
            }

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
