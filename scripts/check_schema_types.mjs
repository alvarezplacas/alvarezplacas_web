async function check() {
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

  const res = await fetch(DIRECTUS_URL + '/collections', { headers });
  const body = await res.json();
  
  if (!body.data) {
    console.log('Error fetching collections:', body);
    return;
  }

  body.data.filter(c => !c.collection.startsWith('directus_')).forEach(c => {
    console.log('--- Collection:', c.collection, '---');
    if (c.schema && c.schema.fields) {
        const pk = c.schema.fields.find(f => f.primary_key);
        console.log('Primary Key Field:', pk ? pk.field : 'Unknown');
        console.log('Primary Key Type:', pk ? pk.type : 'Unknown');
    } else {
        console.log('No schema info available (View only?)');
    }
  });
}
check().catch(console.error);
