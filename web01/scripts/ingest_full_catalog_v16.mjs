import fs from 'fs';
import { createDirectus, rest, authentication, staticToken, readItems, createItem, readFiles } from '@directus/sdk';
import { parse } from 'csv-parse/sync';

/**
 * INGESTA MASIVA V16 - ALVAREZ PLACAS
 * Automatiza: SKU, Slug y Atributos (Color, Textura, Medidas).
 */

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASS = 'JavierMix2026!';
const LOGO_ID = '3ef347b2-d9ca-4bd5-9e83-66452de22d2a';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication())
    .with(rest());

async function ingestFull() {
    console.log("--- 🚀 Iniciando Ingesta Masiva V16 ---");
    
    // Login inicial
    await client.login(ADMIN_EMAIL, ADMIN_PASS);
    
    const csvPath = './database/catalogo_01.csv';
    if (!fs.existsSync(csvPath)) {
        console.error("❌ No se encontró el CSV en:", csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(content, { columns: true, delimiter: ';', skip_empty_lines: true, bom: true });

    // Cache de IDs
    const cache = { marcas: {}, categorias: {}, espesores: {} };

    async function getOrCreateItem(coll, field, val, payload) {
        const strVal = String(val).trim();
        if (!strVal || strVal === 'undefined') return null;
        if (cache[coll][strVal]) return cache[coll][strVal];
        
        try {
            const existing = await client.request(readItems(coll, { filter: { [field]: { _eq: strVal } }, limit: 1 }));
            if (existing.length > 0) {
                cache[coll][strVal] = existing[0].id;
                return existing[0].id;
            }

            const created = await client.request(createItem(coll, payload));
            cache[coll][strVal] = created.id;
            return created.id;
        } catch (e) {
            console.warn(`⚠️ Error gestionando ${coll} [${strVal}]:`, e.message);
            return null;
        }
    }

    let count = 0;
    for (const row of records) {
        try {
            if (!row.nombre) continue;

            // 1. Normalización de Relaciones
            const rawMarca = row.marca || 'Genérica';
            const cleanMarca = rawMarca.charAt(0).toUpperCase() + rawMarca.slice(1).toLowerCase();
            const brandId = await getOrCreateItem('marcas', 'nombre', cleanMarca, { nombre: cleanMarca });
            
            const rawCat = row.categoria || 'General';
            const catId = await getOrCreateItem('categorias', 'nombre', rawCat, { 
                nombre: rawCat, 
                slug: rawCat.toLowerCase().trim().replace(/ /g, '-') 
            });

            const thickVal = row.attr_espesor || '18';
            const thickId = await getOrCreateItem('espesores', 'valor', thickVal, { valor: thickVal });

            // 2. Lógica de SKU y SLUG Automática
            const cleanName = row.nombre.trim();
            const slug = (row.slug && row.slug.trim().length > 3) ? row.slug.trim() : 
                (cleanName + '-' + cleanMarca + '-' + thickVal).toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            
            const sku = (row.sku && row.sku.trim().length > 3) ? row.sku.trim().toUpperCase() : 
                `${rawCat.substring(0,3)}-${cleanName.substring(0,3)}-${cleanMarca.substring(0,3)}-${thickVal}`.toUpperCase();

            // 3. Verificación de existencia para evitar duplicados en 'Productos'
            const existingMaterial = await client.request(readItems('Productos', { 
                filter: { sku: { _eq: sku } },
                limit: 1 
            }));

            if (existingMaterial.length > 0) {
                console.log(`⏩ [${count+1}] ${cleanName} ya existe (SKU: ${sku}) - Saltando...`);
                count++;
                continue;
            }

            // 4. Preparación de Data
            const materialData = {
                nombre: cleanName,
                sku: sku,
                slug: slug,
                descripcion: row.descripcion || '',
                linea: row.linea || '',
                tags: row.tags || '',
                color: row.attr_color || '',
                textura: row.attr_textura || '',
                medidas: row.attr_medidas || '',
                id_marca: brandId,
                id_categoria: catId,
                id_espesor: thickId,
                precio_m2: parseFloat(row.precio) || 0,
                stock: parseInt(row.stock) || 0,
                activo: true,
                imagen: LOGO_ID // Fallback por defecto en ingesta masiva inicial
            };

            await client.request(createItem('Productos', materialData));
            console.log(`✅ [${count+1}] ${cleanName} cargado - SKU: ${sku}`);
            count++;

        } catch (err) {
            console.error(`❌ Error con fila ${count + 1}:`, err.message);
        }
    }

    console.log(`\n--- ✨ INGESTA FINALIZADA: ${count} productos procesados ---`);
}

ingestFull().catch(console.error);
