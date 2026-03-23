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

async function counts() {
    const token = await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    const pRes = await fetch(`${DIRECTUS_URL}/items/productos?aggregate[count]=*`, { headers });
    const pBody = await pRes.json();
    console.log('Total Productos:', pBody.data[0].count);

    const vRes = await fetch(`${DIRECTUS_URL}/items/variantes_sku?aggregate[count]=*`, { headers });
    const vBody = await vRes.json();
    console.log('Total Variantes:', vBody.data[0].count);
}

counts().catch(console.error);
