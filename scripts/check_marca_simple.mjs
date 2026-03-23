import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkMarca() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Logged in");
        
        try {
            const items = await client.request(readItems('Marca', { limit: 1 }));
            console.log("✅ 'Marca' collection is readable. Item count sample:", items.length);
        } catch (e) {
            console.log("❌ Error reading 'Marca' collection:", e.message || e);
            if (e.errors) console.log(JSON.stringify(e.errors, null, 2));
        }

    } catch (e) {
        console.error("Critical Login Error:", e.message);
    }
}

checkMarca();
