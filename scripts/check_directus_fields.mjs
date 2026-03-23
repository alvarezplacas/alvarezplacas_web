const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function checkFields() {
    console.log("--- Checking Directus Collection Fields ---");
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const access_token = loginData.data.access_token;
        
        const res = await fetch(`${DIRECTUS_URL}/fields/clientes`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const body = await res.json();
        console.log("Fields in 'clientes':");
        body.data.forEach(f => {
            console.log(`- ${f.field} (${f.type})`);
        });

        // Also check one item to see the data structure
        const itemRes = await fetch(`${DIRECTUS_URL}/items/clientes?limit=1`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const itemBody = await itemRes.json();
        console.log("\nSample item data:");
        console.log(JSON.stringify(itemBody.data[0], null, 2));

    } catch (e) {
        console.error("Error checking fields:", e.message);
    }
}

checkFields();
