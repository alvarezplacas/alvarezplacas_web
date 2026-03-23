async function check() {
  const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
  const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
  const ADMIN_PASSWORD = 'JavierMix2026!';

  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginBody = await loginRes.json();
  const access_token = loginBody.data.access_token;
  const headers = { 'Authorization': `Bearer ${access_token}` };

  console.log('--- Directus Catalog Health Check ---');

  const getCount = async (collection) => {
    const res = await fetch(`${DIRECTUS_URL}/items/${collection}?aggregate[count]=*`, { headers });
    const { data } = await res.json();
    return data[0].count;
  };

  const counts = {
    categorias: await getCount('categorias'),
    marcas: await getCount('marcas'),
    lineas: await getCount('lineas'),
    productos: await getCount('productos'),
    variantes_sku: await getCount('variantes_sku')
  };

  console.table(counts);

  const resImg = await fetch(`${DIRECTUS_URL}/items/productos?filter[imagen_cover][_null]=true&aggregate[count]=*`, { headers });
  const { data: imgData } = await resImg.json();
  console.log(`❌ Productos sin imagen: ${imgData[0].count}`);

  const resDraft = await fetch(`${DIRECTUS_URL}/items/productos?filter[status][_eq]=draft&aggregate[count]=*`, { headers });
  const { data: draftData } = await resDraft.json();
  console.log(`⚠️ Productos en borrador: ${draftData[0].count}`);
}

check().catch(console.error);
