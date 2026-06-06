import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Only admin or seller can update
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;

    if (!adminSession && !sellerSession) {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, nombre, funcion, sueldo_base, id_reloj, email, whatsapp } = body;

        if (!id) {
            return new Response('ID requerido', { status: 400 });
        }

        // Update in DB
        await query(`
            UPDATE control_personal 
            SET nombre = $1, funcion = $2, sueldo_base = $3, id_reloj = $4, email = $5, whatsapp = $6
            WHERE id = $7
        `, [
            nombre, 
            funcion, 
            sueldo_base ? parseFloat(sueldo_base) : 0, 
            id_reloj, 
            email, 
            whatsapp, 
            parseInt(id)
        ]);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error("Error updating personal:", e);
        return new Response(e.message || 'Error interno', { status: 500 });
    }
}
