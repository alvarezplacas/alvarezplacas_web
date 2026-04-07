import fs from 'fs';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkTables() {
    console.log("--- 🕵️ Verificando Tablas ---");
    
    const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    if (!loginResp.ok) {
        console.error("❌ Error de login:", await loginResp.text());
        return;
    }
    
    const { data: { access_token: token } } = await loginResp.json();
    const headers = { 'Authorization': `Bearer ${token}` };

    const resp = await fetch(`${DIRECTUS_URL}/collections`, { headers });
    const { data: collections } = await resp.json();
    
    console.log("Tablas encontradas:");
    collections.forEach(c => {
        if (!c.collection.startsWith('directus_')) {
            console.log(`- ${c.collection}`);
        }
    });
}

checkTables().catch(console.error);
