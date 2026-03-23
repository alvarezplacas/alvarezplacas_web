import fs from 'fs';
import path from 'path';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const MASTER_JSON_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\src\\data\\biblioteca\\master_catalog.json';
const IMAGES_ROOT = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\public\\images\\catalog\\Placas';

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
    if (body.errors && body.errors[0]?.message === 'Token expired.') {
        console.log('🔄 Token expirado, re-autenticando...');
        await login();
        return request(url, options);
    }
    return body;
}

async function uploadImage(localPath) {
    const fileName = path.basename(localPath);
    const searchBody = await request(`${DIRECTUS_URL}/files?filter[filename_download][_eq]=${encodeURIComponent(fileName)}`);
    if (searchBody.data && searchBody.data.length > 0) return searchBody.data[0].id;

    console.log(`⬆️ Subiendo: ${fileName}...`);
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
    return uploadBody.data.id;
}

async function syncV2() {
    console.log('🚀 Iniciando Sincronización de Imágenes V2...');
    await login();

    const masterData = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, 'utf8'));
    const masterMap = new Map();
    masterData.forEach(item => { if (item.imagen) masterMap.set(item.original.trim().toUpperCase(), item.imagen); });

    console.log('📦 Cargando Productos y Variantes...');
    const pBody = await request(`${DIRECTUS_URL}/items/productos?limit=-1&fields=id,nombre`);
    const prods = pBody.data;
    const vBody = await request(`${DIRECTUS_URL}/items/variantes_sku?limit=-1&fields=producto_id,codigo_proveedor`);
    const variants = vBody.data;

    // Map variants to products
    const prodVariants = {};
    variants.forEach(v => {
        if (!v.producto_id) return;
        if (!prodVariants[v.producto_id]) prodVariants[v.producto_id] = [];
        prodVariants[v.producto_id].push(v.codigo_proveedor);
    });

    console.log('🔍 Escaneando galería local...');
    const localGallery = [];
    function walk(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
            else if (/\.(avif|webp|jpg|png)$/i.test(file)) localGallery.push({ name: file, path: fullPath });
        });
    }
    walk(IMAGES_ROOT);

    let count = 0;
    for (const prod of prods) {
        let imageToLink = null;
        
        // Match 1: Master JSON via variants
        const skus = prodVariants[prod.id] || [];
        for (const sku of skus) {
            const upperSku = sku.trim().toUpperCase();
            if (masterMap.has(upperSku)) {
                const lp = masterMap.get(upperSku);
                const fp = path.join('d:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\public', lp.replace(/\//g, path.sep));
                if (fs.existsSync(fp)) { imageToLink = fp; break; }
            }
        }

        // Match 2: Filename fallback
        if (!imageToLink) {
            const clean = prod.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const match = localGallery.find(img => {
                const ci = img.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return ci.includes(clean) || clean.includes(ci.split('.')[0]);
            });
            if (match) imageToLink = match.path;
        }

        if (imageToLink) {
            const fileId = await uploadImage(imageToLink);
            if (fileId) {
                await request(`${DIRECTUS_URL}/items/productos/${prod.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ imagen_cover: fileId })
                });
                count++;
                if (count % 20 === 0) console.log(`🖼️ Vinculadas ${count} imágenes...`);
            }
        }
    }

    console.log(`🏁 Sincronización V2 finalizada. Matches: ${count}/${prods.length}`);
}

syncV2().catch(console.error);
