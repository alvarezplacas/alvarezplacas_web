import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { updateItem } from '@directus/sdk';
import bcrypt from 'bcryptjs';

/**
 * API: Cambiar contraseña de un vendedor.
 * Ruta: POST /api/admin/set-seller-password
 * Requiere: admin_session cookie
 * Body: { sellerId: string, password: string }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
    // Verificar sesión admin
    const adminSession = cookies.get('admin_session')?.value;
    if (!adminSession) {
        return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { sellerId, password } = await request.json();

        if (!sellerId || !password) {
            return new Response(JSON.stringify({ success: false, error: 'sellerId y password son requeridos' }), {
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
        await directus.request(updateItem('vendedores', sellerId, {
            password_hash: passwordHash
        }));

        console.log(`[Admin] Contraseña actualizada para vendedor ID: ${sellerId}`);

        return new Response(JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente' }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('[set-seller-password Error]:', e);
        return new Response(JSON.stringify({ success: false, error: e?.message || 'Error interno' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
};
