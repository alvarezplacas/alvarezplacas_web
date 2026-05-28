import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const adminToken = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

const client = createDirectus(directusUrl)
    .with(staticToken(adminToken))
    .with(rest());

async function listVendedoresAdmin() {
    try {
        console.log("--- Listando Vendedores con Token de Admin ---");
        const results = await client.request(readItems('vendedores', {
            fields: ['*'],
            limit: 10
        }));
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

listVendedoresAdmin();
