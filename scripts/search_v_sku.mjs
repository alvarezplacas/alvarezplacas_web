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

async function search() {
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    const res = await fetch(`${DIRECTUS_URL}/items/variantes_sku?filter[codigo_proveedor][_contains]=GRUPO 2&fields=codigo_proveedor,producto_id`, { headers });
    const body = await res.json();
    
    console.log('Search Results for GRUPO 2:');
    console.table(body.data);
}

search().catch(console.error);
