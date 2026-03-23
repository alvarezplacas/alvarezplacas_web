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

function extractLine(articulo) {
    if (!articulo) return 'General';
    const s = articulo.toUpperCase();
    let brand = '';
    if (s.includes('EGGER')) brand = 'EGGER';
    else if (s.includes('FAPLAC')) brand = 'FAPLAC';
    else if (s.includes('SADEPAN')) brand = 'SADEPAN';
    else return 'General';

    const quoteMatch = s.match(/"(.*?)"/);
    if (quoteMatch) return quoteMatch[1];

    const parts = s.split(brand)[1].trim().split(' ');
    const lineParts = [];
    for (const p of parts) {
        if (p.includes('MM') || p === 'AGLO' || p === 'MDF' || p === 'A/' || p === 'M/' || p === 'LACA') break;
        lineParts.push(p);
    }
    let res = lineParts.length > 0 ? lineParts.join(' ') : 'General';
    if (res === 'BLANCO') return 'General';
    return res;
}

const cache = {};

async function getOrCreateLine(token, name, marcaId) {
    const key = `${marcaId}:${name}`;
    if (cache[key]) return cache[key];

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch(`${DIRECTUS_URL}/items/lineas?filter[nombre][_eq]=${encodeURIComponent(name)}&filter[marca_id][_eq]=${marcaId}`, { headers });
    const body = await res.json();
    
    if (body.data && body.data.length > 0) {
        cache[key] = body.data[0].id;
        return body.data[0].id;
    }

    // Create
    const createRes = await fetch(`${DIRECTUS_URL}/items/lineas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nombre: name, marca_id: marcaId, status: 'published' })
    });
    const createBody = await createRes.json();
    cache[key] = createBody.data.id;
    return createBody.data.id;
}

async function fix() {
    console.log('🚀 Iniciando corrección de líneas de productos...');
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Fetch all products with their first variant to get the original name
    const res = await fetch(`${DIRECTUS_URL}/items/productos?limit=-1&fields=id,nombre,marca_id,variantes.codigo_proveedor`, { headers });
    const body = await res.json();
    const productos = body.data;
    console.log(`📦 Procesando ${productos.length} productos...`);

    let count = 0;
    for (const prod of productos) {
        const articulo = prod.variantes?.[0]?.codigo_proveedor;
        const correctLineNom = extractLine(articulo);
        
        const lineaId = await getOrCreateLine(token, correctLineNom, prod.marca_id);
        
        // Update product if needed
        await fetch(`${DIRECTUS_URL}/items/productos/${prod.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ linea_id: lineaId })
        });
        
        count++;
        if (count % 100 === 0) console.log(`✅ Procesados ${count}/${productos.length}`);
    }

    console.log('🏁 Corrección finalizada.');
}

fix().catch(console.error);
