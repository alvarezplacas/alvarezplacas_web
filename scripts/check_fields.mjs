async function checkFields() {
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

  const res = await fetch(`${DIRECTUS_URL}/fields/lineas`, { headers });
  const body = await res.json();
  console.log('Fields in lineas:', JSON.stringify(body.data, null, 2));

  const res2 = await fetch(`${DIRECTUS_URL}/fields/productos`, { headers });
  const body2 = await res2.json();
  console.log('Fields in productos:', JSON.stringify(body2.data, null, 2));

  const res3 = await fetch(`${DIRECTUS_URL}/fields/variantes_sku`, { headers });
  const body3 = await res3.json();
  console.log('Fields in variantes_sku:', JSON.stringify(body3.data, null, 2));
}
checkFields().catch(console.error);
