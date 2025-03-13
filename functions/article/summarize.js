export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        const clientIP = request.headers.get('cf-connecting-ip') ||
            request.headers.get('x-forwarded-for') ||
            'unknown';

        const lastRequestTimeHeader = request.headers.get(`x-last-request-time-${clientIP}`);
        const currentTime = Date.now();

        if (lastRequestTimeHeader) {
            const timeDiff = currentTime - parseInt(lastRequestTimeHeader);
            if (timeDiff < 60000) {
                const remainingSeconds = Math.ceil((60000 - timeDiff) / 1000);
                throw new Error(`请求过于频繁，请等待${remainingSeconds}秒后再试`);
            }
        }

        if (!env.GEMINI_API_KEY) {
            throw new Error('未配置API密钥');
        }

        const { articleContent, title } = await request.json();

        if (!articleContent || !title) {
            throw new Error('缺少必要的文章内容或标题');
        }

        const truncatedContent = articleContent.length > 12000
            ? articleContent.substring(0, 12000) + '...'
            : articleContent;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': env.GEMINI_API_KEY,
                'x-forwarded-for': '104.28.193.196',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `作为一位专业的技术文章摘要专家，请为文章提供一个全面但简洁的总结（200-250字）。
                                    总结应该：
                                    1. 抓住文章的核心问题和解决方案
                                    2. 提炼出关键技术要点和实操步骤
                                    3. 突出最有价值的信息
                                    4. 使用技术准确但通俗易懂的语言
                                    5. 适当使用Markdown标记关键术语（如**关键词**）
                                    
                                    请直接给出总结内容，不要包含任何引导语如"以下是总结"等。
                                    
                                    文章标题: ${title}
                                    文章内容: 
                                    ${truncatedContent}`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 400,
                    temperature: 0.7,
                    topP: 0.95
                }
            })
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorText;

            try {
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorText = JSON.stringify(errorData);
                } else {
                    errorText = await response.text();
                }
            } catch (e) {
                errorText = `状态码: ${response.status}`;
            }

            throw new Error(`API调用失败: ${errorText}`);
        }

        const result = await response.json();
        const summary = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!summary || summary.length < 50) {
            throw new Error('未能获取到有效的文章总结');
        }

        return new Response(JSON.stringify({
            success: true,
            summary
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=1800',
                [`x-last-request-time-${clientIP}`]: currentTime.toString()
            }
        });
    } catch (error) {
        const status = error.message.includes('请求过于频繁') ? 429 : 500;

        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Retry-After': '60'
            }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}