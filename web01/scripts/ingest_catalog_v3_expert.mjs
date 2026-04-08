import fs from 'fs';
import path from 'path';
import { createDirectus, rest, staticToken, readItems, createItem, createFolder, uploadFiles, readFolders, readFiles } from '@directus/sdk';
import { parse } from 'csv-parse/sync';

/**
 * SCRIPT EXPERTO DE INGESTA V3 - ALVAREZ PLACAS
 * Automatiza: SKU, Slug, Carpetas Directus, Carga de Imágenes y Relaciones.
 */

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKEN = 'alvarez-api-token-v16-2026';
const STAGING_DIR = '/opt/alvarezplacas/import_staging'; // Directorio en el VPS
const LOGO_ID = '3f58bb2f-4447-472b-9ece-2cc573f98873';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(TOKEN))
    .with(rest());

async function ingest() {
    console.log("--- 🚀 Iniciando Ingesta Experta V3 ---");
    
    const csvPath = './database/catalogo_master_v3.csv';
    if (!fs.existsSync(csvPath)) {
        console.error("❌ No se encontró el CSV en:", csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(content, { columns: true, delimiter: ';', skip_empty_lines: true, bom: true });

    // Cache de IDs para evitar miles de peticiones
    const cache = { marcas: {}, categorias: {}, espesores: {}, folders: {} };

    // 1. Precargar carpetas existentes en Directus
    const folders = await client.request(readFolders());
    folders.forEach(f => cache.folders[f.name] = f.id);

    async function getOrCreateFolder(name, parentId = null) {
        const key = `${parentId || 'root'}_${name}`;
        if (cache.folders[key]) return cache.folders[key];
        
        try {
            const folder = await client.request(createFolder({ name, parent: parentId }));
            cache.folders[key] = folder.id;
            return folder.id;
        } catch (e) {
            // Si ya existe pero no estaba en cache
            const existing = await client.request(readFolders({ filter: { name: { _eq: name }, parent: { _eq: parentId } } }));
            if (existing.length > 0) {
                cache.folders[key] = existing[0].id;
                return existing[0].id;
            }
            throw e;
        }
    }

    async function getOrCreateItem(coll, field, val, payload) {
        const strVal = String(val).trim();
        if (cache[coll][strVal]) return cache[coll][strVal];
        
        const existing = await client.request(readItems(coll, { filter: { [field]: { _eq: strVal } }, limit: 1 }));
        if (existing.length > 0) {
            cache[coll][strVal] = existing[0].id;
            return existing[0].id;
        }

        const created = await client.request(createItem(coll, payload));
        cache[coll][strVal] = created.id;
        return created.id;
    }

    let count = 0;
    for (const row of records) {
        try {
            console.log(`\n📦 Procesando: ${row.nombre}...`);

            // I. Relaciones con normalización de marcas
            const rawMarca = row.marca || 'Genérica';
            const cleanMarca = rawMarca.charAt(0).toUpperCase() + rawMarca.slice(1).toLowerCase();
            const brandId = await getOrCreateItem('marcas', 'nombre', cleanMarca, { nombre: cleanMarca });
            const catId = await getOrCreateItem('categorias', 'nombre', row.categoria || 'General', { 
                nombre: row.categoria || 'General', 
                slug: (row.categoria || 'general').toLowerCase().trim().replace(/ /g, '-') 
            });
            const thickVal = parseFloat(row.espesor) || 18;
            const thickId = await getOrCreateItem('espesores', 'valor', thickVal, { valor: thickVal });

            // II. Automatización de SKU y SLUG
            const slug = (row.nombre + '-' + row.marca + '-' + thickVal).toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                .replace(/[^a-z0-z0-9]/g, '-').replace(/-+/g, '-');
            
            const sku = row.sku || `${row.categoria.substring(0,3)}-${row.nombre.substring(0,3)}-${row.marca.substring(0,3)}-${thickVal}`.toUpperCase();

            // III. Gestión de Imagen
            let imageId = LOGO_ID;
            if (row.foto) {
                // Lógica de carpetas recursivas en Directus
                const pathParts = row.foto.split('/');
                const fileName = pathParts.pop();
                let parentFolderId = null;

                for (const part of pathParts) {
                    parentFolderId = await getOrCreateFolder(part, parentFolderId);
                }

                // Aquí el script debería leer el archivo físico del VPS si se ejecuta allí
                // Por ahora simulamos la vinculación si el archivo ya fue subido o existe en staging
                // IMPORTANTE: En producción este script usaría fs.createReadStream para subir el archivo
                console.log(`🖼️ Vinculando imagen: ${fileName} en carpeta ${pathParts.join('/') || 'root'}`);
                
                // Opción: Buscar si ya existe el archivo en Directus
                const existingFiles = await client.request(readFiles({ filter: { filename_download: { _eq: fileName } } }));
                if (existingFiles.length > 0) {
                    imageId = existingFiles[0].id;
                } else {
                    console.warn(`⚠️ Foto ${fileName} no encontrada en Directus Assets. Usando Logo Fallback.`);
                }
            }

            // IV. Creación del Material
            const materialData = {
                nombre: row.nombre,
                sku: sku,
                slug: slug,
                id_marca: brandId,
                id_categoria: catId,
                id_espesor: thickId,
                precio_m2: parseFloat(row.precio) || 0,
                stock: parseInt(row.stock) || 0,
                activo: true,
                imagen: imageId
            };

            await client.request(createItem('materiales', materialData));
            console.log(`✅ ${row.nombre} cargado con SKU: ${sku}`);
            count++;

        } catch (err) {
            console.error(`❌ Error con ${row.nombre}:`, err.message);
        }
    }

    console.log(`\n--- ✨ PROCESO FINALIZADO: ${count} productos nuevos ---`);
}

ingest().catch(console.error);
