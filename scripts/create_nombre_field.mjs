const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function createNombreField() {
    try {
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.access_token;
        
        console.log("Attempting to create 'nombre' field in 'Marca'...");
        const res = await fetch(`${DIRECTUS_URL}/fields/Marca`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field: 'nombre',
                type: 'string',
                meta: {
                    interface: 'input',
                    width: 'full'
                }
            })
        });
        const body = await res.json();
        if (body.errors) {
            console.error("Error creating field:", JSON.stringify(body.errors, null, 2));
        } else {
            console.log("✅ Field 'nombre' created successfully in 'Marca'!");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

createNombreField();
