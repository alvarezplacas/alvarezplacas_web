import { createDirectus, rest, authentication, createField } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function addImageField() {
    console.log("--- 🛠️ Añadiendo Campo de Imagen a Directus ---");
    
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        console.log(`Conectando a ${DIRECTUS_URL}...`);
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Login exitoso.");

        console.log("Creando campo 'image' en la colección 'materials'...");
        
        // El tipo 'file' en Directus se representa como un UUID que apunta a directus_files
        await client.request(createField('materials', {
            field: 'image',
            type: 'uuid',
            meta: {
                interface: 'file',
                display_name: 'Imagen del Material',
                note: 'Imagen principal que se mostrará en el catálogo (AVIF recomendado)',
                width: 'full'
            },
            schema: {
                foreign_key_table: 'directus_files',
                foreign_key_column: 'id'
            }
        }));

        console.log("✅ Campo 'image' creado correctamente en 'materials'.");
        console.log("--- ✨ Proceso Finalizado ---");
        
    } catch (e) {
        if (e.errors && e.errors[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
            console.log("⚠️ El campo 'image' ya existe en la colección 'materials'.");
        } else {
            console.error("❌ Error al crear el campo:", e.message || e);
            if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
        }
    }
}

addImageField().catch(console.error);
