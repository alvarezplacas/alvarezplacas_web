import { createDirectus, rest, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkFields() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const access_token = loginData.data.access_token;
        
        const res = await fetch(`${DIRECTUS_URL}/fields/Marca`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const body = await res.json();
        
        console.log("--- Fields in 'Marca' ---");
        body.data.forEach(f => {
            console.log(`- ${f.field} (${f.type})`);
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkFields();
