const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function setup() {
  console.log('🚀 Iniciando configuración de esquema de Catálogo (INTEGER)...');

  // 1. Login
  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginRes.ok) throw new Error(`Error en login: ${loginRes.statusText}`);
  const { data: { access_token } } = await loginRes.json();
  const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' };

  // Helpers
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

  // --- Recrear Colecciones ---

  await createCollection('marcas', { icon: 'branding_watermark' });
  await createField('marcas', 'nombre', 'string', { interface: 'input' });
  await createField('marcas', 'logo', 'uuid', { interface: 'file' });

  await createCollection('categorias', { icon: 'category' });
  await createField('categorias', 'nombre', 'string', { interface: 'input' });
  await createField('categorias', 'padre', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });

  await createCollection('lineas', { icon: 'linear_scale' });
  await createField('lineas', 'nombre', 'string', { interface: 'input' });
  await createField('lineas', 'marca_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });

  await createCollection('productos', { icon: 'inventory_2' });
  await createField('productos', 'status', 'string', { interface: 'select-dropdown', options: { choices: [{ text: 'Publicado', value: 'published' }, { text: 'Borrador', value: 'draft' }] } });
  await createField('productos', 'nombre', 'string', { interface: 'input' });
  await createField('productos', 'sku', 'string', { interface: 'input' });
  await createField('productos', 'slug', 'string', { interface: 'input' });
  await createField('productos', 'descripcion', 'text', { interface: 'textarea' });
  await createField('productos', 'precio', 'decimal', { interface: 'input' });
  await createField('productos', 'stock', 'integer', { interface: 'input' });
  await createField('productos', 'categoria_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });
  await createField('productos', 'marca_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });
  await createField('productos', 'linea_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'lineas', foreign_key_column: 'id' });
  await createField('productos', 'atributos', 'json', { interface: 'list' });
  await createField('productos', 'tags', 'json', { interface: 'tags' });

  console.log('🏁 Esquema de Catálogo configurado exitosamente.');
}

setup().catch(console.error);
