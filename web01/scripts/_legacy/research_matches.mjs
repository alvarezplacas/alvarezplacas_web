import { createDirectus, rest, staticToken, readItems, readFiles } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

async function research() {
    const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());
    try {
        const materials = await client.request(readItems('materiales', { limit: 100, fields: ['id', 'nombre', 'id_marca.nombre'] }));
        const files = await client.request(readFiles({ limit: 500, fields: ['id', 'title', 'filename_download'] }));
        
        console.log(`Materials: ${materials.length}`);
        console.log(`Files: ${files.length}`);
        
        const matches = [];
        materials.forEach(mat => {
            const match = files.find(f => 
                f.title.toLowerCase().includes(mat.nombre.toLowerCase()) || 
                mat.nombre.toLowerCase().includes(f.title.toLowerCase())
            );
            if (match) {
                matches.push({ mat: mat.nombre, file: match.title, fileId: match.id });
            }
        });
        
        console.log("Potential Matches Found:", matches.length);
        console.log(matches.slice(0, 20));
        
    } catch (e) {
        console.error(e);
    }
}
research();
