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

async function audit() {
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    const res = await fetch(`${DIRECTUS_URL}/items/lineas?limit=-1`, { headers });
    const body = await res.json();
    console.log('Total Lineas found:', body.data.length);
    console.table(body.data.slice(0, 30));
}

audit().catch(console.error);
