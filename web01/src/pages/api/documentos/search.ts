import type { APIRoute } from 'astro';
import { query } from '../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async ({ url }) => {
    try {
        const searchQuery = url.searchParams.get('q')?.trim() || '';
        const page = parseInt(url.searchParams.get('page') || '1') || 1;
        const limit = parseInt(url.searchParams.get('limit') || '10') || 10;
        const offset = (page - 1) * limit;
        const order = url.searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';
        const docType = url.searchParams.get('type')?.trim() || '';
        const typeParam = docType ? `${docType}-%` : '%';
        
        let dbResult;
        let totalCount = 0;
        
        if (!searchQuery) {
            // No query: Return the recent documents paginated
            const queryText = `
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
                    id, filename, doc_type, pos_number, doc_number, doc_date,
                    client_cta, client_name, client_cuit, total_amount, seller_code,
                    created_at,
                    substring(doc_text from '(?i)DTO\s*GENERAL\s*(\d+(?:[.,]\d+)?)\s*%') AS discount_pct,
                    count(*) OVER() AS full_count
                FROM RankedDocs
                WHERE doc_type ILIKE $3 AND rn = 1
                ORDER BY doc_date ${order}, created_at ${order}
                LIMIT $1 OFFSET $2;
            `;
            dbResult = await query(queryText, [limit, offset, typeParam]);
        } else {
            const likeParam = `%${searchQuery}%`;
            
            // Multi-layer search:
            // 1. Full-text search via plainto_tsquery (handles product names, brands, any words)
            // 2. Exact field matches (doc_number, client_name, client_cuit, client_cta)
            // Removed raw ILIKE on doc_text to prevent slow full table scans
            const sqlQuery = `
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
                    id, filename, doc_type, pos_number, doc_number, doc_date,
                    client_cta, client_name, client_cuit, total_amount, seller_code,
                    created_at,
                    substring(doc_text from '(?i)DTO\s*GENERAL\s*(\d+(?:[.,]\d+)?)\s*%') AS discount_pct,
                    count(*) OVER() AS full_count,
                    CASE
                        WHEN doc_number ILIKE $2 THEN 3.0
                        WHEN client_name ILIKE $2 THEN 2.5
                        WHEN client_cuit ILIKE $2 THEN 2.0
                        WHEN client_cta ILIKE $2 THEN 1.8
                        ELSE 0.5
                    END AS rank
                FROM RankedDocs
                WHERE 
                    rn = 1 AND
                    (doc_type ILIKE $5) AND
                    (doc_number ILIKE $2
                    OR client_name ILIKE $2
                    OR client_cuit ILIKE $2
                    OR client_cta ILIKE $2
                    OR (fts_doc IS NOT NULL AND fts_doc @@ plainto_tsquery('spanish', $1)))
                ORDER BY rank DESC, doc_date ${order}
                LIMIT $3 OFFSET $4;
            `;
            
            try {
                dbResult = await query(sqlQuery, [searchQuery, likeParam, limit, offset, typeParam]);
            } catch (ftsErr: any) {
                // Fallback: pure ILIKE search if FTS fails (e.g., special characters, numeric-only queries)
                console.warn('FTS search failed, falling back to ILIKE:', ftsErr.message);
                const fallbackQuery = `
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
                        id, filename, doc_type, pos_number, doc_number, doc_date,
                        client_cta, client_name, client_cuit, total_amount, seller_code,
                        created_at,
                        substring(doc_text from '(?i)DTO\s*GENERAL\s*(\d+(?:[.,]\d+)?)\s*%') AS discount_pct,
                        count(*) OVER() AS full_count
                    FROM RankedDocs
                    WHERE 
                        rn = 1 AND
                        (doc_type ILIKE $4) AND
                        (doc_number ILIKE $1
                        OR client_name ILIKE $1
                        OR client_cuit ILIKE $1
                        OR client_cta ILIKE $1)
                    ORDER BY doc_date ${order}
                    LIMIT $2 OFFSET $3;
                `;
                dbResult = await query(fallbackQuery, [likeParam, limit, offset, typeParam]);
            }
        }

        if (dbResult.rows.length > 0) {
            totalCount = parseInt(dbResult.rows[0].full_count) || dbResult.rows.length;
        }

        return new Response(JSON.stringify({
            status: 'success',
            count: totalCount,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalCount / limit),
            results: dbResult.rows.map((r: any) => {
                const { full_count, rank, ...cleanRow } = r;
                return cleanRow;
            })
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
