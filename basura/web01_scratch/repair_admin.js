import { directus } from '../Backend/conexiones/directus.js';
import { createItems } from '@directus/sdk';

async function repairAdmin() {
    try {
        console.log("Intentando crear el usuario administrador en 'vendedores'...");
        const result = await directus.request(createItems('vendedores', [{
            id: 2,
            name: 'Administrador Javier',
            email: 'admin@alvarezplacas.com.ar',
            whatsapp: '5491100000000'
        }]));
        console.log("✅ Usuario administrador creado exitosamente.");
        console.log("Ahora intenta loguearte con:");
        console.log("Email: admin@alvarezplacas.com.ar");
        console.log("Pass: JavierMix2026!");
    } catch (error) {
        console.error("❌ Error al crear el usuario:", error);
    }
}

repairAdmin();
