import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const DELETE: APIRoute = async ({ request, cookies }) => {
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;

    if (!adminSession && !sellerSession) {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return new Response('ID requerido', { status: 400 });
        }

        await query(`
            DELETE FROM control_personal 
            WHERE id = $1
        `, [parseInt(id)]);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error("Error deleting personal:", e);
        return new Response(e.message || 'Error interno', { status: 500 });
    }
}
