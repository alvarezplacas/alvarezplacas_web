import { directus, readItems } from '../Backend/conexiones/directus.js';

async function checkAdmin() {
    try {
        console.log("Buscando usuario admin en la colección 'vendedores'...");
        const results = await directus.request(readItems('vendedores', {
            filter: { email: { _eq: 'admin@alvarezplacas.com.ar' } },
            limit: 1
        }));

        if (results && results.length > 0) {
            const user = results[0];
            console.log("Usuario encontrado:");
            console.log(`- ID: ${user.id}`);
            console.log(`- Email: ${user.email}`);
            console.log(`- Nombre: ${user.nombre}`);
            console.log(`- Tiene Hash: ${user.password_hash ? 'SÍ' : 'NO'}`);
            // NO imprimimos el hash por seguridad, pero confirmamos si existe.
        } else {
            console.log("❌ No se encontró ningún vendedor con el email 'admin@alvarezplacas.com.ar'");
            
            // Buscar todos los vendedores para ver qué hay
            const all = await directus.request(readItems('vendedores', { limit: 10 }));
            console.log("Vendedores disponibles en la base de datos:");
            all.forEach(v => console.log(`- ${v.email} (${v.nombre})`));
        }
    } catch (error) {
        console.error("❌ Error al conectar con Directus:", error);
    }
}

checkAdmin();
