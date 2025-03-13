export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.AZURE_API_KEY) {
            throw new Error('未配置Azure API密钥');
        }

        const { articleContent, title } = await request.json();

        if (!articleContent || !title) {
            throw new Error('缺少必要的文章内容或标题');
        }

        const truncatedContent = articleContent.length > 12000
            ? articleContent.substring(0, 12000) + '...'
            : articleContent;

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        const response = new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

        (async () => {
            try {
                const apiResponse = await fetch('https://ai-zygame1314models044002979816.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': env.AZURE_API_KEY
                    },
                    body: JSON.stringify({
                        model: "DeepSeek-R1",
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
                        stream: true
                    })
                });

                if (!apiResponse.ok) {
                    const error = await apiResponse.text();
                    throw new Error(`API调用失败: ${error}`);
                }

                const reader = apiResponse.body.getReader();
                const decoder = new TextDecoder();
                let fullSummary = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.substring(6));
                                const content = data.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    fullSummary += content;
                                    // 发送数据块到客户端
                                    const message = `data: ${JSON.stringify({ content })}\n\n`;
                                    await writer.write(new TextEncoder().encode(message));
                                }
                            } catch (e) {
                                console.error('解析数据错误:', e);
                            }
                        }
                    }
                }

                if (fullSummary.length < 50) {
                    throw new Error('未能获取到有效的文章总结');
                }

                await writer.write(new TextEncoder().encode(`data: [DONE]\n\n`));
            } catch (error) {
                console.error('生成文章总结错误:', error);
                const errorMessage = `data: ${JSON.stringify({
                    error: error.message || '生成总结失败'
                })}\n\n`;
                await writer.write(new TextEncoder().encode(errorMessage));
            } finally {
                await writer.close();
            }
        })();

        return response;
    } catch (error) {
        console.error('请求处理错误:', error);
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