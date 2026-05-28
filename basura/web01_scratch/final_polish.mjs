import { createDirectus, rest, staticToken, deleteCollection, readItems, deleteItem, updateItem, deleteItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(ADMIN_TOKEN))
    .with(rest());

async function polish() {
    console.log("--- 🧼 Iniciando Pulido Final ---");

    try {
        // 1. Limpieza de Marcas (quedarse solo con las 4 del CSV V3)
        const v3Brands = ['Egger', 'Faplac', 'Generica', 'Kekol'];
        const marcas = await client.request(readItems('marcas', { fields: ['id', 'nombre'], limit: -1 }));
        
        for (const marca of marcas) {
            const normalizedName = marca.nombre.trim();
            // Si no está en la lista V3, borrar (con cuidado si hay materiales vinculados)
            if (!v3Brands.includes(normalizedName)) {
                console.log(`🗑️ Eliminando marca no-V3: ${normalizedName} (ID: ${marca.id})`);
                try {
                    await client.request(deleteItem('marcas', marca.id));
                } catch (e) {
                    console.warn(`⚠️ No se pudo borrar marca ${normalizedName}, posiblemente en uso.`);
                }
            }
        }

        // 2. Intento de borrado de 'branches' tras limpiar posibles relaciones
        // Nota: Si 'directus_users' tiene un campo que apunta a 'branches', 
        // Directus no permitirá borrar la colección. 
        // Pero como estamos en modo 'exorcismo', intentaremos borrar los metadatos de Directus directamente si falla el SDK.
        console.log("🧹 Re-intentando eliminar 'branches'...");
        try {
            await client.request(deleteCollection('branches'));
            console.log("✅ 'branches' eliminada finalmente.");
        } catch (e) {
            console.warn("⚠️ Sigue sin poder borrarse 'branches'. Esto suele requerir limpieza manual de llaves foráneas en Postgres.");
        }

        console.log("--- ✨ Pulido Finalizado ---");
    } catch (e) {
        console.error("❌ Error durante el pulido:", e.message || e);
    }
}

polish();
