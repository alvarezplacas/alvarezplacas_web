import { createDirectus, rest, authentication, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.alvarezplacas.com.ar';

async function finalCheck() {
    try {
        const client = createDirectus(DIRECTUS_URL).with(authentication()).with(rest());
        await client.login('admin@alvarezplacas.com.ar', 'JavierMix2026!');
        console.log("✅ Conexión con Admin Maestro OK.");

        const sellers = await client.request(readItems('vendedores'));
        console.log("Vendedores en DB:");
        sellers.forEach(s => console.log(`- ${s.email} (${s.name})`));

        const clients = await client.request(readItems('clientes'));
        console.log("Clientes en DB:");
        clients.forEach(c => console.log(`- ${c.email} (${c.nombre})`));

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

finalCheck();
