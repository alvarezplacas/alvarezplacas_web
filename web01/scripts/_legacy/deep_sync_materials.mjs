import { createDirectus, rest, staticToken, readItems, readFiles, createItem, readFolders } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const DIRECTUS_TOKEN = 'alvarez-api-token-v16-2026';

const BRAND_MAPPING = {
    'egger': 1,
    'faplac': 2,
    'sadepan': 3,
    'nova': 4
};

async function deepSync() {
    console.log("--- 🚀 Iniciando Sincronización Profunda de Productos (V2) ---");
    const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

    try {
        console.log("1. Obteniendo datos actuales...");
        const materials = await client.request(readItems('Productos', { limit: -1, fields: ['id', 'nombre'] }));
        const files = await client.request(readFiles({ limit: -1, fields: ['id', 'title', 'folder', 'filename_download'] }));
        const folders = await client.request(readFolders());

        console.log(`📊 Productos en DB: ${materials.length}`);
        console.log(`📂 Archivos en Directus: ${files.length}`);

        const materialNames = new Set(materials.map(m => m.nombre.toLowerCase().trim()));
        
        // Función para obtener el nombre del folder y sus padres
        const getFullFolderPath = (folderId) => {
            let path = [];
            let currentId = folderId;
            while (currentId) {
                const f = folders.find(x => x.id === currentId);
                if (!f) break;
                path.push(f.name.toLowerCase());
                currentId = f.parent;
            }
            return path.join(' / ');
        };

        let createdCount = 0;
        let skipCount = 0;

        for (const file of files) {
            // Solo procesar imágenes compatibles
            if (!file.filename_download.match(/\.(jpg|jpeg|png|webp|avif)$/i)) continue;

            const fullPath = getFullFolderPath(file.folder);
            const fileTitle = file.title.trim();
            const fileTitleLower = fileTitle.toLowerCase();

            // EXCLUSIONES CRÍTICAS
            const exclusions = ['logo', 'icon', 'banner', 'badge', 'favicon', 'avatar', 'cover', 'perfil', 'background', 'fondo', 'original'];
            if (exclusions.some(ex => fileTitleLower.includes(ex)) || fileTitle.length < 3) {
                continue;
            }

            // Determinar Marca buscando en el path de carpetas o el título
            let brandId = null;
            if (fullPath.includes('egger') || fileTitleLower.includes('egger')) brandId = BRAND_MAPPING.egger;
            else if (fullPath.includes('faplac') || fileTitleLower.includes('faplac')) brandId = BRAND_MAPPING.faplac;
            else if (fullPath.includes('sadepan') || fileTitleLower.includes('sadepan')) brandId = BRAND_MAPPING.sadepan;
            else if (fullPath.includes('nova') || fileTitleLower.includes('nova')) brandId = BRAND_MAPPING.nova;

            // Si no detectamos marca de tablero, ignoramos
            if (!brandId) continue;

            // Verificar si ya existe el material
            if (materialNames.has(fileTitleLower)) {
                skipCount++;
                continue;
            }

            console.log(`✨ Detectado tablero faltante: [${fileTitle}] (Marca: ${Object.keys(BRAND_MAPPING).find(k => BRAND_MAPPING[k] === brandId)}) | Path: ${fullPath}`);
            
            try {
                await client.request(createItem('Productos', {
                    nombre: fileTitle,
                    marca: brandId,
                    rubro: 1, // Tableros
                    espesor: 1,   // 18mm
                    foto_principal: file.id,
                    activo: true,
                    stock: 10,
                    precio_m2: 0
                }));
                
                materialNames.add(fileTitleLower);
                createdCount++;
            } catch (err) {
                console.error(`❌ Error creando ${fileTitle}:`, err.message);
            }
        }

        console.log(`\n✅ Sincronización completada.`);
        console.log(`🆕 Creados: ${createdCount}`);
        console.log(`⏭️ Omitidos: ${skipCount}`);

    } catch (e) {
        console.error('❌ Error general:', e.message || e);
    }
}

deepSync();
