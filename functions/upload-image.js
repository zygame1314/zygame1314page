import { verifyToken } from './utils';
export function onRequestOptions(context) {
  return new Response(null, { status: 204 });
}
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
        const uploadContext = formData.get('context') || 'general';
        if (!file || !(file instanceof File)) {
            throw new Error('未找到有效的图片文件');
        }
        if (!file.type.startsWith('image/')) {
            throw new Error('仅支持图片文件上传');
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('图片文件大小不能超过5MB');
        }
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const validContexts = ['music', 'projects', 'articles', 'notices', 'general'];
        const finalContext = validContexts.includes(uploadContext) ? uploadContext : 'general';
        const r2ObjectKey = `static/images/${finalContext}/${timestamp}-${randomString}.webp`;
        const arrayBuffer = await file.arrayBuffer();
        await env.R2_BUCKET.put(r2ObjectKey, arrayBuffer, {
            httpMetadata: {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000',
            },
        });
        const imageUrl = `https://bucket.zygame1314.site/${r2ObjectKey}`;
        return new Response(
            JSON.stringify({
                success: true,
                url: imageUrl
            }),
            {
                headers: {
                    'Content-Type': 'application/json'
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
                status: error.message === '未提供授权令牌' || error.message === '无效或过期的令牌' ? 401 : 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}
