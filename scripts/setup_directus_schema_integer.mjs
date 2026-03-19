// Fix script to ensure all IDs are Integer
const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function setup() {
  console.log('🚀 Iniciando RE-configuración de esquema en Directus (Estandarizando a INTEGER)...');

  const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const { data: { access_token } } = await loginRes.json();
  const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' };

  const collections = ['atributos_tecnicos', 'variantes_sku', 'productos', 'lineas', 'categorias', 'marcas', 'clientes', 'vendedores'];

  // ... previous logic for deletion and helpers ...

  // --- Recrear ---

  await createCollection('vendedores', { icon: 'person_pin', note: 'Equipo de ventas' });
  await createField('vendedores', 'Nombre', 'string', { interface: 'input' });
  await createField('vendedores', 'Whatsapp', 'string', { interface: 'input' });
  await createField('vendedores', 'email', 'string', { interface: 'input' });
  await createField('vendedores', 'role', 'string', { interface: 'select-dropdown', options: { choices: [{ text: 'Vendedor', value: 'seller' }, { text: 'Admin', value: 'admin' }] } });

  await createCollection('clientes', { icon: 'supervised_user_circle', note: 'Base de profesionales' });
  await createField('clientes', 'status', 'string', { interface: 'select-dropdown', options: { choices: [{ text: 'Publicado', value: 'published' }, { text: 'Borrador', value: 'draft' }] } });
  await createField('clientes', 'nombre_empresa', 'string', { interface: 'input' });
  await createField('clientes', 'whatsapp', 'string', { interface: 'input' });
  await createField('clientes', 'direccion', 'text', { interface: 'textarea' });
  await createField('clientes', 'email', 'string', { interface: 'input' });
  await createField('clientes', 'password_hash', 'string', { interface: 'input' });
  await createField('clientes', 'client_number', 'string', { interface: 'input' });
  await createField('clientes', 'puntaje', 'integer', { interface: 'input' });
  await createField('clientes', 'fin_status', 'string', { interface: 'select-dropdown', options: { choices: [{ text: 'Al día', value: 'clean' }, { text: 'Parcial', value: 'partial' }, { text: 'Deuda', value: 'debt' }] } });
  await createField('clientes', 'debt_amount', 'decimal', { interface: 'input' });
  await createField('clientes', 'vendedor_asignado', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'vendedores', foreign_key_column: 'id' });

  await createCollection('marcas', { icon: 'branding_watermark' });
  await createField('marcas', 'nombre', 'string', { interface: 'input' });
  await createField('marcas', 'logo', 'uuid', { interface: 'file' });

  await createCollection('categorias', { icon: 'category' });
  await createField('categorias', 'nombre', 'string', { interface: 'input' });
  // FK a si mismo debe ser Integer
  await createField('categorias', 'padre', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });

  await createCollection('lineas', { icon: 'linear_scale' });
  await createField('lineas', 'nombre', 'string', { interface: 'input' });
  // FK a marcas debe ser Integer
  await createField('lineas', 'marca_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });

  await createCollection('productos', { icon: 'inventory_2' });
  await createField('productos', 'status', 'string');
  await createField('productos', 'nombre', 'string', { interface: 'input' });
  // Todas las FKs deben ser Integer
  await createField('productos', 'categoria_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'categorias', foreign_key_column: 'id' });
  await createField('productos', 'marca_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'marcas', foreign_key_column: 'id' });
  await createField('productos', 'linea_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'lineas', foreign_key_column: 'id' });

  await createCollection('variantes_sku', { icon: 'qr_code' });
  await createField('variantes_sku', 'producto_id', 'integer', { interface: 'select-dropdown-m2o' }, { foreign_key_table: 'productos', foreign_key_column: 'id' });
  await createField('variantes_sku', 'codigo_proveedor', 'string', { interface: 'input' });
  await createField('variantes_sku', 'especificacion', 'string', { interface: 'input' });
  await createField('variantes_sku', 'precio_efectivo', 'decimal');
  await createField('variantes_sku', 'precio_transferencia', 'decimal');
  await createField('variantes_sku', 'ultima_act', 'datetime');



  console.log('🏁 Esquema recreado exitosamente con IDs INTEGER.');
}

setup().catch(console.error);
