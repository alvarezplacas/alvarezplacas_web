import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { query } from '../../../../Backend/conexiones/lib/db.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const API_KEY = 'alvarez-document-sync-2026';
const UPLOAD_DIR = '/app/private/facturas';

// Helper to format Spanish dates (DD/MM/YY or DD/MM/YYYY) to standard SQL YYYY-MM-DD
function parseSpanishDate(dateStr: string): string {
    try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            let day = parts[0].padStart(2, '0');
            let month = parts[1].padStart(2, '0');
            let year = parts[2].trim();
            if (year.length === 2) {
                year = '20' + year;
            }
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.error('Error parsing date:', dateStr, e);
    }
    return new Date().toISOString().split('T')[0];
}

// Helper to convert Argentinian decimal notation (e.g. 305.700,00) to standard float
function parseArgentineAmount(amountStr: string): number {
    try {
        // Remove periods (thousands separator) and replace comma with dot (decimal separator)
        const normalized = amountStr.replace(/\./g, '').replace(/,/g, '.').trim();
        const value = parseFloat(normalized);
        return isNaN(value) ? 0 : value;
    } catch (e) {
        return 0;
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        // 1. Authentication Check
        const apiKeyHeader = request.headers.get('X-API-Key');
        if (apiKeyHeader !== API_KEY) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Parse Multipart Form Data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const filename = formData.get('filename') as string;

        if (!file || !filename) {
            return new Response(JSON.stringify({ error: 'Missing file or filename' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Ensure Storage Dir Exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        // 4. Save file to disk
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const filepath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filepath, uint8);

        // 5. Parse PDF Text Content
        const instance = new pdf.PDFParse(uint8);
        const parseResult = await instance.getText();
        const textContent = parseResult.text || '';

        // 6. Regex Metadata Extraction
        // Parse doc number details from filename (e.g. FA-B-1901-00010451.pdf)
        let docType = 'X';
        let posNumber = '0000';
        let docNumber = '00000000';
        const nameParts = filename.match(/^([A-Z0-9-]+)-([0-9]+)-([0-9]+)/i);
        if (nameParts) {
            docType = nameParts[1].toUpperCase();
            posNumber = nameParts[2];
            docNumber = nameParts[3];
        }

        // Extract Date: e.g. FECHA: 03/01/26
        let docDate = new Date().toISOString().split('T')[0];
        const dateMatch = textContent.match(/FECHA:\s*([0-9\/]+)/i);
        if (dateMatch) {
            docDate = parseSpanishDate(dateMatch[1]);
        }

        // Extract Customer Account and Name: e.g. Señor/es: Cta Nº:	GUILLERMO PAREDES 11616
        let clientCta = '00000';
        let clientName = 'Consumidor Final';
        const clientMatch = textContent.match(/Señor\/es:\s*Cta\s*Nº:\s*([^\n]+)/i);
        if (clientMatch) {
            const rawClient = clientMatch[1].trim();
            // Try to split name and account code (usually the last word or code)
            const parts = rawClient.split(/\s+/);
            if (parts.length > 1) {
                const possibleCta = parts[parts.length - 1];
                if (/^\d+$/.test(possibleCta)) {
                    clientCta = possibleCta;
                    clientName = parts.slice(0, -1).join(' ').trim();
                } else {
                    clientName = rawClient;
                }
            } else {
                clientName = rawClient;
            }
        }

        // Extract CUIT/DNI: e.g. C.U.I.T:	CONSUMIDOR FINAL DNI 39097797
        let clientCuit = '';
        const cuitMatch = textContent.match(/C\.U\.I\.T:\s*([^\n]+)/i);
        if (cuitMatch) {
            clientCuit = cuitMatch[1].trim();
        }

        // Extract Total Amount: e.g. TOTAL $ 305.700,00
        let totalAmount = 0;
        const totalMatch = textContent.match(/TOTAL\s*\$\s*([\d\.,]+)/i);
        if (totalMatch) {
            totalAmount = parseArgentineAmount(totalMatch[1]);
        }

        // Extract Seller Code: e.g. VENDEDOR 30005
        let sellerCode = '';
        const sellerMatch = textContent.match(/VENDEDOR\s*(\d+)/i);
        if (sellerMatch) {
            sellerCode = sellerMatch[1];
        }

        // 7. Insert to PostgreSQL Database
        const queryText = `
            INSERT INTO documentos_facturacion (
                filename, filepath, doc_type, pos_number, doc_number, doc_date,
                client_cta, client_name, client_cuit, total_amount, seller_code,
                doc_text, fts_doc
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, to_tsvector('spanish', $12))
            ON CONFLICT (filename) DO UPDATE SET
                filepath = EXCLUDED.filepath,
                doc_type = EXCLUDED.doc_type,
                pos_number = EXCLUDED.pos_number,
                doc_number = EXCLUDED.doc_number,
                doc_date = EXCLUDED.doc_date,
                client_cta = EXCLUDED.client_cta,
                client_name = EXCLUDED.client_name,
                client_cuit = EXCLUDED.client_cuit,
                total_amount = EXCLUDED.total_amount,
                seller_code = EXCLUDED.seller_code,
                doc_text = EXCLUDED.doc_text,
                fts_doc = to_tsvector('spanish', EXCLUDED.doc_text)
            RETURNING id;
        `;

        const queryParams = [
            filename, filepath, docType, posNumber, docNumber, docDate,
            clientCta, clientName, clientCuit, totalAmount, sellerCode,
            textContent
        ];

        const dbResult = await query(queryText, queryParams);
        const recordId = dbResult.rows[0]?.id;

        return new Response(JSON.stringify({
            status: 'success',
            message: 'Document successfully parsed and indexed',
            data: {
                id: recordId,
                filename,
                docType,
                posNumber,
                docNumber,
                docDate,
                clientCta,
                clientName,
                clientCuit,
                totalAmount,
                sellerCode
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Error in document upload endpoint:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
