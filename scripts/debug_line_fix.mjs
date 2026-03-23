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

async function debug() {
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch one Egger product with variant
    const res = await fetch(`${DIRECTUS_URL}/items/productos?filter[nombre][_contains]=GRUPO 2&fields=id,nombre,variantes.codigo_proveedor`, { headers });
    const body = await res.json();
    const prod = body.data[0];
    
    console.log('Product:', prod.nombre);
    console.log('Original Articulo:', prod.variantes?.[0]?.codigo_proveedor);
    console.log('Extracted Line:', extractLine(prod.variantes?.[0]?.codigo_proveedor));
}

debug().catch(console.error);
