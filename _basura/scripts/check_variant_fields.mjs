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

async function checkFields() {
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    const res = await fetch(`${DIRECTUS_URL}/fields/variantes_sku`, { headers });
    const body = await res.json();
    console.table(body.data.map(f => ({ field: f.field, type: f.type })));
}

checkFields().catch(console.error);
