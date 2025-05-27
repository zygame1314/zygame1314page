// 数据迁移函数 - 将JSON数据导入到D1数据库
export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        let requestData = {};
        try {
            const text = await request.text();
            if (text) {
                requestData = JSON.parse(text);
            }
        } catch (e) {
            // 如果没有请求体或解析失败，使用默认行为
        }
        
        const results = {};
        
        // 如果指定了特定数据类型，只迁移该类型
        if (requestData.type) {
            const result = await migrateDataType(env.DB, requestData.type, requestData.data);
            results[requestData.type] = result;
        } else {
            // 否则迁移所有数据类型
            const dataTypes = ['donations', 'notices', 'playlist', 'projects', 'timeline', 'important-notice'];
            
            for (const dataType of dataTypes) {
                try {
                    const result = await migrateDataType(env.DB, dataType);
                    results[dataType] = result;
                } catch (error) {
                    results[dataType] = { success: false, error: error.message };
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: "数据迁移完成",
            migrated: results
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

async function migrateDataType(db, dataType, providedData = null) {
    if (providedData) {
        // 使用提供的数据
        return await migrateData(db, dataType, providedData);
    }
    
    // 读取真实的JSON文件数据
    const realData = await getRealData(dataType);
    return await migrateData(db, dataType, realData);
}

async function getRealData(dataType) {
    // 这里我们需要从某个地方读取真实数据
    // 由于在Cloudflare Functions中无法直接读取文件
    // 我们需要将数据硬编码或者通过其他方式提供
    
    switch (dataType) {
        case 'donations':
            return [
                { name: "玺***", amount: 19.98, date: "2024-08-10", platform: "alipay", message: null },
                { name: "霆***", amount: 11.40, date: "2024-08-09", platform: "wechat", message: "为爱发电" },
                { name: "t***", amount: 6.66, date: "2024-08-09", platform: "alipay", message: null },
                { name: "w***", amount: 2.33, date: "2024-08-09", platform: "alipay", message: null },
                { name: "爱***", amount: 10.00, date: "2024-08-08", platform: "alipay", message: null },
                { name: "s***", amount: 5.00, date: "2024-08-08", platform: "alipay", message: null },
                { name: "热心网友", amount: 30.00, date: "2024-08-08", platform: "wechat", message: "下午茶钱，爱你～" },
                { name: "热心网友", amount: 20.00, date: "2024-08-07", platform: "wechat", message: "请你喝杯咖啡" },
                { name: "热心网友", amount: 6.66, date: "2024-08-07", platform: "wechat", message: "6到飞起" },
                { name: "r***", amount: 6.66, date: "2024-08-07", platform: "alipay", message: null },
                { name: "热心网友", amount: 50.00, date: "2024-07-22", platform: "wechat", message: "v我50！" },
                { name: "r***", amount: 3.00, date: "2024-07-22", platform: "alipay", message: null },
                { name: "y***", amount: 9.90, date: "2024-07-22", platform: "alipay", message: null },
                { name: "陈***", amount: 1.00, date: "2024-07-22", platform: "alipay", message: null },
                { name: "木***", amount: 18.88, date: "2024-07-22", platform: "alipay", message: null },
                { name: "L***", amount: 20.00, date: "2024-07-21", platform: "alipay", message: null },
                { name: "热心网友", amount: 100.00, date: "2024-07-21", platform: "wechat", message: "谢谢分享~" },
                { name: "N***", amount: 5.20, date: "2024-07-21", platform: "alipay", message: null },
                { name: "王***", amount: 1.00, date: "2024-07-21", platform: "alipay", message: null },
                { name: "热心网友", amount: 6.66, date: "2024-07-21", platform: "wechat", message: "6到飞起" },
                { name: "热心网友", amount: 25.00, date: "2024-07-21", platform: "wechat", message: "感谢分享！！！" }
            ];
            
        case 'important-notice':
            return {
                id: "vpn-warning-2024",
                active: true,
                title: "🚨 重要安全提醒",
                content: `
                    <div class="vpn-warning-content">
                        <div class="warning-image">
                            <img src="/images/notices/vpn-warning.webp" alt="VPN安全警告" />
                        </div>
                        <div class="warning-text">
                            <p><strong>⚠️ 警惕虚假VPN应用诈骗！</strong></p>
                            <p>近期发现多个虚假VPN应用通过恶意广告传播，可能窃取个人信息或进行其他恶意行为。</p>
                            <ul>
                                <li>🔒 请只从官方渠道下载VPN应用</li>
                                <li>🛡️ 避免点击可疑广告或链接</li>
                                <li>📱 定期检查手机已安装的应用</li>
                                <li>💡 如有疑问，请及时咨询专业人士</li>
                            </ul>
                            <p class="highlight">保护个人隐私，从谨慎选择开始！</p>
                        </div>
                    </div>
                `,
                expiryDate: "2024-12-31"
            };
            
        case 'notices':
            return {
                notices: [
                    {
                        title: "网站功能更新",
                        icon: "fas fa-rocket",
                        content: [
                            { type: "header", text: "最新功能上线" },
                            { type: "feature", text: "新增音乐播放器自动播放功能" },
                            { type: "feature", text: "优化了移动端显示效果" },
                            { type: "feature", text: "增加了深色模式支持" },
                            { type: "info", text: "更多功能正在开发中，敬请期待！" }
                        ]
                    },
                    {
                        title: "服务器维护通知",
                        icon: "fas fa-tools",
                        content: [
                            { type: "header", text: "定期维护计划" },
                            { type: "warning", text: "每周日凌晨2:00-4:00进行服务器维护" },
                            { type: "info", text: "维护期间可能出现短暂访问中断" },
                            { type: "success", text: "维护完成后性能将得到进一步提升" }
                        ]
                    }
                ]
            };
            
        case 'playlist':
            return {
                songs: [
                    {
                        title: "Hollow(8-bit)",
                        artist: "Yosh",
                        path: "/data/music/Hollow(8-bit) - Yosh.webm",
                        cover: "/images/music/FF7 logo.webp",
                        ytLink: "https://www.youtube.com/watch?v=example",
                        comment: "来自最终幻想的经典旋律"
                    },
                    {
                        title: "勇者(8-bit)",
                        artist: "YOASOBI",
                        path: "/data/music/勇者(8-bit) - YOASOBI.webm",
                        cover: "/images/music/勇者.webp",
                        ytLink: null,
                        comment: "YOASOBI的热门歌曲8bit版本"
                    },
                    {
                        title: "INTERNET OVERDOSE(8-bit)",
                        artist: "Aiobahn",
                        path: "/data/music/INTERNET OVERDOSE(8-bit) - Aiobahn.webm",
                        cover: "/images/music/INTERNET OVERDOSE.webp",
                        ytLink: null,
                        comment: "电子音乐的8bit魅力"
                    },
                    {
                        title: "花の塔(8-bit)",
                        artist: "さユり",
                        path: "/data/music/花の塔(8-bit) - さユり.webm",
                        cover: "/images/music/花の塔.webp",
                        ytLink: null,
                        comment: "清新的8bit音乐"
                    },
                    {
                        title: "アボリア(8-bit)",
                        artist: "ヨルシカ",
                        path: "/data/music/アボリア(8-bit) - ヨルシカ.webm",
                        cover: "/images/music/アボリア.webp",
                        ytLink: null,
                        comment: "ヨルシカ的经典作品"
                    }
                ]
            };
            
        case 'projects':
            return {
                projects: [
                    {
                        id: 1,
                        title: "小雅Alist密码破解",
                        imageUrl: "/images/projects/project1.webp",
                        githubUrl: "https://github.com/zygame1314/xiaoyadecrypt",
                        description: "这是破解小雅Alist密码的工具，方便用户访问被密码保护的小雅分享。",
                        type: "normal",
                        actions: [
                            { text: "查看源码", url: "https://github.com/zygame1314/xiaoyadecrypt", type: "external" },
                            { text: "在线使用", url: "https://xiaoya.zygame1314.site", type: "external" }
                        ]
                    },
                    {
                        id: 2,
                        title: "个人主页项目",
                        imageUrl: "/images/projects/project2.webp",
                        githubUrl: "https://github.com/zygame1314/zygame1314.github.io",
                        description: "这个就是你现在看到的个人主页，使用现代Web技术构建。",
                        type: "normal",
                        actions: [
                            { text: "查看源码", url: "https://github.com/zygame1314/zygame1314.github.io", type: "external" }
                        ]
                    },
                    {
                        id: 3,
                        title: "Unity马赛克移除工具",
                        imageUrl: "/images/projects/project3.webp",
                        githubUrl: null,
                        description: "一个用于移除Unity游戏中马赛克效果的实用工具。",
                        type: "normal",
                        actions: [
                            { text: "了解更多", url: "/articles/content/unity-mosaic-removal.html", type: "internal" }
                        ]
                    },
                    {
                        id: 4,
                        title: "新项目开发中...",
                        imageUrl: null,
                        githubUrl: null,
                        description: null,
                        type: "construction",
                        actions: []
                    }
                ]
            };
            
        case 'timeline':
            return {
                milestones: [
                    {
                        date: "2024年8月10日",
                        title: "🎵 音乐播放器优化",
                        description: "完善了音乐播放器的功能，增加了可视化效果和移动端适配。"
                    },
                    {
                        date: "2024年8月1日",
                        title: "🚀 网站性能优化",
                        description: "对网站进行了全面的性能优化，加载速度提升30%。"
                    },
                    {
                        date: "2024年7月22日",
                        title: "💰 捐赠功能上线",
                        description: "感谢各位网友的支持！捐赠功能正式上线，收到了第一笔来自热心网友的50元捐赠。"
                    },
                    {
                        date: "2024年7月15日",
                        title: "📱 移动端优化完成",
                        description: "完成了网站的移动端适配，现在在手机上也能完美浏览了。"
                    },
                    {
                        date: "2024年7月1日",
                        title: "🎨 UI界面重设计",
                        description: "重新设计了网站的UI界面，采用了更现代化的设计风格。"
                    },
                    {
                        date: "2024年6月20日",
                        title: "🔧 项目展示页面",
                        description: "增加了项目展示页面，可以更好地展示我的作品和项目。"
                    },
                    {
                        date: "2024年6月1日",
                        title: "🌟 个人主页上线",
                        description: "个人主页正式上线！包含了我的基本信息、项目展示、博客文章等内容。"
                    }
                ]
            };
            
        default:
            return {};
    }
}

async function migrateData(db, dataType, data) {
    switch (dataType) {
        case 'donations':
            await migrateDonations(db, data);
            return `迁移了 ${data.length} 条捐赠记录`;
        case 'important-notice':
            await migrateImportantNotice(db, data);
            return '迁移了重要通知';
        case 'notices':
            await migrateNotices(db, data);
            return `迁移了 ${data.notices?.length || 0} 条通知`;
        case 'playlist':
            await migratePlaylist(db, data);
            return `迁移了 ${data.songs?.length || 0} 首音乐`;
        case 'projects':
            await migrateProjects(db, data);
            return `迁移了 ${data.projects?.length || 0} 个项目`;
        case 'timeline':
            await migrateTimeline(db, data);
            return `迁移了 ${data.milestones?.length || 0} 个时间线事件`;
        default:
            throw new Error(`未知的数据类型: ${dataType}`);
    }
}


async function migrateDonations(db, donations) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO donations (name, amount, date, platform, message)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const donation of donations) {
        await stmt.bind(
            donation.name,
            donation.amount,
            donation.date,
            donation.platform,
            donation.message
        ).run();
    }
}

async function migrateImportantNotice(db, notice) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO important_notices (id, active, title, content, expiry_date)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
        notice.id,
        notice.active,
        notice.title,
        notice.content,
        notice.expiryDate
    ).run();
}

async function migrateNotices(db, noticesData) {
    // 清空现有数据
    await db.prepare('DELETE FROM notices').run();
    
    const stmt = db.prepare(`
        INSERT INTO notices (title, icon, content)
        VALUES (?, ?, ?)
    `);
    
    for (const notice of noticesData.notices) {
        await stmt.bind(
            notice.title,
            notice.icon,
            JSON.stringify(notice.content)
        ).run();
    }
}

async function migratePlaylist(db, playlistData) {
    // 清空现有数据
    await db.prepare('DELETE FROM playlist').run();
    
    const stmt = db.prepare(`
        INSERT INTO playlist (title, artist, path, cover, yt_link, comment)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const song of playlistData.songs) {
        await stmt.bind(
            song.title,
            song.artist,
            song.path,
            song.cover,
            song.ytLink,
            song.comment
        ).run();
    }
}

async function migrateProjects(db, projectsData) {
    // 清空现有数据
    await db.prepare('DELETE FROM projects').run();
    
    const stmt = db.prepare(`
        INSERT INTO projects (id, title, image_url, github_url, description, type, actions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const project of projectsData.projects) {
        await stmt.bind(
            project.id,
            project.title,
            project.imageUrl || null,
            project.githubUrl || null,
            project.description || null,
            project.type || 'normal',
            project.actions ? JSON.stringify(project.actions) : null
        ).run();
    }
}

async function migrateTimeline(db, timelineData) {
    // 清空现有数据
    await db.prepare('DELETE FROM timeline').run();
    
    const stmt = db.prepare(`
        INSERT INTO timeline (date, title, description)
        VALUES (?, ?, ?)
    `);
    
    for (const milestone of timelineData.milestones) {
        await stmt.bind(
            milestone.date,
            milestone.title,
            milestone.description
        ).run();
    }
}