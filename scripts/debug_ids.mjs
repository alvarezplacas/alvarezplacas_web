async function debug() {
  const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
  const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
  const ADMIN_PASSWORD = 'JavierMix2026!';

  console.log('Logging in...');
  const loginRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginBody = await loginRes.json();
  const access_token = loginBody.data.access_token;
  const headers = { 'Authorization': 'Bearer ' + access_token };

  const check = async (collection) => {
    console.log(`--- Checking ${collection} ---`);
    const res = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=1`, { headers });
    const body = await res.json();
    if (body.data && body.data.length > 0) {
        console.log(`Sample item in ${collection}:`, JSON.stringify(body.data[0], null, 2));
    } else {
        console.log(`No items or error in ${collection}:`, JSON.stringify(body, null, 2));
    }
  };

  await check('categorias');
  await check('marcas');
  await check('lineas');
  await check('productos');
}
debug().catch(console.error);
