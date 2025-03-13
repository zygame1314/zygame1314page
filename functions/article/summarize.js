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
        const encoder = new TextEncoder();

        const fetchPromise = fetch('https://ai-zygame1314models044002979816.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': env.AZURE_API_KEY
            },
            body: JSON.stringify({
                model: "DeepSeek-R1",
                stream: true,
                max_tokens: 2048,
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
            })
        });

        const initialChunk = JSON.stringify({
            success: true,
            streaming: true,
            summary: ""
        });
        await writer.write(encoder.encode(initialChunk + '\n'));

        fetchPromise.then(async response => {
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

                const errorObj = {
                    success: false,
                    error: `API调用失败: ${errorText}`
                };
                await writer.write(encoder.encode(JSON.stringify(errorObj)));
                await writer.close();
                return;
            }

            if (!response.body) {
                const errorObj = {
                    success: false,
                    error: "API返回的响应没有正文"
                };
                await writer.write(encoder.encode(JSON.stringify(errorObj)));
                await writer.close();
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedSummary = "";

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            const data = line.substring(5).trim();

                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices[0]?.delta?.content || '';
                                if (content) {
                                    accumulatedSummary += content;

                                    const updateChunk = JSON.stringify({
                                        success: true,
                                        streaming: true,
                                        content: content,
                                        summary: accumulatedSummary
                                    });
                                    await writer.write(encoder.encode(updateChunk + '\n'));
                                }
                            } catch (e) {
                                console.error('解析流式数据出错:', e);
                            }
                        }
                    }
                }

                const finalChunk = JSON.stringify({
                    success: true,
                    streaming: false,
                    summary: accumulatedSummary
                });
                await writer.write(encoder.encode(finalChunk));
            } catch (error) {
                console.error('处理流式数据时出错:', error);
                const errorObj = {
                    success: false,
                    error: error.message || '处理流式响应时发生错误'
                };
                await writer.write(encoder.encode(JSON.stringify(errorObj)));
            } finally {
                await writer.close();
            }
        }).catch(async error => {
            console.error('流处理错误:', error);
            const errorObj = {
                success: false,
                error: error.message || '处理流式响应时发生错误'
            };
            await writer.write(encoder.encode(JSON.stringify(errorObj)));
            await writer.close();
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
                'X-Content-Type-Options': 'nosniff',
                'Transfer-Encoding': 'chunked'
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