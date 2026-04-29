import { createDirectus, rest, staticToken, readItems, readFiles, updateItem } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

const GENERIC_CATEGORIES = ['finger', 'enchapado', 'multilaminado', 'terciado'];
const BRANDS = ['egger', 'faplac', 'sadepan'];

async function linkImages() {
    console.log("--- 🔗 Iniciando Vinculación de Imágenes ---");
    const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

    try {
        console.log("1. Obteniendo materiales y archivos...");
        const materials = await client.request(readItems('materiales', { 
            limit: 200, 
            fields: ['id', 'nombre', 'id_marca.nombre'] 
        }));
        const files = await client.request(readFiles({ 
            limit: 500, 
            fields: ['id', 'title', 'filename_download'] 
        }));

        console.log(`📊 Total Materiales: ${materials.length} | Total Archivos: ${files.length}`);

        let count = 0;
        for (const mat of materials) {
            const matName = mat.nombre.toLowerCase().trim();
            const matBrand = mat.id_marca?.nombre?.toLowerCase() || "";
            
            // Normalizar nombre de material: quitar marcas para búsqueda limpia
            let cleanMatName = matName;
            BRANDS.forEach(b => { cleanMatName = cleanMatName.replace(b, '').trim(); });

            // Buscar coincidencia
            const matchedFile = files.find(f => {
                const fileTitle = f.title.toLowerCase();
                const fileName = f.filename_download.toLowerCase();

                // 1. Coincidencia exacta o contenida con el nombre limpio
                if (fileTitle.includes(cleanMatName) || fileName.includes(cleanMatName)) return true;

                // 2. Manejo de categorías genéricas sin marca
                for (const cat of GENERIC_CATEGORIES) {
                    if (matName.includes(cat) && (fileTitle.includes(cat) || fileName.includes(cat))) {
                         // Si el material es "Finger Eucalyptus" y la foto dice "Finger", es un buen match si no hay nada mejor
                         return true;
                    }
                }

                return false;
            });

            if (matchedFile) {
                console.log(`✨ Match: [${mat.nombre}] -> [${matchedFile.title}] (ID: ${matchedFile.id})`);
                await client.request(updateItem('materiales', mat.id, {
                    imagen: matchedFile.id
                }));
                count++;
            }
        }

        console.log(`\n✅ Proceso completado. Se vincularon ${count} de ${materials.length} materiales.`);

    } catch (e) {
        console.error('❌ Error vinculando imágenes:', e.message || e);
    }
}

linkImages();
