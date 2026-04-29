import { createDirectus, rest, staticToken, createItem, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
dotenv.config();

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const staticTokenValue = 'jb-_twuOduXRpNMS_mN5-6jKKlE1ddH8';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

// Cache to prevent duplicate queries
const cache = { categorias: {}, marcas: {}, lineas: {}, productos: {} };

async function getOrCreate(collection, filterField, filterValue, createData) {
    if (cache[collection][filterValue]) return cache[collection][filterValue];

    try {
        const existing = await client.request(readItems(collection, {
            filter: { [filterField]: { _eq: filterValue } },
            limit: 1
        }));
        
        if (existing && existing.length > 0) {
            cache[collection][filterValue] = existing[0].id;
            return existing[0].id;
        }

        const created = await client.request(createItem(collection, createData));
        cache[collection][filterValue] = created.id;
        return created.id;
    } catch (e) {
        console.error(`Error en ${collection} para ${filterValue}:`, e.errors || e);
        return null;
    }
}

async function ingestCatalog() {
    console.log('🚀 Iniciando Ingesta de Catálogo...');
    const csvPath = path.resolve('database/catalogo_01.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('❌ No se encontró catalogo_01.csv en', csvPath);
        return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        delimiter: ';',
        skip_empty_lines: true
    });

    console.log(`📥 Se encontraron ${records.length} productos en el CSV. Subiendo a la nube...`);

    for (const row of records) {
        const marcaName = row.marca?.trim() || 'Genérica';
        const catName = row.categoria?.trim() || 'General';
        const lineaName = row.linea?.trim() || 'Estándar';
        const prodName = row.nombre?.trim() || 'Sin Nombre';
        const sku = row.sku?.trim();

        if (!sku) continue; // Skip bad rows

        // 1. Marca
        const marcaId = await getOrCreate('marcas', 'nombre', marcaName, { nombre: marcaName });
        
        // 2. Categoria
        const catId = await getOrCreate('categorias', 'nombre', catName, { nombre: catName, slug: catName.toLowerCase() });

        // 3. Linea
        const lineaKey = `${marcaName}-${lineaName}`;
        const lineaId = await getOrCreate('lineas', 'nombre', lineaKey, { 
            nombre: lineaName, 
            marca_id: marcaId 
        });

        // 4. Producto
        const productoKey = `${marcaName}-${prodName}`;
        const prodId = await getOrCreate('productos', 'nombre', productoKey, {
            nombre: prodName,
            status: 'published',
            marca_id: marcaId,
            categoria_id: catId,
            linea_id: lineaId,
            tags: [row.tags]
        });

        // 5. Variante SKU (Stock y Precio)
        // Check if SKU exists to avoid duplicates
        const existingSku = await client.request(readItems('variantes_sku', { filter: { codigo_proveedor: { _eq: sku } }, limit: 1 }));
        if (!existingSku || existingSku.length === 0) {
            await client.request(createItem('variantes_sku', {
                producto_id: prodId,
                codigo_proveedor: sku,
                especificacion: `${row.attr_espesor || ''}mm ${row.attr_medidas || ''}`.trim(),
                acabado: row.attr_textura || row.attr_color,
                precio: parseFloat(row.precio) || 0,
                stock: parseInt(row.stock) || 0,
                ultima_act: new Date().toISOString()
            }));
            process.stdout.write('+');
        } else {
            process.stdout.write('.');
        }
    }
    console.log('\n✅ ¡Catálogo inyectado con éxito!');
}

ingestCatalog();
