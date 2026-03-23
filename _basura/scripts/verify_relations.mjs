import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function verify() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Logged in for verification");
        
        const items = await client.request(readItems('productos', {
            fields: ['sku', 'nombre', 'marca_id.nombre', 'categoria_id.nombre'],
            limit: 5
        }));
        
        console.log(JSON.stringify(items, null, 2));

    } catch (e) {
        console.error("Error during verification:", e.message || e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

verify();
