import { createDirectus, rest, staticToken, createCollection, createField, createRelation } from '@directus/sdk';
import dotenv from 'dotenv';
dotenv.config();

const directusUrl = 'https://admin.alvarezplacas.com.ar';
// Token estático provisto por Javiermix
const staticTokenValue = 'jb-_twuOduXRpNMS_mN5-6jKKlE1ddH8';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

async function safeCreate(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name} procesada con éxito`);
    } catch (e) {
        if (e.errors?.[0]?.message?.includes('already exists')) {
            console.log(`⚠️ ${name} ya existe. Saltando...`);
        } else {
            console.error(`❌ Error en ${name}:`, e.errors || e);
        }
    }
}

async function buildSchema() {
    console.log('🚀 Iniciando construcción de Arquitectura en Directus...');

    // 1. Crear Colección 'categorias'
    await safeCreate('categorias', async () => {
        await client.request(createCollection({
            collection: 'categorias',
            meta: { icon: 'category', note: 'Jerarquía principal (ej. Placas, Herrajes)' },
            schema: { name: 'categorias' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', readonly: true, hidden: true }, schema: { is_primary_key: true } },
                { field: 'nombre', type: 'string', meta: { interface: 'input' } },
                { field: 'slug', type: 'string', meta: { interface: 'input' } },
                { field: 'icono', type: 'string', meta: { interface: 'icon' } }
            ]
        }));
        await client.request(createField('categorias', { field: 'padre', type: 'uuid', meta: { interface: 'select-dropdown-m2o' } }));
        await client.request(createRelation({ collection: 'categorias', field: 'padre', related_collection: 'categorias' }));
    });

    // 2. Crear Colección 'marcas'
    await safeCreate('marcas', async () => {
        await client.request(createCollection({
            collection: 'marcas',
            meta: { icon: 'verified', note: 'Egger, Faplac, etc.' },
            schema: { name: 'marcas' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', readonly: true, hidden: true }, schema: { is_primary_key: true } },
                { field: 'nombre', type: 'string', meta: { interface: 'input' } },
                { field: 'logo', type: 'uuid', meta: { interface: 'file-image' } },
                { field: 'descripcion', type: 'text', meta: { interface: 'input-rich-text-html' } }
            ]
        }));
        await client.request(createRelation({ collection: 'marcas', field: 'logo', related_collection: 'directus_files' }));
    });

    // 3. Crear Colección 'lineas'
    await safeCreate('lineas', async () => {
        await client.request(createCollection({
            collection: 'lineas',
            meta: { icon: 'style', note: 'Línea Hilados, Línea Étnica, etc.' },
            schema: { name: 'lineas' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', readonly: true, hidden: true }, schema: { is_primary_key: true } },
                { field: 'nombre', type: 'string', meta: { interface: 'input' } },
                { field: 'marca_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o' } },
                { field: 'descripcion', type: 'text', meta: { interface: 'input-multiline' } }
            ]
        }));
        await client.request(createRelation({ collection: 'lineas', field: 'marca_id', related_collection: 'marcas' }));
    });

    // 4. Crear Colección 'productos'
    await safeCreate('productos', async () => {
        await client.request(createCollection({
            collection: 'productos',
            meta: { icon: 'inventory_2', note: 'Catálogo Madre' },
            schema: { name: 'productos' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', readonly: true, hidden: true }, schema: { is_primary_key: true } },
                { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Publicado', value: 'published' }, { text: 'Borrador', value: 'draft' }] } } },
                { field: 'nombre', type: 'string', meta: { interface: 'input' } },
                { field: 'categoria_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o' } },
                { field: 'marca_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o' } },
                { field: 'linea_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o' } },
                { field: 'imagen_cover', type: 'uuid', meta: { interface: 'file-image' } },
                { field: 'tags', type: 'json', meta: { interface: 'tags' } }
            ]
        }));
        await client.request(createRelation({ collection: 'productos', field: 'categoria_id', related_collection: 'categorias' }));
        await client.request(createRelation({ collection: 'productos', field: 'marca_id', related_collection: 'marcas' }));
        await client.request(createRelation({ collection: 'productos', field: 'linea_id', related_collection: 'lineas' }));
        await client.request(createRelation({ collection: 'productos', field: 'imagen_cover', related_collection: 'directus_files' }));
    });

    // 5. Crear Colección 'variantes_sku'
    await safeCreate('variantes_sku', async () => {
        await client.request(createCollection({
            collection: 'variantes_sku',
            meta: { icon: 'straighten', note: 'Precios y Stock de las Placas Reales' },
            schema: { name: 'variantes_sku' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', readonly: true, hidden: true }, schema: { is_primary_key: true } },
                { field: 'producto_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o' } },
                { field: 'codigo_proveedor', type: 'string', meta: { interface: 'input' } },
                { field: 'especificacion', type: 'string', meta: { interface: 'input', note: 'Ej: 18mm, 15mm' } },
                { field: 'acabado', type: 'string', meta: { interface: 'input', note: 'Color o textura' } },
                { field: 'precio', type: 'decimal', meta: { interface: 'input' } },
                { field: 'stock', type: 'integer', meta: { interface: 'input' } },
                { field: 'ultima_act', type: 'timestamp', meta: { interface: 'datetime' } }
            ]
        }));
        await client.request(createRelation({ collection: 'variantes_sku', field: 'producto_id', related_collection: 'productos' }));
    });

    console.log('🎉 Estructura Profesional Completada. Revisa tu panel en admin.alvarezplacas.com.ar');
}

buildSchema();
