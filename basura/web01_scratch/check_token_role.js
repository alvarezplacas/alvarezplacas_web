import { createDirectus, rest, staticToken, readMe } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const FRONTEND_TOKEN = 'U_49a1I4EcNofowltd95z0MwlUdJ8VgW';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(FRONTEND_TOKEN))
    .with(rest());

async function checkToken() {
    try {
        const me = await client.request(readMe());
        console.log("Token Frontend Identidad:");
        console.log("- ID:", me.id);
        console.log("- Role ID:", me.role);
    } catch (e) {
        console.error("Error identificando token:", e.message);
    }
}

checkToken();
