import fs from 'fs';
import { parse } from 'csv-parse/sync';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function run() {
    console.log("--- FINAL CATALOG INGESTION v3.0 ---");
    
    // 1. Cargar CSV
    const csvPath = './database/catalogo_01.csv';
    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(content, { columns: true, delimiter: ';', skip_empty_lines: true, bom: true });
    console.log(`INFO: Processing ${records.length} records.`);

    // 2. Auth
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginJson = await loginRes.json();
    const token = loginJson.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 3. Helper compatible con números y strings
    async function getOrCreate(col, filter, data) {
        // Generar query string de filtros
        const query = Object.entries(filter).map(([k, v]) => `filter[${k}][_eq]=${encodeURIComponent(v)}`).join('&');
        const r = await fetch(`${DIRECTUS_URL}/items/${col}?${query}`, { headers });
        const { data: results } = await r.json();
        
        if (results && results.length > 0) return results[0].id;

        // Si no existe, crear
        const c = await fetch(`${DIRECTUS_URL}/items/${col}`, {
            method: 'POST', headers, body: JSON.stringify(data)
        });
        const res = await c.json();
        if (c.ok) return res.data.id;
        
        // Si falló por duplicado (carrera de hilos), intentar buscar una vez más
        if (res.errors?.[0]?.code === 'RECORD_NOT_UNIQUE') {
            const r2 = await fetch(`${DIRECTUS_URL}/items/${col}?${query}`, { headers });
            const { data: res2 } = await r2.json();
            return res2?.[0]?.id;
        }
        
        return null;
    }

    // 4. Ingestión
    let count = 0;
    for (const row of records) {
        try {
            const marca = (row.marca || 'Generica').trim();
            const brandId = await getOrCreate('material_brands', { name: marca }, { name: marca });
            
            const categoria = (row.categoria || 'General').trim();
            const catId = await getOrCreate('material_categories', { name: categoria }, { name: categoria, slug: categoria.toLowerCase().replace(/ /g, '-') });
            
            const espesor = parseFloat(row.attr_espesor) || 18;
            const thickId = await getOrCreate('material_thicknesses', { value: espesor }, { value: espesor });

            if (brandId && catId && thickId) {
                const matRes = await fetch(`${DIRECTUS_URL}/items/materials`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        name: row.nombre || row.sku,
                        brand_id: brandId,
                        category_id: catId,
                        thickness_id: thickId,
                        price_m2: parseFloat(row.precio) || 0,
                        stock_quantity: parseInt(row.stock) || 0,
                        active: true
                    })
                });
                if (matRes.ok) {
                    count++;
                    process.stdout.write('.');
                } else {
                    process.stdout.write('x');
                }
            } else {
                process.stdout.write('E');
            }
        } catch (e) {
            process.stdout.write('!');
        }
    }

    console.log(`\n--- COMPLETE: ${count} materials loaded successfully ---`);
}

run().catch(console.error);
