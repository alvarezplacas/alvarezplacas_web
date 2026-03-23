import fs from 'fs';
import path from 'path';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const CSV_PATH = './_Zona_datos/catalogo_2026.csv';

async function upsertItem(collection, filter, data, token) {
    const query = encodeURIComponent(JSON.stringify(filter));
    const existingReq = await fetch(`${DIRECTUS_URL}/items/${collection}?filter=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const existingRes = await existingReq.json();
    
    const fetchOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    };
    
    if (existingRes.data && existingRes.data.length > 0) {
        fetchOptions.method = 'PATCH';
        const res = await fetch(`${DIRECTUS_URL}/items/${collection}/${existingRes.data[0].id}`, fetchOptions);
        const json = await res.json();
        if (json.errors) {
            console.error(`Error patching ${collection}:`, JSON.stringify(json.errors, null, 2));
            throw new Error(`Directus error in ${collection}`);
        }
        return json;
    } else {
        fetchOptions.method = 'POST';
        const res = await fetch(`${DIRECTUS_URL}/items/${collection}`, fetchOptions);
        const json = await res.json();
        if (json.errors) {
            console.error(`Error posting to ${collection}:`, JSON.stringify(json.errors, null, 2));
            throw new Error(`Directus error in ${collection}`);
        }
        return json;
    }
}

async function run() {
    try {
        console.log('--- Starting Catalog Ingestion ---');
        
        // 1. Login
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data?.access_token;
        if (!token) throw new Error('Could not authenticate with Directus');

        // 2. Read CSV
        const content = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(';');
        const dataRows = lines.slice(1);

        console.log(`Processing ${dataRows.length} items...`);

        let count = 0;
        for (const line of dataRows) {
            const values = line.split(';');
            const row = {};
            headers.forEach((h, i) => {
                row[h.trim()] = values[i] ? values[i].trim() : '';
            });

            const { 
                sku, nombre, slug, descripcion, categoria, marca, linea, 
                precio, stock, tags, attr_tipo, attr_espesor, attr_color, 
                attr_textura, attr_medidas 
            } = row;

            if (!sku || !nombre) continue;

            console.log(`[${++count}/${dataRows.length}] Processing: ${sku}`);

            // A. Upsert Category
            const catName = categoria || 'General';
            const catRes = await upsertItem('categorias', { nombre: { _eq: catName } }, { nombre: catName }, token);
            const catId = catRes.data.id;

            // B. Upsert Brand
            const brandName = marca || 'Varios';
            const brandRes = await upsertItem('marcas', { nombre: { _eq: brandName } }, { nombre: brandName }, token);
            const brandId = brandRes.data.id;

            // C. Upsert Line
            let lineId = null;
            if (linea) {
                const lineRes = await upsertItem('lineas', {
                    _and: [
                        { nombre: { _eq: linea } },
                        { marca_id: { _eq: brandId } }
                    ]
                }, { nombre: linea, marca_id: brandId }, token);
                lineId = lineRes.data.id;
            }

            // D. Prepare Attributes & Tags
            const atributos = {
                tipo: attr_tipo,
                espesor: attr_espesor,
                color: attr_color,
                textura: attr_textura,
                medidas: attr_medidas
            };

            const tagList = (tags || '').split(',').map(t => t.trim()).filter(Boolean);
            if (catName) tagList.push(catName.toLowerCase());
            if (brandName) tagList.push(brandName.toLowerCase());
            if (linea) tagList.push(linea.toLowerCase());

            // E. Upsert Product
            await upsertItem('productos', { sku: { _eq: sku } }, {
                status: 'published',
                nombre,
                descripcion,
                sku,
                precio: parseFloat(precio || 0),
                stock: parseInt(stock || 0),
                categoria_id: catId,
                marca_id: brandId,
                linea_id: lineId,
                atributos,
                tags: Array.from(new Set(tagList)),
                slug: slug || sku.toLowerCase()
            }, token);
        }

        console.log('--- Ingestion Complete ---');

    } catch (e) {
        console.error('Error during ingestion:', e);
    }
}

run();
