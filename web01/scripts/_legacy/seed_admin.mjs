import { createDirectus, rest, staticToken, createItem, readItems } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const directusUrl = 'https://admin.alvarezplacas.com.ar';
const staticTokenValue = 'a9eE0ukhC16wj43TpuDYx9HYb2z2zsbE';

const client = createDirectus(directusUrl)
    .with(staticToken(staticTokenValue))
    .with(rest());

async function seedAdmin() {
    const adminEmail = 'admin@alvarezplacas.com.ar';
    const adminPass = 'JavierMix2026!'; // Current hardcoded pass
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPass, salt);

    try {
        const existing = await client.request(readItems('vendedores', {
            filter: { email: { _eq: adminEmail } }
        }));

        if (existing.length === 0) {
            console.log('Seeding Admin user...');
            await client.request(createItem('vendedores', {
                nombre: 'Administrador General',
                email: adminEmail,
                password_hash: hash,
                whatsapp: '549341000000'
            }));
            console.log('✅ Admin seed successful.');
        } else {
            console.log('⚠️ Admin already exists in database.');
        }
    } catch (e) {
        console.error('❌ Error seeding Admin:', e);
    }
}

seedAdmin();
