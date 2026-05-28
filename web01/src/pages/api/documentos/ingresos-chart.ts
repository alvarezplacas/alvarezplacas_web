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
        const result = await query(`
            SELECT 
                DATE(doc_date) as fecha,
                SUM(CASE WHEN doc_type LIKE 'FA-%' THEN total_amount WHEN doc_type LIKE 'NC-%' THEN -total_amount ELSE 0 END) as ingresos
            FROM documentos_facturacion
            WHERE (doc_type LIKE 'FA-%' OR doc_type LIKE 'NC-%')
              AND doc_date >= date_trunc('month', CURRENT_DATE)
            GROUP BY DATE(doc_date)
            ORDER BY DATE(doc_date) ASC
        `, []);

        return new Response(JSON.stringify({
            success: true,
            data: result.rows
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e: any) {
        console.error("Error in ingresos-chart API:", e);
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
};
