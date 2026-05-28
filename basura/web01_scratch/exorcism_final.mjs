import { createDirectus, rest, staticToken, deleteCollection, readCollections, readItems, deleteItems, deleteItem } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(ADMIN_TOKEN))
    .with(rest());

async function cleanup() {
    console.log("--- 🧹 Iniciando Limpieza Final (Exorcismo V3) ---");

    try {
        // 1. Eliminar colección obsoleta 'branches'
        const collections = await client.request(readCollections());
        if (collections.some(c => c.collection === 'branches')) {
            console.log("🗑️ Eliminando colección obsoleta 'branches'...");
            try {
                await client.request(deleteCollection('branches'));
                console.log("✅ 'branches' eliminada.");
            } catch (e) {
                console.warn("⚠️ No se pudo eliminar 'branches' (probablemente tiene dependencias).");
            }
        }

        // 2. Vaciar 'materiales' (141 registros antiguos)
        console.log("🗑️ Vaciando colección 'materiales'...");
        const items = await client.request(readItems('materiales', { fields: ['id'], limit: -1 }));
        if (items.length > 0) {
            const ids = items.map(i => i.id);
            await client.request(deleteItems('materiales', ids));
            console.log(`✅ ${ids.length} materiales eliminados.`);
        } else {
            console.log("ℹ️ No hay materiales para eliminar.");
        }

        // 3. Normalizar 'marcas'
        console.log("🧼 Normalizando 'marcas'...");
        const marcas = await client.request(readItems('marcas', { fields: ['id', 'nombre'], limit: -1 }));
        const seen = new Set();
        for (const marca of marcas) {
            const cleanName = marca.nombre.trim().toUpperCase();
            if (seen.has(cleanName)) {
                console.log(`🗑️ Eliminando marca duplicada: ${marca.nombre} (ID: ${marca.id})`);
                await client.request(deleteItem('marcas', marca.id));
            } else {
                seen.add(cleanName);
                // Opcional: Podríamos forzar que todas sean Capital Case, 
                // pero el script de ingesta ya lo hace con 'cleanMarca'.
                // Dejamos una de cada una para que el script la encuentre y use.
            }
        }
        console.log("✅ Marcas normalizadas.");

        console.log("--- ✨ Limpieza Finalizada ---");
    } catch (e) {
        console.error("❌ Error durante la limpieza:", e.message || e);
    }
}

cleanup();
