import fs from 'fs';
import path from 'path';
import { createDirectus, rest, staticToken, readItems, createItem, uploadFiles } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

async function ingest() {
    console.log("--- 🚀 Iniciando Ingestión de Productos Externos ---");
    const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

    const products = JSON.parse(fs.readFileSync('./scripts/extracted_products.json', 'utf-8'));
    console.log(`Leídos ${products.length} productos.`);

    // Cache para evitar queries repetitivas
    const brandCache = {};
    const catCache = {};

    for (const p of products) {
        console.log(`\n📦 Procesando: ${p.name}`);

        try {
            // 1. Gestionar Marca
            if (!brandCache[p.brand]) {
                const brands = await client.request(readItems('marcas', { filter: { nombre: { _eq: p.brand } } }));
                if (brands.length > 0) {
                    brandCache[p.brand] = brands[0].id;
                } else {
                    const newBrand = await client.request(createItem('marcas', { nombre: p.brand }));
                    brandCache[p.brand] = newBrand.id;
                    console.log(`  🆕 Marca creada: ${p.brand}`);
                }
            }

            // 2. Gestionar Categoría
            if (!catCache[p.category]) {
                const cats = await client.request(readItems('categorias', { filter: { nombre: { _eq: p.category } } }));
                if (cats.length > 0) {
                    catCache[p.category] = cats[0].id;
                } else {
                    const newCat = await client.request(createItem('categorias', { 
                        nombre: p.category, 
                        slug: p.category.toLowerCase().replace(/ /g, '-') 
                    }));
                    catCache[p.category] = newCat.id;
                    console.log(`  🆕 Categoría creada: ${p.category}`);
                }
            }

            // 3. Descargar y Subir Imagen
            let fileId = null;
            if (p.image_url) {
                console.log(`  🖼️ Descargando imagen: ${p.image_url}`);
                const imgResp = await fetch(p.image_url);
                const buffer = await imgResp.arrayBuffer();
                
                const formData = new FormData();
                const blob = new Blob([buffer]);
                const fileName = `${p.name.replace(/ /g, '_').toLowerCase()}.jpg`;
                formData.append('file', blob, fileName);
                formData.append('title', p.name);

                // Subida via raw fetch por facilidad con multipart
                const uploadResp = await fetch(`${DIRECTUS_URL}/files`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` },
                    body: formData
                });
                const uploadData = await uploadResp.json();
                if (uploadResp.ok) {
                    fileId = uploadData.data.id;
                    console.log(`  ✅ Imagen subida (ID: ${fileId})`);
                } else {
                    console.error("  ❌ Error subiendo imagen:", uploadData);
                }
            }

            // 4. Crear Material
            await client.request(createItem('materiales', {
                nombre: p.name,
                id_marca: brandCache[p.brand],
                id_categoria: catCache[p.category],
                id_espesor: 1, // Default para no-tableros
                precio_m2: 0,
                stock: 10,
                activo: true,
                imagen: fileId
            }));
            console.log(`  ✅ Material creado con éxito.`);

        } catch (e) {
            console.error(`  ❌ Error procesando ${p.name}:`, e.message);
        }
    }

    console.log("\n--- ✨ Ingestión Finalizada ---");
}

ingest();
