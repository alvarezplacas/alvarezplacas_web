import { createDirectus, rest, staticToken, readItems, readFiles } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

async function diagnose() {
    console.log("--- 🕵️ Diagnosing Catalog and Images ---");
    const client = createDirectus(DIRECTUS_URL)
        .with(staticToken(DIRECTUS_TOKEN))
        .with(rest());

    try {
        console.log("1. Checking 'materiales' collection...");
        const materials = await client.request(readItems('materiales', {
            limit: 5,
            fields: ['id', 'nombre', 'imagen', 'id_marca.nombre', 'id_categoria.nombre']
        }));
        console.log(`Found ${materials.length} materials (sample):`);
        materials.forEach(m => {
            console.log(` - [${m.id}] ${m.nombre} | Brand: ${m.id_marca?.nombre} | Image ID: ${m.imagen || 'MISSING'}`);
        });

        console.log("\n2. Checking 'directus_files'...");
        const files = await client.request(readFiles({
            limit: 10,
            fields: ['id', 'filename_download', 'title', 'type']
        }));
        console.log(`Found files (sample):`);
        files.forEach(f => {
            console.log(` - [${f.id}] ${f.title} | Filename: ${f.filename_download}`);
        });

        console.log("\n3. Testing Public Read Access...");
        const publicClient = createDirectus(DIRECTUS_URL).with(rest());
        try {
            await publicClient.request(readItems('materiales', { limit: 1 }));
            console.log("✅ Public access to 'materiales' is OK.");
        } catch (e) {
            console.error("❌ Public access to 'materiales' is FORBIDDEN.");
        }

    } catch (e) {
        console.error('❌ Error during diagnosis:', e.message || e);
    }
}

diagnose();
