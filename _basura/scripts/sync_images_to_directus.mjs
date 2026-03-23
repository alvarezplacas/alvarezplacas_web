import fs from 'fs';
import path from 'path';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const IMAGES_DIR = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\public\\images\\catalog\\Placas';
const DRY_RUN = true; 

async function sync() {
  console.log(`🚀 Iniciando sincronización de imágenes... ${DRY_RUN ? '[DRY RUN MODE]' : ''}`);

  // 1. Login
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginBody = await loginRes.json();
  const access_token = loginBody.data.access_token;
  const headers = { 'Authorization': `Bearer ${access_token}` };

  console.log('✅ Autenticado.');

  // 2. Obtener todos los productos para mapeo
  console.log('🔍 Obteniendo productos de Directus...');
  const prodRes = await fetch(`${DIRECTUS_URL}/items/productos?limit=-1&fields=id,nombre,marca_id.nombre`, { headers });
  const { data: productos } = await prodRes.json();
  console.log(`📦 ${productos.length} productos encontrados en Directus.`);

  // 3. Obtener archivos ya subidos para evitar duplicados
  console.log('🔍 Revisando archivos existentes en Directus...');
  const filesRes = await fetch(`${DIRECTUS_URL}/files?limit=-1&fields=id,filename_download`, { headers });
  const { data: existingFiles } = await filesRes.json();
  const fileMap = new Map(existingFiles.map(f => [f.filename_download.toLowerCase(), f.id]));

  // 4. Escanear directorio local
  const walk = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else if (file.toLowerCase().endsWith('.avif') || file.toLowerCase().endsWith('.webp')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const imageFiles = walk(IMAGES_DIR);
  console.log(`🖼️ ${imageFiles.length} imágenes encontradas localmente.`);

  let matched = 0;
  for (const filePath of imageFiles) {
    const fileName = path.basename(filePath);
    const prodNameFromImg = fileName.replace(/\.[^/.]+$/, "").trim().toLowerCase();
    
    // Buscar producto coincidente
    const product = productos.find(p => {
        const pName = p.nombre.toLowerCase();
        // Matching exacto o contenido
        return pName === prodNameFromImg || pName.includes(prodNameFromImg) || prodNameFromImg.includes(pName);
    });

    if (!product) continue;

    matched++;
    if (DRY_RUN) {
        console.log(`🔍 [DRY RUN] Coincidencia: ${fileName} -> ${product.nombre}`);
        continue;
    }

    let fileId = fileMap.get(fileName.toLowerCase());

    if (!fileId) {
      console.log(`⬆️ Subiendo ${fileName}...`);
      const fileBuffer = fs.readFileSync(filePath);
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'image/avif' });
      formData.append('file', blob, fileName);

      const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}` },
        body: formData
      });

      if (!uploadRes.ok) {
        console.error(`❌ Error subiendo ${fileName}:`, await uploadRes.text());
        continue;
      }

      const { data: uploadedFile } = await uploadRes.json();
      fileId = uploadedFile.id;
      fileMap.set(fileName.toLowerCase(), fileId);
    }

    // Actualizar producto
    await fetch(`${DIRECTUS_URL}/items/productos/${product.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagen_cover: fileId })
    });
    console.log(`✅ Vinculado: ${fileName} -> ${product.id}`);
  }

  console.log(`🏁 Resultados: ${matched}/${imageFiles.length} imágenes vinculadas.`);
}

sync().catch(console.error);
