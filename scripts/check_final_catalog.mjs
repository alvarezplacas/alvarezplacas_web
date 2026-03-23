import fs from 'fs';
console.log('DEBUG: fetch is', typeof fetch);

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function login() {
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const body = await loginRes.json();
  return body.data.access_token;
}

async function check() {
    console.log('🔍 Iniciando auditoría final del catálogo...');
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    const fetchTotal = async (coll) => {
        const res = await fetch(`${DIRECTUS_URL}/items/${coll}?aggregate[count]=*`, { headers });
        const body = await res.json();
        return body.data[0].count;
    };

    const countProds = await fetchTotal('productos');
    const countVariants = await fetchTotal('variantes_sku');
    const countBrands = await fetchTotal('marcas');
    const countLines = await fetchTotal('lineas');
    const countCats = await fetchTotal('categorias');

    // Count products with images
    const resImg = await fetch(`${DIRECTUS_URL}/items/productos?filter[imagen_cover][_nnull]=true&aggregate[count]=*`, { headers });
    const bodyImg = await resImg.json();
    const countWithImages = bodyImg.data[0].count;

    console.log('--- ESTADISTICAS DIRECTUS ---');
    console.log(`Categorías: ${countCats}`);
    console.log(`Marcas:     ${countBrands}`);
    console.log(`Líneas:     ${countLines}`);
    console.log(`Productos:  ${countProds}`);
    console.log(`Variantes:  ${countVariants}`);
    console.log(`Productos con Imagen: ${countWithImages} (${((countWithImages/countProds)*100).toFixed(1)}%)`);
    console.log('-----------------------------');
}

check().catch(console.error);
