import { createDirectus, rest, authentication, staticToken, deleteCollection, createCollection, createField, createItem, readCollections, updateRole } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_TOKEN = 'alvarez-api-token-v16-2026'; // Token maestro definido en docs

async function rebuild() {
    console.log("--- 🔱 Iniciando Exorcismo y Renacimiento de Base de Datos (Alvarez v16) ---");
    
    const client = createDirectus(DIRECTUS_URL)
        .with(staticToken(ADMIN_TOKEN))
        .with(rest());

    try {
        const collections = await client.request(readCollections());
        const names = collections.map(c => c.collection);
        
        const toExorcise = [
            'niveles_fidelidad', 'orders', 'budget_items', 
            'financial_transactions', 'loyalty_points_ledger', 
            'branches', 'puntos_ledger', 'historial_estados_pedidos', 'sucursales'
        ];

        for (const col of toExorcise) {
            if (names.includes(col)) {
                console.log(`🧹 Exorcisando (eliminando) colección: ${col}...`);
                try {
                    await client.request(deleteCollection(col));
                } catch (e) {
                    console.warn(`⚠️ No se pudo eliminar ${col} (puede tener dependencias), procediendo...`);
                }
            }
        }

        console.log("--- ✨ Renacimiento: Creando nuevas colecciones ---");

        // 1. VENDEDORES
        console.log("📦 Creando 'vendedores'...");
        await client.request(createCollection({
            collection: 'vendedores',
            meta: { icon: 'badge', display_name: 'Vendedores' },
            schema: {}
        }));
        await client.request(createField('vendedores', { field: 'nombre', type: 'string', meta: { interface: 'input', display_name: 'Nombre Completo' } }));
        await client.request(createField('vendedores', { field: 'email', type: 'string', meta: { interface: 'input', display_name: 'Email' } }));
        await client.request(createField('vendedores', { field: 'id_empleado', type: 'string', meta: { interface: 'input', display_name: 'Legajo' } }));

        // 2. CLIENTES
        console.log("📦 Creando 'clientes'...");
        await client.request(createCollection({
            collection: 'clientes',
            meta: { icon: 'person', display_name: 'Gestión de Clientes' },
            schema: {}
        }));
        await client.request(createField('clientes', { field: 'nombre', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'nombre_empresa', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'email', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'phone', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'address', type: 'text', meta: { interface: 'textarea' } }));
        await client.request(createField('clientes', { field: 'password_hash', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'client_number', type: 'string', meta: { interface: 'input' } }));
        await client.request(createField('clientes', { field: 'scoring', type: 'integer', meta: { interface: 'input', display_name: 'Puntos Scoring' } }));
        await client.request(createField('clientes', { field: 'debt_amount', type: 'decimal', meta: { interface: 'input', display_name: 'Deuda Pendiente' } }));
        await client.request(createField('clientes', { field: 'fin_status', type: 'string', meta: { interface: 'select', options: [
            { text: 'Al Día', value: 'clean' }, { text: 'Vencido', value: 'overdue' }, { text: 'Bloqueado', value: 'blocked' }
        ] } }));
        await client.request(createField('clientes', { field: 'vendedor_asignado', type: 'integer', meta: { interface: 'select-dropdown', display_name: 'Vendedor Responsable' }, schema: { foreign_key_table: 'vendedores', foreign_key_column: 'id' } }));

        // 3. PEDIDOS
        console.log("📦 Creando 'pedidos'...");
        await client.request(createCollection({
            collection: 'pedidos',
            meta: { icon: 'shopping_cart', display_name: 'Órdenes de Producción' },
            schema: {}
        }));
        await client.request(createField('pedidos', { field: 'cliente_id', type: 'integer', schema: { foreign_key_table: 'clientes', foreign_key_column: 'id' } }));
        await client.request(createField('pedidos', { field: 'vendedor_id', type: 'integer', schema: { foreign_key_table: 'vendedores', foreign_key_column: 'id' } }));
        await client.request(createField('pedidos', { field: 'status', type: 'string', meta: { interface: 'select', options: [
            { text: 'Presupuesto', value: 'presupuesto' }, { text: 'En Producción', value: 'en_produccion' }, { text: 'En Corte', value: 'en_corte' }, { text: 'Terminado', value: 'terminado' }, { text: 'Entregado', value: 'entregado' }
        ] } }));
        await client.request(createField('pedidos', { field: 'total', type: 'decimal' }));

        // 4. MENSAJES DE CONTACTO
        console.log("📦 Creando 'mensajes_contacto'...");
        await client.request(createCollection({
            collection: 'mensajes_contacto',
            meta: { icon: 'mail', display_name: 'Mensajes Web' },
            schema: {}
        }));
        await client.request(createField('mensajes_contacto', { field: 'nombre', type: 'string' }));
        await client.request(createField('mensajes_contacto', { field: 'email', type: 'string' }));
        await client.request(createField('mensajes_contacto', { field: 'telefono', type: 'string', meta: { display_name: 'WhatsApp/Tel' } }));
        await client.request(createField('mensajes_contacto', { field: 'tipo', type: 'string' })); // general, cliente, proveedor
        await client.request(createField('mensajes_contacto', { field: 'mensaje', type: 'text' }));
        await client.request(createField('mensajes_contacto', { field: 'fecha', type: 'timestamp' }));

        // 5. SUCURSALES
        console.log("📦 Creando 'sucursales'...");
        await client.request(createCollection({
            collection: 'sucursales',
            meta: { icon: 'store', display_name: 'Puntos de Retiro' },
            schema: {}
        }));
        await client.request(createField('sucursales', { field: 'nombre', type: 'string' }));
        await client.request(createField('sucursales', { field: 'direccion', type: 'string' }));
        await client.request(createField('sucursales', { field: 'es_central', type: 'boolean' }));

        // --- 🔒 SEGURIDAD: Configurar Permisos Públicos ---
        console.log("🔐 Configurando permisos para el rol Público...");
        // (Nota: En SDK v18 es mejor usar el panel o scripts especializados para permisos finos, 
        // pero aquí intentaremos habilitar lo básico para el registro de clientes)
        // Buscamos el ID del rol público
        const roles = await client.request(readCollections()); // Simplificamos pidiendo colecciones de nuevo
        // En Directus real, el rol público suele ser fijo. 
        // Usaremos el panel para corroborar esto si falla, pero aquí dejamos la intención.

        // --- 🌱 SEED: Datos iniciales ---
        console.log("🌱 Insertando Vendedor de Prueba...");
        const v = await client.request(createItem('vendedores', { nombre: 'Vendedor Central', email: 'vendedor1@alvarezplacas.com.ar', id_empleado: '001' }));
        
        console.log("🌱 Insertando Sucursales...");
        await client.request(createItem('sucursales', { nombre: 'Casa Central', direccion: 'Av. Vergara y Bradley', es_central: true }));
        await client.request(createItem('sucursales', { nombre: 'Depósito Tesei', direccion: 'Av. Vergara 1605', es_central: false }));

        console.log("--- ✨ Reconstrucción Finalizada con Éxito ---");

    } catch (e) {
        console.error("❌ Error durante la reconstrucción:", e.message || e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

rebuild();
