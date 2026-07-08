import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const GET: APIRoute = async () => {
    try {
        const result = await query('SELECT id, name, type_code AS "typeCode", active FROM deposito_ubicaciones WHERE active = true ORDER BY name ASC');
        return new Response(JSON.stringify({ success: true, locations: result.rows }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return new Response(JSON.stringify({ success: false, error: 'Database error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
