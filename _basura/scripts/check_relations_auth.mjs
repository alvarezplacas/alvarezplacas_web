const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkRelations() {
    console.log("--- Checking Directus Relations ---");
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const access_token = loginData.data.access_token;
        
        const res = await fetch(`${DIRECTUS_URL}/relations`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const body = await res.json();
        
        const productRelations = body.data.filter(r => r.collection === 'productos');
        productRelations.forEach(r => {
            console.log(`- Field: ${r.field} | Target: ${r.related_collection}`);
        });

    } catch (e) {
        console.error("Error checking relations:", e.message);
    }
}

checkRelations();
