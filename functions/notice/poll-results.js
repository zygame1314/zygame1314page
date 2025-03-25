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

        const kv = context.env.POLL_RESULTS;
        let results = await kv.get(`results_${noticeId}`);

        if (!results) {
            results = "[]";
        }

        return new Response(JSON.stringify({
            success: true,
            results: JSON.parse(results)
        }), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=60"
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "获取投票结果失败",
            details: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}