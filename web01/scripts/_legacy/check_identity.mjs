import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkMe() {
    console.log("--- Checking User Identity ---");
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        const me = await client.request(readMe({ fields: ['*', 'role.*'] }));
        console.log('User Email:', me.email);
        console.log('User Role Name:', me.role?.name);
        console.log('User Role Admin Access:', me.role?.admin_access);
    } catch (e) {
        console.error('❌ Error checking identity:', e.message || e);
    }
}

checkMe();
