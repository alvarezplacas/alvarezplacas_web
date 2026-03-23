const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkProductFields() {
    console.log("--- Checking 'productos' Collection Fields ---");
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const access_token = loginData.data.access_token;
        
        const res = await fetch(`${DIRECTUS_URL}/fields/productos`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const body = await res.json();
        
        body.data.forEach(f => {
            console.log(`- ${f.field} (${f.type}) | Meta: ${f.meta?.interface || 'no-interface'}`);
        });

    } catch (e) {
        console.error("Error checking fields:", e.message);
    }
}

checkProductFields();
