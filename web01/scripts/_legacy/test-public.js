import { createDirectus, rest, createItem } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function testPublicCreation() {
    console.log("--- Iniciando Prueba de Creación PÚBLICA (Sin Token) ---");
    
    const directus = createDirectus(DIRECTUS_URL).with(rest());

    try {
        console.log("Intentando crear un registro público...");
        const result = await directus.request(createItem('mensajes_contacto', {
            nombre: 'TEST PUBLICO SDK',
            mensaje: 'Esta es una prueba de creacion sin token desde el SDK.',
            tipo: 'general',
            fecha: new Date().toISOString()
        }));
        console.log("✅ ÉXITO: Registro creado!");
        console.log("Resultado:", result);
    } catch (e) {
        console.error("❌ FALLO: No se pudo crear el registro público.");
        if (e.errors) {
            console.error("Errores de Directus:", JSON.stringify(e.errors, null, 2));
        } else {
            console.error("Error:", e.message || e);
        }
    }
}

testPublicCreation();
