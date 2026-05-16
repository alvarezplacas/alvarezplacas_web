import { createDirectus, rest, staticToken, readItems, deleteItems } from '@directus/sdk';

const DIRECTUS_URL = 'http://alvarezplacas_directus_v16:8055';
const STATIC_TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL).with(staticToken(STATIC_TOKEN)).with(rest());

async function limpiar() {
    console.log("--- 🗑️ Limpiando Productos Basura ---");
    try {
        // 1. Buscar el rubro de Placas para no borrar herramientas u otra cosa
        const rubros = await client.request(readItems('Rubros', { filter: { nombre: { _eq: 'Placas' } } }));
        if (rubros.length === 0) return console.log("No se encontró rubro Placas");
        
        const rubroId = rubros[0].id;

        // 2. Buscar todos los productos de ese rubro
        const productos = await client.request(readItems('Productos', { 
            filter: { rubro: { _eq: rubroId } },
            limit: -1,
            fields: ['id']
        }));

        console.log(`Encontrados ${productos.length} productos para borrar.`);
        
        if (productos.length > 0) {
            const ids = productos.map(p => p.id);
            // Borrar en bloques de 100 para no saturar la API
            for (let i = 0; i < ids.length; i += 100) {
                const chunk = ids.slice(i, i + 100);
                await client.request(deleteItems('Productos', chunk));
                console.log(`Borrados ${i + chunk.length}...`);
            }
        }
        console.log("--- ✨ Base de datos LIMPIA ---");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

limpiar();
