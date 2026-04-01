const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

async function debugAuth() {
    console.log("--- Depuración de Autenticación con fetch nativo ---");
    try {
        const response = await fetch(`${DIRECTUS_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`
            }
        });
        
        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        
        const data = await response.json();
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error en fetch:", e);
    }
}

debugAuth();
