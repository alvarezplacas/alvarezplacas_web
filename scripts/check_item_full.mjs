import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkItemFull() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const items = await client.request(readItems('productos', {
            filter: { sku: { _eq: 'TAB-RAC-FAP-18-AGL' } },
            fields: ['sku', 'nombre', 'marca_id.*', 'linea_id.*', 'categoria_id.*']
        }));
        
        if (items.length > 0) {
            const item = items[0];
            console.log(`SKU: ${item.sku}`);
            console.log(`Nombre: ${item.nombre}`);
            console.log(`Marca: ${item.marca_id ? item.marca_id.nombre : 'NULL'}`);
            console.log(`Linea: ${item.linea_id ? item.linea_id.nombre : 'NULL'}`);
            console.log(`Categoria: ${item.categoria_id ? item.categoria_id.nombre : 'NULL'}`);
        } else {
            console.log("Item not found");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkItemFull();
