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

async function debugV2() {
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch variants with joining product info
    const res = await fetch(`${DIRECTUS_URL}/items/variantes_sku?limit=5&fields=codigo_proveedor,producto_id.id,producto_id.marca_id`, { headers });
    const body = await res.json();
    
    console.log('Results:');
    console.table(body.data.map(v => ({
        sku: v.codigo_proveedor,
        prodId: v.producto_id?.id,
        marcaId: v.producto_id?.marca_id
    })));
}

debugV2().catch(console.error);
