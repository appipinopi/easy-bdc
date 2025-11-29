export default {

    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // CORSプロキシエンドポイント
        if (url.pathname.startsWith('/proxy/')) {
            const targetUrl = url.pathname.replace('/proxy/', '');
            const decodedUrl = decodeURIComponent(targetUrl);
            
            try {
                const proxyResponse = await fetch(decodedUrl, {
                    method: request.method,
                    headers: {
                        'User-Agent': 'EDBP-Plugin-Manager/1.0',
                    },
                });
                
                const data = await proxyResponse.arrayBuffer();
                
                return new Response(data, {
                    status: proxyResponse.status,
                    headers: {
                        'Content-Type': proxyResponse.headers.get('Content-Type') || 'application/octet-stream',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        }

        const responseText = `Hello from Cloudflare Worker!
        Request Method: ${request.method}
        Request URL: ${url.pathname}`;

        return new Response(responseText, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        });
    },
};

interface Env {
}
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
}
