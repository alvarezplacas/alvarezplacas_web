import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function lastCheck() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        console.log("Checking 'Marcas' (capital M):");
        const M = await client.request(readItems('Marcas', { limit: 5 }));
        console.log(`  Count: ${M.length}`);
        
        console.log("Checking 'marcas' (lowercase m):");
        const m = await client.request(readItems('marcas', { limit: 5 }));
        console.log(`  Count: ${m.length}`);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

lastCheck();
