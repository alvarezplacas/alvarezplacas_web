import { createDirectus, rest, authentication, readPermissions } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function inspectPermissionsSchema() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const perms = await client.request(readPermissions({ limit: 1 }));
        console.log("Muestra de Permiso:");
        console.log(JSON.stringify(perms[0], null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

inspectPermissionsSchema();
