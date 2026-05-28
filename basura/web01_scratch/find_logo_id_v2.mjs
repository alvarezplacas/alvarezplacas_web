import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function findTheRealLogo() {
    console.log("--- 🕵️ Buscando el UUID del Logo Real ---");
    
    try {
        // 1. Login para obtener token fresco
        const loginResp = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginResp.json();
        if (!loginResp.ok) throw new Error("Login fallido");
        const token = loginData.data.access_token;

        // 2. Buscar archivos que contengan "Logo"
        const res = await fetch(`${DIRECTUS_URL}/files?filter[title][_contains]=Logo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        console.log("\n📁 Resultado de búsqueda:");
        if (data.data && data.data.length > 0) {
            data.data.forEach(f => {
                console.log(`✅ ENCONTRADO:`);
                console.log(`   - ID: ${f.id}`);
                console.log(`   - Título: ${f.title}`);
                console.log(`   - Extensión: ${f.type}`);
                console.log(`   - Carpeta ID: ${f.folder}`);
            });
        } else {
            console.log("❌ No se encontró nada con 'Logo'. Listando todos los archivos...");
            const allRes = await fetch(`${DIRECTUS_URL}/files?limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allData = await allRes.json();
            allData.data.forEach(f => console.log(`- ${f.id} : ${f.title}`));
        }
    } catch (e) {
        console.error("❌ Error catastrófico:", e.message);
    }
}

findTheRealLogo();
