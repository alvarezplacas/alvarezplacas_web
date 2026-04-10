import { createDirectus, rest, staticToken, createItem, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKEN = 'alvarez-api-token-v16-2026';

async function restoreSadepan() {
    const client = createDirectus(DIRECTUS_URL)
        .with(staticToken(TOKEN))
        .with(rest());

    try {
        const existing = await client.request(readItems('marcas', { filter: { nombre: { _eq: 'Sadepan' } } }));
        if (existing.length === 0) {
            console.log("🌱 Insertando Sadepan en el catálogo...");
            await client.request(createItem('marcas', { nombre: 'Sadepan' }));
        } else {
            console.log("✅ Sadepan ya existe en el catálogo.");
        }
    } catch (e) {
        console.error("❌ Error al restaurar Sadepan:", e);
    }
}

restoreSadepan();
