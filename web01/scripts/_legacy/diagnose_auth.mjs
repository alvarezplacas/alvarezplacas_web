// Diagnóstico completo del estado de autenticación de Directus
const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function diagnose() {
    console.log("--- 🔍 Diagnóstico de Directus Auth ---");
    console.log("URL:", DIRECTUS_URL);
    
    // 1. Test de salud
    console.log("\n1. Verificando /server/health...");
    try {
        const health = await fetch(`${DIRECTUS_URL}/server/health`);
        const healthData = await health.json();
        console.log("   Status:", health.status, healthData.status);
    } catch (e) {
        console.log("   Error:", e.message);
    }
    
    // 2. Login con email/password
    console.log("\n2. Intentando login con email/password...");
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@alvarezplacas.com.ar',
                password: 'JavierMix2026!'
            })
        });
        const loginData = await loginRes.json();
        console.log("   HTTP Status:", loginRes.status);
        
        if (loginData.data?.access_token) {
            console.log("\n   ✅ LOGIN EXITOSO!");
            const token = loginData.data.access_token;
            console.log("   Token (primeros 20 chars):", token.substring(0, 20) + "...");
            
            // 3. Verificar identidad con el nuevo token
            console.log("\n3. Verificando identidad con token dinámico...");
            const meRes = await fetch(`${DIRECTUS_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const meData = await meRes.json();
            console.log("   HTTP Status:", meRes.status);
            console.log("   User Email:", meData.data?.email);
            console.log("   Role:", JSON.stringify(meData.data?.role));
            
            // 4. Intentar leer colecciones con el token dinámico
            console.log("\n4. Intentando leer /collections con token dinámico...");
            const collRes = await fetch(`${DIRECTUS_URL}/collections`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const collData = await collRes.json();
            console.log("   HTTP Status:", collRes.status);
            if (collData.data) {
                const nonSystem = collData.data.filter(c => !c.collection.startsWith('directus_'));
                console.log("   Colecciones (no-sistema):", nonSystem.map(c => c.collection));
            } else {
                console.log("   Error:", JSON.stringify(collData.errors));
            }
            
        } else {
            console.log("   ❌ LOGIN FALLIDO:", JSON.stringify(loginData));
        }
    } catch (e) {
        console.log("   Exception:", e.message);
    }
    
    // 5. Test con token estático actual
    console.log("\n5. Verificando token estático actual...");
    try {
        const tokenRes = await fetch(`${DIRECTUS_URL}/users/me`, {
            headers: { 'Authorization': 'Bearer a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE' }
        });
        const tokenData = await tokenRes.json();
        console.log("   HTTP Status:", tokenRes.status);
        if (tokenRes.ok) {
            console.log("   ✅ Token estático válido! Email:", tokenData.data?.email);
        } else {
            console.log("   ❌ Token estático inválido:", tokenData.errors?.[0]?.message);
        }
    } catch (e) {
        console.log("   Exception:", e.message);
    }
}

diagnose();
