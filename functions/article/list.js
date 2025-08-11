export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
export async function onRequestGet(context) {
    const { env } = context;
    try {
        if (!env.DB) {
            return new Response('D1 数据库绑定 (DB) 未找到。请检查 Pages 项目设置。', {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain',
                }
            });
        }
        const stmt = env.DB.prepare(
            'SELECT id, title, date, excerpt, thumbnail, contentUrl, tags, aiAssistants FROM articles ORDER BY date DESC'
        );
        const { results } = await stmt.all();
        if (results && results.length > 0) {
            const articles = results.map(article => {
                let parsedTags = [];
                try {
                    if (typeof article.tags === 'string' && article.tags.trim() !== '') {
                        const potentialTagsArray = JSON.parse(article.tags);
                        if (Array.isArray(potentialTagsArray)) {
                            parsedTags = potentialTagsArray;
                        } else if (typeof potentialTagsArray === 'string') {
                            parsedTags = [potentialTagsArray];
                        }
                    } else if (Array.isArray(article.tags)) {
                        parsedTags = article.tags;
                    }
                } catch (e) {
                    if (typeof article.tags === 'string' && article.tags.trim() !== '') {
                        console.warn(`将文章 ID "${article.id}" 的 tags "${article.tags}" 作为单项处理。`);
                        parsedTags = [article.tags];
                    } else {
                        console.warn(`无法解析或处理文章 ID "${article.id}" 的 tags: ${article.tags}`, e);
                    }
                }
                let parsedAiAssistants = [];
                try {
                    if (typeof article.aiAssistants === 'string' && article.aiAssistants.trim() !== '') {
                        const potentialAiArray = JSON.parse(article.aiAssistants);
                        if (Array.isArray(potentialAiArray)) {
                            parsedAiAssistants = potentialAiArray;
                        } else if (typeof potentialAiArray === 'string') {
                            parsedAiAssistants = [potentialAiArray];
                        }
                    } else if (Array.isArray(article.aiAssistants)) {
                        parsedAiAssistants = article.aiAssistants;
                    }
                } catch (e) {
                    if (typeof article.aiAssistants === 'string' && article.aiAssistants.trim() !== '') {
                        console.warn(`将文章 ID "${article.id}" 的 aiAssistants "${article.aiAssistants}" 作为单项处理。`);
                        parsedAiAssistants = [article.aiAssistants];
                    } else {
                        console.warn(`无法解析或处理文章 ID "${article.id}" 的 aiAssistants: ${article.aiAssistants}`, e);
                    }
                }
                return {
                    ...article,
                    tags: parsedTags,
                    aiAssistants: parsedAiAssistants
                };
            });
            return new Response(JSON.stringify(articles), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } else {
            return new Response(JSON.stringify([]), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
    } catch (e) {
        console.error('从 D1 获取文章时出错 (顶层捕获):', e.message, e.stack);
        return new Response(`获取文章时出错: ${e.message}`, {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
            }
        });
    }
}
export function onRequestHead(context) {
    return new Response(null, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        }
    });
}