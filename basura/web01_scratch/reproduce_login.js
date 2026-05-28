import { directus, readItems } from '../Backend/conexiones/directus.js';
import bcrypt from 'bcryptjs';

async function reproduceLogin() {
    const email = 'admin@alvarezplacas.com.ar';
    const password = 'JavierMix2026!';

    console.log(`Intentando login para: ${email}`);

    try {
        const results = await directus.request(readItems('vendedores', {
            filter: { email: { _eq: email } },
            limit: 1
        }));

        const user = results?.[0];

        if (!user) {
            console.log("❌ Usuario no encontrado");
            return;
        }

        console.log("Datos del usuario:", user);

        if (user.email !== 'admin@alvarezplacas.com.ar') {
             console.log("❌ No autorizado como admin");
             return;
        }

        let isPasswordValid = false;
        if (user.password_hash) {
            console.log("Usando Hash para verificación...");
            isPasswordValid = await bcrypt.compare(password, user.password_hash);
        } else {
            console.log("Campo 'password_hash' ausente. Usando fallback...");
            isPasswordValid = (password === 'JavierMix2026!');
        }

        if (isPasswordValid) {
            console.log("✅ LOGIN EXITOSO");
        } else {
            console.log("❌ CREDENCIALES INVÁLIDAS");
        }
    } catch (e) {
        console.error("❌ ERROR EN EL SERVIDOR:", e);
    }
}

reproduceLogin();
