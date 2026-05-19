import type { APIRoute } from 'astro';
import { query } from '../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async ({ url }) => {
    try {
        const searchQuery = url.searchParams.get('q')?.trim() || '';
        
        let dbResult;
        
        if (!searchQuery) {
            // No query: Return the last 50 documents
            const queryText = `
                SELECT 
                    id, filename, doc_type, pos_number, doc_number, doc_date,
                    client_cta, client_name, client_cuit, total_amount, seller_code,
                    created_at
                FROM documentos_facturacion
                ORDER BY created_at DESC, doc_date DESC
                LIMIT 50;
            `;
            dbResult = await query(queryText, []);
        } else {
            // Intelligent full-text and field-based search
            const sqlQuery = `
                SELECT 
                    id, filename, doc_type, pos_number, doc_number, doc_date,
                    client_cta, client_name, client_cuit, total_amount, seller_code,
                    created_at,
                    ts_rank(fts_doc, websearch_to_tsquery('spanish', $1)) as rank
                FROM documentos_facturacion
                WHERE 
                    fts_doc @@ websearch_to_tsquery('spanish', $1)
                    OR doc_number ILIKE $2
                    OR client_name ILIKE $2
                    OR client_cuit ILIKE $2
                    OR client_cta ILIKE $2
                ORDER BY 
                    (CASE WHEN doc_number ILIKE $2 THEN 2.0 ELSE 0.0 END) + 
                    (CASE WHEN client_name ILIKE $2 THEN 1.5 ELSE 0.0 END) +
                    ts_rank(fts_doc, websearch_to_tsquery('spanish', $1)) DESC,
                    doc_date DESC
                LIMIT 50;
            `;
            
            const likeParam = `%${searchQuery}%`;
            dbResult = await query(sqlQuery, [searchQuery, likeParam]);
        }

        return new Response(JSON.stringify({
            status: 'success',
            count: dbResult.rows.length,
            results: dbResult.rows
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (err: any) {
        console.error('Error in documents search endpoint:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
