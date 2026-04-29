import { createDirectus, rest, staticToken, updateField, createField } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_TOKEN = 'alvarez-api-token-v16-2026';

async function fixFields() {
    console.log("--- 🔧 Corrigiendo Campos de la Colección 'clientes' ---");
    
    const client = createDirectus(DIRECTUS_URL)
        .with(staticToken(ADMIN_TOKEN))
        .with(rest());

    try {
        // 1. Renombrar 'nombre' -> 'name'
        console.log("🔄 Renombrando 'nombre' a 'name'...");
        await client.request(updateField('clientes', 'nombre', {
            field: 'name',
            meta: { display_name: 'Nombre Completo' }
        }));

        // 2. Renombrar 'vendedor_asignado' -> 'vendedor_id'
        console.log("🔄 Renombrando 'vendedor_asignado' a 'vendedor_id'...");
        await client.request(updateField('clientes', 'vendedor_asignado', {
            field: 'vendedor_id',
            meta: { display_name: 'Vendedor Asignado' }
        }));

        // 3. Añadir 'registration_date'
        console.log("➕ Añadiendo 'registration_date'...");
        await client.request(createField('clientes', {
            field: 'registration_date',
            type: 'timestamp',
            meta: { interface: 'datetime', display_name: 'Fecha de Registro' }
        }));

        console.log("--- ✨ Campos Corregidos con Éxito ---");

    } catch (e) {
        console.error("❌ Error durante la corrección de campos:", e.message || e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

fixFields();
