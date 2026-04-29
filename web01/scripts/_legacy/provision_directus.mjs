import { createDirectus, rest, authentication, createCollection, createField, readCollections } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function provision() {
    console.log("--- 🚀 Iniciando Provisión de Directus (SDK v18) ---");
    
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        console.log(`Intentando login como ${ADMIN_EMAIL}...`);
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Login exitoso.");

        const existingCollections = await client.request(readCollections());
        const names = existingCollections.map(c => c.collection);
        console.log("Colecciones existentes (no-sistema):", names.filter(n => !n.startsWith('directus_')));

        // --- 1. SUCURSALES ---
        if (!names.includes('sucursales')) {
            console.log("Creando colección 'sucursales'...");
            await client.request(createCollection({
                collection: 'sucursales',
                meta: { icon: 'store', display_name: 'Sucursales', show_24_hour_time: true },
                schema: {}
            }));
            
            await client.request(createField('sucursales', { field: 'nombre', type: 'string', meta: { interface: 'input', display_name: 'Nombre' } }));
            await client.request(createField('sucursales', { field: 'direccion', type: 'text', meta: { interface: 'textarea', display_name: 'Dirección' } }));
            await client.request(createField('sucursales', { field: 'telefono', type: 'string', meta: { interface: 'input', display_name: 'Teléfono' } }));
            await client.request(createField('sucursales', { field: 'coordenadas', type: 'string', meta: { interface: 'input', display_name: 'Coordenadas (lat, lng)' } }));
            await client.request(createField('sucursales', { field: 'es_central', type: 'boolean', meta: { interface: 'boolean', display_name: 'Es Casa Central' } }));
            console.log("✅ Colección 'sucursales' configurada.");
        }

        // --- 2. FIDELIZACIÓN ---
        if (!names.includes('niveles_fidelidad')) {
            console.log("Creando colección 'niveles_fidelidad'...");
            await client.request(createCollection({
                collection: 'niveles_fidelidad',
                meta: { icon: 'military_tech', display_name: 'Niveles de Fidelidad' }
            }));
            await client.request(createField('niveles_fidelidad', { field: 'nombre', type: 'string', meta: { interface: 'input' } }));
            await client.request(createField('niveles_fidelidad', { field: 'puntos_min', type: 'integer', meta: { interface: 'input' } }));
            await client.request(createField('niveles_fidelidad', { field: 'multiplicador_puntos', type: 'decimal', meta: { interface: 'input' } }));
            await client.request(createField('niveles_fidelidad', { field: 'descuento_porcentaje', type: 'decimal', meta: { interface: 'input' } }));
            console.log("✅ Colección 'niveles_fidelidad' configurada.");
        }

        if (!names.includes('puntos_ledger')) {
            console.log("Creando colección 'puntos_ledger'...");
            await client.request(createCollection({
                collection: 'puntos_ledger',
                meta: { icon: 'account_balance_wallet', display_name: 'Libro de Puntos' }
            }));
            await client.request(createField('puntos_ledger', { field: 'usuario_id', type: 'integer', meta: { interface: 'input' } }));
            await client.request(createField('puntos_ledger', { field: 'puntos', type: 'integer', meta: { interface: 'input' } }));
            await client.request(createField('puntos_ledger', { field: 'motivo', type: 'string', meta: { interface: 'input' } }));
            await client.request(createField('puntos_ledger', { field: 'referencia_pedido', type: 'string', meta: { interface: 'input' } }));
            console.log("✅ Colección 'puntos_ledger' configurada.");
        }

        // --- 3. FINANZAS ---
        if (!names.includes('transacciones_financieras')) {
            console.log("Creando colección 'transacciones_financieras'...");
            await client.request(createCollection({
                collection: 'transacciones_financieras',
                meta: { icon: 'attach_money', display_name: 'Transacciones Financieras' }
            }));
            await client.request(createField('transacciones_financieras', { field: 'usuario_id', type: 'integer' }));
            await client.request(createField('transacciones_financieras', { field: 'monto', type: 'decimal' }));
            await client.request(createField('transacciones_financieras', { field: 'moneda', type: 'string' })); // ARS, USD
            await client.request(createField('transacciones_financieras', { field: 'metodo_pago', type: 'string' }));
            console.log("✅ Colección 'transacciones_financieras' configurada.");
        }

        // --- 4. TRAZABILIDAD DE PEDIDOS ---
        if (!names.includes('historial_estados_pedidos')) {
            console.log("Creando colección 'historial_estados_pedidos'...");
            await client.request(createCollection({
                collection: 'historial_estados_pedidos',
                meta: { icon: 'history', display_name: 'Historial de Estados' }
            }));
            await client.request(createField('historial_estados_pedidos', { field: 'pedido_id', type: 'integer' }));
            await client.request(createField('historial_estados_pedidos', { field: 'estado_anterior', type: 'string' }));
            await client.request(createField('historial_estados_pedidos', { field: 'estado_nuevo', type: 'string' }));
            await client.request(createField('historial_estados_pedidos', { field: 'notas', type: 'text' }));
            console.log("✅ Colección 'historial_estados_pedidos' configurada.");
        }

        console.log("--- ✨ Provisión Finalizada Correctamente ---");
        
    } catch (e) {
        console.error("❌ Error en la provisión:", e.message || e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

provision();
