export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const noticeId = url.searchParams.get("id");

        if (!noticeId) {
            return new Response(JSON.stringify({
                error: "缺少通知ID参数"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const clientIP = context.request.headers.get("cf-connecting-ip");
        if (!clientIP) {
            return new Response(JSON.stringify({
                hasVoted: false
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        const kv = context.env.POLL_RESULTS;
        const hasVoted = await kv.get(`voted_${noticeId}_${clientIP}`);

        return new Response(JSON.stringify({
            hasVoted: !!hasVoted
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "检查投票状态失败",
            details: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}