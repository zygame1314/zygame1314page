export async function onRequestGet(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
    };

    if (context.request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const url = new URL(context.request.url);
        const noticeId = url.searchParams.get("id");

        if (!noticeId) {
            return new Response(JSON.stringify({
                error: "缺少通知ID参数"
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const kv = context.env.POLL_RESULTS;
        let results = await kv.get(`results_${noticeId}`);

        if (!results) {
            results = "[]";
        }

        return new Response(JSON.stringify({
            success: true,
            results: JSON.parse(results)
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "获取投票结果失败",
            details: error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}