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
    
    // Convertir a PascalCase o lo que sea necesario si vemos inconsistencias,
    // pero por ahora usemos el valor exacto del CSV.
    console.log(`- Checking ${collection} for: "${nameValue}"`);
    
    try {
        const existing = await client.request(readItems(collection, {
            filter: { [nameField]: { _eq: nameValue } },
            limit: 1
        }));

        if (existing.length > 0) {
            return existing[0].id;
        }

        const created = await client.request(createItem(collection, {
            [nameField]: nameValue,
            ...extraData
        }));
        return created.id;
    } catch (e) {
        console.error(`  Error in ${collection}: ${e.message}`);
        return null;
    }
}

async function run() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Logged In');

        // Leer CSV
        const content = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
        const headers = lines[0].split(';').map(h => h.trim());
        const rows = lines.slice(1);

        console.log(`Syncing ${rows.length} products...`);

        for (const line of rows) {
            const values = line.split(';');
            const row = {};
            headers.forEach((h, i) => { row[h] = values[i]?.trim() || ''; });

            const { sku, nombre, marca, categoria, linea } = row;
            if (!sku || !nombre) continue;

            console.log(`\n> SKU: ${sku}`);

            // USAR LAS COLECCIONES EXACTAS QUE VIMOS EN LA RELACIÓN
            // marca_id -> Marcas
            // categoria_id -> categorias
            // linea_id -> lineas
            
            const brandId = await getOrCreate('Marcas', 'nombre', marca || 'Varios');
            const catId = await getOrCreate('categorias', 'nombre', categoria || 'General');
            
            let lineId = null;
            if (linea) {
                lineId = await getOrCreate('lineas', 'nombre', linea, { marca_id: brandId });
            }

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

            const existing = await client.request(readItems('productos', {
                filter: { sku: { _eq: sku } },
                limit: 1
            }));

            if (existing.length > 0) {
                await client.request(updateItem('productos', existing[0].id, productData));
                console.log(`  Updated.`);
            } else {
                await client.request(createItem('productos', productData));
                console.log(`  Created.`);
            }
        }

        console.log('\n✅ DONE!');
    } catch (e) {
        console.error('❌ CRITICAL ERROR:', e.message);
    }
}

run();
