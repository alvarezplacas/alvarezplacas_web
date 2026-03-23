import fs from 'fs';
import { createDirectus, rest, readItems, createItem, updateItem, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const CSV_PATH = './database/catalogo.csv';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function getOrCreate(collection, nameField, nameValue, extraData = {}) {
    if (!nameValue || nameValue.trim() === '') return null;
    
    console.log(`Checking ${collection} for ${nameValue}...`);
    try {
        const existing = await client.request(readItems(collection, {
            filter: { [nameField]: { _eq: nameValue } },
            limit: 1
        }));

        if (existing.length > 0) {
            console.log(`  Found existing ${collection}: ${nameValue} (ID: ${existing[0].id})`);
            return existing[0].id;
        }

        console.log(`  Creating new ${collection}: ${nameValue}...`);
        const created = await client.request(createItem(collection, {
            [nameField]: nameValue,
            ...extraData
        }));
        console.log(`  Created ${collection}: ${nameValue} (ID: ${created.id})`);
        return created.id;
    } catch (e) {
        console.error(`  Error in getOrCreate for ${collection}:`, e.message);
        return null;
    }
}

async function run() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Logged in');

        const content = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        const headers = lines[0].split(';').map(h => h.trim());
        const dataRows = lines.slice(1);

        for (const line of dataRows) {
            const values = line.split(';');
            if (values.length < 2) continue;
            
            const row = {};
            headers.forEach((h, i) => { row[h] = values[i] ? values[i].trim() : ''; });

            const { sku, nombre, marca, categoria, linea } = row;
            if (!sku) continue;

            console.log(`\n--- Processing item: ${sku} ---`);

            const catId = await getOrCreate('categorias', 'nombre', categoria || 'General');
            const brandId = await getOrCreate('marcas', 'nombre', marca || 'Varios');
            
            let lineId = null;
            if (linea) {
                lineId = await getOrCreate('lineas', 'nombre', linea, { marca_id: brandId });
            }

            console.log(`IDs: cat=${catId}, brand=${brandId}, line=${lineId}`);

            const productData = {
                status: 'published',
                nombre,
                sku,
                marca_id: brandId,
                categoria_id: catId,
                linea_id: lineId,
                precio: parseFloat((row.precio || '0').replace(',', '.')),
                stock: parseInt(row.stock || '0'),
                slug: (row.slug || sku).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                descripcion: row.descripcion || ''
            };

            const existingProd = await client.request(readItems('productos', {
                filter: { sku: { _eq: sku } },
                limit: 1
            }));

            if (existingProd.length > 0) {
                console.log(`  Updating product ${sku} (ID: ${existingProd[0].id})`);
                await client.request(updateItem('productos', existingProd[0].id, productData));
            } else {
                console.log(`  Creating product ${sku}`);
                await client.request(createItem('productos', productData));
            }
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

run();
