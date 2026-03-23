const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkCollection() {
    console.log("--- Checking Directus Collection Metadata ---");
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const { data: { access_token } } = await loginRes.json();
        
        const res = await fetch(`${DIRECTUS_URL}/collections/clientes`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const body = await res.json();
        console.log("Collection 'clientes' metadata:");
        console.log(JSON.stringify(body.data, null, 2));

    } catch (e) {
        console.error("Error checking collection:", e.message);
    }
}

checkCollection();
