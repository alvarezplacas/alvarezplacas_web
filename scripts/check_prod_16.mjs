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

async function checkProd16() {
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    const res = await fetch(`${DIRECTUS_URL}/items/variantes_sku?filter[producto_id][_eq]=16&fields=codigo_proveedor`, { headers });
    const body = await res.json();
    
    console.log('Variants for Prod 16:');
    console.table(body.data);
}

checkProd16().catch(console.error);
