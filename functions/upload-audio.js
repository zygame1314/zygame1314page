import { verifyToken } from './utils';

export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            throw new Error('未提供授权令牌');
        }

        const userData = await verifyToken(token, env.JWT_SECRET);
        if (!userData) {
            throw new Error('无效或过期的令牌');
        }

        if (!env.R2_BUCKET) {
            throw new Error('未配置 R2 存储桶');
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            throw new Error('未找到有效的音频文件');
        }

        if (!file.type.startsWith('audio/')) {
            throw new Error('仅支持音频文件上传');
        }

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('音频文件大小不能超过20MB');
        }

        const timestamp = Date.now();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        const r2ObjectKey = `static/music/${timestamp}-${cleanFileName}`;

        const arrayBuffer = await file.arrayBuffer();

        await env.R2_BUCKET.put(r2ObjectKey, arrayBuffer, {
            httpMetadata: {
                contentType: file.type,
                cacheControl: 'public, max-age=31536000',
            },
        });

        const audioUrl = `https://bucket.zygame1314.site/${r2ObjectKey}`;
        const audioPath = `/${r2ObjectKey}`;

        return new Response(
            JSON.stringify({
                success: true,
                url: audioUrl,
                path: audioPath 
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    } catch (error) {
        console.error('上传音频错误:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || '上传失败'
            }),
            {
                status: error.message === '未提供授权令牌' || error.message === '无效或过期的令牌' ? 401 : 400,
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
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}