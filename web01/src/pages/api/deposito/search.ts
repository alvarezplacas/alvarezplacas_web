import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';

    try {
        // Asumiendo que sku o linea puede actuar como "brand" si no hay JOIN a marcas
        const sql = `
            SELECT id, nombre AS name, sku AS brand, foto_principal AS "fotoPrincipal"
            FROM "Productos" 
            WHERE (nombre ILIKE $1 OR sku ILIKE $1) AND ("Estado" IS NULL OR "Estado" <> 'Revision')
            LIMIT 20
        `;
        const result = await query(sql, [`%${q}%`]);
        
        return new Response(JSON.stringify({ success: true, products: result.rows }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return new Response(JSON.stringify({ success: false, error: 'Database error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
