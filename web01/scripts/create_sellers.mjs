import { createDirectus, rest, staticToken, createCollection, createItem, readItems, deleteCollection } from '@directus/sdk';
import dotenv from 'dotenv';
dotenv.config();

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const staticTokenValue = 'jb-_twuOduXRpNMS_mN5-6jKKlE1ddH8';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

async function setupSellers() {
    console.log('👥 Iniciando carga de Vendedores (Re-intento)...');

    try {
        // Borramos si existe para asegurar que el ID se cree bien
        try {
            console.log('Borrando colección vieja...');
            await client.request(deleteCollection('vendedores'));
        } catch (e) {}

        // 1. Crear Colección 'vendedores' con ID UUID autogenerado
        console.log('Creando colección: vendedores');
        await client.request(createCollection({
            collection: 'vendedores',
            meta: { icon: 'manage_accounts', note: 'Staff de Alvarez Placas' },
            schema: { name: 'vendedores' },
            fields: [
                { 
                    field: 'id', 
                    type: 'uuid', 
                    meta: { interface: 'input', readonly: true, hidden: true, special: ['uuid'] }, 
                    schema: { is_primary_key: true } 
                },
                { field: 'nombre', type: 'string', meta: { interface: 'input' } },
                { field: 'email', type: 'string', meta: { interface: 'input' } },
                { field: 'sucursal', type: 'string', meta: { interface: 'input' } },
                { field: 'nivel', type: 'string', meta: { interface: 'input' } }
            ]
        }));
        console.log('✅ Colección "vendedores" recreada.');

        // 2. Inyectar Vendedores
        const sellers = [
            { nombre: 'Martín Giménez', email: 'martin@alvarezplacas.com', sucursal: 'Villa Tesei', nivel: 'Vendedor Sr.' },
            { nombre: 'Laura Sánchez', email: 'laura@alvarezplacas.com', sucursal: 'Hurlingham', nivel: 'Vendedor' },
            { nombre: 'Carlos Rodriguez', email: 'carlos@alvarezplacas.com', sucursal: 'Villa Tesei', nivel: 'Vendedor Jr.' }
        ];

        for (const s of sellers) {
            await client.request(createItem('vendedores', s));
            console.log(`👤 Vendedor inyectado: ${s.nombre}`);
        }

        console.log('🎉 ¡Vendedores cargados con éxito!');

    } catch (e) {
        console.error('❌ Error final:', e.errors || e);
    }
}

setupSellers();
