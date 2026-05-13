import type { APIRoute } from 'astro';
import { directus } from '@conexiones/directus.js';
import { updateItem } from '@directus/sdk';

/**
 * API: Activar o desactivar un vendedor.
 * Ruta: POST /api/admin/toggle-seller-status
 * Requiere: admin_session cookie
 * Body: { sellerId: string, status: 'active' | 'inactive' }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
    const adminSession = cookies.get('admin_session')?.value;
    if (!adminSession) {
        return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { sellerId, status } = await request.json();

        if (!sellerId || !['active', 'inactive'].includes(status)) {
            return new Response(JSON.stringify({ success: false, error: 'Parámetros inválidos' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        await directus.request(updateItem('vendedores', sellerId, { status }));

        console.log(`[Admin] Vendedor ID ${sellerId} → status: ${status}`);

        return new Response(JSON.stringify({ success: true, status }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error('[toggle-seller-status Error]:', e);
        return new Response(JSON.stringify({ success: false, error: e?.message || 'Error interno' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
};
