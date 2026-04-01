import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { readItems, updateItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { token, newPassword, collection } = await request.json();

        if (!token || !newPassword || !collection) {
            return new Response(JSON.stringify({ error: 'Faltan parámetros obligatorios' }), { status: 400 });
        }

        console.log(`[Complete Reset] Attempting for token: ${token} in ${collection}`);

        // 1. Buscar el usuario con este token y validar expiración
        const userResult = await directus.request(readItems(collection, {
            filter: { recovery_token: { _eq: token } },
            limit: 1
        }));

        const user = userResult?.[0];

        if (!user) {
            return new Response(JSON.stringify({ error: 'Token inválido o cuenta no encontrada' }), { status: 404 });
        }

        // 2. Validar Expiración
        const expiryDate = new Date(user.recovery_expiry);
        if (expiryDate < new Date()) {
            return new Response(JSON.stringify({ error: 'El enlace ha expirado. Solicita uno nuevo.' }), { status: 410 });
        }

        // 3. Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar usuario y limpiar tokens
        await directus.request(updateItem(collection, user.id, {
            password_hash: hash,
            recovery_token: null,
            recovery_expiry: null
        }));

        console.log(`[Complete Reset] Success for ID: ${user.id}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' 
        }), { status: 200 });

    } catch (e: any) {
        console.error('[Complete Reset API Error]:', e);
        return new Response(JSON.stringify({ 
            error: 'Error interno al procesar el cambio de contraseña.' 
        }), { status: 500 });
    }
};
