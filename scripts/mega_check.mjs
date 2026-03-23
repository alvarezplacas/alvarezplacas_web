import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function megaCheck() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const collections = ['Marca', 'Marcaa', 'Marcas', 'marcas'];
        for (const c of collections) {
            try {
                const items = await client.request(readItems(c));
                console.log(`Collection '${c}': ${items.length} items`);
            } catch (e) {
                console.log(`Collection '${c}': ERROR (${e.message})`);
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

megaCheck();
