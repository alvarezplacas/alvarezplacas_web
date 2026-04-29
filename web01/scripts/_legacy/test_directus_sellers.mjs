import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

const directus = createDirectus(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_TOKEN))
    .with(rest());

async function test() {
    try {
        console.log("Conectando a:", DIRECTUS_URL);
        const res = await directus.request(readItems('vendedores', {
            fields: ['*']
        }));
        console.log("Resultado de vendedores:", JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Error en la conexión:", e.message);
        if (e.response) {
            console.error("Detalles del error:", await e.response.json());
        }
    }
}

test();
