import { createDirectus, rest, authentication, readRole } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const FRONTEND_ROLE_ID = '7a946998-c9df-42ed-aacc-817028a927f1';

async function inspectRole() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const role = await client.request(readRole(FRONTEND_ROLE_ID, {
            fields: ['*']
        }));
        console.log("Detalles del Rol Frontend:");
        console.log(JSON.stringify(role, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

inspectRole();
