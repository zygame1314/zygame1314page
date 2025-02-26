export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        if (!env.IMAGES_BUCKET) {
            throw new Error('未配置 R2 存储桶');
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            throw new Error('未找到有效的图片文件');
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('仅支持图片文件上传');
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `comments/${timestamp}-${randomString}.${fileExtension}`;

        const arrayBuffer = await file.arrayBuffer();

        await env.IMAGES_BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: {
                contentType: file.type,
            },
        });

        const imageUrl = `https://pub-d477e766898f476ab5049edca8c32627.r2.dev/${fileName}`;

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