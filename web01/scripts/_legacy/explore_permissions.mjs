import { createDirectus, rest, authentication, readRoles, readUsers } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function explore() {
    console.log("--- Exploring Roles and Users ---");
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        console.log("Fetching roles...");
        const roles = await client.request(readRoles({ fields: ['id', 'name', 'admin_access'] }));
        console.log("Roles found:", roles);

        const adminRole = roles.find(r => r.admin_access === true);
        if (adminRole) {
            console.log(`Admin role ID: ${adminRole.id}`);
            console.log("Fetching users in admin role...");
            const users = await client.request(readUsers({ filter: { role: { _eq: adminRole.id } } }));
            console.log("Admin Users:", users.map(u => u.email));
        } else {
            console.log("No explicit Admin role found with admin_access=true!");
        }

    } catch (e) {
        console.error('❌ Error explore:', e.message || e);
    }
}

explore();
