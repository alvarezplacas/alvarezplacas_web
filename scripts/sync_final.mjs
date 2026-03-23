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
    const cleanValue = nameValue.trim();
    try {
        const existing = await client.request(readItems(collection, {
            filter: { [nameField]: { _eq: cleanValue } },
            limit: 1
        }));
        if (existing.length > 0) return existing[0].id;
        const created = await client.request(createItem(collection, { [nameField]: cleanValue, ...extraData }));
        return created.id;
    } catch (e) {
        console.error(`  ❌ Error en ${collection}: ${e.message}`);
        return null;
    }
}

async function run() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const content = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
        const headers = lines[0].split(';').map(h => h.trim());
        const rows = lines.slice(1);

        console.log(`🚀 Iniciando sincronización DE DEFINITIVA de ${rows.length} productos...`);

        for (const line of rows) {
            const values = line.split(';');
            const row = {};
            headers.forEach((h, i) => { row[h] = values[i]?.trim() || ''; });

            const { sku, nombre, marca, categoria, linea } = row;
            if (!sku || !nombre) continue;

            const brandId = await getOrCreate('Marca', 'nombre', marca || 'Varios');
            const catId = await getOrCreate('categorias', 'nombre', categoria || 'General');
            const lineId = await getOrCreate('lineas', 'nombre', linea, { marca_id: brandId });

            const atributos = {
                tipo: row.attr_tipo || '',
                espesor: row.attr_espesor || '',
                color: row.attr_color || '',
                textura: row.attr_textura || '',
                medidas: row.attr_medidas || ''
            };

            const productData = {
                status: 'published',
                nombre,
                sku,
                marca_id: brandId,
                categoria_id: catId,
                linea_id: lineId,
                precio: parseFloat((row.precio || '0').replace(',', '.')),
                stock: parseInt(row.stock || '0'),
                slug: (row.slug || sku).toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 100),
                descripcion: row.descripcion || '',
                atributos,
                tags: (row.tags || '').split(',').map(t => t.trim()).filter(Boolean)
            };

            const existing = await client.request(readItems('productos', {
                filter: { sku: { _eq: sku } },
                limit: 1
            }));

            if (existing.length > 0) {
                await client.request(updateItem('productos', existing[0].id, productData));
                console.log(`✅ SKU: ${sku} - Actualizado (Linea ${lineId})`);
            } else {
                await client.request(createItem('productos', productData));
                console.log(`✨ SKU: ${sku} - Creado`);
            }
        }
        console.log("🎉 ¡SINCRONIZACIÓN FINALIZADA CON ÉXITO!");
    } catch (e) {
        console.error("Critical Error:", e.message);
    }
}

run();
