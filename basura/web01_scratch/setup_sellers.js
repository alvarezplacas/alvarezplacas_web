import { createDirectus, rest, authentication, updateItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function setupSellers() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Admin Login OK.");

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('Vendedor2026!', salt);

        await client.request(updateItem('vendedores', 1, {
            password_hash: hash
        }));
        console.log("✅ Vendedor 1 actualizado con password: Vendedor2026!");

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

setupSellers();
