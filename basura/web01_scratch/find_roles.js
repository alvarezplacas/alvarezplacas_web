import { createDirectus, rest, authentication, readRoles, readUsers } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';
const ADMIN_EMAIL = 'admin@alvarezplacas.com.ar';
const ADMIN_PASSWORD = 'JavierMix2026!';

async function findRoles() {
    const client = createDirectus(DIRECTUS_URL)
        .with(authentication())
        .with(rest());

    try {
        await client.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Login exitoso.");

        const roles = await client.request(readRoles());
        console.log("--- Roles en Directus ---");
        roles.forEach(r => {
            console.log(`- ${r.name} (ID: ${r.id})`);
        });

        const users = await client.request(readUsers({
            fields: ['id', 'email', 'role', 'token']
        }));
        console.log("\n--- Usuarios de Sistema ---");
        users.forEach(u => {
            console.log(`- ${u.email} (Role: ${u.role}) - Token: ${u.token ? 'SÍ' : 'NO'}`);
            if (u.token === 'U_49a1I4EcNofowltd95z0MwlUdJ8VgW') {
                console.log("   🌟 ENCONTRADO EL USUARIO DEL TOKEN FRONTEND!");
            }
        });

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

findRoles();
