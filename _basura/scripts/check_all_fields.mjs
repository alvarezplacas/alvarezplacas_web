const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkAllFields() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        for (const coll of ['Marca', 'categorias', 'lineas']) {
            const res = await fetch(`${DIRECTUS_URL}/fields/${coll}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const body = await res.json();
            console.log(`--- Fields in '${coll}' ---`);
            if (body.data) {
                body.data.forEach(f => console.log(`- ${f.field}`));
            } else {
                console.log("No data found or error.");
            }
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkAllFields();
