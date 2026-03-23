const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function setup() {
  console.log('🚀 Reiniciando configuración de esquema en Directus (con UUIDs)...');

  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const { data: { access_token } } = await loginRes.json();
  const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' };

  const collections = ['atributos_tecnicos', 'variantes_sku', 'productos', 'lineas', 'categorias', 'marcas'];

  // 1. Eliminar colecciones existentes (en orden inverso de dependencia)
  for (const collection of collections) {
    console.log(`🗑️ Eliminando colección: ${collection}...`);
    await fetch(`${DIRECTUS_URL}/collections/${collection}`, { method: 'DELETE', headers });
  }

  // Helper para crear colecciones con PK UUID
  const createCollection = async (collection, meta = {}) => {
    console.log(`📦 Creando colección: ${collection} (PK: UUID)...`);
    const res = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        collection, 
        meta, 
        schema: {
          fields: [{ field: 'id', type: 'uuid', primary_key: true }]
        } 
      })
    });
    if (!res.ok) console.error(`❌ Error creando ${collection}:`, await res.text());
  };

  const createField = async (collection, field, type, meta = {}, schema = {}) => {
    const res = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ field, type, meta, schema })
    });
    if (!res.ok) console.error(`❌ Error campo ${field}:`, await res.text());
  };

  // --- Recrear ---

  await createCollection('marcas', { icon: 'branding_watermark' });
  await createField('marcas', 'nombre', 'string', { interface: 'input' });
  await createField('marcas', 'logo', 'uuid', { interface: 'file' });

  await createCollection('categorias', { icon: 'category' });
  await createField('categorias', 'nombre', 'string', { interface: 'input' });
  await createField('categorias', 'padre', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });

  await createCollection('lineas', { icon: 'linear_scale' });
  await createField('lineas', 'nombre', 'string', { interface: 'input' });
  await createField('lineas', 'marca_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });

  await createCollection('productos', { icon: 'inventory_2' });
  await createField('productos', 'nombre', 'string', { interface: 'input' });
  await createField('productos', 'categoria_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });
  await createField('productos', 'marca_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });
  await createField('productos', 'linea_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'lineas', foreign_key_column: 'id' });

  await createCollection('variantes_sku', { icon: 'qr_code' });
  await createField('variantes_sku', 'producto_id', 'uuid', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'productos', foreign_key_column: 'id' });
  await createField('variantes_sku', 'codigo_proveedor', 'string', { interface: 'input' });
  await createField('variantes_sku', 'precio_efectivo', 'decimal');
  await createField('variantes_sku', 'precio_transferencia', 'decimal');

  console.log('🏁 Esquema recreado exitosamente con UUIDs.');
}

setup().catch(console.error);
