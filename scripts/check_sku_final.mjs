import { createDirectus, rest, readItems, authentication } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

const client = createDirectus(DIRECTUS_URL)
    .with(authentication('json'))
    .with(rest());

async function checkSkuFinal() {
    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        const products = await client.request(readItems('productos', { 
            filter: { sku: { _eq: 'TAB-RAC-FAP-18-AGL' } },
            fields: ['*']
        }));
        
        if (products.length > 0) {
            console.log(JSON.stringify(products[0], null, 2));
        } else {
            console.log("SKU not found");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkSkuFinal();
