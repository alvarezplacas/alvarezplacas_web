import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const URL_PUBLIC = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

const directus = createDirectus(URL_PUBLIC)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

async function run() {
    try {
        const sellers = await directus.request(readItems('vendedores'));
        console.log("SELLERS:", JSON.stringify(sellers, null, 2));
    } catch(e) {
        console.error("ERROR:", e);
    }
}
run();
