import { createDirectus, rest, staticToken, createField, updateField, readPermissions, deletePermission, createRole, createPermission } from '@directus/sdk';

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const staticTokenValue = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

async function safeCreateField(collection, fieldData) {
    try {
        await client.request(createField(collection, fieldData));
        console.log(`✅ Campo '${fieldData.field}' creado en '${collection}'`);
    } catch (e) {
        if (e.errors?.[0]?.message?.includes('already exists')) {
            console.log(`⚠️ Campo '${fieldData.field}' ya existe en '${collection}'.`);
        } else {
            console.error(`❌ Error creando campo '${fieldData.field}':`, e.errors?.[0]?.message || e);
        }
    }
}

async function fixSecurityAndSync() {
    console.log('🚀 Iniciando Sincronización de Seguridad y Esquema...');

    // 1. BLINDAJE DE SEGURIDAD (Eliminar permisos públicos peligrosos)
    try {
        const perms = await client.request(readPermissions({
            filter: { 
                policy: { _null: true }, // Rol Público suele tener policy null en algunas versiones o un ID específico
                collection: { _in: ['clientes', 'pedidos', 'mensajes'] }
            }
        }));

        for (const p of perms) {
            if (['read', 'update', 'delete'].includes(p.action)) {
                await client.request(deletePermission(p.id));
                console.log(`🔒 Eliminado permiso público de '${p.action}' en '${p.collection}'`);
            }
        }
    } catch (e) {
        console.error('⚠️ Error al limpiar seguridad pública:', e.message);
    }

    // 2. ACTUALIZAR COLECCIÓN 'clientes'
    await safeCreateField('clientes', { field: 'nombre_empresa', type: 'string', meta: { interface: 'input' } });
    await safeCreateField('clientes', { field: 'debt_amount', type: 'decimal', meta: { interface: 'input', note: 'Deuda actual' } });
    await safeCreateField('clientes', { 
        field: 'fin_status', 
        type: 'string', 
        meta: { 
            interface: 'select-dropdown', 
            options: { 
                choices: [
                    { text: 'Al Día', value: 'clean' },
                    { text: 'Vencido', value: 'overdue' },
                    { text: 'Bloqueado', value: 'blocked' }
                ] 
            } 
        } 
    });
    // Renombrar puntos a puntaje si es necesario (asumimos crear puntaje por ahora)
    await safeCreateField('clientes', { field: 'puntaje', type: 'integer', meta: { interface: 'input' } });

    // 3. ACTUALIZAR COLECCIÓN 'pedidos'
    await safeCreateField('pedidos', { field: 'resumen_visible', type: 'text', meta: { interface: 'input-multiline' } });
    await safeCreateField('pedidos', { field: 'leptom_raw', type: 'text', meta: { interface: 'input-multiline', hidden: true } });
    await safeCreateField('pedidos', { field: 'total_m2', type: 'decimal', meta: { interface: 'input' } });
    await safeCreateField('pedidos', { field: 'fecha_pedido', type: 'timestamp', meta: { interface: 'datetime' } });
    await safeCreateField('pedidos', { 
        field: 'status', 
        type: 'string', 
        meta: { 
            interface: 'select-dropdown', 
            options: { 
                choices: [
                    { text: 'Presupuesto', value: 'presupuesto' },
                    { text: 'En Producción', value: 'en_produccion' },
                    { text: 'En Corte', value: 'en_corte' },
                    { text: 'Terminado', value: 'terminado' },
                    { text: 'En Reparto', value: 'en_reparto' },
                    { text: 'Entregado', value: 'entregado' }
                ] 
            } 
        } 
    });

    // 4. ACTUALIZAR COLECCIÓN 'vendedores'
    await safeCreateField('vendedores', { field: 'whatsapp', type: 'string', meta: { interface: 'input', note: 'Formato: 549341...' } });

    // 5. CREAR ROLES (Opcional, manual es más seguro para IDs)
    console.log('✅ Sincronización de esquemas finalizada.');
}

fixSecurityAndSync();
