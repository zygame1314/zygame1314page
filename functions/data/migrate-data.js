// 数据迁移函数 - 将JSON数据导入到D1数据库
export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const { dataType, data } = await request.json();
        
        switch (dataType) {
            case 'donations':
                await migrateDonations(env.DB, data);
                break;
            case 'important-notice':
                await migrateImportantNotice(env.DB, data);
                break;
            case 'notices':
                await migrateNotices(env.DB, data);
                break;
            case 'playlist':
                await migratePlaylist(env.DB, data);
                break;
            case 'projects':
                await migrateProjects(env.DB, data);
                break;
            case 'timeline':
                await migrateTimeline(env.DB, data);
                break;
            default:
                throw new Error(`未知的数据类型: ${dataType}`);
        }

        return new Response(JSON.stringify({
            success: true,
            message: `${dataType} 数据迁移成功`
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
    await db.exec('DELETE FROM notices');
    
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
    await db.exec('DELETE FROM playlist');
    
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
    await db.exec('DELETE FROM projects');
    
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
    await db.exec('DELETE FROM timeline');
    
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