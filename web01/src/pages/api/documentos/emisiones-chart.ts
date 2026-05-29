import type { APIRoute } from 'astro';
import { query } from '../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async ({ cookies }) => {
    // Verify Authentication
    const sellerSession = cookies.get('seller_session')?.value;
    const adminSession = cookies.get('admin_session')?.value;
    if (!sellerSession && !adminSession) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const result = await query(`
            WITH RankedDocs AS (
                SELECT 
                    *,
                    ROW_NUMBER() OVER(
                        PARTITION BY regexp_replace(doc_number, '_\\d+$', '') 
                        ORDER BY created_at DESC
                    ) as rn
                FROM documentos_facturacion
            )
            SELECT 
                DATE(doc_date) as fecha,
                SUM(CASE WHEN doc_type LIKE 'FA-%' THEN 1 ELSE 0 END) as facturas,
                SUM(CASE WHEN doc_type = 'RE' THEN 1 ELSE 0 END) as remitos
            FROM RankedDocs
            WHERE rn = 1 AND (doc_type LIKE 'FA-%' OR doc_type = 'RE')
              AND doc_date >= CURRENT_DATE - INTERVAL '60 days'
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
        console.error("Error in emisiones-chart API:", e);
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
};
