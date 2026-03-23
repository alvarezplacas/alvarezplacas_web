import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkPermissions() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        console.log("--- Checking Permissions (Public Role) ---");
        // Get Public Role ID (usually always null for public, or a specific ID)
        // Let's just list all permissions
        const perms = await client.request(readItems('directus_permissions', {
            filter: { role: { _null: true } }
        }));
        
        perms.forEach(p => {
            console.log(`- Collection: ${p.collection} | Action: ${p.action}`);
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkPermissions();
