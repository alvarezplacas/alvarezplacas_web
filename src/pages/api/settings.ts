import type { APIRoute } from 'astro';
import { query } from '../../lib/db.js';

const ENSURE_TABLE = `
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

export const GET: APIRoute = async () => {
    try {
        await query(ENSURE_TABLE);
        const result = await query('SELECT key, value FROM site_settings');
        const settings = (result.rows as any[]).reduce((acc: Record<string, string>, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, string>);
        
        return new Response(JSON.stringify(settings), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('API Settings GET Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        await query(ENSURE_TABLE);
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
        console.error('API Settings POST Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500 });
    }
}
