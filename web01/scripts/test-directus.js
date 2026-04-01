import { createDirectus, rest, createItem, staticToken } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE'; // Token del archivo de conexiones

async function testConnection() {
    console.log("--- Iniciando Prueba de Conexión ---");
    console.log("URL:", DIRECTUS_URL);
    
    const directus = createDirectus(DIRECTUS_URL)
        .with(staticToken(DIRECTUS_TOKEN))
        .with(rest());

    try {
        console.log("Intentando crear un registro de prueba...");
        const result = await directus.request(createItem('mensajes_contacto', {
            nombre: 'TEST SCRIPT',
            mensaje: 'Esta es una prueba de conexión desde script de depuración.',
            tipo: 'general',
            fecha: new Date().toISOString()
        }));
        console.log("✅ ÉXITO: Registro creado!");
        console.log("Resultado:", result);
    } catch (e) {
        console.error("❌ FALLO: No se pudo conectar o crear el registro.");
        if (e.errors) {
            console.error("Errores de Directus:", JSON.stringify(e.errors, null, 2));
        } else {
            console.error("Error:", e.message || e);
        }
    }
}

testConnection();
