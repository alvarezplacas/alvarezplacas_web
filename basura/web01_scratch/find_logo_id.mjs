import fetch from 'node-fetch';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKEN = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE'; // Trrying static token from diagnose_auth.mjs or will use login

async function getLogoId() {
    console.log("--- 🔍 Buscando ID del Logo ---");
    
    try {
        // Primero intentamos buscar el archivo con el token estático si es válido
        const res = await fetch(`${DIRECTUS_URL}/files?filter[title][_contains]=Logo`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
            console.log("✅ Logos encontrados:");
            data.data.forEach(f => {
                console.log(`- ID: ${f.id} | Título: ${f.title} | Tipo: ${f.type}`);
            });
        } else {
            console.log("❌ No se encontró ningún archivo con 'Logo' en el título.");
            // Si falla, tal vez el token expiró o es incorrecto. 
            // Podríamos intentar login pero para una búsqueda simple puede que baste con esto si el token es válido.
        }
    } catch (e) {
        console.error("❌ Error al consultar Directus:", e.message);
    }
}

getLogoId();
