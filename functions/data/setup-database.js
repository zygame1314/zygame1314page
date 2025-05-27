// 设置D1数据库表结构
export async function onRequestPost(context) {
    const { env } = context;
    
    try {
        // 创建捐赠表
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                platform TEXT NOT NULL,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建重要通知表
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS important_notices (
                id TEXT PRIMARY KEY,
                active BOOLEAN NOT NULL DEFAULT FALSE,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                expiry_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建普通通知表
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS notices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                icon TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建播放列表表
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS playlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                path TEXT NOT NULL,
                cover TEXT NOT NULL,
                yt_link TEXT,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建项目表
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                image_url TEXT,
                github_url TEXT,
                description TEXT,
                type TEXT DEFAULT 'normal',
                actions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // 创建时间线表
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS timeline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        return new Response(JSON.stringify({
            success: true,
            message: "数据库表创建成功"
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