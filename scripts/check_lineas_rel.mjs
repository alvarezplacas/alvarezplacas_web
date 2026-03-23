const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkLineasRelations() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        const res = await fetch(`${DIRECTUS_URL}/relations/lineas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const body = await res.json();
        
        console.log("--- Relations in 'lineas' ---");
        body.data.forEach(r => {
            console.log(`- Field: ${r.field} | Target: ${r.related_collection}`);
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkLineasRelations();
