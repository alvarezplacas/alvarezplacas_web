import { createDirectus, rest, authentication, deleteCollection, createCollection, createField, createItem, readCollections } from '@directus/sdk';

const DIRECTUS_URL = 'http://alvarezplacas_directus:8055';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASS = 'JavierMix2026!';

async function rebuild() {
    console.log("--- 🔱 Iniciando Reconstrucción Final (Alineación con Frontend) ---");
    
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASS);
        const collections = await client.request(readCollections());
        const names = collections.map(c => c.collection);
        
        // Exorcismo: Borrar todo lo relacionado para asegurar consistencia
        const toExorcise = [
            'pedidos', 'clientes', 'vendedores', 'sucursales', 'branches', 
            'mensajes_contacto', 'materiales', 'marcas', 'categorias', 'espesores'
        ];

        for (const col of toExorcise) {
            if (names.includes(col)) {
                console.log(`🧹 Eliminando colección: ${col}...`);
                try {
                    await client.request(deleteCollection(col));
                } catch (e) {
                    console.warn(`⚠️ No se pudo eliminar ${col}, procediendo...`);
                }
            }
        }

        console.log("--- ✨ Renacimiento: Creando Colecciones Alineadas ---");

        // 1. VENDEDORES (Campos: id, name, whatsapp, email)
        console.log("📦 Creando 'vendedores'...");
        await client.request(createCollection({ collection: 'vendedores', meta: { icon: 'badge' }, schema: {} }));
        await client.request(createField('vendedores', { field: 'name', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('vendedores', { field: 'whatsapp', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('vendedores', { field: 'email', type: 'string', meta: { interface: 'input' } }));

        // 2. CLIENTES (Campos: id, name, email, phone, address, vendedor_id)
        console.log("📦 Creando 'clientes'...");
        await client.request(createCollection({ collection: 'clientes', meta: { icon: 'person' }, schema: {} }));
        await client.request(createField('clientes', { field: 'name', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'email', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'phone', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'address', type: 'text', meta: { interface: 'textarea' } }));
        await client.request(createField('clientes', { field: 'vendedor_id', type: 'integer', schema: { foreign_key_table: 'vendedores', foreign_key_column: 'id' } }));
        // Campos adicionales para lógica de negocio
        await client.request(createField('clientes', { field: 'scoring', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } }));
        await client.request(createField('clientes', { field: 'debt_amount', type: 'decimal', meta: { interface: 'input' }, schema: { default_value: 0 } }));

        // 3. PEDIDOS (Campos: id, cliente_id, vendedor_id, status, resumen_visible, leptom_raw, total_m2)
        console.log("📦 Creando 'pedidos'...");
        await client.request(createCollection({ collection: 'pedidos', meta: { icon: 'shopping_cart' }, schema: {} }));
        await client.request(createField('pedidos', { field: 'cliente_id', type: 'integer', schema: { foreign_key_table: 'clientes', foreign_key_column: 'id' } }));
        await client.request(createField('pedidos', { field: 'vendedor_id', type: 'integer', schema: { foreign_key_table: 'vendedores', foreign_key_column: 'id' } }));
        await client.request(createField('pedidos', { field: 'status', type: 'string', meta: { interface: 'select', options: [{ text: 'Presupuesto', value: 'presupuesto' }, { text: 'En Producción', value: 'en_produccion' }] } }));
        await client.request(createField('pedidos', { field: 'resumen_visible', type: 'text', meta: { interface: 'textarea' } }));
        await client.request(createField('pedidos', { field: 'leptom_raw', type: 'text', meta: { interface: 'textarea' } }));
        await client.request(createField('pedidos', { field: 'total_m2', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('pedidos', { field: 'fecha_pedido', type: 'timestamp', meta: { interface: 'datetime' } }));

        // 4. SUCURSALES (Campos: id, nombre, direccion, es_central)
        console.log("📦 Creando 'sucursales'...");
        await client.request(createCollection({ collection: 'sucursales', meta: { icon: 'store' }, schema: {} }));
        await client.request(createField('sucursales', { field: 'nombre', type: 'string' }));
        await client.request(createField('sucursales', { field: 'direccion', type: 'string' }));
        await client.request(createField('sucursales', { field: 'es_central', type: 'boolean' }));

        // 5. MENSAJES DE CONTACTO
        console.log("📦 Creando 'mensajes_contacto'...");
        await client.request(createCollection({ collection: 'mensajes_contacto', meta: { icon: 'mail' }, schema: {} }));
        await client.request(createField('mensajes_contacto', { field: 'nombre', type: 'string' }));
        await client.request(createField('mensajes_contacto', { field: 'email', type: 'string' }));
        await client.request(createField('mensajes_contacto', { field: 'telefono', type: 'string' }));
        await client.request(createField('mensajes_contacto', { field: 'tipo', type: 'string' }));
        await client.request(createField('mensajes_contacto', { field: 'mensaje', type: 'text' }));
        await client.request(createField('mensajes_contacto', { field: 'fecha', type: 'timestamp' }));

        // 6. CATÁLOGO BASE (Para que ingest_catalog funcione)
        console.log("📦 Creando Tablas de Catálogo...");
        await client.request(createCollection({ collection: 'marcas', schema: {} }));
        await client.request(createField('marcas', { field: 'nombre', type: 'string' }));
        await client.request(createCollection({ collection: 'categorias', schema: {} }));
        await client.request(createField('categorias', { field: 'nombre', type: 'string' }));
        await client.request(createField('categorias', { field: 'slug', type: 'string' }));
        await client.request(createCollection({ collection: 'espesores', schema: {} }));
        await client.request(createField('espesores', { field: 'valor', type: 'string' }));
        
        await client.request(createCollection({ collection: 'materiales', meta: { icon: 'layers' }, schema: {} }));
        await client.request(createField('materiales', { field: 'nombre', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'sku', type: 'string', schema: { is_unique: true }, meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'slug', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'descripcion', type: 'text', meta: { interface: 'textarea' } }));
        await client.request(createField('materiales', { field: 'linea', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'tags', type: 'string', meta: { interface: 'tags' } }));
        
        // Atributos Técnicos (Alineados con Excel)
        await client.request(createField('materiales', { field: 'tipo', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'color', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'textura', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'medidas', type: 'string', meta: { interface: 'input' } }));
        
        await client.request(createField('materiales', { field: 'activo', type: 'boolean', schema: { default_value: true }, meta: { interface: 'boolean' } }));
        
        // Precios L1/L2 (Alineados con Excel)
        await client.request(createField('materiales', { field: 'precio_l1', type: 'decimal', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'precio_l2', type: 'decimal', meta: { interface: 'input' } }));
        
        await client.request(createField('materiales', { field: 'mostrar_precio', type: 'boolean', schema: { default_value: true }, meta: { interface: 'boolean' } }));
        await client.request(createField('materiales', { field: 'stock', type: 'integer', meta: { interface: 'input' } }));
        await client.request(createField('materiales', { field: 'imagen', type: 'uuid', meta: { interface: 'file' } }));
        
        // ... rest of relations
        
        // Relaciones con Metadata Visual (Interfaces y Displays)
        await client.request(createField('materiales', { 
            field: 'id_marca', 
            type: 'integer', 
            schema: { foreign_key_table: 'marcas', foreign_key_column: 'id' },
            meta: { interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{nombre}}' } }
        }));
        await client.request(createField('materiales', { 
            field: 'id_categoria', 
            type: 'integer', 
            schema: { foreign_key_table: 'categorias', foreign_key_column: 'id' },
            meta: { interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{nombre}}' } }
        }));
        await client.request(createField('materiales', { 
            field: 'id_espesor', 
            type: 'integer', 
            schema: { foreign_key_table: 'espesores', foreign_key_column: 'id' },
            meta: { interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{valor}}' } }
        }));

        // SEED BÁSICO
        console.log("🌱 Insertando Datos de Semilla...");
        await client.request(createItem('vendedores', { name: 'Vendedor Central', email: 'vendedor1@alvarezplacas.com.ar', whatsapp: '5491161411842' }));
        await client.request(createItem('sucursales', { nombre: 'Casa Central', direccion: 'Av. Vergara y Bradley', es_central: true }));
        await client.request(createItem('sucursales', { nombre: 'Depósito Tesei', direccion: 'Av. Vergara 1605', es_central: false }));

        console.log("--- ✨ Reconstrucción Finalizada con Éxito ---");

    } catch (e) {
        console.error("❌ Error grave en reconstrucción:", e.message || e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

rebuild();
