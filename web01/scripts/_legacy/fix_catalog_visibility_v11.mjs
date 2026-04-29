import { createDirectus, rest, staticToken, createItem, updateRole } from '@directus/sdk';

/**
 * FIX INTEGRACION V11 - ALVAREZ PLACAS
 * Crea una política de lectura y la asigna a los roles Público y Vendedor.
 */

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const TOKEN = 'alvarez-api-token-v16-2026';
const VENDEDOR_ROLE_ID = '4c7250e7-7bd9-4cb9-9c2c-a809f85c150f';

const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(TOKEN))
    .with(rest());

async function runFix() {
    console.log("--- 🔱 Iniciando Fix de Visibilidad V11 ---");

    try {
        // 1. Crear una Política de "Lectura Total Catálogo"
        console.log("📦 Creando Política de Lectura...");
        const policy = await client.request(createItem('directus_policies', {
            name: 'Public Catalog Read',
            icon: 'visibility',
            description: 'Permite leer materiales, marcas, categorias y espesores.'
        }));
        
        const policyId = policy.id;
        console.log(`✅ Política creada ID: ${policyId}`);

        // 2. Crear los permisos dentro de esa política
        const collections = ['materiales', 'marcas', 'categorias', 'espesores', 'sucursales', 'site_settings'];
        for (const coll of collections) {
            await client.request(createItem('directus_permissions', {
                policy: policyId,
                collection: coll,
                action: 'read',
                fields: ['*'],
                permissions: {}
            }));
            console.log(`✅ Permiso 'read' agregado a ${coll}`);
        }

        // 3. Vincular la política a los roles
        // Nota: En Directus 11, los roles pueden tener múltiples políticas
        console.log("🔗 Vinculando política al rol Vendedor...");
        // Intentamos leer el rol para obtener sus políticas actuales
        const rolesResult = await client.request(readItems('directus_roles', { filter: { id: { _eq: VENDEDOR_ROLE_ID } } }));
        if (rolesResult.length > 0) {
            const currentPolicies = rolesResult[0].policies || [];
            await client.request(updateRole(VENDEDOR_ROLE_ID, {
                policies: [...currentPolicies, policyId]
            }));
            console.log("✅ Rol Vendedor actualizado.");
        }

        // 4. Intentar vincular a Public (Si existe un rol 'Public')
        const publicRoles = await client.request(readItems('directus_roles', { filter: { name: { _icontains: 'Public' } } }));
        if (publicRoles.length > 0) {
            const publicId = publicRoles[0].id;
            const currentPolicies = publicRoles[0].policies || [];
            await client.request(updateRole(publicId, {
                policies: [...currentPolicies, policyId]
            }));
            console.log("✅ Rol Público actualizado.");
        }

        console.log("\n--- ✨ Proceso Terminado. Verifica el frontend. ---");
    } catch (e) {
        console.error("❌ Error en el fix:", e.errors?.[0]?.message || e.message);
    }
}

runFix();
