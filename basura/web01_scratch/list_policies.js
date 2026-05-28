import { createDirectus, rest, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function listPolicies() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        // Manual fetch for policies if SDK doesn't have readPolicies (it might not be in the default rest())
        // But let's try reading from 'directus_policies' via regular readItems
        // Actually, let's use the raw fetch for system collections
        const token = (await client.getToken()) || '';
        const res = await fetch(`${DIRECTUS_URL}/policies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Políticas encontradas:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

listPolicies();
