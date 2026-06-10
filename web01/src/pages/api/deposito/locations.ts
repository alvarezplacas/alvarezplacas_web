import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
    try {
        const response = await fetch('http://192.168.1.87:3050/api/stock/locations');
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error proxying locations:', error);
        return new Response(JSON.stringify({ success: false, error: 'Proxy error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
