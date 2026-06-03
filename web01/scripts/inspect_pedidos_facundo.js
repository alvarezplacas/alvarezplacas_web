import { createDirectus, rest, readItem, staticToken } from '@directus/sdk';

const finalUrl = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

const directus = createDirectus(finalUrl)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

async function main() {
    try {
        console.log("--- DETAILS FOR ORDER #3 ---");
        const order3 = await directus.request(readItem('pedidos', '3', {
            fields: ['*', { cliente_id: ['*'] }]
        }));
        console.log(JSON.stringify(order3, null, 2));

        console.log("\n--- DETAILS FOR ORDER #2 ---");
        const order2 = await directus.request(readItem('pedidos', '2', {
            fields: ['*', { cliente_id: ['*'] }]
        }));
        console.log(JSON.stringify(order2, null, 2));
    } catch (e) {
        console.error("Error inspecting:", e);
    }
}

main();
