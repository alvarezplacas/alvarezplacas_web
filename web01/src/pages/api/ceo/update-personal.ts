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
        const {
            id, nombre, funcion, sueldo_base, id_reloj, email, whatsapp,
            forma_pago, indumentaria_entregada, fecha_entrega_indumentaria,
            observaciones, adelantos, horas_extras_manual,
            es_externo, horas_trabajadas_manual,
            basico_recibo, antiguedad_anos, no_remunerativo_basico, es_media_jornada,
            talle_pantalon, talle_remera, talle_calzado, talle_campera
        } = body;

        if (!id) {
            return new Response('ID requerido', { status: 400 });
        }

        // Auto-migrate: add new columns if they don't exist yet
        await query(`
            ALTER TABLE control_personal 
            ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(50) DEFAULT 'Efectivo',
            ADD COLUMN IF NOT EXISTS indumentaria_entregada TEXT,
            ADD COLUMN IF NOT EXISTS fecha_entrega_indumentaria DATE,
            ADD COLUMN IF NOT EXISTS observaciones TEXT,
            ADD COLUMN IF NOT EXISTS adelantos NUMERIC(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS horas_extras_manual NUMERIC(6,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS es_externo BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS horas_trabajadas_manual NUMERIC(6,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS basico_recibo NUMERIC(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS antiguedad_anos INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS no_remunerativo_basico NUMERIC(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS es_media_jornada BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS talle_pantalon VARCHAR(10),
            ADD COLUMN IF NOT EXISTS talle_remera VARCHAR(10),
            ADD COLUMN IF NOT EXISTS talle_calzado VARCHAR(10),
            ADD COLUMN IF NOT EXISTS talle_campera VARCHAR(10)
        `).catch(() => {}); // Silently ignore if columns already exist

        // Update in DB
        await query(`
            UPDATE control_personal 
            SET 
                nombre = $1, 
                funcion = $2, 
                sueldo_base = $3, 
                id_reloj = $4, 
                email = $5, 
                whatsapp = $6,
                forma_pago = $7,
                indumentaria_entregada = $8,
                fecha_entrega_indumentaria = $9,
                observaciones = $10,
                adelantos = $11,
                horas_extras_manual = $12,
                es_externo = $13,
                horas_trabajadas_manual = $14,
                basico_recibo = $15,
                antiguedad_anos = $16,
                no_remunerativo_basico = $17,
                es_media_jornada = $18,
                talle_pantalon = $19,
                talle_remera = $20,
                talle_calzado = $21,
                talle_campera = $22
            WHERE id = $23
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
            horas_extras_manual ? parseFloat(horas_extras_manual) : 0,
            es_externo === 'true' || es_externo === true,
            horas_trabajadas_manual ? parseFloat(horas_trabajadas_manual) : 0,
            basico_recibo ? parseFloat(basico_recibo) : 0,
            antiguedad_anos ? parseInt(antiguedad_anos) : 0,
            no_remunerativo_basico ? parseFloat(no_remunerativo_basico) : 0,
            es_media_jornada === 'true' || es_media_jornada === true,
            talle_pantalon || null,
            talle_remera || null,
            talle_calzado || null,
            talle_campera || null,
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
