import { createDirectus, rest, staticToken, readFieldsByCollection } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const STATIC_TOKEN = 'alvarez-api-token-v16-2026'; // Token nuevo de Javiermix

const client = createDirectus(DIRECTUS_URL).with(staticToken(STATIC_TOKEN)).with(rest());

async function debug() {
    try {
        const fields = await client.request(readFieldsByCollection('Productos'));
        console.log("CAMPOS_DETALLE:");
        fields.forEach(f => {
            console.log(`- ${f.field} (Label: ${f.meta?.label || f.field})`);
        });
    } catch (e) {
        console.error("Error:", JSON.stringify(e));
    }
}

debug();
