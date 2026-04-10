import { createDirectus, rest, authentication, readItems, createItem, updateItem, readItem } from '@directus/sdk';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const DIRECTUS_URL = 'http://alvarezplacas_directus:8055';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASS = 'JavierMix2026!';
const CSV_FILE = 'database/catalogo_master_v16.csv'; // Ajustar al nombre de tu archivo

// Lógica de Normalización y Automatización
const slugify = (text) => text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-') || '';

function generateSKU(row) {
    if (row.sku && row.sku.trim() !== '') return row.sku.trim().toUpperCase();
    
    const prefix = row.categoria?.toLowerCase().includes('tablero') ? 'TAB' : 'GEN';
    const nom = slugify(row.nombre).substring(0, 3).toUpperCase();
    const mar = slugify(row.marca).substring(0, 3).toUpperCase();
    const esp = row.attr_espesor || '00';
    const tip = slugify(row.attr_tipo).substring(0, 3).toUpperCase();
    
    return `${prefix}-${nom}-${mar}-${esp}-${tip}`;
}

async function syncCatalog() {
    console.log("--- 🧠 Iniciando Sincronización Automática Master V16 ---");
    
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`❌ Archivo no encontrado: ${CSV_FILE}`);
        return;
    }

    const client = createDirectus(DIRECTUS_URL).with(authentication()).with(rest());
    const cache = { marcas: {}, categorias: {}, espesores: {} };

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASS);
        console.log("✅ Login exitoso.");

        const content = fs.readFileSync(CSV_FILE, 'utf-8');
        const records = parse(content, { columns: true, skip_empty_lines: true });
        console.log(`📊 Procesando ${records.length} productos...`);

        // Función auxiliar para IDs relacionales con Cache
        async function getOrCreate(collection, nameField, value) {
            if (!value) return null;
            const val = value.toString().trim();
            if (cache[collection][val]) return cache[collection][val];

            const existing = await client.request(readItems(collection, {
                filter: { [nameField]: { _eq: val } },
                limit: 1
            }));

            if (existing.length > 0) {
                cache[collection][val] = existing[0].id;
                return existing[0].id;
            } else {
                const newItem = await client.request(createItem(collection, { [nameField]: val }));
                cache[collection][val] = newItem.id;
                return newItem.id;
            }
        }

        let created = 0;
        let updated = 0;

        for (const [index, row] of records.entries()) {
            try {
                const sku = generateSKU(row);
                const slug = row.slug || slugify(`${row.nombre} ${row.marca} ${row.attr_espesor} ${row.attr_tipo}`);
                
                // Resolver Relaciones
                const id_marca = await getOrCreate('marcas', 'nombre', row.marca);
                const id_categoria = await getOrCreate('categorias', 'nombre', row.categoria);
                const id_espesor = await getOrCreate('espesores', 'valor', row.attr_espesor);

                // Preparar Objeto de Material
                const materialData = {
                    nombre: row.nombre,
                    sku: sku,
                    slug: slug,
                    descripcion: row.descripcion,
                    linea: row.linea,
                    tags: row.tags,
                    tipo: row.attr_tipo,
                    color: row.attr_color,
                    textura: row.ttr_textur,
                    medidas: row.attr_medidas,
                    precio_l1: parseFloat(row['Precio L1']?.replace(/[^0-9.]/g, '') || 0),
                    precio_l2: parseFloat(row['Precio L2']?.replace(/[^0-9.]/g, '') || 0),
                    stock: parseInt(row.stock || 0),
                    id_marca,
                    id_categoria,
                    id_espesor,
                    activo: true
                };

                // Lógica de UPSERT (Sincronización Inteligente)
                const existingProduct = await client.request(readItems('materiales', {
                    filter: { sku: { _eq: sku } },
                    limit: 1
                }));

                if (existingProduct.length > 0) {
                    // Solo actualizamos campos dinámicos para proteger la imagen y personalizaciones en Directus
                    await client.request(updateItem('materiales', existingProduct[0].id, {
                        nombre: materialData.nombre,
                        precio_l1: materialData.precio_l1,
                        precio_l2: materialData.precio_l2,
                        stock: materialData.stock,
                        descripcion: materialData.descripcion,
                        linea: materialData.linea,
                        tags: materialData.tags,
                        activo: true
                    }));
                    updated++;
                    if (index % 50 === 0) console.log(`🔄 [${index}] Actualizado: ${sku}`);
                } else {
                    await client.request(createItem('materiales', materialData));
                    created++;
                    if (index % 50 === 0) console.log(`✨ [${index}] Creado: ${sku}`);
                }

            } catch (err) {
                console.error(`❌ Error en fila ${index + 1} (${row.nombre}):`, err.message);
            }
        }

        console.log(`--- ✨ Sincronización Finalizada ---`);
        console.log(`✅ Creados: ${created} | 🔄 Actualizados: ${updated}`);

    } catch (e) {
        console.error("❌ Error grave en la sincronización:", e.message);
    }
}

syncCatalog();
