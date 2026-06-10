import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        
        const response = await fetch('http://192.168.1.87:3050/api/stock/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error proxying stock save:', error);
        return new Response(JSON.stringify({ success: false, error: 'Proxy error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
