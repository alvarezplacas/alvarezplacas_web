import xlsx from 'xlsx';
import path from 'path';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\_infra_docs\\LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';

async function ingest() {
  console.log('🚀 Iniciando ingesta de catálogo a Directus...');

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets['PRECIOS VENTA A.P.'];
  const allData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const rows = allData.slice(6, 16); // Data starts after header at row 5, test with 10 rows

  // 1. Login
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const { data: { access_token } } = await loginRes.json();
  const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' };

  console.log('✅ Autenticado.');

  // Caches
  const cache = { categorias: {}, marcas: {}, lineas: {}, productos: {} };

  async function getOrCreate(collection, name, data = {}) {
    if (cache[collection][name]) return cache[collection][name];

    // Buscar existente
    const searchRes = await fetch(`${DIRECTUS_URL}/items/${collection}?filter[nombre][_eq]=${encodeURIComponent(name)}`, { headers });
    const { data: existing } = await searchRes.json();

    if (existing && existing.length > 0) {
      cache[collection][name] = existing[0].id;
      return existing[0].id;
    }

    // Crear nuevo
    const createRes = await fetch(`${DIRECTUS_URL}/items/${collection}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ nombre: name, ...data })
    });
    
    const body = await createRes.json();
    
    if (!createRes.ok) {
        console.error(`❌ Error creando item en ${collection}:`, JSON.stringify(body, null, 2));
        throw new Error(`Fallo creación en ${collection}`);
    }

    const created = body.data;
    cache[collection][name] = created.id;
    return created.id;
  }

  for (const row of rows) {
    const articulo = row[0];
    if (!articulo || typeof articulo !== 'string') continue;

    const precioEf = row[1];
    const precioTr = row[2];
    const proveedor = row[4] || 'Varios';
    const categoriaNom = row[5] || 'General';

    console.log(`📦 Procesando: ${articulo}...`);

    // Inferencia de Marca
    let marcaNom = 'Varios';
    if (articulo.toUpperCase().includes('EGGER')) marcaNom = 'Egger';
    else if (articulo.toUpperCase().includes('FAPLAC')) marcaNom = 'Faplac';
    else if (articulo.toUpperCase().includes('SADEPAN')) marcaNom = 'Sadepan';
    else marcaNom = proveedor;

    // Normalizar nombre de producto y variante
    // Ej: "BLANCO EGGER 18MM AGLO" -> Producto: "Blanco", Variante: "18mm Aglo"
    let prodNombre = articulo.replace(new RegExp(marcaNom, 'gi'), '').trim();
    let varianteInfo = '';

    const matchMedida = prodNombre.match(/(\d+\s*MM.*)/i);
    if (matchMedida) {
        varianteInfo = matchMedida[1].trim();
        prodNombre = prodNombre.replace(matchMedida[1], '').trim();
    }

    if (!prodNombre) prodNombre = articulo; // Fallback

    const catId = await getOrCreate('categorias', categoriaNom);
    const marcaId = await getOrCreate('marcas', marcaNom);
    const lineaId = await getOrCreate('lineas', 'General', { marca_id: marcaId });
    const prodId = await getOrCreate('productos', prodNombre, { categoria_id: catId, marca_id: marcaId, linea_id: lineaId, status: 'published' });

    // Crear Variante (SKU)
    // Usamos el nombre completo del articulo como codigo de proveedor si no hay uno real
    await fetch(`${DIRECTUS_URL}/items/variantes_sku`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            producto_id: prodId,
            codigo_proveedor: articulo,
            especificacion: varianteInfo || 'Estándar',
            precio_efectivo: precioEf,
            precio_transferencia: precioTr,
            ultima_act: new Date().toISOString()
        })
    });
  }

  console.log('🏁 Ingesta completada.');
}

ingest().catch(console.error);
