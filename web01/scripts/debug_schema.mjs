import { createDirectus, rest, staticToken, readCollection } from '@directus/sdk';

const DIRECTUS_URL = 'http://alvarezplacas_directus_v16:8055';
const STATIC_TOKEN = 'alvarez-api-token-v16-2026';

const client = createDirectus(DIRECTUS_URL).with(staticToken(STATIC_TOKEN)).with(rest());

async function debug() {
    console.log("--- 🕵️ Auditando Campos de 'Productos' ---");
    try {
        const collection = await client.request(readCollection('Productos'));
        console.log("Campos encontrados:");
        collection.fields.forEach(f => {
            console.log(`- ${f.field} (${f.type})`);
        });
    } catch (e) {
        console.error("Error:", e.message);
    }
}

debug();
