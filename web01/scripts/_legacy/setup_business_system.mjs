import { createDirectus, rest, staticToken, createCollection, createItem, deleteCollection, createField } from '@directus/sdk';
import dotenv from 'dotenv';
dotenv.config();

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const staticTokenValue = 'jb-_twuOduXRpNMS_mN5-6jKKlE1ddH8';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

async function setupBusinessData() {
    console.log('🚀 Iniciando configuración maestra de Negocio (Vendedores + Clientes)...');

    try {
        // --- 1. VENDEDORES (Re-creación con PascalCase para Frontend) ---
        try {
            console.log('🔄 Limpiando colección vendedores...');
            await client.request(deleteCollection('vendedores'));
        } catch (e) {}

        console.log('📦 Creando colección: vendedores');
        await client.request(createCollection({
            collection: 'vendedores',
            meta: { icon: 'badge', note: 'Equipo de Ventas' },
            schema: { name: 'vendedores' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', readonly: true, hidden: true, special: ['uuid'] }, schema: { is_primary_key: true } },
                { field: 'Nombre', type: 'string', meta: { interface: 'input' } },
                { field: 'Whatsapp', type: 'string', meta: { interface: 'input', note: 'Ej: 1122334455' } },
                { field: 'Email', type: 'string', meta: { interface: 'input' } },
                { field: 'Sucursal', type: 'string', meta: { interface: 'input' } },
                { field: 'Nivel', type: 'string', meta: { interface: 'input' } }
            ]
        }));

        // Inyectar vendedores base
        const sellers = [
            { Nombre: 'Martín Giménez', Whatsapp: '1161411842', Email: 'martin@alvarezplacas.com', Sucursal: 'Villa Tesei', Nivel: 'Vendedor Sr.' },
            { Nombre: 'Laura Sánchez', Whatsapp: '1122334455', Email: 'laura@alvarezplacas.com', Sucursal: 'Hurlingham', Nivel: 'Vendedor' },
            { Nombre: 'Carlos Rodriguez', Whatsapp: '1155443322', Email: 'carlos@alvarezplacas.com', Sucursal: 'Villa Tesei', Nivel: 'Vendedor Jr.' }
        ];

        for (const s of sellers) {
            await client.request(createItem('vendedores', s));
            console.log(`👤 Vendedor listo: ${s.Nombre}`);
        }

        // --- 2. CLIENTES (Suscripciones) ---
        try {
            await client.request(deleteCollection('clientes'));
        } catch (e) {}

        console.log('📦 Creando colección: clientes');
        await client.request(createCollection({
            collection: 'clientes',
            meta: { icon: 'group', note: 'Base de datos de Clientes / Suscriptores' },
            schema: { name: 'clientes' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', readonly: true, hidden: true, special: ['uuid'] }, schema: { is_primary_key: true } },
                { field: 'nombre_empresa', type: 'string', meta: { interface: 'input', note: 'Razón social o Nombre' } },
                { field: 'email', type: 'string', meta: { interface: 'input' }, schema: { is_unique: true } },
                { field: 'whatsapp', type: 'string', meta: { interface: 'input' } },
                { field: 'direccion', type: 'string', meta: { interface: 'input' } },
                { field: 'password_hash', type: 'string', meta: { interface: 'input', hidden: true } },
                { field: 'client_number', type: 'string', meta: { interface: 'input' } },
                { field: 'puntaje', type: 'integer', meta: { interface: 'input' }, schema: { default_value: 0 } },
                { field: 'debt_amount', type: 'decimal', meta: { interface: 'input' }, schema: { default_value: 0 } },
                { field: 'fin_status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{text: 'Al día', value: 'clean'}, {text: 'Con Deuda', value: 'debt'}] } }, schema: { default_value: 'clean' } },
                { 
                    field: 'vendedor_asignado', 
                    type: 'uuid', 
                    meta: { interface: 'select-relational-m2o', note: 'Vendedor que atiende a este cliente' },
                    schema: { foreign_key_table: 'vendedores', foreign_key_column: 'id' }
                }
            ]
        }));
        console.log('✅ Colección "clientes" creada con éxito.');

        // --- 3. PEDIDOS (Historial) ---
        try {
            await client.request(deleteCollection('pedidos'));
        } catch (e) {}

        console.log('📦 Creando colección: pedidos');
        await client.request(createCollection({
            collection: 'pedidos',
            meta: { icon: 'shopping_cart', note: 'Historial de compras' },
            schema: { name: 'pedidos' },
            fields: [
                { field: 'id', type: 'uuid', meta: { interface: 'input', hidden: true, special: ['uuid'] }, schema: { is_primary_key: true } },
                { field: 'fecha_pedido', type: 'timestamp', meta: { interface: 'datetime' }, schema: { default_value: 'now()' } },
                { field: 'total', type: 'decimal', meta: { interface: 'input' } },
                { field: 'tracking_id', type: 'string', meta: { interface: 'input' } },
                { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{text: 'Procesado', value: 'procesado'}, {text: 'Producción', value: 'produccion'}, {text: 'Terminado', value: 'terminado'}] } }, schema: { default_value: 'procesado' } },
                { 
                    field: 'cliente_id', 
                    type: 'uuid', 
                    schema: { foreign_key_table: 'clientes', foreign_key_column: 'id' }
                }
            ]
        }));

        console.log('🎉 ¡Arquitectura Completa Finalizada!');

    } catch (e) {
        console.error('❌ Error en el setup maestro:', e.errors || e);
    }
}

setupBusinessData();
