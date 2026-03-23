import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const MASTER_JSON_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\src\\data\\biblioteca\\master_catalog.json';
const IMAGES_ROOT = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\public\\images\\catalog\\Placas';

const DRY_RUN = false; // CAMBIAR A FALSE PARA EJECUTAR REALMENTE

let headers = {};

async function login() {
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const body = await loginRes.json();
  const token = body.data.access_token;
  headers = { 'Authorization': `Bearer ${token}` };
  console.log('✅ Autenticado en Directus.');
}

async function request(url, options = {}) {
    const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    const body = await res.json();
    if (body.errors && body.errors[0]?.extensions?.code === 'TOKEN_EXPIRED') {
        console.log('🔄 Token expirado, re-autenticando...');
        await login();
        return request(url, options);
    }
    return { res, body };
}

async function uploadImage(localPath) {
    const fileName = path.basename(localPath);
    
    // Check if exists
    const { body: searchBody } = await request(`${DIRECTUS_URL}/files?filter[filename_download][_eq]=${encodeURIComponent(fileName)}`);
    if (searchBody.data && searchBody.data.length > 0) {
        return searchBody.data[0].id;
    }

    if (DRY_RUN) {
        console.log(`[DRY-RUN] Subiría imagen: ${fileName}`);
        return 'DRY_RUN_ID';
    }

    // Upload using native FormData
    console.log(`⬆️ Subiendo imagen: ${fileName}...`);
    const fileBuffer = fs.readFileSync(localPath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('file', blob, fileName);
    
    const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
        method: 'POST',
        headers: { ...headers },
        body: formData
    });
    
    const uploadBody = await uploadRes.json();
    if (!uploadRes.ok) {
        console.error('❌ Error subiendo imagen:', JSON.stringify(uploadBody, null, 2));
        return null;
    }
    return uploadBody.data.id;
}

async function sync() {
    console.log(`🚀 Iniciando sincronización de imágenes (DRY_RUN=${DRY_RUN})...`);
    await login();

    const masterData = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, 'utf8'));
    const masterMap = new Map();
    masterData.forEach(item => {
        if (item.imagen) masterMap.set(item.original.trim().toUpperCase(), item.imagen);
    });

    // Cargar todos los productos de Directus
    console.log('📦 Obteniendo productos de Directus...');
    const { body: prodBody } = await request(`${DIRECTUS_URL}/items/productos?limit=-1&fields=id,nombre,variantes.codigo_proveedor`);
    const productos = prodBody.data;
    console.log(`✅ ${productos.length} productos cargados.`);

    // Escanear imágenes locales para fallback
    console.log('🔍 Escaneando imágenes locales para fallback...');
    const localGallery = [];
    function walk(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
            } else if (file.endsWith('.avif') || file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png')) {
                localGallery.push({ name: file, path: fullPath });
            }
        }
    }
    walk(IMAGES_ROOT);
    console.log(`✅ ${localGallery.length} imágenes encontradas.`);

    let matchedCount = 0;

    for (const prod of productos) {
        let imageToLink = null;
        let matchSource = '';

        // Prioridad 1: master_catalog.json vía codigo_proveedor
        if (prod.variantes) {
            for (const v of prod.variantes) {
                const originalName = v.codigo_proveedor?.trim().toUpperCase();
                if (masterMap.has(originalName)) {
                    const relativePath = masterMap.get(originalName);
                    const fullPath = path.join('d:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\public', relativePath.replace(/\//g, path.sep));
                    if (fs.existsSync(fullPath)) {
                        imageToLink = fullPath;
                        matchSource = 'MASTER_JSON';
                        break;
                    }
                }
            }
        }

        // Prioridad 2: Fallback por nombre de producto en localGallery
        if (!imageToLink) {
            const cleanProdName = prod.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const match = localGallery.find(img => {
                const cleanImgName = img.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return cleanImgName.includes(cleanProdName) || cleanProdName.includes(cleanImgName.split('.')[0]);
            });
            if (match) {
                imageToLink = match.path;
                matchSource = 'FILENAME_MATCH';
            }
        }

        if (imageToLink) {
            const fileId = await uploadImage(imageToLink);
            if (fileId) {
                matchedCount++;
                if (DRY_RUN) {
                    console.log(`[DRY-RUN] Match ${matchedCount}: Vincularía producto "${prod.nombre}" (ID: ${prod.id}) con imagen ${path.basename(imageToLink)}`);
                } else {
                    const { res: updateRes } = await request(`${DIRECTUS_URL}/items/productos/${prod.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imagen_cover: fileId })
                    });
                }
            }
        }
    }

    console.log(`🏁 Sincronización finalizada. Matches: ${matchedCount}/${productos.length}`);
}

sync().catch(console.error);
