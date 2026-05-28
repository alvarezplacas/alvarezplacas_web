import { createDirectus, rest, authentication, updateItem, readItems } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function updateHash() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Login Admin Exitoso.");

        const sellers = await client.request(readItems('vendedores', {
            filter: { email: { _eq: ADMIN_EMAIL } }
        }));

        if (sellers.length > 0) {
            const adminUser = sellers[0];
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

            await client.request(updateItem('vendedores', adminUser.id, {
                password_hash: hash,
                name: 'Administrador Javier'
            }));
            console.log(`✅ Registro ${adminUser.id} actualizado con el hash.`);
            console.log("Ahora el login en Astro debería usar este hash de forma segura.");
        } else {
            console.log("❌ No se encontró el usuario en 'vendedores'.");
        }
    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

updateHash();
