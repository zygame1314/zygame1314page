export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.R2_BUCKET) {
            throw new Error('未配置 R2 存储桶');
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const site = formData.get('site');

        if (!file || !(file instanceof File)) {
            throw new Error('未找到有效的图片文件');
        }

        if (!site || typeof site !== 'string') {
            throw new Error('未提供有效的网站标识 (site)');
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('仅支持图片文件上传');
        }

        if (file.type !== 'image/webp') {
            throw new Error('上传的图片必须是WebP格式');
        }

        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `comments/${site}/${timestamp}-${randomString}.webp`;

        const arrayBuffer = await file.arrayBuffer();

        await env.R2_BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: {
                contentType: 'image/webp',
            },
        });

        const imageUrl = `https://bucket.zygame1314.top/static/${fileName}`;

        return new Response(
            JSON.stringify({
                success: true,
                url: imageUrl
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    } catch (error) {
        console.error('上传图片错误:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || '上传失败'
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}