import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { updateItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';

/**
 * API: Cambiar contraseña propia del vendedor logueado.
 * Ruta: POST /api/vendedor/change-password
 * Requiere: seller_session cookie
 * Body: { password: string }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
    const sellerId = cookies.get('seller_session')?.value;
    if (!sellerId) {
        return new Response(JSON.stringify({ success: false, error: 'No autorizado. Sesión de vendedor requerida.' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { password } = await request.json();

        if (!password) {
            return new Response(JSON.stringify({ success: false, error: 'La contraseña es obligatoria' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        if (password.length < 6) {
            return new Response(JSON.stringify({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generar hash bcrypt seguro
        const passwordHash = await bcrypt.hash(password, 10);

        // Actualizar en Directus
        await directus.request(updateItem('vendedores', parseInt(sellerId), {
            password_hash: passwordHash
        }));

        console.log(`[Vendedor] Contraseña actualizada para sí mismo ID: ${sellerId}`);

        return new Response(JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente' }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('[vendedor-change-password Error]:', e);
        return new Response(JSON.stringify({ success: false, error: e?.message || 'Error interno del servidor' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
};
