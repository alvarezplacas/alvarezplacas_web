import type { APIRoute } from 'astro';
import fs from 'fs';
import { query } from '../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async ({ url }) => {
    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing document ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch filepath and filename from database
        const dbResult = await query(
            'SELECT filename, filepath FROM documentos_facturacion WHERE id = $1',
            [id]
        );

        if (dbResult.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Document not found in database' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { filename, filepath } = dbResult.rows[0];

        // Verify if file exists on disk
        if (!fs.existsSync(filepath)) {
            return new Response(JSON.stringify({ error: 'Physical PDF file not found on server storage' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Read and stream file
        const fileBuffer = fs.readFileSync(filepath);

        return new Response(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000'
            }
        });

    } catch (err: any) {
        console.error('Error in document download endpoint:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
