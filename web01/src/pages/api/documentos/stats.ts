import type { APIRoute } from 'astro';
import { query } from '../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async ({ url, cookies }) => {
    // Verify Authentication
    const sellerSession = cookies.get('seller_session')?.value;
    const adminSession = cookies.get('admin_session')?.value;
    if (!sellerSession && !adminSession) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const fecha = url.searchParams.get('fecha')?.trim() || new Date().toISOString().split('T')[0];
        
        const statsResult = await query(`
            SELECT COUNT(*) as count, SUM(total_amount) as total
            FROM documentos_facturacion
            WHERE doc_type LIKE 'FA-%'
              AND DATE(doc_date) = $1
        `, [fecha]);

        let count = 0;
        let total = 0;

        if (statsResult.rows.length > 0) {
            count = parseInt(statsResult.rows[0].count) || 0;
            total = parseFloat(statsResult.rows[0].total) || 0;
        }

        return new Response(JSON.stringify({
            success: true,
            count,
            total
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e: any) {
        console.error("Error in invoice stats API:", e);
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
};
