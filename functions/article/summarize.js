export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.SILICONFLOW_API_KEY) {
            throw new Error('未配置SILICONFLOW API密钥');
        }

        const { articleContent, title } = await request.json();

        if (!articleContent || !title) {
            throw new Error('缺少必要的文章内容或标题');
        }

        const truncatedContent = articleContent.length > 12000
            ? articleContent.substring(0, 12000) + '...'
            : articleContent;

        const responseStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('event: start\ndata: {"message": "开始生成摘要"}\n\n'));

                fetch(`https://api.siliconflow.cn/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${env.SILICONFLOW_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
                        messages: [
                            {
                                role: "user",
                                content: `作为一位专业的技术文章摘要专家，请为文章提供一个全面但简洁的总结（200-250字）。
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
                        ],
                        max_tokens: 2048,
                        temperature: 0.7,
                        top_p: 0.95,
                        stream: true
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`API调用失败: ${response.status}`);
                        }

                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        let buffer = '';

                        function processStream() {
                            return reader.read().then(({ done, value }) => {
                                if (done) {
                                    controller.enqueue(new TextEncoder().encode('event: end\ndata: {"message": "摘要生成完成"}\n\n'));
                                    controller.close();
                                    return;
                                }

                                buffer += decoder.decode(value, { stream: true });

                                const lines = buffer.split('\n');
                                buffer = lines.pop() || '';

                                for (const line of lines) {
                                    if (line.startsWith('data: ')) {
                                        try {
                                            const data = line.slice(6);
                                            if (data === '[DONE]') continue;

                                            const json = JSON.parse(data);
                                            const content = json.choices?.[0]?.delta?.content;

                                            if (content) {
                                                controller.enqueue(new TextEncoder().encode(`event: token\ndata: ${JSON.stringify({ content })}\n\n`));
                                            }
                                        } catch (e) {
                                            console.error('解析流数据出错:', e);
                                        }
                                    }
                                }

                                return processStream();
                            });
                        }

                        return processStream();
                    })
                    .catch(error => {
                        controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`));
                        controller.close();
                    });
            }
        });

        return new Response(responseStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}