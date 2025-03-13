export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.GORK_API_KEY) {
            throw new Error('未配置Gork API密钥');
        }

        const { articleContent, title } = await request.json();

        if (!articleContent || !title) {
            throw new Error('缺少必要的文章内容或标题');
        }

        const truncatedContent = articleContent.length > 12000
            ? articleContent.substring(0, 12000) + '...'
            : articleContent;

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.GORK_API_KEY}`
            },
            body: JSON.stringify({
                model: "grok-2-1212",
                messages: [
                    {
                        role: "system",
                        content: `作为一位专业的技术文章摘要专家，请为文章提供一个全面但简洁的总结（200-250字）。
                        总结应该：
                        1. 抓住文章的核心问题和解决方案
                        2. 提炼出关键技术要点和实操步骤
                        3. 突出最有价值的信息
                        4. 使用技术准确但通俗易懂的语言
                        5. 适当使用Markdown标记关键术语（如**关键词**）
                        
                        请直接给出总结内容，不要包含任何引导语如"以下是总结"等。`
                    },
                    {
                        role: "user",
                        content: `请为以下文章提供总结：
                        
                        文章标题: ${title}
                        文章内容: 
                        ${truncatedContent}`
                    }
                ],
                max_tokens: 400,
                temperature: 0.4,
                top_p: 0.95
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
        const summary = result.choices[0]?.message?.content?.trim();

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
                'Cache-Control': 'public, max-age=1800'
            }
        });
    } catch (error) {
        console.error('生成文章总结错误:', error);

        return new Response(JSON.stringify({
            success: false,
            error: error.message || '生成总结失败'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
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