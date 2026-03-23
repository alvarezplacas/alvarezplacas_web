import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkLineas() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        console.log("--- Lineas ---");
        const lines = await client.request(readItems('lineas', {
            fields: ['id', 'nombre', 'marca_id.nombre']
        }));
        lines.forEach(l => {
            console.log(`- ID: ${l.id} | Nombre: ${l.nombre} | Marca: ${l.marca_id?.nombre || 'NULL'}`);
        });

        console.log("\n--- Categorias ---");
        const cats = await client.request(readItems('categorias', {
            fields: ['id', 'nombre']
        }));
        cats.forEach(c => {
            console.log(`- ID: ${c.id} | Nombre: ${c.nombre}`);
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkLineas();
