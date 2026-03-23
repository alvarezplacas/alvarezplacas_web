import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkIds() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        console.log("--- Marcas ---");
        const marcas = await client.request(readItems('marcas'));
        marcas.forEach(m => console.log(`  - ${m.id} : ${m.nombre}`));
        
        console.log("--- Categorias ---");
        const cats = await client.request(readItems('categorias'));
        cats.forEach(c => console.log(`  - ${c.id} : ${c.nombre}`));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkIds();
