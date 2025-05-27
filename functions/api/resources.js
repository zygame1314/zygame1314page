// R2资源管理API - 用于获取音乐和其他媒体资源
export async function onRequestGet(context) {
    const { env, request } = context;
    
    try {
        const url = new URL(request.url);
        const resourcePath = url.searchParams.get('path');
        
        if (!resourcePath) {
            return new Response(JSON.stringify({
                error: '缺少资源路径参数'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 从R2存储桶获取资源
        const object = await env.R2_BUCKET.get(resourcePath);
        
        if (!object) {
            return new Response(JSON.stringify({
                error: '资源不存在'
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 获取文件的MIME类型
        const contentType = getContentType(resourcePath);
        
        return new Response(object.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000', // 缓存1年
                'ETag': object.etag,
                'Last-Modified': object.uploaded.toUTCString()
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
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

// 上传资源到R2
export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const path = formData.get('path');
        
        if (!file || !path) {
            return new Response(JSON.stringify({
                error: '缺少文件或路径参数'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 上传文件到R2
        await env.R2_BUCKET.put(path, file.stream(), {
            httpMetadata: {
                contentType: file.type || getContentType(path)
            }
        });

        return new Response(JSON.stringify({
            success: true,
            path: path,
            url: `/api/resources?path=${encodeURIComponent(path)}`
        }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
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

// 删除R2资源
export async function onRequestDelete(context) {
    const { env, request } = context;
    
    try {
        const url = new URL(request.url);
        const resourcePath = url.searchParams.get('path');
        
        if (!resourcePath) {
            return new Response(JSON.stringify({
                error: '缺少资源路径参数'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        await env.R2_BUCKET.delete(resourcePath);

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
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

// 根据文件扩展名获取MIME类型
function getContentType(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const mimeTypes = {
        'webm': 'video/webm',
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'json': 'application/json',
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
}