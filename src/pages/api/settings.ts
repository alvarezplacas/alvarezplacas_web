import type { APIRoute } from 'astro';
import { query } from '../../lib/db.js';

export const GET: APIRoute = async () => {
    try {
        const result = await query('SELECT key, value FROM site_settings');
        const settings = result.rows.reduce((acc: Record<string, string>, row: { key: string, value: string }) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
        
        return new Response(JSON.stringify(settings), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const { key, value } = await request.json();
        
        if (!key) {
            return new Response(JSON.stringify({ error: 'Key is required' }), { status: 400 });
        }

        // Upsert logic for PostgreSQL
        await query(
            'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [key, value]
        );
        
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500 });
    }
}
