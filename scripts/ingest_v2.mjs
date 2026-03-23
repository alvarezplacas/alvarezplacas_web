import xlsx from 'xlsx';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\_infra_docs\\LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';

const cache = { marcas: {}, categorias: {}, lineas: {}, productos: {} };

let currentToken = null;

async function login() {
  console.log('🔑 Autenticando...');
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const body = await loginRes.json();
  currentToken = body.data.access_token;
  return currentToken;
}

async function request(url, options = {}) {
  const headers = { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json', ...options.headers };
  let res = await fetch(url, { ...options, headers });
  let body = await res.json();

  if (body.errors && body.errors[0]?.message === 'Token expired.') {
      console.log('🔄 Token expirado, re-autenticando...');
      await login();
      const newHeaders = { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json', ...options.headers };
      res = await fetch(url, { ...options, headers: newHeaders });
      body = await res.json();
  }
  return body;
}

async function preload() {
    console.log('📦 Pre-cargando datos existentes...');
    const catRes = await request(`${DIRECTUS_URL}/items/categorias?limit=-1&fields=id,nombre`);
    catRes.data.forEach(x => cache.categorias[`categorias:${x.nombre}:`] = x.id);

    const marcaRes = await request(`${DIRECTUS_URL}/items/marcas?limit=-1&fields=id,nombre`);
    marcaRes.data.forEach(x => cache.marcas[`marcas:${x.nombre}:`] = x.id);

    const lineRes = await request(`${DIRECTUS_URL}/items/lineas?limit=-1&fields=id,nombre,marca_id`);
    lineRes.data.forEach(x => cache.lineas[`lineas:${x.nombre}:${x.marca_id}`] = x.id);

    const prodRes = await request(`${DIRECTUS_URL}/items/productos?limit=-1&fields=id,nombre,marca_id,linea_id,categoria_id`);
    prodRes.data.forEach(x => {
        const key = `productos:${x.nombre}:${x.marca_id}`;
        cache.productos[key] = x.id;
    });

    const varRes = await request(`${DIRECTUS_URL}/items/variantes_sku?limit=-1&fields=codigo_proveedor`);
    const existingSkus = new Set(varRes.data.map(v => v.codigo_proveedor));
    console.log(`✅ Pre-carga completa. Encontrados ${existingSkus.size} SKUs existentes.`);
    return existingSkus;
}

async function getOrCreate(collection, name, extraFields = {}) {
    const key = `${collection}:${name}:${extraFields.marca_id || ''}`;
    if (cache[collection][key]) return cache[collection][key];

    // ... search logic (only if not preloaded)
    let filter = `filter[nombre][_eq]=${encodeURIComponent(name)}`;
    if (extraFields.marca_id) filter += `&filter[marca_id][_eq]=${extraFields.marca_id}`;
    if (extraFields.categoria_id) filter += `&filter[categoria_id][_eq]=${extraFields.categoria_id}`;
    if (collection === 'productos' && extraFields.linea_id) filter += `&filter[linea_id][_eq]=${extraFields.linea_id}`;

    const search = await request(`${DIRECTUS_URL}/items/${collection}?${filter}`);
    if (search.data && search.data.length > 0) {
        cache[collection][key] = search.data[0].id;
        return search.data[0].id;
    }

    const create = await request(`${DIRECTUS_URL}/items/${collection}`, {
        method: 'POST',
        body: JSON.stringify({ nombre: name, ...extraFields })
    });
    if (!create.data) {
        console.error(`❌ Error creando en ${collection}:`, create);
        return null;
    }
    cache[collection][key] = create.data.id;
    return create.data.id;
}

function extractLine(articulo) {
    if (!articulo) return 'General';
    const s = articulo.toUpperCase();
    let brand = '';
    if (s.includes('EGGER')) brand = 'EGGER';
    else if (s.includes('FAPLAC')) brand = 'FAPLAC';
    else if (s.includes('SADEPAN')) brand = 'SADEPAN';
    else return 'General';

    const quoteMatch = s.match(/"(.*?)"/);
    if (quoteMatch) return quoteMatch[1];

    const parts = s.split(brand)[1].trim().split(' ');
    const lineParts = [];
    for (const p of parts) {
        if (p.includes('MM') || p === 'AGLO' || p === 'MDF' || p === 'A/' || p === 'M/' || p === 'LACA' || p === 'SOFT' || p === 'PVC' || p === 'CANTO') break;
        lineParts.push(p);
    }
    let res = lineParts.length > 0 ? lineParts.join(' ') : 'General';
    if (res === 'BLANCO' || res === 'MDF' || res === 'AGLO') return 'General';
    return res;
}

async function ingest() {
  console.log('🚀 Iniciando Ingesta V2 (Clean & Structured - Optimized)...');
  await login();
  const existingSkus = await preload();
  
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(6);

  console.log(`Processing rows... Starting from row 7 (total ${rows.length})`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const articulo = row[0];
    if (!articulo || typeof articulo !== 'string') continue;
    if (articulo.includes('TOTAL') || articulo.includes('SUBTOTAL')) continue;

    if (existingSkus.has(articulo)) {
        // console.log(`⏩ Saltando ${articulo} (ya existe)`);
        if ((i+1) % 50 === 0) console.log(`✅ Saltando a través de ${i+1}/${rows.length}`);
        continue;
    }

    const precioEf = row[1];
    const precioTr = row[2];
// ... rest of loop
    const proveedor = row[4] || 'Varios';
    const categoriaNom = row[5] || 'General';

    // Inferencia de Marca
    let marcaNom = 'Varios';
    if (articulo.toUpperCase().includes('EGGER')) marcaNom = 'Egger';
    else if (articulo.toUpperCase().includes('FAPLAC')) marcaNom = 'Faplac';
    else if (articulo.toUpperCase().includes('SADEPAN')) marcaNom = 'Sadepan';
    else marcaNom = proveedor;

    const lineNom = extractLine(articulo);
    
    let prodNombre = articulo.replace(new RegExp(marcaNom, 'gi'), '').trim();
    if (lineNom !== 'General') {
        prodNombre = prodNombre.replace(new RegExp(`"${lineNom}"`, 'gi'), '').trim();
        prodNombre = prodNombre.replace(new RegExp(lineNom, 'gi'), '').trim();
    }

    let varianteInfo = '';
    const matchMedida = prodNombre.match(/(\d+\s*MM.*)/i);
    if (matchMedida) {
        varianteInfo = matchMedida[1].trim();
        prodNombre = prodNombre.replace(matchMedida[1], '').trim();
    }
    
    // Clean prodNombre from common suffixes
    prodNombre = prodNombre.replace(/\s(AGLO|MDF|A\/|M\/)\.?$/i, '').trim();

    if (!prodNombre || prodNombre === '""' || prodNombre === "''") {
        prodNombre = lineNom;
    }

    const catId = await getOrCreate('categorias', categoriaNom);
    const marcaId = await getOrCreate('marcas', marcaNom);
    const lineaId = await getOrCreate('lineas', lineNom, { marca_id: marcaId, status: 'published' });
    const prodId = await getOrCreate('productos', prodNombre, { categoria_id: catId, marca_id: marcaId, linea_id: lineaId, status: 'published' });

    if (!prodId) continue;

    await request(`${DIRECTUS_URL}/items/variantes_sku`, {
        method: 'POST',
        body: JSON.stringify({
            producto_id: prodId,
            codigo_proveedor: articulo,
            especificacion: varianteInfo || 'Estándar',
            precio_efectivo: precioEf,
            precio_transferencia: precioTr,
            ultima_act: new Date().toISOString()
        })
    });

    if ((i+1) % 50 === 0) console.log(`✅ Procesados ${i+1}/${rows.length}`);
  }

  console.log('🏁 Ingesta V2 completada.');
}

ingest().catch(console.error);
