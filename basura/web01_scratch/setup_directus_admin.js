import { createDirectus, rest, authentication, createItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function setupAdmin() {
    try {
        const client = createDirectus(DIRECTUS_URL).with(authentication()).with(rest());

        console.log("Iniciando sesión en Directus como Administrador Maestro...");
        await client.login('admin@alvarezplacas.com.ar', 'JavierMix2026!');
        console.log("✅ Sesión iniciada.");

        console.log("Registrando Administrador en la colección 'vendedores'...");
        
        try {
            const result = await client.request(createItems('vendedores', [{
                id: 2,
                name: 'Administrador Javier',
                email: 'admin@alvarezplacas.com.ar',
                whatsapp: '5491100000000'
            }]));
            console.log("✅ Registro completado exitosamente.");
        } catch (innerError) {
            if (innerError.errors && innerError.errors[0].extensions.code === 'RECORD_NOT_UNIQUE') {
                console.log("ℹ️ El usuario ya existía en la colección 'vendedores'.");
            } else {
                throw innerError;
            }
        }

        console.log("--------------------------------------------------");
        console.log("PROCESO TERMINADO");
        console.log("Ya puedes usar admin@alvarezplacas.com.ar / JavierMix2026!");
        console.log("en el panel de alvarezplacas.com.ar/admin/login");
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("❌ Error durante el setup:", error);
    }
}

setupAdmin();
