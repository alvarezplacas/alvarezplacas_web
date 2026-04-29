// scripts/ingest_catalog_es.mjs
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function ingestCatalog() {
    console.log("--- 📥 Ingestando Catálogo en Español ---");
    
    const csvPath = 'd:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/web01/database/catalogo_01.csv';
    if (!fs.existsSync(csvPath)) return console.error("❌ Archivo no encontrado:", csvPath);
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(content, { columns: true, delimiter: ';', skip_empty_lines: true, bom: true });

    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const { data: { access_token: token } } = await loginResp.json();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const cache = { marcas: {}, categorias: {}, espesores: {} };

    async function getOrCreate(coll, field, val, payload) {
        const strVal = String(val).trim();
        if (cache[coll][strVal]) return cache[coll][strVal];
        
        const resp = await fetch(`${DIRECTUS_URL}/items/${coll}?filter[${field}][_eq]=${encodeURIComponent(strVal)}`, { headers });
        const { data: existing } = await resp.json();
        if (existing?.length > 0) {
            cache[coll][strVal] = existing[0].id;
            return existing[0].id;
        }

        const createResp = await fetch(`${DIRECTUS_URL}/items/${coll}`, {
            method: 'POST', headers, body: JSON.stringify(payload)
        });
        const { data: created } = await createResp.json();
        cache[coll][strVal] = created.id;
        return created.id;
    }

    let count = 0;
    for (const row of records) {
        const brandId = await getOrCreate('marcas', 'nombre', row.marca || 'Genérica', { nombre: row.marca || 'Genérica' });
        const catId = await getOrCreate('categorias', 'nombre', row.categoria || 'General', { 
            nombre: row.categoria || 'General', 
            slug: (row.categoria || 'general').toLowerCase().trim().replace(/ /g, '-') 
        });
        const thicknessVal = parseFloat(row.attr_espesor) || 18;
        const thickId = await getOrCreate('espesores', 'valor', thicknessVal, { valor: thicknessVal });

        const materialData = {
            nombre: row.nombre || row.sku || "Sin Nombre",
            id_marca: brandId,
            id_categoria: catId,
            id_espesor: thickId,
            precio_m2: parseFloat(row.precio) || 0,
            stock: parseInt(row.stock) || 0,
            activo: true
        };

        const createMatResp = await fetch(`${DIRECTUS_URL}/items/materiales`, {
            method: 'POST', headers, body: JSON.stringify(materialData)
        });
        
        if (createMatResp.ok) {
            count++;
            process.stdout.write('.');
        } else {
            console.error(`\n❌ Error al crear ${materialData.nombre}`);
        }
    }

    console.log(`\n--- ✅ Ingesta Completa! Se cargaron ${count} materiales ---`);
}

ingestCatalog().catch(console.error);
