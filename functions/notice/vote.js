export async function onRequestPost(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    try {
        const request = context.request;
        const body = await request.json();

        if (!body.noticeId || !body.options || !Array.isArray(body.options)) {
            return new Response(JSON.stringify({
                error: "无效的请求数据"
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const kv = context.env.POLL_RESULTS;
        let currentResults = await kv.get(`results_${body.noticeId}`);

        if (!currentResults) {
            currentResults = "[]";
        }

        currentResults = JSON.parse(currentResults);

        for (const optionId of body.options) {
            const existingOption = currentResults.find(r => r.id === optionId);
            if (existingOption) {
                existingOption.count += 1;
            } else {
                currentResults.push({ id: optionId, count: 1 });
            }
        }

        await kv.put(`results_${body.noticeId}`, JSON.stringify(currentResults));

        const clientIP = request.headers.get("cf-connecting-ip");
        if (clientIP) {
            await kv.put(`voted_${body.noticeId}_${clientIP}`, "true", { expirationTtl: 60 * 60 * 24 * 30 });
        }

        currentResults.sort((a, b) => b.count - a.count);

        return new Response(JSON.stringify({
            success: true,
            results: currentResults
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "投票处理失败",
            details: error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}