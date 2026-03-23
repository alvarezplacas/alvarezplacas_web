// Usando fetch nativo de Node 22

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function setup() {
  console.log('🚀 Iniciando configuración de esquema en Directus...');

  // 1. Login
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginRes.ok) {
    throw new Error(`Error en login: ${loginRes.statusText}`);
  }

  const { data: { access_token } } = await loginRes.json();
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  };

  console.log('✅ Autenticado exitosamente.');

  // Helper para crear colecciones
  const createCollection = async (collection, meta = {}) => {
    console.log(`📦 Creando colección: ${collection}...`);
    const res = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ collection, meta, schema: {} })
    });
    if (!res.ok) {
      const error = await res.json();
      if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
        console.log(`⚠️ La colección ${collection} ya existe.`);
        return;
      }
      console.error(`❌ Error creando ${collection}:`, JSON.stringify(error, null, 2));
    } else {
      console.log(`✅ Colección ${collection} creada.`);
    }
  };

  // Helper para crear campos
  const createField = async (collection, field, type, meta = {}, schema = {}) => {
    console.log(`📝 Creando campo ${field} en ${collection}...`);
    const res = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ field, type, meta, schema })
    });
    if (!res.ok) {
        const error = await res.json();
        if (error.errors?.[0]?.extensions?.code === 'INVALID_PAYLOAD' && error.errors?.[0]?.message?.includes('already exists')) {
            console.log(`⚠️ El campo ${field} ya existe en ${collection}.`);
            return;
        }
        console.error(`❌ Error creando campo ${field}:`, JSON.stringify(error, null, 2));
    }
  };

  // --- 1. Colecciones Base ---

  await createCollection('marcas', { icon: 'branding_watermark', note: 'Marcas de proveedores' });
  await createField('marcas', 'nombre', 'string', { interface: 'input' });
  await createField('marcas', 'logo', 'uuid', { interface: 'file' });
  await createField('marcas', 'descripcion', 'text', { interface: 'wysiwyg' });

  await createCollection('categorias', { icon: 'category', note: 'Jerarquía de productos' });
  await createField('categorias', 'nombre', 'string', { interface: 'input' });
  await createField('categorias', 'slug', 'string', { interface: 'slug' });
  await createField('categorias', 'icono', 'string', { interface: 'input' });
  await createField('categorias', 'padre', 'uuid', { interface: 'select-dropdown-m2o', options: { template: '{{nombre}}' } }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });

  await createCollection('lineas', { icon: 'linear_scale', note: 'Líneas de productos por marca' });
  await createField('lineas', 'nombre', 'string', { interface: 'input' });
  await createField('lineas', 'descripcion', 'text', { interface: 'textarea' });
  await createField('lineas', 'marca_id', 'uuid', { interface: 'select-dropdown-m2o', options: { template: '{{nombre}}' } }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });

  // --- 2. Productos ---

  await createCollection('productos', { icon: 'inventory_2', note: 'Catálogo Maestro' });
  await createField('productos', 'status', 'string', { interface: 'select-dropdown', options: { choices: [{ text: 'Publicado', value: 'published' }, { text: 'Borrador', value: 'draft' }, { text: 'Archivado', value: 'archived' }] } });
  await createField('productos', 'nombre', 'string', { interface: 'input' });
  await createField('productos', 'categoria_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });
  await createField('productos', 'marca_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });
  await createField('productos', 'linea_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'lineas', foreign_key_column: 'id' });
  await createField('productos', 'imagen_cover', 'uuid', { interface: 'file' });
  await createField('productos', 'tags', 'json', { interface: 'tags' });

  // --- 3. Variantes SKU ---

  await createCollection('variantes_sku', { icon: 'qr_code', note: 'Unidades de venta y precios' });
  await createField('variantes_sku', 'producto_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'productos', foreign_key_column: 'id' });
  await createField('variantes_sku', 'codigo_proveedor', 'string', { interface: 'input' });
  await createField('variantes_sku', 'especificacion', 'string', { interface: 'input', note: 'Ej: 18mm, 15mm' });
  await createField('variantes_sku', 'acabado', 'string', { interface: 'input' });
  await createField('variantes_sku', 'precio_efectivo', 'decimal', { interface: 'input' });
  await createField('variantes_sku', 'precio_transferencia', 'decimal', { interface: 'input' });
  await createField('variantes_sku', 'stock', 'integer', { interface: 'input' });
  await createField('variantes_sku', 'ultima_act', 'datetime', { interface: 'datetime' });

  // --- 4. Atributos Técnicos ---

  await createCollection('atributos_tecnicos', { icon: 'settings', note: 'Filtros dinámicos' });
  await createField('atributos_tecnicos', 'producto_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'productos', foreign_key_column: 'id' });
  await createField('atributos_tecnicos', 'clave', 'string', { interface: 'input' });
  await createField('atributos_tecnicos', 'valor', 'string', { interface: 'input' });

  console.log('🏁 Configuración de esquema finalizada.');
}

setup().catch(console.error);
