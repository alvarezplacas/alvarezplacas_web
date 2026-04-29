import { createDirectus, rest, staticToken, createRelation, updateField } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(TOKEN))
    .with(rest());

async function fixRelations() {
    console.log("--- 🏗️ Configurando Relaciones y UI de Catálogo ---");
    
    try {
        // 1. Relación de IMAGEN (Materiales -> directus_files)
        console.log("📸 Vinculando Imagen a Galería...");
        try {
            await client.request(createRelation({
                collection: 'materiales',
                field: 'imagen',
                related_collection: 'directus_files',
                schema: { 
                    column: 'imagen', 
                    foreign_key_table: 'materiales', 
                    foreign_key_column: 'imagen' 
                },
                meta: {
                    interface: 'file-image',
                    display: 'image',
                    width: 'full'
                }
            }));
        } catch (e) {
            console.log("ℹ️ Relación de imagen ya existe o se gestiona manualmente.");
        }

        // 2. Relación de MARCA (M2O)
        console.log("🏷️ Configurando selector de Marca...");
        await client.request(updateField('materiales', 'id_marca', {
            meta: {
                interface: 'select-dropdown-m2o',
                display: 'related-values',
                options: { template: '{{nombre}}' }
            }
        }));

        // 3. Relación de CATEGORIA (M2O)
        console.log("📁 Configurando selector de Categoría...");
        await client.request(updateField('materiales', 'id_categoria', {
            meta: {
                interface: 'select-dropdown-m2o',
                display: 'related-values',
                options: { template: '{{nombre}}' }
            }
        }));

        // 4. Relación de ESPESOR (M2O)
        console.log("📏 Configurando selector de Espesor...");
        await client.request(updateField('materiales', 'id_espesor', {
            meta: {
                interface: 'select-dropdown-m2o',
                display: 'related-values',
                options: { template: '{{valor}}mm' }
            }
        }));

        console.log("--- ✨ Relaciones y UI Listas ---");
    } catch (e) {
        console.error("❌ Error configurando relaciones:", e.errors?.[0]?.message || e.message);
    }
}

fixRelations();
