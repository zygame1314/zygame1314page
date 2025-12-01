import { requireAuth } from '../utils.js';
export function onRequestOptions() {
    return new Response(null, { status: 204 });
}
export async function onRequest(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) {
        return authResponse;
    }
    const { request, env } = context;
    const url = new URL(request.url);
    const DB = env.CODE_MANAGER_DB;
    try {
        if (request.method === 'GET') {
            const searchTerm = url.searchParams.get('search_term');
            const limit = url.searchParams.get('limit');
            return await handleGetRecords(DB, searchTerm, limit);
        } else if (request.method === 'POST') {
            const { action, payload } = await request.json();
            switch (action) {
                case 'INSERT_CODES':
                    return await handleInsertCodes(DB, payload.codes);
                case 'BAN_USER':
                    return await handleBanUser(DB, payload.userId, payload.reason);
                case 'UNBAN_USER':
                    return await handleUnbanUser(DB, payload.userId);
                default:
                    return new Response(JSON.stringify({ error: '无效的操作' }), { status: 400 });
            }
        } else if (request.method === 'DELETE') {
            const { codes } = await request.json();
            return await handleDeleteCodes(DB, codes);
        }
        return new Response(JSON.stringify({ error: '不支持的请求方法' }), { status: 405 });
    } catch (error) {
        console.error('d1-manager error:', error);
        return new Response(JSON.stringify({ error: '服务器内部错误: ' + error.message }), { status: 500 });
    }
}
async function handleGetRecords(DB, searchTerm, limit) {
    let baseSql = `
        SELECT a.code, a.duration_days, a.is_used, a.used_by_user_id, a.note, a.created_at, 
               u.total_queries, u.daily_queries, u.last_query_date, u.expires_at, u.realname, u.school_info,
               b.platform_user_id IS NOT NULL AS is_banned, b.reason AS ban_reason 
        FROM activations AS a 
        LEFT JOIN users AS u ON a.used_by_user_id = u.platform_user_id 
        LEFT JOIN blacklist AS b ON a.used_by_user_id = b.platform_user_id
    `;
    const params = [];
    if (searchTerm) {
        baseSql = `
            SELECT a.code, a.duration_days, a.is_used, a.used_by_user_id, a.note, a.created_at, 
                   u.total_queries, u.daily_queries, u.last_query_date, u.expires_at, u.realname, u.school_info,
                   b.platform_user_id IS NOT NULL AS is_banned, b.reason AS ban_reason 
            FROM activations_fts AS fts
            JOIN activations AS a ON fts.code = a.code
            LEFT JOIN users AS u ON a.used_by_user_id = u.platform_user_id 
            LEFT JOIN blacklist AS b ON a.used_by_user_id = b.platform_user_id
            WHERE fts MATCH ?
        `;
        params.push(`"${searchTerm}"`);
    } else {
        baseSql += " ORDER BY a.created_at DESC";
    }
    if (limit && !searchTerm) {
        baseSql += ` LIMIT ?`;
        params.push(parseInt(limit, 10));
    }
    const stmt = DB.prepare(baseSql).bind(...params);
    const { results } = await stmt.all();
    return new Response(JSON.stringify({ success: true, data: results }), { status: 200 });
}
async function handleInsertCodes(DB, codesToInsert) {
    if (!codesToInsert || codesToInsert.length === 0) {
        return new Response(JSON.stringify({ success: true, message: '没有要插入的激活码' }), { status: 200 });
    }
    const stmts = codesToInsert.map(codeInfo =>
        DB.prepare("INSERT INTO activations (code, note, duration_days) VALUES (?, ?, ?)")
            .bind(codeInfo.code, codeInfo.note, codeInfo.days)
    );
    const results = await DB.batch(stmts);
    return new Response(JSON.stringify({ success: true, results }), { status: 201 });
}
async function handleDeleteCodes(DB, codesToDelete) {
    if (!codesToDelete || codesToDelete.length === 0) {
        return new Response(JSON.stringify({ success: true, message: '没有要删除的激活码' }), { status: 200 });
    }
    const placeholders = codesToDelete.map(() => '?').join(',');
    const stmt = DB.prepare(`DELETE FROM activations WHERE code IN (${placeholders})`).bind(...codesToDelete);
    const result = await stmt.run();
    return new Response(JSON.stringify({ success: true, ...result.meta }), { status: 200 });
}
async function handleBanUser(DB, userId, reason) {
    const banStmt = DB.prepare("INSERT OR REPLACE INTO blacklist (platform_user_id, reason, banned_at) VALUES (?, ?, ?)")
        .bind(userId, reason, Math.floor(Date.now() / 1000));
    const deleteUserStmt = DB.prepare("DELETE FROM users WHERE platform_user_id = ?").bind(userId);
    const results = await DB.batch([banStmt, deleteUserStmt]);
    return new Response(JSON.stringify({ success: true, results }), { status: 200 });
}
async function handleUnbanUser(DB, userId) {
    const stmt = DB.prepare("DELETE FROM blacklist WHERE platform_user_id = ?").bind(userId);
    const result = await stmt.run();
    return new Response(JSON.stringify({ success: true, ...result.meta }), { status: 200 });
}