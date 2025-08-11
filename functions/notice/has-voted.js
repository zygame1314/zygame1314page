export async function onRequestGet(context) {
    const corsHeaders = {
        "Content-Type": "application/json"
    };

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

        const clientIP = context.request.headers.get("cf-connecting-ip");
        if (!clientIP) {
            return new Response(JSON.stringify({
                hasVoted: false
            }), {
                headers: corsHeaders
            });
        }

        const kv = context.env.POLL_RESULTS;
        const hasVoted = await kv.get(`voted_${noticeId}_${clientIP}`);

        return new Response(JSON.stringify({
            hasVoted: !!hasVoted
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "检查投票状态失败",
            details: error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
