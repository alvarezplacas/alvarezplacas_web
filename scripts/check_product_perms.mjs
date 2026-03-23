const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkProductFieldsPer() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const access_token = loginData.data.access_token;
        
        const res = await fetch(`${DIRECTUS_URL}/permissions?filter={"collection":{"_eq":"productos"},"role":{"_null":true}}`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const body = await res.json();
        
        console.log("--- Public Permissions for 'productos' ---");
        if (body.data && body.data.length > 0) {
            body.data.forEach(p => {
                console.log(`Action: ${p.action} | Fields: ${JSON.stringify(p.fields)}`);
            });
        } else {
            console.log("No specific permissions found for Public on 'productos'.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkProductFieldsPer();
