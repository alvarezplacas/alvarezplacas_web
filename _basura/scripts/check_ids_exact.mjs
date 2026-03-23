import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkIdsExact() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        console.log("--- Collection: 'Marca' (Capital M, singular) ---");
        const brands = await client.request(readItems('Marca'));
        brands.forEach(b => console.log(`  - ${b.id} : ${b.nombre}`));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkIdsExact();
