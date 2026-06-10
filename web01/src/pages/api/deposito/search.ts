import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    try {
        const response = await fetch(`http://192.168.1.87:3050/api/stock/products?q=${encodeURIComponent(query || '')}`);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error proxying product search:', error);
        return new Response(JSON.stringify({ success: false, error: 'Proxy error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
