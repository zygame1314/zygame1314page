import { requireAuth } from '../utils.js';
async function md5(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
async function fetchAfdianSponsors(env) {
    const user_id = env.AFDIAN_USER_ID;
    const token = env.AFDIAN_TOKEN;
    if (!user_id || !token) {
        console.log("Afdian USER_ID or TOKEN not set in environment variables, skipping Afdian fetch.");
        return [];
    }
    let allSponsors = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const ts = Math.floor(Date.now() / 1000);
        const params = JSON.stringify({ page });
        const signStr = `${token}params${params}ts${ts}user_id${user_id}`;
        const sign = await md5(signStr);
        const body = { user_id, params, ts, sign };
        try {
            const response = await fetch('https://afdian.com/api/open/query-sponsor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                console.error(`Afdian API request failed with status ${response.status}: ${await response.text()}`);
                break;
            }
            const result = await response.json();
            if (result.ec !== 200) {
                console.error("Afdian API Error:", result.em, result.data);
                break;
            }
            const data = result.data;
            if (data.list && data.list.length > 0) {
                allSponsors = allSponsors.concat(data.list);
            }
            if (page >= data.total_page || data.list.length === 0) {
                hasMore = false;
            } else {
                page++;
            }
        } catch (error) {
            console.error("Failed to fetch from Afdian:", error);
            hasMore = false;
        }
    }
    return allSponsors;
}
export function onRequestOptions() {
    return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    const { env, request } = context;
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;
        const platformFilter = url.searchParams.get('platform');
        let dbDonations = [];
        let afdianDonations = [];
        if (!platformFilter) {
            const dbQuery = `SELECT id, name, amount, date, platform, message, NULL as avatar FROM donations`;
            const { results } = await env.DB.prepare(dbQuery).all();
            dbDonations = results || [];
            afdianDonations = await fetchAfdianSponsors(env);
        } else if (platformFilter === 'afdian') {
            afdianDonations = await fetchAfdianSponsors(env);
        } else {
            const dbQuery = `SELECT id, name, amount, date, platform, message, NULL as avatar FROM donations WHERE platform = ?`;
            const { results } = await env.DB.prepare(dbQuery).bind(platformFilter).all();
            dbDonations = results || [];
        }
        const transformedAfdian = afdianDonations
            .filter(sponsor => sponsor.user && parseFloat(sponsor.all_sum_amount) >= 5)
            .map(sponsor => ({
                id: `afdian-${sponsor.user.user_id}-${sponsor.last_pay_time}`,
                name: sponsor.user.name,
                amount: parseFloat(sponsor.all_sum_amount),
                date: new Date(sponsor.last_pay_time * 1000).toISOString(),
                platform: 'afdian',
                message: '',
                avatar: sponsor.user.avatar
            }));
        const combinedDonations = [...dbDonations, ...transformedAfdian];
        combinedDonations.sort((a, b) => new Date(b.date) - new Date(a.date));
        const total = combinedDonations.length;
        const paginatedData = combinedDonations.slice(offset, offset + limit);
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        return new Response(JSON.stringify({
            data: paginatedData,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext,
                hasPrev
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
export async function onRequestPost(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    try {
        const { name, amount, date, platform, message } = await request.json();
        const { meta } = await env.DB.prepare(`
            INSERT INTO donations (name, amount, date, platform, message)
            VALUES (?, ?, ?, ?, ?)
        `).bind(name, amount, date, platform, message).run();
        return new Response(JSON.stringify({
            success: true,
            id: meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
export async function onRequestPut(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    try {
        const { id, name, amount, date, platform, message } = await request.json();
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required for updating' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const { meta } = await env.DB.prepare(`
            UPDATE donations
            SET name = ?, amount = ?, date = ?, platform = ?, message = ?
            WHERE id = ?
        `).bind(name, amount, date, platform, message, id).run();
        if (meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Donation not found or no changes made' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
export async function onRequestDelete(context) {
    const authResponse = await requireAuth(context);
    if (authResponse) return authResponse;
    const { env, request } = context;
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) {
            throw new Error('缺少捐献记录ID');
        }
        const { meta } = await env.DB.prepare(`
            DELETE FROM donations WHERE id = ?
        `).bind(id).run();
        if (meta.changes === 0) {
            throw new Error('未找到要删除的记录');
        }
        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}