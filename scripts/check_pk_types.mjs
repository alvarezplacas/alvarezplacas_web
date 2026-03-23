async function checkPrimaryKeys() {
  const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
  const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
  const ADMIN_PASSWORD = 'JavierMix2026!';

  const loginRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginBody = await loginRes.json();
  const access_token = loginBody.data.access_token;
  const headers = { 'Authorization': 'Bearer ' + access_token };

  const check = async (collection) => {
    const res = await fetch(`${DIRECTUS_URL}/fields/${collection}/id`, { headers });
    const body = await res.json();
    console.log(`ID type for ${collection}:`, body.data ? body.data.type : 'Error or not found');
  };

  await check('categorias');
  await check('marcas');
}
checkPrimaryKeys().catch(console.error);
