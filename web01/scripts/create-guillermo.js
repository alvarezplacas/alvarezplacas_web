import { createDirectus, rest, readItems, createItem, deleteItem, staticToken } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const URL_PUBLIC = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

const directus = createDirectus(URL_PUBLIC)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

async function run() {
    try {
        console.log("1. Generando hash de contraseña para Guillermo...");
        const passwordHash = await bcrypt.hash("Tecno/315", 10);
        console.log("Contraseña Hasheada:", passwordHash);

        console.log("2. Buscando vendedores existentes...");
        const sellers = await directus.request(readItems('vendedores'));
        
        // Buscar si existe Franco
        const franco = sellers.find(s => s.email === 'franco@alvarezplacas.com.ar');
        if (franco) {
            console.log(`Eliminando a Franco (ID: ${franco.id})...`);
            await directus.request(deleteItem('vendedores', franco.id));
            console.log("Franco eliminado de Directus.");
        } else {
            console.log("Franco no estaba registrado en Directus.");
        }

        // Buscar si existe Guillermo
        const guillermo = sellers.find(s => s.email === 'guillermo@alvarezplacas.com.ar');
        if (guillermo) {
            console.log("Guillermo ya existe en Directus. No es necesario crearlo.");
        } else {
            console.log("Creando a Guillermo como CEO en Directus...");
            const newSeller = await directus.request(createItem('vendedores', {
                name: "Guillermo",
                email: "guillermo@alvarezplacas.com.ar",
                role: "ceo",
                status: "active",
                password_hash: passwordHash,
                whatsapp: null
            }));
            console.log("Guillermo creado exitosamente:", JSON.stringify(newSeller, null, 2));
        }

    } catch(e) {
        console.error("ERROR:", e);
    }
}
run();
