const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkPermissionsFine() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const access_token = loginData.data.access_token;
        
        // List all permissions for PUBLIC role (role is null)
        const res = await fetch(`${DIRECTUS_URL}/permissions?filter={"role":{"_null":true}}`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const body = await res.json();
        
        console.log("--- Public Permissions (Detailed) ---");
        if (body.data) {
            body.data.forEach(p => {
                console.log(`[${p.collection}] Action: ${p.action} | Fields: ${JSON.stringify(p.fields)}`);
            });
        } else {
            console.log("No permissions found for Public role.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkPermissionsFine();
