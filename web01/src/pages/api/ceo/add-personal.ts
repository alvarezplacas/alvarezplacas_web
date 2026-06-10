import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const POST: APIRoute = async ({ request, cookies }) => {
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;

    if (!adminSession && !sellerSession) {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            nombre, funcion, sueldo_base, id_reloj, email, whatsapp,
            forma_pago, indumentaria_entregada, fecha_entrega_indumentaria,
            observaciones, adelantos, horas_extras_manual
        } = body;

        if (!nombre) {
            return new Response('Nombre requerido', { status: 400 });
        }

        // Auto-migrate: add new columns if they don't exist yet
        await query(`
            ALTER TABLE control_personal 
            ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(50) DEFAULT 'Efectivo',
            ADD COLUMN IF NOT EXISTS indumentaria_entregada TEXT,
            ADD COLUMN IF NOT EXISTS fecha_entrega_indumentaria DATE,
            ADD COLUMN IF NOT EXISTS observaciones TEXT,
            ADD COLUMN IF NOT EXISTS adelantos NUMERIC(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS horas_extras_manual NUMERIC(6,2) DEFAULT 0
        `).catch(() => {}); // Ignorar si ya existen

        const result = await query(`
            INSERT INTO control_personal 
                (nombre, funcion, sueldo_base, id_reloj, email, whatsapp,
                 forma_pago, indumentaria_entregada, fecha_entrega_indumentaria,
                 observaciones, adelantos, horas_extras_manual)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `, [
            nombre,
            funcion || null,
            sueldo_base ? parseFloat(sueldo_base) : 0,
            id_reloj || null,
            email || null,
            whatsapp || null,
            forma_pago || 'Efectivo',
            indumentaria_entregada || null,
            fecha_entrega_indumentaria || null,
            observaciones || null,
            adelantos ? parseFloat(adelantos) : 0,
            horas_extras_manual ? parseFloat(horas_extras_manual) : 0
        ]);

        return new Response(JSON.stringify({ success: true, id: result.rows[0]?.id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error("Error adding personal:", e);
        return new Response(e.message || 'Error interno', { status: 500 });
    }
}
