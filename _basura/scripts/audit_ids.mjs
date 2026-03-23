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

    const fetchAll = async (coll) => {
        const res = await fetch(`${DIRECTUS_URL}/items/${coll}`, { headers });
        const body = await res.json();
        return body.data;
    };

    console.log('--- CATEGORIAS ---');
    console.table(await fetchAll('categorias'));
    console.log('--- MARCAS ---');
    console.table(await fetchAll('marcas'));
    console.log('--- LINEAS (first 10) ---');
    const lineas = await fetchAll('lineas');
    console.table(lineas.slice(0, 15));
}

audit().catch(console.error);
