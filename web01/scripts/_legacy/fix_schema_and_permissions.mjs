import { createDirectus, rest, staticToken, updateField, createField, createPermission } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_TOKEN = 'alvarez-api-token-v16-2026';

async function fix() {
    console.log("--- 🔧 Iniciando Reparación de Esquema y Permisos ---");
    
    const client = createDirectus(DIRECTUS_URL)
        .with(staticToken(ADMIN_TOKEN))
        .with(rest());

    try {
        // 1. Corregir Mapeo de Campos en 'clientes'
        console.log("🔄 Renombrando campos en 'clientes'...");
        
        // Renombrar 'nombre' -> 'name'
        await client.request(updateField('clientes', 'nombre', {
            field: 'name',
            meta: { display_name: 'Nombre Completo' }
        }));

        // Renombrar 'vendedor_asignado' -> 'vendedor_id'
        await client.request(updateField('clientes', 'vendedor_asignado', {
            field: 'vendedor_id',
            meta: { display_name: 'Vendedor Asignado' }
        }));

        // Añadir 'registration_date' si falta
        console.log("➕ Añadiendo campo 'registration_date'...");
        await client.request(createField('clientes', {
            field: 'registration_date',
            type: 'timestamp',
            meta: { interface: 'datetime', display_name: 'Fecha de Registro' }
        }));

        // 2. Configurar Permisos Públicos (Rol: null)
        console.log("🔐 Configurando permisos públicos (Rol: null)...");

        // Permiso para crear mensajes de contacto
        await client.request(createPermission({
            role: null,
            collection: 'mensajes_contacto',
            action: 'create',
            permissions: {},
            validation: {}
        }));

        // Permiso para crear clientes (Registro)
        await client.request(createPermission({
            role: null,
            collection: 'clientes',
            action: 'create',
            permissions: {},
            validation: {}
        }));

        // Permiso para leer vendedores (Necesario para auto-asignación en el registro)
        await client.request(createPermission({
            role: null,
            collection: 'vendedores',
            action: 'read',
            fields: ['id', 'nombre', 'email'],
            permissions: {},
            validation: {}
        }));

        // Permiso para leer sucursales (Para el selector de la web)
        await client.request(createPermission({
            role: null,
            collection: 'sucursales',
            action: 'read',
            fields: ['*'],
            permissions: {},
            validation: {}
        }));

        console.log("--- ✨ Reparación Finalizada con Éxito ---");

    } catch (e) {
        console.error("❌ Error durante la reparación:", e.message || e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

fix();
