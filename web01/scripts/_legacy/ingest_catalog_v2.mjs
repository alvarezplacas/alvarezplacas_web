import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function ingestCatalog() {
    console.log("--- DEBUG: Starting Ingestion v2.1 ---");
    
    // 1. Verificar archivo
    const csvPath = 'd:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/web01/database/catalogo_01.csv';
    if (!fs.existsSync(csvPath)) {
        console.error("CRITICAL: CSV file not found at", csvPath);
        return;
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    console.log("CSV Content Length:", content.length);

    // 2. Parsear con más detalle
    const records = parse(content, { 
        columns: true, 
        delimiter: ';', 
        skip_empty_lines: true,
        bom: true // IMPORTANTE: Por si el archivo tiene BOM de Excel
    });
    
    console.log(`TOTAL RECORDS FOUND: ${records.length}`);
    if (records.length === 0) {
        console.log("First 100 chars of content:", content.substring(0, 100));
        return;
    }

    // 3. Login
    console.log("Logging into Directus...");
    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginData = await loginResp.json();
    if (!loginResp.ok) return console.error("Login Failed:", loginData);
    
    const token = loginData.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Cache
    const cache = { brands: {}, categories: {}, thicknesses: {} };

    // Helper functions
    async function getOrCreate(collection, field, value, data) {
        const valString = String(value).trim();
        if (cache[collection][valString]) return cache[collection][valString];
        
        const resp = await fetch(`${DIRECTUS_URL}/items/${collection}?filter[${field}][_eq]=${encodeURIComponent(valString)}`, { headers });
        const existing = await resp.json();
        if (existing.data?.length > 0) {
            cache[collection][valString] = existing.data[0].id;
            return existing.data[0].id;
        }

        const createResp = await fetch(`${DIRECTUS_URL}/items/${collection}`, {
            method: 'POST', headers, body: JSON.stringify(data)
        });
        const created = await createResp.json();
        if (!createResp.ok) {
            console.error(`Error creating ${collection}:`, created);
            return null;
        }
        cache[collection][valString] = created.data.id;
        return created.data.id;
    }

    // 4. Ingestión real
    let count = 0;
    for (const row of records) {
        // En Directos el SKu es opcional pero el nombre no
        const name = row.nombre || row.sku || "Sin Nombre";
        
        const brandId = await getOrCreate('material_brands', 'name', (row.marca || 'Genérica').trim(), { 
            name: (row.marca || 'Genérica').trim() 
        });
        
        const catId = await getOrCreate('material_categories', 'name', (row.categoria || 'General').trim(), { 
            name: (row.categoria || 'General').trim(), 
            slug: (row.categoria || 'general').toLowerCase().trim().replace(/ /g, '-') 
        });

        const thicknessVal = parseFloat(row.attr_espesor) || 18;
        const thicknessId = await getOrCreate('material_thicknesses', 'value', thicknessVal, { 
            value: thicknessVal 
        });

        if (!brandId || !catId || !thicknessId) continue;

        const materialData = {
            name: name,
            brand_id: brandId,
            category_id: catId,
            thickness_id: thicknessId,
            price_m2: parseFloat(row.precio) || 0,
            stock_quantity: parseInt(row.stock) || 0,
            active: true
        };

        const createMatResp = await fetch(`${DIRECTUS_URL}/items/materials`, {
            method: 'POST', headers, body: JSON.stringify(materialData)
        });
        
        if (createMatResp.ok) {
            count++;
            process.stdout.write('.');
        } else {
            const err = await createMatResp.json();
            console.error(`\nFailed for ${name}:`, err);
        }
    }

    console.log(`\n--- Done! Total Loaded: ${count} materials ---`);
}

ingestCatalog().catch(console.error);
