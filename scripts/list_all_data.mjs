import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function listAll() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const lines = await client.request(readItems('lineas', { limit: -1 }));
        console.log(`--- Total Lineas: ${lines.length} ---`);
        lines.forEach(l => console.log(`- ${l.id}: "${l.nombre}"`));

        const cats = await client.request(readItems('categorias', { limit: -1 }));
        console.log(`\n--- Total Categorias: ${cats.length} ---`);
        cats.forEach(c => console.log(`- ${c.id}: "${c.nombre}"`));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

listAll();
