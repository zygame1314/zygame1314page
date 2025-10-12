import { requireAuth } from '../utils.js';
export function onRequestOptions(context) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
export async function onRequestGet(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) {
        return authResponse;
    }
    const { env } = context;
    try {
        const stmt = env.CODE_MANAGER_DB.prepare(
            `SELECT
                id,
                content_hash,
                report_type,
                comment,
                reporter_user_id,
                reported_at
             FROM reports
             ORDER BY reported_at DESC
             LIMIT 200`
        );
        const { results } = await stmt.all();
        return new Response(JSON.stringify({ success: true, data: results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("获取题目反馈失败:", error);
        return new Response(JSON.stringify({ success: false, error: '获取题目反馈失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
export async function onRequestDelete(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) {
        return authResponse;
    }
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
        return new Response(JSON.stringify({ success: false, error: '缺少ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    try {
        const stmt = env.CODE_MANAGER_DB.prepare('DELETE FROM reports WHERE id = ?');
        const result = await stmt.bind(id).run();
        if (result.success && result.meta.changes > 0) {
            return new Response(JSON.stringify({ success: true, message: '反馈已删除' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ success: false, error: '未找到要删除的反馈或删除失败' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error("删除题目反馈失败:", error);
        return new Response(JSON.stringify({ success: false, error: '删除题目反馈失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}