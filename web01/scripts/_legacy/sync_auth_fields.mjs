import { createDirectus, rest, staticToken, createField } from '@directus/sdk';

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

async function syncAuthFields() {
    console.log('🚀 Sincronizando campos de recuperación...');

    const collections = ['clientes', 'vendedores'];

    for (const col of collections) {
        // Recovery Fields
        await safeCreateField(col, { field: 'recovery_token', type: 'string', meta: { interface: 'input', hidden: true } });
        await safeCreateField(col, { field: 'recovery_expiry', type: 'timestamp', meta: { interface: 'datetime', hidden: true } });
        
        // Ensure password_hash exists (for migration if needed)
        await safeCreateField(col, { field: 'password_hash', type: 'string', meta: { interface: 'input-password', hidden: true } });
    }

    console.log('✅ Sincronización de recuperación finalizada.');
}

syncAuthFields();
