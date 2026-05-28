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
        // Clean up spaces and hyphens
        const cleanStr = dateStr.replace(/\s+/g, '').replace(/-/g, '/');
        const parts = cleanStr.split('/');
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
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
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

        // Pattern 1: Standard internal format: FA-B-1901-00010451.pdf
        const nameParts = filename.match(/^([A-Z0-9-]+)-([0-9]+)-([0-9]+)/i);
        // Pattern 2: AFIP official format: 23142843099_011_00002_00000144 ALVAREZ.pdf
        const namePartsAfip = filename.match(/^([0-9]+)_([0-9]+)_([0-9]+)_([0-9]+)/i);
        // Pattern 3: Standard generic invoice name containing "Factura", "NC", "ND", "Recibo" or "Certif"
        const namePartsGeneric = filename.match(/(Factura|NC|ND|Recibo|Certif|Ret)[^\d]*(\d+)[^\d]*(\d+)?/i);

        if (nameParts) {
            docType = nameParts[1].toUpperCase();
            posNumber = nameParts[2];
            docNumber = nameParts[3];
        } else if (namePartsAfip) {
            const typeCode = namePartsAfip[2];
            posNumber = namePartsAfip[3];
            docNumber = namePartsAfip[4];
            
            const typeMap: Record<string, string> = {
                '001': 'FA-A', '002': 'ND-A', '003': 'NC-A',
                '006': 'FA-B', '007': 'ND-B', '008': 'NC-B',
                '011': 'FA-C', '012': 'ND-C', '013': 'NC-C',
                '015': 'RE-A', '051': 'FA-M'
            };
            docType = typeMap[typeCode] || ('FA-' + typeCode);
        } else if (namePartsGeneric) {
            const typeWord = namePartsGeneric[1].toLowerCase();
            if (typeWord.includes('factura')) docType = 'FA-B';
            else if (typeWord.includes('nc')) docType = 'NC-B';
            else if (typeWord.includes('nd')) docType = 'ND-B';
            else if (typeWord.includes('recibo')) docType = 'RE-B';
            else if (typeWord.includes('certif') || typeWord.includes('ret')) docType = 'CERT';
            
            posNumber = namePartsGeneric[2].padStart(4, '0');
            docNumber = namePartsGeneric[3] ? namePartsGeneric[3].padStart(8, '0') : '00000000';
        }

        // If after filename parsing we still don't have a valid doc number, try to extract it from text body
        if (docNumber === '00000000' || posNumber === '0000') {
            // Search for AFIP style Point of Sale and Comp Number in text
            // e.g. "Punto de Venta: Comp. Nro:      00002 00000144"
            const bodyPosCompMatch = textContent.match(/Punto\s+de\s+Venta\s*:\s*(?:Comp\.\s*Nro\s*:\s*)?(\d+)\s+(\d+)/i) 
                || textContent.match(/P\.V\.\s*:\s*(\d+)\s*-\s*Comp\.\s*Nº\s*:\s*(\d+)/i)
                || textContent.match(/PUNTO\s+DE\s+VENTA\s*(\d+)/i);
            
            if (bodyPosCompMatch) {
                posNumber = bodyPosCompMatch[1].padStart(4, '0');
                if (bodyPosCompMatch[2]) {
                    docNumber = bodyPosCompMatch[2].padStart(8, '0');
                }
            }
        }

        // 6.2 Extract Date: e.g. FECHA: 03/01/26 or standard DD/MM/YYYY dates
        let docDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        const dateMatch = textContent.match(/FECHA:\s*([0-9\/\-\s]{8,14})/i);
        const dateMatchEmission = textContent.match(/Fecha\s+de\s+Emisi(?:o|ó)n\s*:\s*([0-9\/\-\s]{8,14})/i)
            || textContent.match(/Fecha\s*:\s*([0-9\/\-\s]{8,14})/i);
        
        // Find any standard DD/MM/YYYY date in the text as a backup
        const genericDateMatch = textContent.match(/\b(\d{2}[\/\-\s]+\d{2}[\/\-\s]+\d{2,4})\b/);

        if (dateMatchEmission) {
            docDate = parseSpanishDate(dateMatchEmission[1]);
        } else if (dateMatch) {
            docDate = parseSpanishDate(dateMatch[1]);
        } else if (genericDateMatch) {
            docDate = parseSpanishDate(genericDateMatch[1]);
        }

        // 6.3 Extract Customer Account and Name
        let clientCta = '00000';
        let clientName = 'Consumidor Final';
        
        // Try original style "Señor/es: Cta Nº:	GUILLERMO PAREDES 11616"
        const clientMatch = textContent.match(/Señor\/es:\s*Cta\s*Nº:\s*([^\n]+)/i)
            || textContent.match(/Señor\/es\s*:\s*([^\n]+)/i);
            
        if (clientMatch) {
            const rawClient = clientMatch[1].trim();
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
        } else {
            // AFIP style "Apellido y Nombre / Razón Social: ..."
            // Look for this label and extract text following it
            const afipClientMatch = textContent.match(/(?:Apellido\s+y\s+Nombre\s*\/\s*)?Razón\s+Social\s*:\s*([^\n]*)/i)
                || textContent.match(/Cliente\s*:\s*([^\n]*)/i)
                || textContent.match(/Señor\s*\(es\)\s*:\s*([^\n]*)/i);
                
            if (afipClientMatch && afipClientMatch[1].trim().length > 0) {
                const tempName = afipClientMatch[1].trim();
                // Filter out ALVAREZ PLACAS S.R.L. if it matched Alvarez as the client in purchase invoices
                if (tempName.toUpperCase().includes('ALVAREZ PLACAS')) {
                    // Try to find the other party! In purchase invoices, the seller is the issuer.
                    // "Razón Social: GABELLONI SERGIO GUSTAVO"
                    const sellerNameMatch = textContent.match(/Razón\s+Social\s*:\s*([^\n]+)/i);
                    if (sellerNameMatch && !sellerNameMatch[1].toUpperCase().includes('ALVAREZ PLACAS')) {
                        clientName = sellerNameMatch[1].trim();
                    } else {
                        clientName = tempName;
                    }
                } else {
                    clientName = tempName;
                }
            } else {
                // If it is an AFIP invoice, look at lines around the top
                // Search for GABELLONI or other uppercase lines
                const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                for (const line of lines) {
                    if (line.includes('ALVAREZ PLACAS S.R.L.')) {
                        continue;
                    }
                    if (line.toUpperCase() === line && line.length > 4 && !line.includes(':') && !/^\d+$/.test(line) && !line.includes('PÁG') && !line.includes('ORIGINAL') && !line.includes('TRIPLICADO') && !line.includes('DUPLICADO')) {
                        clientName = line;
                        break;
                    }
                }
            }
        }

        // 6.4 Extract CUIT/DNI
        let clientCuit = '';
        const cuitMatch = textContent.match(/(?:C\.U\.I\.T|CUIT|Documento)\s*:\s*([^\n]+)/i)
            || textContent.match(/CUIT\s*(\d{2}-\d{8}-\d|\d{11})/i);
            
        if (cuitMatch) {
            let extracted = cuitMatch[1].trim();
            // clean up if it contains extra text, e.g. "CONSUMIDOR FINAL DNI 30576088"
            const justNumbers = extracted.match(/\b(\d{2}-\d{8}-\d|\d{11}|\d{7,8})\b/);
            if (justNumbers) {
                clientCuit = justNumbers[1];
            } else {
                clientCuit = extracted;
            }
        } else {
            // Find any CUIT in the text (format XX-XXXXXXXX-X or 11 digits)
            const cuits = textContent.match(/\b\d{2}-\d{8}-\d\b|\b\d{11}\b/g) || [];
            // Skip Alvarez Placas own CUIT if possible
            for (const cuit of cuits) {
                const cleanCuit = cuit.replace(/-/g, '');
                if (cleanCuit !== '23142843099') {
                    clientCuit = cuit;
                    break;
                }
            }
        }

        // 6.5 Extract Total Amount
        let totalAmount = 0;
        const totalMatch = textContent.match(/TOTAL\s*\$\s*([\d\.,]+)/i);
        const afipTotalMatch = textContent.match(/Importe\s+Total\s*:\s*\$\s*([\d\.,]+)/i)
            || textContent.match(/Total\s*:\s*\$\s*([\d\.,]+)/i);
        const genericTotalMatch = textContent.match(/(?:Total|Importe\s+Total|Subtotal)\D*([\d\.,]+)/i);
        
        if (totalMatch) {
            totalAmount = parseArgentineAmount(totalMatch[1]);
        } else if (afipTotalMatch) {
            totalAmount = parseArgentineAmount(afipTotalMatch[1]);
        } else if (genericTotalMatch) {
            totalAmount = parseArgentineAmount(genericTotalMatch[1]);
        }

        // 6.6 Extract Seller Code
        let sellerCode = '';
        const sellerMatch = textContent.match(/VENDEDOR\s*(\d+)/i)
            || textContent.match(/Vendedor\s*:\s*(\d+)/i);
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
