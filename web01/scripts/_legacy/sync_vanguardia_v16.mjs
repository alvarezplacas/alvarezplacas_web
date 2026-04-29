import { createDirectus, rest, authentication, readItems, createItems, updateItem, readItem } from '@directus/sdk';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const DIRECTUS_URL = 'http://alvarezplacas_directus:8055';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASS = 'JavierMix2026!';
const CSV_FILE = 'database/catalogo_01.csv';
const BATCH_SIZE = 100;

// Utilidades de Vanguardia
const slugify = (text) => text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-') || '';

function generateSecureSKU(row, index) {
    if (row.sku && row.sku.trim() !== '') return row.sku.trim().toUpperCase();
    
    const cat = slugify(row.categoria || 'PLA').substring(0,3).toUpperCase();
    const nom = slugify(row.nombre).substring(0,3).toUpperCase();
    const mar = slugify(row.marca).substring(0,3).toUpperCase();
    const esp = row.attr_espesor || '00';
    
    // Si faltan datos técnicos, usamos el slug del nombre para garantizar unicidad
    if (esp === '00' || !row.attr_tipo) {
        return `GEN-${cat}-${nom}-${index+1}`.toUpperCase();
    }
    
    const tip = slugify(row.attr_tipo).substring(0,3).toUpperCase();
    return `TAB-${nom}-${mar}-${esp}-${tip}`.toUpperCase();
}

async function syncVanguardia() {
    console.log("--- 🚀 INICIANDO SINCRONIZACIÓN VANGUARDIA V16 ---");
    
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`❌ Archivo maestro no encontrado en ${CSV_FILE}`);
        return;
    }

    const client = createDirectus(DIRECTUS_URL).with(authentication()).with(rest());
    const cache = { marcas: {}, categorias: {}, espesores: {} };

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASS);
        console.log("✅ Conexión con el Cerebro Directus establecida.");

        const content = fs.readFileSync(CSV_FILE, 'utf-8');
        const records = parse(content, { columns: true, skip_empty_lines: true, delimiter: ';' });
        console.log(`📊 Catálogo detectado: ${records.length} productos.`);

        // 1. Precarga de Relaciones (Vanguardia Style)
        async function getRefId(collection, field, value, defaultVal = 'S/D') {
            const val = value?.toString().trim() || defaultVal;
            if (cache[collection][val]) return cache[collection][val];

            const res = await client.request(readItems(collection, { filter: { [field]: { _eq: val } }, limit: 1 }));
            if (res.length > 0) {
                cache[collection][val] = res[0].id;
                return res[0].id;
            }
            const newItem = await client.request(createItems(collection, [{ [field]: val }]));
            cache[collection][val] = newItem[0].id;
            return newItem[0].id;
        }

        let createdCount = 0;
        let batch = [];

        for (const [index, row] of records.entries()) {
            try {
                const sku = generateSecureSKU(row, index);
                const slug = row.slug || slugify(`${row.nombre}-${row.marca}-${index}`);

                const material = {
                    nombre: row.nombre || 'Producto Sin Nombre',
                    sku,
                    slug,
                    descripcion: row.descripcion || '',
                    linea: row.linea || '',
                    tipo: row.attr_tipo || '',
                    color: row.attr_color || '',
                    textura: row.attr_textura || '',
                    medidas: row.attr_medidas || '',
                    precio_l1: parseFloat(row.precio?.replace(/[^0-9.]/g, '') || 0) || 0,
                    stock: parseInt(row.stock || 0) || 0,
                    id_marca: await getRefId('marcas', 'nombre', row.marca),
                    id_categoria: await getRefId('categorias', 'nombre', row.categoria, 'Placas'),
                    id_espesor: await getRefId('espesores', 'valor', row.attr_espesor, '18'),
                    activo: true,
                    mostrar_precio: true
                };

                batch.push(material);

                if (batch.length >= BATCH_SIZE || index === records.length - 1) {
                    console.log(`📦 Enviando lote de ${batch.length} productos...`);
                    await client.request(createItems('materiales', batch));
                    createdCount += batch.length;
                    batch = [];
                }

            } catch (err) {
                console.error(`❌ Error en fila ${index + 1}:`, err.errors?.[0]?.message || err.message);
            }
        }

        console.log(`--- ✨ OPERACIÓN FINALIZADA CON ÉXITO ---`);
        console.log(`✅ Total de productos inyectados: ${createdCount}`);

    } catch (e) {
        console.error("🚨 ERROR CRÍTICO DE SISTEMA:", e.errors?.[0]?.message || e.message);
    }
}

syncVanguardia();
